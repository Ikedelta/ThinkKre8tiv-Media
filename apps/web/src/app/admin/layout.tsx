'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  FileText,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    title: 'Clients & Sales',
    items: [
      { name: 'Customers', href: '/admin/customers', icon: Users },
      { name: 'Orders', href: '/admin/orders', icon: FileText },
      { name: 'Estimates', href: '/admin/quotations', icon: FileText },
      { name: 'Invoices', href: '/admin/invoices', icon: FileText },
      { name: 'Payments', href: '/admin/payments', icon: Receipt },
    ]
  },
  {
    title: 'Accounting',
    items: [
      { name: 'Expenses', href: '/admin/expenses', icon: CreditCard },
      { name: 'Reports', href: '/admin/reports', icon: BarChart3, requiresAdmin: true },
      { name: 'Suppliers', href: '/admin/suppliers', icon: Truck },
    ]
  },
  {
    title: 'Settings',
    items: [
      { name: 'Services Catalog', href: '/admin/services', icon: FileBarChart, requiresAdmin: true },
      { name: 'Website CMS', href: '/admin/cms', icon: Globe, requiresAdmin: true },
      { name: 'Staff', href: '/admin/users', icon: UserCog, requiresAdmin: true },
    ]
  }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const { data: session, isPending } = authClient.useSession();

  const { data: smsData, refetch: refetchSms } = useQuery<{ balance: number }>({
    queryKey: ['sms_balance'],
    queryFn: async () => {
      const res = await fetch('/api/sms');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: (session?.user as any)?.role === 'admin',
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session && typeof window !== 'undefined') {
      router.push('/account/signin?callbackUrl=' + encodeURIComponent(pathname));
    }
  }, [isPending, session, pathname, router]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const currentPage =
    navSections.flatMap(s => s.items).find(
      (item) =>
        item.href === pathname || (item.href !== '/admin' && pathname.startsWith(item.href))
    )?.name || 'Admin';

  if (isPending || !session) {
    return (
      <div className={cn("flex h-screen w-full items-center justify-center font-sans", theme === 'dark' ? 'bg-[#0B0F19]' : 'bg-[#F8FAFC]')}>
        <div className="w-8 h-8 border-4 border-[#E04D1B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex h-screen overflow-hidden font-sans transition-colors duration-300",
      theme === 'dark' ? 'bg-[#0B0F19] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
    )}>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:relative inset-y-0 left-0 transition-all duration-300 ease-in-out flex flex-col z-50 w-64 border-r',
          theme === 'dark' 
            ? 'bg-[#111827] border-slate-800 text-slate-200' 
            : 'bg-white border-slate-200 text-slate-700',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className={cn(
          "p-5 flex items-center justify-between border-b flex-shrink-0",
          theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
        )}>
          <Link href="/" className="flex items-center space-x-2.5">
            <img src="/logo.png" alt="Think Kre8tiv Logo" className="w-8 h-8 object-contain" />
            <span className="font-extrabold text-lg tracking-tight">
              THINK <span className="text-primary font-bold">KRE8TIV</span>
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className={cn(
              "lg:hidden p-1.5 rounded-lg transition-colors",
              theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            )}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3.5 py-5 space-y-0.5 overflow-y-auto">
          {navSections.map((section, idx) => {
            const visibleItems = section.items.filter(item => !item.requiresAdmin || (session?.user as any)?.role === 'admin');
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="mb-6">
                <div className="px-3 mb-2">
                  <h3 className={cn("text-[11px] font-bold tracking-widest uppercase", theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}>
                    {section.title}
                  </h3>
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
                          'flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200 group relative',
                          isActive
                            ? 'bg-[#E04D1B]/10 text-[#E04D1B] border border-[#E04D1B]/20 font-semibold'
                            : theme === 'dark'
                              ? 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-[#E04D1B]'
                        )}
                      >
                        <item.icon
                          size={16}
                          className={cn(
                            isActive ? 'text-[#E04D1B]' : 'group-hover:text-[#E04D1B] transition-colors'
                          )}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                        {isActive && (
                          <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#E04D1B]" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className={cn(
          "p-4 border-t flex-shrink-0 flex flex-col gap-3",
          theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
        )}>
          {/* SMS Credits - Admin Only */}
          {(session?.user as any)?.role === 'admin' && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={cn("text-[10px] font-bold tracking-wider uppercase", theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}>
                    SMS Credits
                  </h3>
                  <span className={cn("text-lg font-black leading-none", theme === 'dark' ? 'text-white' : 'text-slate-800')}>
                    {smsData?.balance ?? '...'} <span className="text-[11px] font-medium text-slate-500">pts</span>
                  </span>
                </div>
                <button 
                  onClick={() => refetchSms()}
                  className="text-[#E04D1B] hover:text-orange-400 text-[10px] font-bold transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
          
          {/* Footer Branding */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[9px] text-slate-400 font-medium tracking-wide">Developed by Tech34 Systems</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className={cn(
          "h-16 border-b flex items-center justify-between px-4 md:px-6 z-40 flex-shrink-0 transition-colors duration-300",
          theme === 'dark' ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
        )}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={cn(
                "lg:hidden p-2 rounded-lg transition-colors",
                theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
              )}
            >
              <Menu size={20} />
            </button>
            <h2 className={cn("font-bold text-base", theme === 'dark' ? 'text-white' : 'text-slate-800')}>{currentPage}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={cn(
                "p-2 rounded-lg border transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95",
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              )}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                // Sun Icon
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707-.707m12.728 0l-.707.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                // Moon Icon
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <Link
              href="/"
              className={cn(
                "text-xs font-semibold transition-colors",
                theme === 'dark' ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-500 hover:text-indigo-600'
              )}
            >
              ← View Website
            </Link>

            {/* User Profile */}
            <div className="flex items-center gap-3 border-l pl-4 ml-2 dark:border-slate-800 border-slate-200">
              <Link href="/admin/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-[#E04D1B] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {session.user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-bold leading-none text-slate-800 dark:text-white">{session.user?.name || 'Admin User'}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{session.user?.email || 'admin@thinkkre8tivmedia.com'}</p>
                </div>
              </Link>
              <button
                onClick={async () => {
                  await authClient.signOut();
                  router.push('/account/signin');
                }}
                className={cn(
                  "p-1.5 rounded-lg transition-colors shrink-0",
                  theme === 'dark' ? "text-slate-400 hover:bg-rose-500/10 hover:text-rose-500" : "text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                )}
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <main className={cn(
          "flex-1 overflow-y-auto p-4 md:p-6 pb-6 transition-colors duration-300",
          theme === 'dark' ? 'bg-[#0B0F19]' : 'bg-[#F8FAFC]'
        )}>
          {/* Injecting theme context into children via wrapper style classes */}
          <div className={theme === 'dark' ? 'dark' : ''}>
            {children}
          </div>
        </main>
      </div>


    </div>
  );
}
