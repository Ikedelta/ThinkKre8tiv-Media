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
  Briefcase,
  ListTodo,
  Truck,
  Package,
  BarChart3,
  Building2,
  Sun,
  Moon,
  Search,
  Crown,
  Lock,
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
    title: 'Home',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Sales Pipeline',
    items: [
      { name: 'Customers', href: '/admin/customers', icon: Users },
      { name: 'Estimates', href: '/admin/quotations', icon: FileSignature },
      { name: 'Invoices', href: '/admin/invoices', icon: FileText },
      { name: 'Receipts', href: '/admin/receipts', icon: Receipt },
    ]
  },
  {
    title: 'Accounting',
    items: [
      { name: 'Expenses', href: '/admin/expenses', icon: CreditCard },
      { name: 'Suppliers (Vendors)', href: '/admin/suppliers', icon: Building2 },
      { name: 'Reports', href: '/admin/reports', icon: BarChart3, requiresAdmin: true },
    ]
  },
  {
    title: 'System Management',
    items: [
      { name: 'Services Catalog', href: '/admin/services', icon: FileBarChart, requiresAdmin: true },
      { name: 'Website CMS', href: '/admin/cms', icon: Globe, requiresAdmin: true },
      { name: 'Staff', href: '/admin/users', icon: UserCog, requiresAdmin: true },
      { name: 'Settings', href: '/admin/settings', icon: Settings, requiresAdmin: true },
      { name: 'Audit & System Logs', href: '/admin/audit-logs', icon: Shield, requiresAdmin: true },
    ]
  }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Global Cmd+K / Ctrl+K keyboard shortcut for Command Palette
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

  // Redirect to login if not authenticated or if deactivated
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
    navSections.flatMap(s => s.items).find(
      (item) =>
        item.href === pathname || (item.href !== '/admin' && pathname.startsWith(item.href))
    )?.name || 'Admin';

  if (isPending || !session) {
    return (
      <div className="flex h-screen w-full items-center justify-center font-sans bg-[#F8FAFC] dark:bg-[#0B0F19]">
        <div className="w-8 h-8 border-4 border-[#E04D1B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans transition-colors duration-300 print:h-auto print:overflow-visible print:block bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm print:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:relative inset-y-0 left-0 transition-all duration-300 ease-in-out flex flex-col z-50 w-64 border-r print:hidden bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-5 flex items-center justify-between border-b flex-shrink-0 border-slate-100 dark:border-slate-800">
          <Link href="/" className="flex items-center space-x-2.5">
            <img src="/logo.png" alt="Think Kre8tiv Logo" className="w-8 h-8 object-contain" />
            <span className="font-extrabold text-lg tracking-tight">
              THINK <span className="text-primary font-bold">KRE8TIV</span>
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg transition-colors text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3.5 py-5 space-y-0.5 overflow-y-auto">
          {navSections.map((section, idx) => {
            const visibleItems = section.items.filter(item => !item.requiresAdmin || isAdmin);
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="mb-6">
                <div className="px-3 mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">
                    {section.title}
                  </h3>
                  {section.items.some(i => i.requiresAdmin) && !isAdmin && (
                    <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5">
                      <Lock size={9} /> Restricted
                    </span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/admin' && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={cn(
                          'flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group relative text-sm',
                          isActive
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
                        )}
                      >
                        <item.icon
                          size={16}
                          className={cn(
                            isActive ? 'text-primary' : 'group-hover:text-primary transition-colors'
                          )}
                        />
                        <span className="font-medium">{item.name}</span>
                        {isActive && (
                          <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t flex-shrink-0 flex flex-col gap-3 border-slate-100 dark:border-slate-800">
          {/* SMS Credits - Admin Only */}
          {isAdmin && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                    SMS Credits
                  </h3>
                  <span className="text-lg font-black leading-none text-slate-800 dark:text-white">
                    {smsData?.balance ?? '...'} <span className="text-[11px] font-medium text-slate-500">pts</span>
                  </span>
                </div>
                <button 
                  onClick={() => refetchSms()}
                  className="text-[#E04D1B] hover:text-orange-400 text-xs font-bold transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 print:overflow-visible print:h-auto print:block">
        <header className="h-16 border-b flex items-center justify-between px-4 md:px-6 z-40 flex-shrink-0 transition-colors duration-300 print:hidden bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg transition-colors text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="font-bold text-base text-slate-800 dark:text-white leading-tight">{currentPage}</h2>
            </div>
          </div>

          {/* Enterprise Search & Command Center Trigger */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-xs"
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
              className="p-2 rounded-lg border transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95 bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-amber-400 dark:hover:bg-slate-700 shadow-2xs"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 transition-transform duration-300 -rotate-12" />
              )}
            </button>

            <Link
              href="/"
              className="text-xs font-semibold transition-colors text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hidden md:inline"
            >
              ← Website
            </Link>

            {/* User Profile */}
            <div className="flex items-center gap-3 border-l pl-4 ml-1 border-slate-200 dark:border-slate-800">
              <Link href="/admin/profile" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-[#E04D1B] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-2xs">
                  {session.user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="hidden md:block">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold leading-none text-slate-800 dark:text-white">{session.user?.name || 'Admin User'}</p>
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1 py-0.2 rounded border border-amber-200 dark:border-amber-900/60 uppercase">
                        <Crown size={9} /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1 py-0.2 rounded border border-blue-200 dark:border-blue-900/60 uppercase">
                        <Shield size={9} /> Staff
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{session.user?.email || 'admin@thinkkre8tivmedia.com'}</p>
                </div>
              </Link>
              <button
                onClick={async () => {
                  await authClient.signOut();
                  router.push('/account/signin');
                }}
                className="p-1.5 rounded-lg transition-colors shrink-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-500"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-6 transition-colors duration-300 bg-[#F8FAFC] dark:bg-[#0B0F19] print:overflow-visible print:h-auto print:p-0 print:m-0 print:bg-white">
          <div className="print:overflow-visible print:h-auto">
            {children}
          </div>
        </main>
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
