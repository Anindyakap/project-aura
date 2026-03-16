// backend/src/services/insights.engine.ts
// The rules engine that analyzes metrics and generates insights
//
// FLOW:
//   1. Fetch last 30 days of metrics for a brand
//   2. Run each rule against the data
//   3. If a rule triggers → generate an insight and save to DB
//   4. Old insights (>7 days) are deleted to keep things fresh

import { pool } from '../config/database';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayMetrics {
  date: string;
  revenue: number;
  orders: number;
  new_customers: number;
}

interface InsightToSave {
  brandId: string;
  insightType: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
  relatedData: Record<string, any>;
}

// ─── Main Engine Function ─────────────────────────────────────────────────────

/**
 * Runs the insights engine for ALL brands that have metrics
 * Called by the cron job after the daily sync completes
 */
export const runInsightsEngine = async (): Promise<void> => {
  console.log('🧠 Starting insights engine...');

  try {
    // Get all brands that have metrics data
    // WHY: Only generate insights for brands with actual data
    const brandsResult = await pool.query(
      `SELECT DISTINCT brand_id FROM metrics`
    );

    const brandIds = brandsResult.rows.map(r => r.brand_id);

    if (brandIds.length === 0) {
      console.log('ℹ️  No brands with metrics found, skipping insights');
      return;
    }

    console.log(`📊 Running insights for ${brandIds.length} brand(s)...`);

    for (const brandId of brandIds) {
      try {
        await generateInsightsForBrand(brandId);
      } catch (error: any) {
        // If one brand fails, continue with others
        console.error(`❌ Insights failed for brand ${brandId}:`, error.message);
      }
    }

    console.log('✅ Insights engine completed');
  } catch (error: any) {
    console.error('❌ Fatal error in insights engine:', error.message);
    throw error;
  }
};

// ─── Per-Brand Insights Generator ─────────────────────────────────────────────

const generateInsightsForBrand = async (brandId: string): Promise<void> => {
  console.log(`  💡 Generating insights for brand ${brandId}...`);

  // STEP 1: Delete old insights (older than 7 days) for this brand
  // WHY: Keep the insights list fresh and relevant
  //      Don't show "High CPA alert" from 3 weeks ago
  await pool.query(
    `DELETE FROM insights
     WHERE brand_id = $1
     AND created_at < NOW() - INTERVAL '7 days'`,
    [brandId]
  );

  // STEP 2: Fetch last 30 days of metrics, pivoted by date
  // We get one row per day with all 3 metrics as columns
  const metricsResult = await pool.query(
    `SELECT
       date,
       MAX(CASE WHEN metric_type = 'revenue'       THEN value ELSE 0 END) as revenue,
       MAX(CASE WHEN metric_type = 'orders'        THEN value ELSE 0 END) as orders,
       MAX(CASE WHEN metric_type = 'new_customers' THEN value ELSE 0 END) as new_customers
     FROM metrics
     WHERE brand_id = $1
       AND date >= CURRENT_DATE - INTERVAL '29 days'
     GROUP BY date
     ORDER BY date ASC`,
    [brandId]
  );

  const days: DayMetrics[] = metricsResult.rows.map(row => ({
    date:          row.date,
    revenue:       parseFloat(row.revenue)       || 0,
    orders:        parseFloat(row.orders)        || 0,
    new_customers: parseFloat(row.new_customers) || 0,
  }));

  if (days.length < 7) {
    console.log(`  ⚠️  Not enough data for brand ${brandId}, need at least 7 days`);
    return;
  }

  // STEP 3: Split into two periods for comparison
  // Last 7 days vs previous 7 days
  const recent   = days.slice(-7);   // last 7 days
  const previous = days.slice(-14, -7); // the 7 days before that

  // STEP 4: Calculate period totals
  const recentRevenue   = sum(recent,   'revenue');
  const previousRevenue = sum(previous, 'revenue');
  const recentOrders    = sum(recent,   'orders');
  const previousOrders  = sum(previous, 'orders');
  const recentNewCust   = sum(recent,   'new_customers');
  const previousNewCust = sum(previous, 'new_customers');

  // Average order value for each period
  const recentAOV   = recentOrders   > 0 ? recentRevenue   / recentOrders   : 0;
  const previousAOV = previousOrders > 0 ? previousRevenue / previousOrders : 0;

  // % changes
  const revenueChange    = pctChange(previousRevenue, recentRevenue);
  const ordersChange     = pctChange(previousOrders,  recentOrders);
  const newCustChange    = pctChange(previousNewCust, recentNewCust);
  const aovChange        = pctChange(previousAOV,     recentAOV);

  // STEP 5: Run each rule
  const insights: InsightToSave[] = [];

  // ── RULE 1: Revenue drop alert ──────────────────────────────────────────────
  // Triggers when revenue drops more than 20% week over week
  if (revenueChange < -5) {
    insights.push({
      brandId,
      insightType: 'revenue_drop',
      priority:    'high',
      title:       '⚠️ Revenue Drop Detected',
      description: `Your revenue has dropped ${Math.abs(revenueChange).toFixed(1)}% this week ($${recentRevenue.toFixed(0)}) compared to last week ($${previousRevenue.toFixed(0)}). Immediate attention recommended.`,
      actionItems: [
        'Check if any campaigns were paused or reduced',
        'Review your top traffic sources for drops',
        'Ensure your store and checkout are functioning correctly',
        'Look for any product inventory issues',
      ],
      relatedData: {
        recent_revenue:   recentRevenue,
        previous_revenue: previousRevenue,
        change_pct:       revenueChange,
      },
    });
  }

  // ── RULE 2: Revenue spike (positive alert) ──────────────────────────────────
  // Triggers when revenue grows more than 25% week over week
  if (revenueChange > 8) {
    insights.push({
      brandId,
      insightType: 'high_performer',
      priority:    'medium',
      title:       '🚀 Revenue Trending Up!',
      description: `Excellent performance! Your revenue grew ${revenueChange.toFixed(1)}% this week ($${recentRevenue.toFixed(0)}) compared to last week ($${previousRevenue.toFixed(0)}). Capitalize on this momentum.`,
      actionItems: [
        'Identify which campaigns are driving this growth',
        'Consider increasing budget on top-performing ads',
        'Ensure inventory can handle increased demand',
        'Document what changed so you can replicate it',
      ],
      relatedData: {
        recent_revenue:   recentRevenue,
        previous_revenue: previousRevenue,
        change_pct:       revenueChange,
      },
    });
  }

  // ── RULE 3: Order volume drop ───────────────────────────────────────────────
  // Triggers when order count drops more than 15% but revenue didn't drop as much
  // This means fewer orders but higher value = AOV increased
  if (ordersChange < -5 && revenueChange > ordersChange) {
    insights.push({
      brandId,
      insightType: 'order_drop',
      priority:    'medium',
      title:       '📉 Order Volume Declining',
      description: `Order count dropped ${Math.abs(ordersChange).toFixed(1)}% this week (${recentOrders.toFixed(0)} orders vs ${previousOrders.toFixed(0)} last week), but your average order value ${aovChange > 0 ? 'increased' : 'held steady'}. Fewer but higher-value purchases.`,
      actionItems: [
        'Review top-of-funnel traffic — are fewer people visiting?',
        'Check if conversion rate dropped on your store',
        'Consider running a promotion to boost order volume',
        'Analyze which products are selling vs stagnant',
      ],
      relatedData: {
        recent_orders:   recentOrders,
        previous_orders: previousOrders,
        orders_change:   ordersChange,
        aov_change:      aovChange,
      },
    });
  }

  // ── RULE 4: AOV improvement opportunity ────────────────────────────────────
  // Triggers when AOV is growing — good sign, recommend doubling down
  if (aovChange > 5) {
    insights.push({
      brandId,
      insightType: 'aov_opportunity',
      priority:    'low',
      title:       '💎 Average Order Value Increasing',
      description: `Your average order value grew ${aovChange.toFixed(1)}% this week ($${recentAOV.toFixed(2)} vs $${previousAOV.toFixed(2)}). Customers are spending more per visit — a great sign.`,
      actionItems: [
        'Identify which products are being bundled together',
        'Consider creating more bundle offers',
        'Add upsell recommendations at checkout',
        'Highlight premium products in ads',
      ],
      relatedData: {
        recent_aov:   recentAOV,
        previous_aov: previousAOV,
        change_pct:   aovChange,
      },
    });
  }

  // ── RULE 5: New customer acquisition drop ───────────────────────────────────
  // Triggers when new customers drop significantly
  // This is an early warning — current customers will churn eventually
  if (newCustChange < -5 && previousNewCust > 0) {
    insights.push({
      brandId,
      insightType: 'acquisition_drop',
      priority:    'high',
      title:       '🔴 New Customer Acquisition Dropping',
      description: `New customer acquisition dropped ${Math.abs(newCustChange).toFixed(1)}% this week (${recentNewCust.toFixed(0)} vs ${previousNewCust.toFixed(0)} new customers last week). Without new customers, future revenue is at risk.`,
      actionItems: [
        'Review your prospecting ad campaigns (Facebook, Google)',
        'Check if your targeting audience has become saturated',
        'Consider testing new creative or new audiences',
        'Look at your landing page conversion rate for new visitors',
      ],
      relatedData: {
        recent_new_customers:   recentNewCust,
        previous_new_customers: previousNewCust,
        change_pct:             newCustChange,
      },
    });
  }

  // ── RULE 6: Consistent growth (weekly summary) ──────────────────────────────
  // Triggers when everything is growing steadily
  // Shows a positive summary insight
  const allPositive = revenueChange > 2 && ordersChange > 0 && newCustChange > 0;
  if (allPositive) {
    insights.push({
      brandId,
      insightType: 'weekly_summary',
      priority:    'low',
      title:       '✅ Strong Week — All Metrics Up',
      description: `Your store is firing on all cylinders. Revenue up ${revenueChange.toFixed(1)}%, orders up ${ordersChange.toFixed(1)}%, and new customer acquisition up ${newCustChange.toFixed(1)}% compared to last week.`,
      actionItems: [
        'Document current strategy — it\'s working',
        'Consider modest budget increases on best performers',
        'Monitor closely to catch any early signs of slowdown',
      ],
      relatedData: {
        revenue_change:  revenueChange,
        orders_change:   ordersChange,
        new_cust_change: newCustChange,
      },
    });
  }

  // STEP 6: Save all triggered insights to database
  console.log(`  📝 Saving ${insights.length} insight(s) for brand ${brandId}`);

  for (const insight of insights) {
    await saveInsight(insight);
  }
};

// ─── Database Saver ───────────────────────────────────────────────────────────

const saveInsight = async (insight: InsightToSave): Promise<void> => {
  // Check if this same type of insight already exists for this brand today
  // WHY: Don't create duplicate insights if engine runs twice
  const existing = await pool.query(
    `SELECT id FROM insights
     WHERE brand_id = $1
       AND insight_type = $2
       AND created_at >= CURRENT_DATE`,
    [insight.brandId, insight.insightType]
  );

  if (existing.rows.length > 0) {
    // Update existing instead of creating duplicate
    await pool.query(
      `UPDATE insights
       SET title = $1, description = $2, action_items = $3,
           related_data = $4, is_read = false
       WHERE brand_id = $5 AND insight_type = $6
         AND created_at >= CURRENT_DATE`,
      [
        insight.title, insight.description,
        JSON.stringify(insight.actionItems),
        JSON.stringify(insight.relatedData),
        insight.brandId, insight.insightType,
      ]
    );
  } else {
    // Create new insight
    await pool.query(
      `INSERT INTO insights
         (brand_id, insight_type, priority, title, description, action_items, related_data, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false)`,
      [
        insight.brandId, insight.insightType, insight.priority,
        insight.title, insight.description,
        JSON.stringify(insight.actionItems),
        JSON.stringify(insight.relatedData),
      ]
    );
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Sum a numeric field across an array of day objects
const sum = (days: DayMetrics[], field: keyof DayMetrics): number =>
  days.reduce((total, day) => total + (day[field] as number), 0);

// Calculate % change: pctChange(100, 120) = 20 (meaning +20%)
const pctChange = (previous: number, current: number): number => {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
};