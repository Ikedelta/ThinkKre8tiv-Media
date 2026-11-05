'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import {
  Search,
  FileText,
  Receipt,
  Users,
  CreditCard,
  Building2,
  BarChart3,
  Globe,
  UserCog,
  Shield,
  Plus,
  Coins,
  Printer,
  Moon,
  Sun,
  ArrowRight,
  Sparkles,
  Command,
  Package,
  Settings,
  DollarSign,
  ArrowLeft,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Actions' | 'Navigation' | 'Customers' | 'Invoices';
  icon: React.ElementType;
  badge?: string;
  onSelect: () => void;
}

export function CommandPalette({ isOpen, onClose, isAdmin = false }: CommandPaletteProps) {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Fetch quick live items if query is non-empty
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ['palette_customers'],
    queryFn: async () => {
      const res = await fetch('/api/customers');
      return res.ok ? res.json() : [];
    },
    enabled: isOpen && query.length > 0,
    staleTime: 60000,
  });

  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ['palette_invoices'],
    queryFn: async () => {
      const res = await fetch('/api/invoices');
      return res.ok ? res.json() : [];
    },
    enabled: isOpen && query.length > 0,
    staleTime: 60000,
  });

  // Base navigation and action items
  const baseItems: CommandItem[] = [
    // Actions
    {
      id: 'act-invoice',
      title: 'Create Commercial Invoice',
      subtitle: 'Issue a new corporate billing statement',
      category: 'Actions',
      icon: Plus,
      badge: 'Action',
      onSelect: () => {
        router.push('/admin/invoices/new');
        onClose();
      },
    },
    {
      id: 'act-payment',
      title: 'Record Customer Payment',
      subtitle: 'Log received payment & issue receipt',
      category: 'Actions',
      icon: Coins,
      badge: 'Action',
      onSelect: () => {
        router.push('/admin/payments/new');
        onClose();
      },
    },
    {
      id: 'act-customer',
      title: 'Add New Client / Customer',
      subtitle: 'Register corporate or individual account',
      category: 'Actions',
      icon: Users,
      badge: 'Action',
      onSelect: () => {
        router.push('/admin/customers/new');
        onClose();
      },
    },
    {
      id: 'act-quote',
      title: 'New Print Estimate',
      subtitle: 'Generate pricing quotation for client review',
      category: 'Actions',
      icon: FileText,
      badge: 'Action',
      onSelect: () => {
        router.push('/admin/quotations/new');
        onClose();
      },
    },
    {
      id: 'act-expense',
      title: 'Record Operating Expense',
      subtitle: 'Log factory consumables, raw paper & disbursements',
      category: 'Actions',
      icon: CreditCard,
      badge: 'Action',
      onSelect: () => {
        router.push('/admin/expenses/new');
        onClose();
      },
    },
    {
      id: 'act-theme',
      title: `Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`,
      subtitle: 'Toggle dashboard color appearance',
      category: 'Actions',
      icon: resolvedTheme === 'dark' ? Sun : Moon,
      badge: 'Theme',
      onSelect: () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
        onClose();
      },
    },

    // Navigation
    {
      id: 'nav-dash',
      title: 'Dashboard Overview',
      subtitle: 'Live manufacturing and sales KPIs',
      category: 'Navigation',
      icon: BarChart3,
      onSelect: () => {
        router.push('/admin');
        onClose();
      },
    },
    {
      id: 'nav-invoices',
      title: 'Invoices & Billing',
      subtitle: 'Manage all accounts receivable',
      category: 'Navigation',
      icon: FileText,
      onSelect: () => {
        router.push('/admin/invoices');
        onClose();
      },
    },
    {
      id: 'nav-receipts',
      title: 'Receipts & Payments',
      subtitle: 'Verified settlement records',
      category: 'Navigation',
      icon: Receipt,
      onSelect: () => {
        router.push('/admin/receipts');
        onClose();
      },
    },
    {
      id: 'nav-customers',
      title: 'Customer Directory',
      subtitle: 'Enterprise client database & history',
      category: 'Navigation',
      icon: Users,
      onSelect: () => {
        router.push('/admin/customers');
        onClose();
      },
    },
    {
      id: 'nav-expenses',
      title: 'Expenses & Disbursements',
      subtitle: 'Track production costs & overheads',
      category: 'Navigation',
      icon: CreditCard,
      onSelect: () => {
        router.push('/admin/expenses');
        onClose();
      },
    },
    {
      id: 'nav-inventory',
      title: 'Inventory & Materials',
      subtitle: 'Stock levels, units, barcodes & Excel import',
      category: 'Navigation',
      icon: Package,
      onSelect: () => {
        router.push('/admin/inventory');
        onClose();
      },
    },
    {
      id: 'nav-suppliers',
      title: 'Suppliers & Vendors',
      subtitle: 'Raw substrate & paper suppliers',
      category: 'Navigation',
      icon: Building2,
      onSelect: () => {
        router.push('/admin/suppliers');
        onClose();
      },
    },
  ];

  // Admin-only nav
  if (isAdmin) {
    baseItems.push(
      {
        id: 'nav-payroll',
        title: 'Payroll & Salaries Management',
        subtitle: 'GRA PAYE tax, SSNIT statutory compliance, and payslips',
        category: 'Navigation',
        icon: DollarSign,
        onSelect: () => {
          router.push('/admin/payroll');
          onClose();
        },
      },
      {
        id: 'nav-reports',
        title: 'Financial & Operational Reports',
        subtitle: 'Executive margin and settlement reports',
        category: 'Navigation',
        icon: BarChart3,
        badge: 'Admin',
        onSelect: () => {
          router.push('/admin/reports');
          onClose();
        },
      },
      {
        id: 'nav-services',
        title: 'Commercial Services Catalog',
        subtitle: 'Base pricing, categories & units',
        category: 'Navigation',
        icon: FileText,
        badge: 'Admin',
        onSelect: () => {
          router.push('/admin/services');
          onClose();
        },
      },
      {
        id: 'nav-users',
        title: 'Staff & Privilege Management',
        subtitle: 'Roles, operator status & accounts',
        category: 'Navigation',
        icon: UserCog,
        badge: 'Admin',
        onSelect: () => {
          router.push('/admin/users');
          onClose();
        },
      },
      {
        id: 'nav-audit',
        title: 'Enterprise Audit & System Logs',
        subtitle: 'Immutable record of operator activities',
        category: 'Navigation',
        icon: Shield,
        badge: 'Admin',
        onSelect: () => {
          router.push('/admin/audit-logs');
          onClose();
        },
      },
      {
        id: 'nav-cms',
        title: 'Website CMS & Brand Content',
        subtitle: 'Manage landing page hero and text',
        category: 'Navigation',
        icon: Globe,
        badge: 'Admin',
        onSelect: () => {
          router.push('/admin/cms');
          onClose();
        },
      },
      {
        id: 'nav-settings',
        title: 'System & Company Settings',
        subtitle: 'Logo, signature, SMS alerts & receipts',
        category: 'Navigation',
        icon: Settings,
        badge: 'Admin',
        onSelect: () => {
          router.push('/admin/settings');
          onClose();
        },
      }
    );
  }

  // Live matching customers
  const matchingCustomers: CommandItem[] = customers
    .filter(
      (c: any) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.company?.toLowerCase().includes(query.toLowerCase()) ||
        c.email?.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 4)
    .map((c: any) => ({
      id: `cust-${c.id}`,
      title: c.name,
      subtitle: c.company ? `${c.company} • ${c.email || c.phone || ''}` : c.email || c.phone,
      category: 'Customers',
      icon: Users,
      badge: 'Client',
      onSelect: () => {
        router.push(`/admin/customers`);
        onClose();
      },
    }));

  // Live matching invoices
  const matchingInvoices: CommandItem[] = invoices
    .filter(
      (inv: any) =>
        inv.invoice_number?.toLowerCase().includes(query.toLowerCase()) ||
        inv.customer_name?.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 4)
    .map((inv: any) => ({
      id: `inv-${inv.id}`,
      title: `${inv.invoice_number} — ${inv.customer_name || 'Client'}`,
      subtitle: `Total: GH₵${Number(inv.total_amount || 0).toLocaleString()} • Status: ${inv.status || 'unpaid'}`,
      category: 'Invoices',
      icon: FileText,
      badge: inv.status?.toUpperCase(),
      onSelect: () => {
        router.push(`/admin/invoices`);
        onClose();
      },
    }));

  // Filter base items
  const filteredBase = baseItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const allItems: CommandItem[] = [
    ...matchingInvoices,
    ...matchingCustomers,
    ...filteredBase,
  ];

  // Keyboard navigation inside palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (allItems.length || 1)) % (allItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          allItems[selectedIndex].onSelect();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-20 px-3 sm:px-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col font-sans transition-all animate-in zoom-in-95 duration-150 max-h-[88vh] sm:max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar with Back / Close Button */}
        <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-3 sm:py-3.5 border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            title="Go back / Close"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <Search size={18} className="text-slate-400 shrink-0 hidden sm:block" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, client name, invoice number..."
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none min-w-0"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Clear search"
            >
              <X size={15} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 overscroll-contain">
          {allItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No matching commands or records found for "{query}"
            </div>
          ) : (
            allItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'flex items-center justify-between px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  )}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                        isSelected
                          ? 'bg-[#E04D1B] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      )}
                    >
                      <item.icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-[13px] font-bold truncate leading-tight">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2">
                    {item.badge && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {item.badge}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold hidden md:inline">
                      {item.category}
                    </span>
                    {isSelected && (
                      <ArrowRight size={13} className="text-[#E04D1B] hidden xs:block" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts & Back Action */}
        <div className="px-3.5 sm:px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline">
              <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 border rounded text-[9px]">↑</kbd>{' '}
              <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 border rounded text-[9px]">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 border rounded text-[9px]">↵</kbd> to select
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={12} />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}

