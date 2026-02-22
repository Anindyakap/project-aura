// app/dashboard/page.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  // If no user, show loading
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <header className="bg-white shadow-sm rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-text">
              Welcome to Aura
            </h1>
            <p className="text-gray-600 mt-2">
              Hello, {user.name || user.email}! 👋
            </p>
          </div>
          <Button onClick={logout} variant="outline">
            Logout
          </Button>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1 */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$12,345</p>
            <p className="text-sm text-gray-500 mt-2">+20% from last month</p>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card>
          <CardHeader>
            <CardTitle>ROAS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">3.2x</p>
            <p className="text-sm text-gray-500 mt-2">Return on ad spend</p>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card>
          <CardHeader>
            <CardTitle>CPA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$45.23</p>
            <p className="text-sm text-gray-500 mt-2">Cost per acquisition</p>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>🚀 Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-gray-600">
            <li>✅ Authentication System (Complete!)</li>
            <li>⏳ Connect Shopify Integration</li>
            <li>⏳ Connect Meta Ads</li>
            <li>⏳ Connect Google Ads</li>
            <li>⏳ Real-time Metrics & Charts</li>
            <li>⏳ AI-powered Insights</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}