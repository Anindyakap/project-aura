// app/dashboard/integrations/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Link2, CheckCircle2, AlertCircle, ArrowRight,
  Loader2, Unplug, Plus
} from 'lucide-react';
import {
  getBrands, createBrand, getShopifyStatus,
  getShopifyConnectUrl, disconnectShopify,
  Brand
} from '@/lib/api';
import { useSearchParams } from 'next/navigation';

// ─────────────────────────────────────────────────────────────────────────────
// This tiny component is the ONLY part that uses useSearchParams.
// Isolating it here is what makes the Suspense boundary work correctly.
// Think of it like a small helper function that reads the URL query string.
// ─────────────────────────────────────────────────────────────────────────────
function ShopifyResultHandler({
  onResult,
}: {
  onResult: (type: 'success' | 'error', message: string) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const shopifyResult = searchParams.get('shopify');
    if (shopifyResult === 'connected') {
      onResult('success', '🎉 Shopify connected successfully!');
    } else if (shopifyResult === 'error') {
      const reason = searchParams.get('reason') || 'unknown';
      onResult('error', `Failed to connect Shopify: ${reason}`);
    }
  }, []);  // runs once when component mounts

  return null; // this component renders nothing — it just reads the URL
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page component — no useSearchParams here, so no Suspense issues
// ─────────────────────────────────────────────────────────────────────────────
function IntegrationsContent() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [shopifyStatus, setShopifyStatus] = useState<{
    connected: boolean;
    integration?: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [shopInput, setShopInput] = useState('');
  const [showShopInput, setShowShopInput] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'; message: string
  } | null>(null);

  // ── On page load ───────────────────────────────────────────────────────────
  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      loadShopifyStatus(selectedBrand.id);
    }
  }, [selectedBrand]);

  // ── Helper functions ───────────────────────────────────────────────────────

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadBrands = async () => {
    try {
      setIsLoading(true);
      const data = await getBrands();
      setBrands(data);
      if (data.length === 1) setSelectedBrand(data[0]);
    } catch (error: any) {
      showNotification('error', 'Failed to load brands');
    } finally {
      setIsLoading(false);
    }
  };

  const loadShopifyStatus = async (brandId: string) => {
    try {
      const status = await getShopifyStatus(brandId);
      setShopifyStatus(status);
    } catch (error) {
      setShopifyStatus({ connected: false });
    }
  };

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return;
    try {
      const brand = await createBrand(newBrandName.trim());
      setBrands(prev => [...prev, brand]);
      setSelectedBrand(brand);
      setNewBrandName('');
      setShowBrandForm(false);
      showNotification('success', `Brand "${brand.name}" created!`);
    } catch (error: any) {
      showNotification('error', error.message);
    }
  };

  const handleConnectShopify = () => {
    if (!selectedBrand) return;

    let shop = shopInput.trim().toLowerCase();
    shop = shop.replace('https://', '').replace('http://', '').replace(/\/$/, '');

    if (!shop.endsWith('.myshopify.com')) {
      showNotification('error', 'Shop URL must end with .myshopify.com');
      return;
    }

    setIsConnecting(true);
    const connectUrl = getShopifyConnectUrl(shop, selectedBrand.id);
    window.location.href = connectUrl;
  };

  const handleDisconnectShopify = async () => {
    if (!selectedBrand) return;
    try {
      await disconnectShopify(selectedBrand.id);
      setShopifyStatus({ connected: false });
      showNotification('success', 'Shopify disconnected');
    } catch (error: any) {
      showNotification('error', error.message);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* ShopifyResultHandler reads ?shopify= from URL and calls showNotification */}
      {/* It renders nothing visually — just handles the redirect result */}
      <Suspense fallback={null}>
        <ShopifyResultHandler onResult={showNotification} />
      </Suspense>

      {/* Notification Banner */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          notification.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {notification.type === 'success'
            ? <CheckCircle2 className="h-5 w-5" />
            : <AlertCircle className="h-5 w-5" />
          }
          {notification.message}
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrations</h1>
        <p className="text-gray-600">Connect your marketing platforms to unlock insights</p>
      </div>

      {/* Brand Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Select Brand</CardTitle>
          <CardDescription>Choose which brand to manage integrations for</CardDescription>
        </CardHeader>
        <CardContent>
          {brands.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">No brands yet. Create your first brand to get started.</p>
              <Button onClick={() => setShowBrandForm(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Brand
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {brands.map(brand => (
                <button
                  key={brand.id}
                  onClick={() => setSelectedBrand(brand)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                    selectedBrand?.id === brand.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {brand.name}
                  {brand.domain && (
                    <span className="ml-2 text-xs text-gray-400">{brand.domain}</span>
                  )}
                </button>
              ))}
              <Button variant="outline" size="sm" onClick={() => setShowBrandForm(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Brand
              </Button>
            </div>
          )}

          {showBrandForm && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg flex gap-3">
              <Input
                placeholder="Brand name (e.g. My Jewelry Store)"
                value={newBrandName}
                onChange={e => setNewBrandName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateBrand()}
              />
              <Button onClick={handleCreateBrand}>Create</Button>
              <Button variant="outline" onClick={() => setShowBrandForm(false)}>Cancel</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integrations Grid */}
      {selectedBrand ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* Shopify Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <span className="text-3xl">🛍️</span>
                </div>
                <Badge
                  variant={shopifyStatus?.connected ? 'default' : 'secondary'}
                  className="flex items-center gap-1"
                >
                  {shopifyStatus?.connected
                    ? <><CheckCircle2 className="h-3 w-3" /> Connected</>
                    : <><AlertCircle className="h-3 w-3" /> Not Connected</>
                  }
                </Badge>
              </div>
              <CardTitle className="text-xl">Shopify</CardTitle>
              <CardDescription>Connect your store to track sales and orders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-1">
                {['Sales data', 'Order tracking', 'Product analytics'].map(f => (
                  <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" /> {f}
                  </li>
                ))}
              </ul>

              {shopifyStatus?.connected && shopifyStatus.integration && (
                <div className="p-3 bg-green-50 rounded-lg text-sm">
                  <p className="font-medium text-green-800">
                    {shopifyStatus.integration.platform_account_name}
                  </p>
                  <p className="text-green-600 text-xs mt-1">
                    {shopifyStatus.integration.platform_account_id}
                  </p>
                </div>
              )}

              {showShopInput && !shopifyStatus?.connected && (
                <div className="space-y-2">
                  <Label className="text-sm">Your Shopify store URL</Label>
                  <Input
                    placeholder="yourstore.myshopify.com"
                    value={shopInput}
                    onChange={e => setShopInput(e.target.value)}
                  />
                </div>
              )}

              {shopifyStatus?.connected ? (
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleDisconnectShopify}
                >
                  <Unplug className="h-4 w-4 mr-2" /> Disconnect
                </Button>
              ) : showShopInput ? (
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleConnectShopify}
                    disabled={isConnecting || !shopInput}
                  >
                    {isConnecting
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Connecting...</>
                      : <><ArrowRight className="h-4 w-4 mr-2" /> Connect</>
                    }
                  </Button>
                  <Button variant="outline" onClick={() => setShowShopInput(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button className="w-full" onClick={() => setShowShopInput(true)}>
                  Connect Shopify <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Meta Ads Card */}
          <Card className="hover:shadow-lg transition-shadow opacity-75">
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <span className="text-3xl">📱</span>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              <CardTitle className="text-xl">Meta Ads</CardTitle>
              <CardDescription>Track Facebook & Instagram ad performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-1">
                {['Campaign metrics', 'Ad spend tracking', 'ROAS calculation'].map(f => (
                  <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full" disabled>
                Connect Meta Ads <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Google Ads Card */}
          <Card className="hover:shadow-lg transition-shadow opacity-75">
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <span className="text-3xl">🔍</span>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              <CardTitle className="text-xl">Google Ads</CardTitle>
              <CardDescription>Monitor Google Ads campaigns and conversions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-1">
                {['Search ads', 'Display ads', 'Conversion tracking'].map(f => (
                  <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full" disabled>
                Connect Google Ads <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

        </div>
      ) : (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Link2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Select a brand above</h3>
              <p className="text-sm text-blue-800">
                Choose an existing brand or create a new one to manage its integrations.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Default export — wraps everything in Suspense for Next.js build compatibility
// ─────────────────────────────────────────────────────────────────────────────
export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <IntegrationsContent />
    </Suspense>
  );
}