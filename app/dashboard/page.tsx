'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Receipt } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getBrands, getMetricsSummary, getMetricsChart, Brand, MetricsSummary, ChartPoint } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';

function KpiCard({ title, formatted, change, icon: Icon, color, bgColor }: {
  title: string; formatted: string; change: number; icon: any; color: string; bgColor: string;
}) {
  const isPositive = change >= 0;
  return (
    <Card className="card-shadow dark:bg-gray-800 dark:border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{formatted}</p>
        {change !== 0 ? (
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {isPositive ? '+' : ''}{change}% vs last 30 days
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">Last 30 days</p>
        )}
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label, prefix = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-900 dark:text-white">
        {prefix}{payload[0].value.toLocaleString()}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [revenueChart, setRevenueChart] = useState<ChartPoint[]>([]);
  const [ordersChart, setOrdersChart] = useState<ChartPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<'revenue' | 'orders'>('revenue');
  const { isDark } = useTheme();

  // Colors that change with dark mode
  const gridColor  = isDark ? '#374151' : '#f0f0f0';
  const tickColor  = isDark ? '#9ca3af' : '#6b7280';

  useEffect(() => { loadBrands(); }, []);
  useEffect(() => { if (selectedBrand) loadMetrics(selectedBrand.id); }, [selectedBrand]);

  const loadBrands = async () => {
    try {
      const data = await getBrands();
      setBrands(data);
      if (data.length > 0) setSelectedBrand(data[0]);
    } catch (e) { console.error(e); }
  };

  const loadMetrics = async (brandId: string) => {
    try {
      setIsLoading(true);
      const [summaryData, revenueData, ordersData] = await Promise.all([
        getMetricsSummary(brandId),
        getMetricsChart(brandId, 'revenue', 30),
        getMetricsChart(brandId, 'orders', 30),
      ]);
      setSummary(summaryData);
      setRevenueChart(revenueData);
      setOrdersChart(ordersData);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const chartData = (activeChart === 'revenue' ? revenueChart : ordersChart)
    .map(p => ({ date: formatDate(p.date), value: p.value }));

  return (
    <DashboardLayout>
      {/* Brand selector */}
      {brands.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {brands.map(brand => (
            <button key={brand.id} onClick={() => setSelectedBrand(brand)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                selectedBrand?.id === brand.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
              }`}>
              {brand.name}
            </button>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {isLoading ? (
          [1,2,3,4].map(i => (
            <Card key={i} className="card-shadow dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : summary ? (
          <>
            <KpiCard title="Revenue"       formatted={summary.metrics.revenue.formatted}       change={summary.metrics.revenue.change}       icon={DollarSign}  color="text-green-600"  bgColor="bg-green-100 dark:bg-green-900"  />
            <KpiCard title="Orders"        formatted={summary.metrics.orders.formatted}        change={summary.metrics.orders.change}        icon={ShoppingCart} color="text-blue-600"   bgColor="bg-blue-100 dark:bg-blue-900"   />
            <KpiCard title="Avg Order Value" formatted={summary.metrics.aov.formatted}         change={summary.metrics.aov.change}           icon={Receipt}     color="text-purple-600" bgColor="bg-purple-100 dark:bg-purple-900"/>
            <KpiCard title="New Customers" formatted={summary.metrics.new_customers.formatted} change={summary.metrics.new_customers.change} icon={Users}       color="text-orange-600" bgColor="bg-orange-100 dark:bg-orange-900"/>
          </>
        ) : null}
      </div>

      {/* Chart */}
      <Card className="card-shadow mb-8 dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="dark:text-white">Performance Trend</CardTitle>
            <div className="flex gap-2">
              {(['revenue', 'orders'] as const).map(type => (
                <button key={type} onClick={() => setActiveChart(type)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all capitalize ${
                    activeChart === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}>
                  {type}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={300} style={{ background: 'transparent' }}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }} style={{ background: 'transparent' }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}  />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: tickColor }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 12, fill: tickColor }} tickLine={false} axisLine={false}
                  tickFormatter={v => activeChart === 'revenue' ? `$${(v/1000).toFixed(0)}k` : String(v)} />
                <Tooltip content={<CustomTooltip prefix={activeChart === 'revenue' ? '$' : ''} />} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2}
                fill="url(#colorValue)" dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-900">
            <CardContent className="p-4">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-300">{summary.metrics.revenue.formatted}</p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">Last 30 days</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900">
            <CardContent className="p-4">
              <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">Average Order Value</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{summary.metrics.aov.formatted}</p>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">Per transaction</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-900">
            <CardContent className="p-4">
              <p className="text-sm text-purple-700 dark:text-purple-400 font-medium">New Customers</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">{summary.metrics.new_customers.formatted}</p>
              <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">First-time buyers</p>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}