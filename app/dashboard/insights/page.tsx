'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, TrendingUp, TrendingDown, Lightbulb,
  CheckCircle, Clock, RefreshCw, BellOff
} from 'lucide-react';
import {
  getBrands, getInsights, markInsightAsRead,
  markAllInsightsAsRead, Brand, Insight
} from '@/lib/api';

// ── Icon based on insight type ───────────────────────────────────────────────
function InsightIcon({ type }: { type: string }) {
  const cls = "h-5 w-5";
  switch (type) {
    case 'revenue_drop':      return <AlertTriangle className={`${cls} text-red-500`}    />;
    case 'acquisition_drop':  return <AlertTriangle className={`${cls} text-orange-500`} />;
    case 'order_drop':        return <TrendingDown  className={`${cls} text-orange-500`} />;
    case 'revenue_spike':     return <TrendingUp    className={`${cls} text-green-500`}  />;
    case 'high_performer':    return <TrendingUp    className={`${cls} text-green-500`}  />;
    case 'aov_opportunity':   return <Lightbulb     className={`${cls} text-blue-500`}   />;
    case 'weekly_summary':    return <CheckCircle   className={`${cls} text-green-500`}  />;
    default:                  return <Lightbulb     className={`${cls} text-purple-500`} />;
  }
}

// ── Priority badge styling ───────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string }) {
  const classes = {
    high:   'bg-red-100    dark:bg-red-900/50    text-red-800    dark:text-red-300    border-red-200    dark:border-red-800',
    medium: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    low:    'bg-gray-100   dark:bg-gray-700      text-gray-700   dark:text-gray-300   border-gray-200   dark:border-gray-600',
  }[priority] || '';

  return (
    <Badge variant="outline" className={`text-xs ${classes}`}>
      {priority.toUpperCase()}
    </Badge>
  );
}

// ── Time ago formatter ───────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60)  return `${mins} minute${mins  !== 1 ? 's' : ''} ago`;
  if (hours < 24)  return `${hours} hour${hours  !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// ── Skeleton loader ──────────────────────────────────────────────────────────
function InsightSkeleton() {
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardContent className="p-6">
        <div className="animate-pulse flex gap-4">
          <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function InsightsPage() {
  const [brands, setBrands]     = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // Load brands on mount
  useEffect(() => {
    getBrands()
      .then(data => {
        setBrands(data);
        if (data.length > 0) setSelectedBrand(data[0]);
      })
      .catch(console.error);
  }, []);

  // Load insights when brand changes
  useEffect(() => {
    if (!selectedBrand) return;
    loadInsights(selectedBrand.id);
  }, [selectedBrand]);

  const loadInsights = async (brandId: string) => {
    try {
      setIsLoading(true);
      const data = await getInsights(brandId);
      setInsights(data.insights);
      setUnreadCount(data.unreadCount);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark single insight as read — optimistic update
  // "Optimistic" = update UI immediately, then call API
  // WHY: Feels instant to user, no waiting for server
  const handleMarkAsRead = async (insightId: string) => {
    // Update UI immediately
    setInsights(prev =>
      prev.map(i => i.id === insightId ? { ...i, is_read: true } : i)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Then tell the server
    try {
      await markInsightAsRead(insightId);
    } catch (e) {
      console.error(e);
      // If server fails, reload to get accurate state
      if (selectedBrand) loadInsights(selectedBrand.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!selectedBrand) return;
    setIsMarkingAll(true);

    // Optimistic update
    setInsights(prev => prev.map(i => ({ ...i, is_read: true })));
    setUnreadCount(0);

    try {
      await markAllInsightsAsRead(selectedBrand.id);
    } catch (e) {
      console.error(e);
      loadInsights(selectedBrand.id);
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Insights
            {unreadCount > 0 && (
              <span className="ml-3 inline-flex items-center justify-center
                w-7 h-7 text-sm font-bold bg-blue-600 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Rules-based recommendations from your store performance data
          </p>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <BellOff className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedBrand && loadInsights(selectedBrand.id)}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Brand selector */}
      {brands.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {brands.map(brand => (
            <button key={brand.id} onClick={() => setSelectedBrand(brand)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                selectedBrand?.id === brand.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
              {brand.name}
            </button>
          ))}
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-4">
          <InsightSkeleton />
          <InsightSkeleton />
          <InsightSkeleton />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && insights.length === 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No insights yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Insights are generated daily after your store data syncs.
              Check back tomorrow or click Refresh.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Insights list */}
      {!isLoading && insights.length > 0 && (
        <div className="space-y-4 mb-8">
          {insights.map(insight => (
            <Card key={insight.id}
              className={`dark:bg-gray-800 dark:border-gray-700 transition-all
                hover:shadow-lg ${!insight.is_read ? 'border-l-4 border-l-blue-500' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">

                  {/* Icon */}
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex-shrink-0">
                    <InsightIcon type={insight.insight_type} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">

                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {insight.title}
                        </h3>
                        {!insight.is_read && (
                          <Badge className="text-xs bg-blue-600 text-white">New</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <PriorityBadge priority={insight.priority} />
                        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                          <Clock className="h-3 w-3" />
                          {timeAgo(insight.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                      {insight.description}
                    </p>

                    {/* Action items */}
                    <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200
                      dark:border-blue-800 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                        💡 Recommended Actions:
                      </p>
                      <ul className="space-y-1">
                        {insight.action_items.map((item, i) => (
                          <li key={i} className="text-sm text-blue-800 dark:text-blue-400
                            flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5 flex-shrink-0">→</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action buttons */}
                    {!insight.is_read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsRead(insight.id)}
                        className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Mark as Read
                      </Button>
                    )}
                    {insight.is_read && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Read
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer info card */}
      <Card className="bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-900">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🤖</div>
            <div>
              <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-1">
                How Insights Work
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                Every day after your store syncs, Aura compares this week vs last week
                across revenue, orders, and customer acquisition. When a significant
                change is detected, an insight is automatically generated with
                specific action items to help you respond.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}