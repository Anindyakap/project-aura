'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, MousePointerClick, Eye, Users } from 'lucide-react';

const metrics = [
  { title: 'Total Revenue',  value: '$45,231.89', change: '+20.1%', trend: 'up',   icon: DollarSign,      color: 'text-green-600',  bgColor: 'bg-green-100  dark:bg-green-900'  },
  { title: 'Ad Spend',       value: '$14,105.00', change: '+4.3%',  trend: 'up',   icon: DollarSign,      color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900' },
  { title: 'ROAS',           value: '3.21x',      change: '+12.5%', trend: 'up',   icon: TrendingUp,      color: 'text-blue-600',   bgColor: 'bg-blue-100   dark:bg-blue-900'   },
  { title: 'Conversions',    value: '573',        change: '+8.2%',  trend: 'up',   icon: MousePointerClick,color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900' },
  { title: 'Impressions',    value: '1.2M',       change: '+15.3%', trend: 'up',   icon: Eye,             color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900' },
  { title: 'New Customers',  value: '245',        change: '-2.4%',  trend: 'down', icon: Users,           color: 'text-pink-600',   bgColor: 'bg-pink-100   dark:bg-pink-900'   },
];

export default function MetricsPage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Metrics</h1>
        <p className="text-gray-500 dark:text-gray-400">Track your marketing performance across all platforms</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const isUp = metric.trend === 'up';
          return (
            <Card key={metric.title} className="card-shadow dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric.title}</p>
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{metric.value}</p>
                <div className={`flex items-center gap-1 text-sm font-medium ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                  {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {metric.change} from last month
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart placeholder */}
      <Card className="card-shadow mb-8 dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Revenue Over Time</CardTitle>
          <CardDescription className="dark:text-gray-400">Last 30 days performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="text-center">
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">📊 Full Charts Coming Soon</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Connect your ad platforms to see real data</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-900">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">📈</div>
            <div>
              <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-1">Real Data Coming Soon!</h3>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                Connect Meta Ads and Google Ads to populate this page with real campaign performance data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}