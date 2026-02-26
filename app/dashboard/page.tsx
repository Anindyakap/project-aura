// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Receipt } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  getBrands, getMetricsSummary, getMetricsChart,
  Brand, MetricsSummary, ChartPoint
} from '@/lib/api';

// ─── KPI Card Component ───────────────────────────────────────────────────────
// Reusable card that shows a single metric with trend arrow
// Props: title, value, change%, icon, colors
function KpiCard({
  title,
  formatted,
  change,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  formatted: string;
  change: number;
  icon: any;
  color: string;
  bgColor: string;
}) {
  const isPositive = change >= 0;

  return (
    <Card className="card-shadow">
      <CardContent className="p-6">
        {/* Top row: label + icon */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>

        {/* Value */}
        <p className="text-3xl font-bold text-gray-900 mb-1">{formatted}</p>

        {/* Trend arrow + % change */}
        {/* Only show if we have comparison data (change !== 0) */}
        {change !== 0 && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            isPositive ? 'text-green-600' : 'text-red-500'
          }`}>
            {isPositive
              ? <TrendingUp className="h-4 w-4" />
              : <TrendingDown className="h-4 w-4" />
            }
            {isPositive ? '+' : ''}{change}% vs last 30 days
          </div>
        )}

        {/* Show neutral message if no comparison data yet */}
        {change === 0 && (
          <p className="text-sm text-gray-400">Last 30 days</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Custom Tooltip for Charts ────────────────────────────────────────────────
// What shows when user hovers over a data point on the chart
function CustomTooltip({ active, payload, label, prefix = '' }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-900">
        {prefix}{payload[0].value.toLocaleString()}
      </p>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  // State
  const [brands, setBrands]           = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [summary, setSummary]         = useState<MetricsSummary | null>(null);
  const [revenueChart, setRevenueChart] = useState<ChartPoint[]>([]);
  const [ordersChart, setOrdersChart]   = useState<ChartPoint[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [activeChart, setActiveChart] = useState<'revenue' | 'orders'>('revenue');

  // On page load: fetch brands
  useEffect(() => {
    loadBrands();
  }, []);

  // When brand changes: fetch its metrics
  useEffect(() => {
    if (selectedBrand) {
      loadMetrics(selectedBrand.id);
    }
  }, [selectedBrand]);

  const loadBrands = async () => {
    try {
      const data = await getBrands();
      setBrands(data);
      // Auto-select first brand
      if (data.length > 0) setSelectedBrand(data[0]);
    } catch (error) {
      console.error('Failed to load brands:', error);
    }
  };

  const loadMetrics = async (brandId: string) => {
    try {
      setIsLoading(true);

      // Fetch all data in parallel (at the same time, not one by one)
      // Promise.all = "start all 3 requests simultaneously, wait for all to finish"
      // WHY: Faster than waiting for each one sequentially
      const [summaryData, revenueData, ordersData] = await Promise.all([
        getMetricsSummary(brandId),
        getMetricsChart(brandId, 'revenue', 30),
        getMetricsChart(brandId, 'orders', 30),
      ]);

      setSummary(summaryData);
      setRevenueChart(revenueData);
      setOrdersChart(ordersData);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for chart X axis: "2026-02-25" → "Feb 25"
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format chart data with readable dates
  const chartData = (activeChart === 'revenue' ? revenueChart : ordersChart)
    .map(point => ({
      date: formatDate(point.date),
      value: point.value,
    }));

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>

      {/* Brand selector — show if user has multiple brands */}
      {brands.length > 1 && (
        <div className="flex gap-2 mb-6">
          {brands.map(brand => (
            <button
              key={brand.id}
              onClick={() => setSelectedBrand(brand)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                selectedBrand?.id === brand.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'

              }`}
            >
              {brand.name}
            </button>
          ))}
        </div>
      )}

      {/* No brands state */}
      {brands.length === 0 && !isLoading && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <p className="text-blue-800 font-medium mb-2">No brands yet</p>
            <p className="text-blue-600 text-sm">
              Go to Integrations to create your first brand and connect Shopify
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── KPI Cards ────────────────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {isLoading ? (
          // Skeleton loading state — shows grey boxes while data loads
          // WHY: Better UX than a blank page or spinner
          <>
            {[1,2,3,4].map(i => (
              <Card key={i} className="card-shadow">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-8 bg-gray-200 rounded w-32" />
                    <div className="h-3 bg-gray-200 rounded w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : summary ? (
          // Real data KPI cards
          <>
            <KpiCard
              title="Revenue"
              formatted={summary.metrics.revenue.formatted}
              change={summary.metrics.revenue.change}
              icon={DollarSign}
              color="text-green-600"
              bgColor="bg-green-100"
            />
            <KpiCard
              title="Orders"
              formatted={summary.metrics.orders.formatted}
              change={summary.metrics.orders.change}
              icon={ShoppingCart}
              color="text-blue-600"
              bgColor="bg-blue-100"
            />
            <KpiCard
              title="Avg Order Value"
              formatted={summary.metrics.aov.formatted}
              change={summary.metrics.aov.change}
              icon={Receipt}
              color="text-purple-600"
              bgColor="bg-purple-100"
            />
            <KpiCard
              title="New Customers"
              formatted={summary.metrics.new_customers.formatted}
              change={summary.metrics.new_customers.change}
              icon={Users}
              color="text-orange-600"
              bgColor="bg-orange-100"
            />
          </>
        ) : null}
      </div>

      {/* ── Chart ────────────────────────────────────────────────────────────── */}
      <Card className="card-shadow mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Performance Trend</CardTitle>

            {/* Toggle between revenue and orders chart */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveChart('revenue')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  activeChart === 'revenue'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setActiveChart('orders')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  activeChart === 'orders'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Orders
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
          ) : (
            // ResponsiveContainer: makes chart fill its parent width
            // AreaChart: line chart with filled area below the line
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                {/* Grid lines in the background */}
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

                {/* X axis: dates */}
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  // Only show every 5th label to avoid crowding
                  interval={4}
                />

                {/* Y axis: values */}
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  // Format: $1,234 for revenue, just 12 for orders
                  tickFormatter={(v) =>
                    activeChart === 'revenue'
                      ? `$${(v/1000).toFixed(0)}k`
                      : v.toString()
                  }
                />

                {/* Tooltip on hover */}
                <Tooltip
                  content={
                    <CustomTooltip
                      prefix={activeChart === 'revenue' ? '$' : ''}
                    />
                  }
                />

                {/* Gradient fill under the line */}
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>

                {/* The actual line + area */}
                <Area
                  type="monotone"      // smooth curve between points
                  dataKey="value"
                  stroke="#3b82f6"     // blue line
                  strokeWidth={2}
                  fill="url(#colorValue)"  // gradient fill
                  dot={false}          // no dots on each data point (cleaner)
                  activeDot={{ r: 4, fill: '#3b82f6' }}  // dot appears on hover
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Quick Stats Row ───────────────────────────────────────────────────── */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900">

            <CardContent className="p-4">
              <p className="text-sm text-green-700 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-green-900">
                {summary.metrics.revenue.formatted}
              </p>
              <p className="text-xs text-green-600 mt-1">Last 30 days</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
            <CardContent className="p-4">
              <p className="text-sm text-blue-700 font-medium">Average Order Value</p>
              <p className="text-2xl font-bold text-blue-900">
                {summary.metrics.aov.formatted}
              </p>
              <p className="text-xs text-blue-600 mt-1">Per transaction</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-900">
            <CardContent className="p-4">
              <p className="text-sm text-purple-700 font-medium">New Customers</p>
              <p className="text-2xl font-bold text-purple-900">
                {summary.metrics.new_customers.formatted}
              </p>
              <p className="text-xs text-purple-600 mt-1">First-time buyers</p>
            </CardContent>
          </Card>
        </div>
      )}

    </DashboardLayout>
  );
}