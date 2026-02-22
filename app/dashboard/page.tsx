// app/dashboard/page.tsx
'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, MousePointerClick, Users } from 'lucide-react';

export default function DashboardPage() {
  // Mock data (we'll replace with real data later)
  const stats = [
    {
      title: 'Revenue',
      value: '$12,345',
      change: '+20.1%',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'ROAS',
      value: '3.2x',
      change: '+12.5%',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Conversions',
      value: '273',
      change: '+8.2%',
      icon: MousePointerClick,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'New Customers',
      value: '145',
      change: '+15.3%',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <DashboardLayout>
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="card-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600 font-medium">{stat.change} from last month</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Coming Soon Section */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            What's Next
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <span className="text-xl">✅</span>
              <div>
                <p className="font-medium text-gray-900">Authentication System</p>
                <p className="text-sm text-gray-600">Complete with login, register, and protected routes</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl">⏳</span>
              <div>
                <p className="font-medium text-gray-900">Platform Integrations</p>
                <p className="text-sm text-gray-600">Connect Shopify, Meta Ads, and Google Ads</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl">⏳</span>
              <div>
                <p className="font-medium text-gray-900">Real-time Analytics</p>
                <p className="text-sm text-gray-600">Live charts and performance metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl">⏳</span>
              <div>
                <p className="font-medium text-gray-900">AI-Powered Insights</p>
                <p className="text-sm text-gray-600">Automated recommendations and alerts</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}