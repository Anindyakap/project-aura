// components/dashboard/DashboardLayout.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard, Link2, BarChart3, Lightbulb,
  Menu, X, LogOut, User, Sun, Moon, ChevronRight,
} from 'lucide-react';
import { getBrands, getInsights } from '@/lib/api';

// showBadge: true means this nav item will show the unread count dot
const menuItems = [
  { name: 'Overview',     href: '/dashboard',              icon: LayoutDashboard, showBadge: false },
  { name: 'Integrations', href: '/dashboard/integrations', icon: Link2,           showBadge: false },
  { name: 'Metrics',      href: '/dashboard/metrics',      icon: BarChart3,       showBadge: false },
  { name: 'Insights',     href: '/dashboard/insights',     icon: Lightbulb,       showBadge: true  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [unreadCount, setUnreadCount]     = useState(0);
  const pathname  = usePathname();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // ── Close mobile sidebar when route changes ─────────────────────────────────
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // ── Collapse sidebar on small screens ──────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Fetch unread insights count for badge ───────────────────────────────────
  // WHY: The red badge tells the user there are new insights without
  //      them having to navigate to the Insights page to check.
  //
  // Re-runs every time pathname changes so:
  //   - When user marks insights as read → navigates away → comes back
  //     the badge count will have updated
  //   - When new insights are generated → navigating around the app
  //     will eventually pick them up
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const brands = await getBrands();
        if (brands.length === 0) return;
        // Use the first brand (same as the dashboard does)
        const data = await getInsights(brands[0].id);
        setUnreadCount(data.unreadCount);
      } catch {
        // Silently fail — badge is non-critical UI
        // Don't show an error if this background fetch fails
      }
    };
    fetchUnreadCount();
  }, [pathname]); // Re-fetch whenever user navigates to a new page

  const getInitials = (name: string | null, email: string): string => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return email[0].toUpperCase();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ── Shared sidebar content (desktop + mobile use the same component) ────────
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
        {sidebarOpen && (
          <h1 className="text-2xl font-bold gradient-text">Aura</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="ml-auto hidden md:flex"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          // Should we show the badge on this item?
          // Only show when: item.showBadge = true AND there are unread insights
          const showBadgeNumber = item.showBadge && unreadCount > 0 && sidebarOpen;
          const showBadgeDot    = item.showBadge && unreadCount > 0 && !sidebarOpen;

          return (
            // relative positioning needed so the dot badge can be positioned absolutely
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />

              {/* Label — only shown when sidebar is expanded */}
              {sidebarOpen && (
                <span className="flex-1 text-sm">{item.name}</span>
              )}

              {/* Badge with number — shown in expanded sidebar */}
              {/* e.g. shows "2" when there are 2 unread insights */}
              {showBadgeNumber && (
                <span className="ml-auto flex items-center justify-center
                  min-w-5 h-5 px-1 text-xs font-bold
                  bg-red-500 text-white rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}

              {/* Dot badge — shown when sidebar is collapsed (icon-only mode) */}
              {/* Small red circle in top-right corner of the icon */}
              {showBadgeDot && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5
                  bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
              )}

              {/* Active chevron in collapsed mode (no badge) */}
              {!sidebarOpen && isActive && !showBadgeDot && (
                <ChevronRight className="h-3 w-3 ml-auto" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Dark mode toggle */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full
            text-gray-600 dark:text-gray-400
            hover:bg-gray-100 dark:hover:bg-gray-800
            transition-all duration-150`}
        >
          {isDark
            ? <Sun  className="h-5 w-5 flex-shrink-0 text-yellow-500" />
            : <Moon className="h-5 w-5 flex-shrink-0 text-blue-500" />
          }
          {sidebarOpen && (
            <span className="text-sm">
              {isDark ? 'Light mode' : 'Dark mode'}
            </span>
          )}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Mobile overlay — dark backdrop behind open sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 flex flex-col
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transition-transform duration-300 ease-in-out
        md:hidden w-64
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full flex-col
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transition-all duration-300
        hidden md:flex
        ${sidebarOpen ? 'w-64' : 'w-20'}
      `}>
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className={`
        transition-all duration-300 min-h-screen
        ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}
      `}>

        {/* Sticky Header */}
        <header className="h-16 bg-white dark:bg-gray-900
          border-b border-gray-200 dark:border-gray-800
          flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Page title */}
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {menuItems.find(item => item.href === pathname)?.name || 'Dashboard'}
          </h2>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-sm">
                    {getInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:block dark:text-gray-100">
                  {user.name || user.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
