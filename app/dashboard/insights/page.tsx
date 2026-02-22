// app/dashboard/insights/page.tsx
'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Lightbulb, CheckCircle, Clock } from 'lucide-react';

export default function InsightsPage() {
  // Mock insights
  const insights = [
    {
      id: 1,
      type: 'warning',
      priority: 'high',
      title: 'High CPA Alert',
      description: 'Your "Spring Collection" Meta Ads campaign has seen a 40% increase in Cost Per Acquisition this week.',
      recommendation: 'Consider pausing underperforming ad sets or adjusting your targeting.',
      timestamp: '2 hours ago',
      isRead: false,
    },
    {
      id: 2,
      type: 'opportunity',
      priority: 'high',
      title: 'Budget Reallocation Opportunity',
      description: 'Your Google Ads "Brand Search" campaign has 25% higher ROAS than Meta Ads.',
      recommendation: 'Consider shifting 20% of your Meta budget to Google Brand Search for better returns.',
      timestamp: '5 hours ago',
      isRead: false,
    },
    {
      id: 3,
      type: 'success',
      priority: 'medium',
      title: 'High Performing Campaign',
      description: 'Your "Summer Sale" Shopify collection has converted 15% better than average this week.',
      recommendation: 'Increase ad spend on campaigns driving traffic to this collection.',
      timestamp: '1 day ago',
      isRead: true,
    },
    {
      id: 4,
      type: 'info',
      priority: 'low',
      title: 'Weekly Performance Summary',
      description: 'Overall ROAS improved by 8% compared to last week across all platforms.',
      recommendation: 'Continue current strategy and monitor for consistency.',
      timestamp: '2 days ago',
      isRead: true,
    },
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'opportunity':
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Lightbulb className="h-5 w-5 text-purple-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Insights</h1>
        <p className="text-gray-600">
          AI-powered recommendations to optimize your marketing performance
        </p>
      </div>

      {/* Insights List */}
      <div className="space-y-4 mb-8">
        {insights.map((insight) => (
          <Card
            key={insight.id}
            className={`card-shadow transition-all hover:shadow-lg ${
              !insight.isRead ? 'border-l-4 border-l-blue-500' : ''
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="p-2 bg-gray-100 rounded-lg">
                  {getInsightIcon(insight.type)}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                      {!insight.isRead && (
                        <Badge variant="default" className="text-xs">New</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={getPriorityColor(insight.priority)}
                      >
                        {insight.priority.toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        {insight.timestamp}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3">{insight.description}</p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      💡 Recommendation:
                    </p>
                    <p className="text-sm text-blue-800">{insight.recommendation}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="default">
                      Take Action
                    </Button>
                    <Button size="sm" variant="outline">
                      Mark as Read
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🤖</div>
            <div>
              <h3 className="font-semibold text-purple-900 mb-1">
                AI-Powered Insights Coming Soon!
              </h3>
              <p className="text-sm text-purple-800">
                These are example insights. Once connected to your platforms, our AI engine will
                analyze your data and generate personalized recommendations automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
