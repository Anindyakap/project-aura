// app/dashboard/integrations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Link2, CheckCircle2, AlertCircle, ArrowRight,
  Loader2, RefreshCw, Unplug, Plus
} from 'lucide-react';
import {
  getBrands, createBrand, getShopifyStatus,
  getShopifyConnectUrl, disconnectShopify,
  Brand
} from '@/lib/api';
import { useSearchParams } from 'next/navigation';

export default function IntegrationsPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [brands, setBrands] = useState<Brand[]>([]);           // list of user's brands
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null); // active brand
  const [shopifyStatus, setShopifyStatus] = useState<{         // shopify connection status
    connected: boolean;
    integration?: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);            // page loading
  const [isConnecting, setIsConnecting] = useState(false);     // shopify connect button
  const [shopInput, setShopInput] = useState('');              // shop URL input
  const [showShopInput, setShowShopInput] = useState(false);   // show/hide input
  const [newBrandName, setNewBrandName] = useState('');        // new brand name input
  const [showBrandForm, setShowBrandForm] = useState(false);   // show/hide brand form
  const [notification, setNotification] = useState<{          // success/error banner
    type: 'success' | 'error'; message: string
  } | null>(null);

  // Read ?shopify=connected or ?shopify=error from URL after OAuth redirect
  const searchParams = useSearchParams();

  // ── On page load ───────────────────────────────────────────────────────────
  useEffect(() => {
    loadBrands();

    // Check if Shopify just redirected back with a result
    const shopifyResult = searchParams.get('shopify');
    if (shopifyResult === 'connected') {
      showNotification('success', '🎉 Shopify connected successfully!');
    } else if (shopifyResult === 'error') {
      const reason = searchParams.get('reason') || 'unknown';
      showNotification('error', `Failed to connect Shopify: ${reason}`);
    }
  }, []);

  // When selected brand changes, fetch its Shopify status
  useEffect(() => {
    if (selectedBrand) {
      loadShopifyStatus(selectedBrand.id);
    }
  }, [selectedBrand]);

  // ── Helper functions ───────────────────────────────────────────────────────

  // Show a notification banner for 4 seconds then hide it
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch all brands from backend
  const loadBrands = async () => {
    try {
      setIsLoading(true);
      const data = await getBrands();
      setBrands(data);
      // Auto-select first brand if only one exists
      if (data.length === 1) setSelectedBrand(data[0]);
    } catch (error: any) {
      showNotification('error', 'Failed to load brands');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Shopify connection status for a brand
  const loadShopifyStatus = async (brandId: string) => {
    try {
      const status = await getShopifyStatus(brandId);
      setShopifyStatus(status);
    } catch (error) {
      setShopifyStatus({ connected: false });
    }
  };

  // Create a new brand
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

  // Connect Shopify — redirects browser to Shopify OAuth
  const handleConnectShopify = () => {
    if (!selectedBrand) return;

    // Clean up shop input: remove https://, trailing slashes etc.
    let shop = shopInput.trim().toLowerCase();
    shop = shop.replace('https://', '').replace('http://', '').replace(/\/$/, '');

    // Validate format
    if (!shop.endsWith('.myshopify.com')) {
      showNotification('error', 'Shop URL must end with .myshopify.com');
      return;
    }

    setIsConnecting(true);

    // Build the backend OAuth URL and redirect the browser there
    // The backend will redirect to Shopify, Shopify will redirect back to our callback
    const connectUrl = getShopifyConnectUrl(shop, selectedBrand.id);
    window.location.href = connectUrl; // full page redirect to start OAuth
  };

  // Disconnect Shopify
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
            /* No brands yet — show create form */
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">No brands yet. Create your first brand to get started.</p>
              <Button onClick={() => setShowBrandForm(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Brand
              </Button>
            </div>
          ) : (
            /* Brand list as clickable cards */
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

          {/* Create Brand Form */}
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

      {/* Integrations Grid — only show if a brand is selected */}
      {selectedBrand ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* ── Shopify Card ── */}
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
                  {shopifyStatus?.connected ? (
                    <><CheckCircle2 className="h-3 w-3" /> Connected</>
                  ) : (
                    <><AlertCircle className="h-3 w-3" /> Not Connected</>
                  )}
                </Badge>
              </div>
              <CardTitle className="text-xl">Shopify</CardTitle>
              <CardDescription>Connect your store to track sales and orders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Features list */}
              <ul className="space-y-1">
                {['Sales data', 'Order tracking', 'Product analytics'].map(f => (
                  <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" /> {f}
                  </li>
                ))}
              </ul>

              {/* Connected state: show store info */}
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

              {/* Shop URL input — shown when user clicks Connect */}
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

              {/* Action buttons */}
              {shopifyStatus?.connected ? (
                /* Already connected: show disconnect button */
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleDisconnectShopify}
                >
                  <Unplug className="h-4 w-4 mr-2" /> Disconnect
                </Button>
              ) : showShopInput ? (
                /* Input visible: show Connect + Cancel */
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
                /* Default: show Connect Shopify button */
                <Button className="w-full" onClick={() => setShowShopInput(true)}>
                  Connect Shopify <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>

          {/* ── Meta Ads Card (Coming Soon) ── */}
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

          {/* ── Google Ads Card (Coming Soon) ── */}
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
        /* No brand selected yet */
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