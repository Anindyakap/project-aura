// app/dashboard/integrations/page.tsx
'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function IntegrationsPage() {
  // Mock integration status
  const integrations = [
    {
      name: 'Shopify',
      description: 'Connect your Shopify store to track sales and orders',
      icon: '🛍️',
      status: 'disconnected',
      features: ['Sales data', 'Order tracking', 'Product analytics'],
    },
    {
      name: 'Meta Ads',
      description: 'Track Facebook & Instagram ad performance',
      icon: '📱',
      status: 'disconnected',
      features: ['Campaign metrics', 'Ad spend tracking', 'ROAS calculation'],
    },
    {
      name: 'Google Ads',
      description: 'Monitor Google Ads campaigns and conversions',
      icon: '🔍',
      status: 'disconnected',
      features: ['Search ads', 'Display ads', 'Conversion tracking'],
    },
  ];

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrations</h1>
        <p className="text-gray-600">
          Connect your marketing platforms to unlock powerful insights
        </p>
      </div>

      {/* Integrations Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.name} className="card-shadow hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <span className="text-3xl">{integration.icon}</span>
                </div>
                <Badge
                  variant={integration.status === 'connected' ? 'default' : 'secondary'}
                  className="flex items-center gap-1"
                >
                  {integration.status === 'connected' ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3" />
                      Not Connected
                    </>
                  )}
                </Badge>
              </div>
              <CardTitle className="text-xl">{integration.name}</CardTitle>
              <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Features */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Features:</p>
                  <ul className="space-y-1">
                    {integration.features.map((feature) => (
                      <li key={feature} className="text-sm text-gray-600 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Connect Button */}
                <Button
                  className="w-full"
                  variant={integration.status === 'connected' ? 'outline' : 'default'}
                  disabled={integration.status === 'connected'}
                >
                  {integration.status === 'connected' ? (
                    'Connected'
                  ) : (
                    <>
                      Connect {integration.name}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Link2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                🚀 Integration Coming Soon!
              </h3>
              <p className="text-sm text-blue-800">
                OAuth connections to Shopify, Meta, and Google Ads will be available in the next phase.
                For now, this page shows how integrations will look in the final product.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}