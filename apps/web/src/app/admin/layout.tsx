'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  FileText,
  FileSignature,
  Receipt,
  Users,
  Menu,
  X,
  CreditCard,
  FileBarChart,
  Settings,
  MessageSquare,
  Globe,
  UserCog,
  Shield,
  LogOut,
  Package,
  BarChart3,
  Building2,
  Sun,
  Moon,
  Search,
  Lock,
  ChevronRight,
  Sparkles,
  Pin,
  PinOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { CommandPalette } from '@/components/CommandPalette';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  requiresAdmin?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Core Management',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Sales & Revenue',
    items: [
      { name: 'Customers', href: '/admin/customers', icon: Users },
      { name: 'Estimates (Quotes)', href: '/admin/quotations', icon: FileSignature },
      { name: 'Invoices', href: '/admin/invoices', icon: FileText },
      { name: 'Receipts', href: '/admin/receipts', icon: Receipt },
    ],
  },
  {
    title: 'Finance & Supply',
    items: [
      { name: 'Expenses', href: '/admin/expenses', icon: CreditCard },
      { name: 'Inventory & Materials', href: '/admin/inventory', icon: Package },
      { name: 'Suppliers (Vendors)', href: '/admin/suppliers', icon: Building2 },
      { name: 'Executive Reports', href: '/admin/reports', icon: BarChart3, requiresAdmin: true },
    ],
  },
  {
    title: 'System & Marketing',
    items: [
      { name: 'Services Catalog', href: '/admin/services', icon: FileBarChart, requiresAdmin: true },
      { name: 'Website CMS', href: '/admin/cms', icon: Globe, requiresAdmin: true },
      { name: 'Staff Users', href: '/admin/users', icon: UserCog, requiresAdmin: true },
      { name: 'SMS & Broadcasts', href: '/admin/sms-logs', icon: MessageSquare, requiresAdmin: true },
      { name: 'System Settings', href: '/admin/settings', icon: Settings, requiresAdmin: true },
      { name: 'Audit & System Logs', href: '/admin/audit-logs', icon: Shield, requiresAdmin: true },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedPin = localStorage.getItem('tk_nav_pinned');
    if (savedPin === 'true') setIsPinned(true);
  }, []);

  const togglePin = () => {
    const nextPin = !isPinned;
    setIsPinned(nextPin);
    localStorage.setItem('tk_nav_pinned', String(nextPin));
  };

  // Drawer expansion state: expanded when pinned OR when hovered on desktop
  const isExpanded = isPinned || isHovered;

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  const { data: session, isPending } = authClient.useSession();
  const isAdmin = (session?.user as any)?.role === 'admin';

  const { data: smsData, refetch: refetchSms } = useQuery<{ balance: number }>({
    queryKey: ['sms_balance'],
    queryFn: async () => {
      const res = await fetch('/api/sms?action=balance');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Redirect to login if not authenticated or deactivated
  useEffect(() => {
    if (!isPending && typeof window !== 'undefined') {
      if (!session) {
        router.push('/account/signin?callbackUrl=' + encodeURIComponent(pathname));
      } else if ((session.user as any)?.is_active === false) {
        authClient.signOut().finally(() => {
          router.push('/account/signin?error=deactivated');
        });
      }
    }
  }, [isPending, session, pathname, router]);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const currentPage =
    navSections.flatMap((s) => s.items).find(
      (item) => item.href === pathname || (item.href !== '/admin' && pathname.startsWith(item.href))
    )?.name || 'Admin';

  if (isPending || !session) {
    return (
      <div className="flex h-screen w-full items-center justify-center font-sans bg-[#F8FAFC] dark:bg-[#0B0F19]">
        <div className="w-8 h-8 border-4 border-[#E04D1B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100">
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Intelligent Interactive Drawer Sidebar */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'fixed inset-y-0 left-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col z-50 border-r print:hidden bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-xl lg:shadow-none',
          // Mobile state
          isSidebarOpen ? 'translate-x-0 w-68' : '-translate-x-full lg:translate-x-0',
          // Desktop smart expandable drawer state
          isExpanded ? 'lg:w-68' : 'lg:w-20'
        )}
      >
        {/* Top Header & Brand */}
        <div className="h-16 px-3 flex items-center justify-between border-b flex-shrink-0 border-slate-100 dark:border-slate-800/80 relative">
          <Link href="/admin" className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 p-1.5 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <img src="/logo.png" alt="Think Kre8tiv Logo" className="w-full h-full object-contain" />
            </div>
            <div
              className={cn(
                'flex flex-col whitespace-nowrap transition-all duration-200 overflow-hidden',
                isExpanded ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0 pointer-events-none'
              )}
            >
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white uppercase leading-tight truncate">
                THINK <span className="text-[#D22630]">KRE8TIV</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                ERP Cloud OS
              </span>
            </div>
          </Link>

          {/* Desktop Pin/Collapse Toggle & Mobile Close */}
          <div className="flex items-center shrink-0">
            {isExpanded && (
              <button
                onClick={togglePin}
                title={isPinned ? 'Unpin Sidebar (Enable hover drawer)' : 'Pin Sidebar Open'}
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isPinned ? <PinOff size={15} className="text-[#D22630]" /> : <Pin size={15} />}
              </button>
            )}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto overflow-x-hidden scrollbar-none">
          {navSections.map((section, idx) => {
            const visibleItems = section.items.filter((item) => !item.requiresAdmin || isAdmin);
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                {/* Section Title */}
                <div
                  className={cn(
                    'px-2 mb-1 flex items-center justify-between transition-all duration-200 whitespace-nowrap overflow-hidden',
                    isExpanded ? 'opacity-100 max-h-6' : 'opacity-0 max-h-0 pointer-events-none'
                  )}
                >
                  <h3 className="text-[10px] font-black tracking-widest uppercase text-slate-400 dark:text-slate-500 truncate">
                    {section.title}
                  </h3>
                </div>

                {/* Items */}
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/admin' && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                        title={!isExpanded ? item.name : undefined}
                        className={cn(
                          'flex items-center rounded-xl transition-all duration-150 group relative',
                          isExpanded ? 'gap-3 px-2.5 py-2' : 'justify-center p-2',
                          isActive
                            ? 'bg-[#0F172A] text-white dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
                        )}
                      >
                        {/* Calm, Clean Monochromatic Icon Badge */}
                        <div
                          className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                            isActive
                              ? 'text-white dark:text-slate-900'
                              : 'text-slate-500 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white bg-slate-100/70 dark:bg-slate-800'
                          )}
                        >
                          <item.icon size={18} />
                        </div>

                        {/* Label (Hidden in icon mode, visible on drawer expand) */}
                        <span
                          className={cn(
                            'text-xs font-semibold whitespace-nowrap transition-all duration-200 overflow-hidden',
                            isExpanded ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0 pointer-events-none hidden',
                            isActive ? 'font-bold' : 'text-slate-700 dark:text-slate-300'
                          )}
                        >
                          {item.name}
                        </span>

                        {isActive && isExpanded && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E04D1B] shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 overflow-hidden">
          <div className={cn("flex items-center gap-2.5", isExpanded ? "justify-between" : "justify-center")}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                {(session?.user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div
                className={cn(
                  'overflow-hidden whitespace-nowrap transition-all duration-200',
                  isExpanded ? 'opacity-100 max-w-[130px]' : 'opacity-0 max-w-0 pointer-events-none hidden'
                )}
              >
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {session?.user?.name}
                </p>
                <span className="text-[10px] uppercase font-bold text-emerald-600 block truncate">
                  {isAdmin ? 'System Admin' : 'Staff Officer'}
                </span>
              </div>
            </div>

            {isExpanded && (
              <button
                onClick={() => {
                  authClient.signOut();
                  router.push('/account/signin');
                }}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area (Spacers adjust automatically with drawer width) */}
      <div
        className={cn(
          'flex-1 flex flex-col overflow-hidden min-w-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] print:overflow-visible print:h-auto print:block',
          isPinned ? 'lg:pl-68' : 'lg:pl-20'
        )}
      >
        <header className="h-16 border-b flex items-center justify-between px-4 md:px-6 z-40 flex-shrink-0 transition-colors duration-300 print:hidden bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                {currentPage}
              </h2>
            </div>
          </div>

          {/* Quick Command Center Trigger */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-xs"
            title="Search or jump to... (Cmd + K / Ctrl + K)"
          >
            <Search size={14} className="text-slate-400" />
            <span className="font-medium text-slate-500 dark:text-slate-400">Search or jump to...</span>
            <kbd className="text-[10px] font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-500 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95 bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-amber-400 dark:hover:bg-slate-700 shadow-2xs"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 transition-transform duration-300 -rotate-12" />
              )}
            </button>

            {/* Top SMS Credit Balance Indicator */}
            {isAdmin && (
              <div
                onClick={() => refetchSms()}
                title="Click to refresh SMS balance"
                className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 hover:bg-amber-100/70 transition-all text-xs font-semibold shadow-2xs"
              >
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-700 dark:text-amber-400">
                  SMS:
                </span>
                <span className="font-mono font-bold">{smsData?.balance ?? '—'}</span>
                <span className="text-[10px] text-amber-600 font-semibold">pts</span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 pb-20 md:pb-6 transition-colors duration-300 bg-[#F8FAFC] dark:bg-[#0B0F19] print:overflow-visible print:h-auto print:p-0 print:m-0 print:bg-white">
          <div className="print:overflow-visible print:h-auto">{children}</div>
        </main>

        {/* Mobile App-Style Bottom Navigation Bar */}
        <nav className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 z-40 md:hidden flex items-center justify-around px-2 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-lg print:hidden">
          {[
            { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
            { name: 'Customers', href: '/admin/customers', icon: Users },
            { name: 'Invoices', href: '/admin/invoices', icon: FileText },
            { name: 'Receipts', href: '/admin/receipts', icon: Receipt },
            { name: 'Menu', href: '#', icon: Menu, isMenuTrigger: true },
          ].map((item) => {
            const isActive =
              item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
            return (
              <button
                key={item.name}
                onClick={() => {
                  if (item.isMenuTrigger) {
                    setIsSidebarOpen(true);
                  } else {
                    router.push(item.href);
                  }
                }}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all active:scale-95',
                  isActive && !item.isMenuTrigger
                    ? 'text-[#D22630] font-black'
                    : 'text-slate-500 dark:text-slate-400 font-medium'
                )}
              >
                <item.icon
                  size={18}
                  className={cn(isActive && !item.isMenuTrigger ? 'text-[#D22630]' : '')}
                />
                <span className="text-[10px] leading-tight tracking-tight">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Enterprise Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        isAdmin={isAdmin}
      />
    </div>
  );
}
