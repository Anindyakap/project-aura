// app/dashboard/metrics/page.tsx
'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, MousePointerClick, Eye, Users } from 'lucide-react';

export default function MetricsPage() {
  // Mock metrics data
  const metrics = [
    {
      title: 'Total Revenue',
      value: '$45,231.89',
      change: '+20.1%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Ad Spend',
      value: '$14,105.00',
      change: '+4.3%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'ROAS',
      value: '3.21x',
      change: '+12.5%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Conversions',
      value: '573',
      change: '+8.2%',
      trend: 'up',
      icon: MousePointerClick,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Impressions',
      value: '1.2M',
      change: '+15.3%',
      trend: 'up',
      icon: Eye,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'New Customers',
      value: '245',
      change: '-2.4%',
      trend: 'down',
      icon: Users,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
  ];

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Metrics</h1>
        <p className="text-gray-600">
          Track your marketing performance across all platforms
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="card-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                  <div className="flex items-center gap-2">
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <p
                      className={`text-sm font-medium ${
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {metric.change} from last month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Placeholder for Charts */}
      <Card className="card-shadow mb-8">
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
          <CardDescription>Last 30 days performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700 mb-2">📊 Chart Coming Soon</p>
              <p className="text-sm text-gray-500">
                Real-time charts will be added in the next phase
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">📈</div>
            <div>
              <h3 className="font-semibold text-purple-900 mb-1">
                Real Data Coming Soon!
              </h3>
              <p className="text-sm text-purple-800">
                These are mock metrics for demonstration. Once you connect your platforms,
                real-time data will populate here automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}