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

const menuItems = [
  { name: 'Overview',     href: '/dashboard',              icon: LayoutDashboard },
  { name: 'Integrations', href: '/dashboard/integrations', icon: Link2 },
  { name: 'Metrics',      href: '/dashboard/metrics',      icon: BarChart3 },
  { name: 'Insights',     href: '/dashboard/insights',     icon: Lightbulb, showBadge: true},
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const pathname  = usePathname();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [unreadInsights, setUnreadInsights] = useState(0);


  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // On small screens, default sidebar to closed
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch unread insights count for badge
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const brands = await getBrands();
        if (brands.length === 0) return;
        const data = await getInsights(brands[0].id);
        setUnreadInsights(data.unreadCount);
      } catch (e) {
        // Silently fail — badge is non-critical
      }
    };
    fetchUnreadCount();
}, [pathname]); // Re-fetch when user navigates (catches mark-as-read updates)
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

  // ── Shared sidebar content (used in both desktop + mobile) ──────────────────
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {sidebarOpen && (
          <h1 className="text-2xl font-bold gradient-text">Aura</h1>
        )}
        {/* Desktop toggle button */}
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
          return (
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
                {sidebarOpen && (
                  <span className="flex-1 text-sm">{item.name}</span>
                )}
                {/* Unread badge — only on Insights, only when there are unread */}
                {sidebarOpen && item.showBadge && unreadInsights > 0 && (
                  <span className="ml-auto flex items-center justify-center
                    w-5 h-5 text-xs font-bold bg-red-500 text-white rounded-full">
                    {unreadInsights > 9 ? '9+' : unreadInsights}
                  </span>
                )}
                {/* Collapsed sidebar — show dot instead of number */}
                {!sidebarOpen && item.showBadge && unreadInsights > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Link>
          );
        })}
      </nav>

      {/* Dark mode toggle at bottom of sidebar */}
      <div className="p-4 border-t border-border">
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

      {/* ── Mobile overlay ────────────────────────────────────────────────────── */}
      {/* Dark backdrop when mobile sidebar is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar ────────────────────────────────────────────────────── */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 flex flex-col
        bg-white dark:bg-gray-900 border-r border-border
        transition-transform duration-300 ease-in-out
        md:hidden w-64
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Close button for mobile */}
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <SidebarContent />
      </aside>

      {/* ── Desktop Sidebar ───────────────────────────────────────────────────── */}
      <aside className={`
        fixed top-0 left-0 h-full flex-col
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transition-all duration-300
        hidden md:flex
        ${sidebarOpen ? 'w-64' : 'w-20'}
      `}>
        <SidebarContent />
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────────────── */}
      <div className={`
        transition-all duration-300 min-h-screen
        ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}
      `}>

        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800
          flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">

          {/* Mobile hamburger menu */}
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

          {/* User menu */}
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