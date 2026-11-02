'use client';

import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import {
  Package,
  Plus,
  Search,
  Layers,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Coins,
  History,
  TrendingUp,
  Tag,
  Warehouse,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  Edit2,
  SlidersHorizontal,
  ChevronDown,
  Building2,
  Calendar,
  Sparkles,
  Upload,
  Download,
  FileText,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useConfirm } from '@/components/providers/ConfirmProvider';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  quantity_on_hand: string | number;
  min_reorder_level: string | number;
  cost_price: string | number;
  selling_price: string | number;
  location?: string;
  supplier_id?: string;
  supplier_name?: string;
  supplier_company?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface InventoryMetrics {
  total_sku_count: number;
  total_valuation: string | number;
  low_stock_count: number;
  out_of_stock_count: number;
}

interface StockMovement {
  id: string;
  item_id: string;
  item_name: string;
  sku: string;
  unit: string;
  type: string;
  quantity: string | number;
  balance_after: string | number;
  reference_number?: string;
  notes?: string;
  performed_by?: string;
  created_at: string;
}

interface Supplier {
  id: string;
  name: string;
  company?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All Materials' },
  { id: 'signage_materials', label: 'Signage & Vinyl' },
  { id: 'paper_stock', label: 'Paper & Board Stock' },
  { id: 'inks_consumables', label: 'Inks & Toners' },
  { id: 'hardware_substrates', label: 'Hardware & Substrates' },
  { id: 'finished_goods', label: 'Finished Goods / Stock' },
];

const UNITS = ['units', 'rolls', 'reams', 'sheets', 'bottles', 'packs', 'meters', 'cartons'];

export default function InventoryPage() {
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  // Search & Filter states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [activeTab, setActiveTab] = useState<'catalog' | 'ledger'>('catalog');

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);

  // Excel Import state
  const [importedRows, setImportedRows] = useState<any[]>([]);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Item Form
  const [itemForm, setItemForm] = useState({
    sku: '',
    name: '',
    category: 'signage_materials',
    unit: 'rolls',
    quantity_on_hand: 0,
    min_reorder_level: 5,
    cost_price: 0,
    selling_price: 0,
    location: 'Accra Main Factory',
    supplier_id: '',
    description: '',
  });

  // Adjustment Form
  const [adjustForm, setAdjustForm] = useState({
    type: 'IN', // IN, OUT, SET
    quantity: '',
    unit_cost: '',
    reference_number: '',
    notes: '',
  });

  // Fetch Inventory Data
  const { data, isLoading, refetch, isFetching } = useQuery<{
    items: InventoryItem[];
    metrics: InventoryMetrics;
    recentMovements: StockMovement[];
  }>({
    queryKey: ['inventory-data'],
    queryFn: async () => {
      const res = await fetch('/api/inventory');
      if (!res.ok) throw new Error('Failed to load inventory');
      return res.json();
    },
  });

  // Fetch Suppliers for dropdown
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers-list'],
    queryFn: async () => {
      const res = await fetch('/api/vendors');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const items = data?.items || [];
  const metrics = data?.metrics || {
    total_sku_count: 0,
    total_valuation: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
  };
  const movements = data?.recentMovements || [];

  // Filtered Items (Refine Table Filter Engine)
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.supplier_name && item.supplier_name.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      const qty = Number(item.quantity_on_hand);
      const minLevel = Number(item.min_reorder_level);

      let matchesStock = true;
      if (stockFilter === 'low') matchesStock = qty <= minLevel && qty > 0;
      if (stockFilter === 'out') matchesStock = qty <= 0;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [items, search, selectedCategory, stockFilter]);

  // Mutations
  const createOrUpdateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const isEdit = !!editingItem;
      const res = await fetch('/api/inventory', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...payload, id: editingItem.id } : payload),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to save item');
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
      toast.success(editingItem ? 'Inventory material updated!' : 'New inventory item added!');
      setIsItemModalOpen(false);
      setEditingItem(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Operation failed');
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust_stock',
          item_id: adjustingItem?.id,
          ...payload,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to adjust stock');
      return resData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
      toast.success(`Stock level adjusted! Current balance: ${data.new_balance}`);
      setIsAdjustModalOpen(false);
      setAdjustingItem(null);
      setAdjustForm({ type: 'IN', quantity: '', unit_cost: '', reference_number: '', notes: '' });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Adjustment failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
      toast.success('Inventory item removed.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to remove item');
    },
  });

  const importMutation = useMutation({
    mutationFn: async (itemsToImport: any[]) => {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_import',
          items: itemsToImport,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to import inventory spreadsheet');
      return resData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
      toast.success(`Successfully imported ${data.imported} new items and updated ${data.updated} items!`);
      setIsImportModalOpen(false);
      setImportedRows([]);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Import failed');
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          toast.error('The selected Excel sheet has no data rows.');
          setIsParsingExcel(false);
          return;
        }

        setImportedRows(data);
        toast.success(`Parsed ${data.length} rows from Excel sheet!`);
      } catch (err: any) {
        toast.error(`Error reading Excel file: ${err.message}`);
      } finally {
        setIsParsingExcel(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleDownloadSampleExcel = () => {
    const sampleData = [
      {
        SKU: 'MAT-SAV-003',
        'Material Name': 'Cast Vehicle Wrap Vinyl (1.52m x 50m)',
        Category: 'signage_materials',
        Unit: 'rolls',
        Quantity: 10,
        'Min Alert': 3,
        'Cost Price': 650.00,
        'Selling Price': 950.00,
        Location: 'Roll Rack Bay 3',
        Notes: 'Ultra conformable cast vinyl for vehicle fleet branding',
      },
      {
        SKU: 'PAP-MAT-250',
        'Material Name': 'Matt Coated Art Card 250gsm (A3+)',
        Category: 'paper_stock',
        Unit: 'reams',
        Quantity: 25,
        'Min Alert': 8,
        'Cost Price': 280.00,
        'Selling Price': 400.00,
        Location: 'Paper Warehouse Shelf B',
        Notes: 'Heavy matte paper for presentation folders and menus',
      },
      {
        SKU: 'INK-UV-01',
        'Material Name': 'UV Curable Black Ink (1 Liter Bottle)',
        Category: 'inks_consumables',
        Unit: 'bottles',
        Quantity: 12,
        'Min Alert': 4,
        'Cost Price': 340.00,
        'Selling Price': 480.00,
        Location: 'Ink Safe Cabinet',
        Notes: 'For flatbed direct substrate printer',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'InventoryTemplate');
    XLSX.writeFile(wb, 'ThinkKre8tiv_Inventory_Import_Template.xlsx');
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setItemForm({
      sku: `MAT-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      category: 'signage_materials',
      unit: 'rolls',
      quantity_on_hand: 0,
      min_reorder_level: 5,
      cost_price: 0,
      selling_price: 0,
      location: 'Accra Main Factory',
      supplier_id: '',
      description: '',
    });
    setIsItemModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setItemForm({
      sku: item.sku,
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity_on_hand: Number(item.quantity_on_hand),
      min_reorder_level: Number(item.min_reorder_level),
      cost_price: Number(item.cost_price),
      selling_price: Number(item.selling_price),
      location: item.location || 'Accra Main Factory',
      supplier_id: item.supplier_id || '',
      description: item.description || '',
    });
    setIsItemModalOpen(true);
  };

  const handleOpenAdjust = (item: InventoryItem) => {
    setAdjustingItem(item);
    setAdjustForm({
      type: 'IN',
      quantity: '',
      unit_cost: String(item.cost_price || ''),
      reference_number: '',
      notes: '',
    });
    setIsAdjustModalOpen(true);
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    const isConfirmed = await confirm({
      title: 'Remove Inventory Item?',
      message: `Are you sure you want to permanently delete "${item.name}" (${item.sku})? All associated stock movement logs will be erased.`,
      confirmText: 'Delete Permanently',
      variant: 'destructive',
    });
    if (isConfirmed) {
      deleteMutation.mutate(item.id);
    }
  };

  const fmt = (num: any) =>
    `GH₵${Number(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#E04D1B] dark:bg-orange-950/40 dark:text-orange-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Package className="w-3.5 h-3.5" /> Refine Materials &amp; Stock Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            Inventory &amp; Consumables Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time stock ledger, roll and paper ream counts, low-stock alerts, and production material valuations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setImportedRows([]);
              setIsImportModalOpen(true);
            }}
            className="text-xs h-9 font-bold gap-2 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100"
          >
            <FileSpreadsheet size={15} className="text-emerald-600" /> Import Excel (.xlsx)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs h-9 font-semibold gap-2 border-slate-300 dark:border-slate-700"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="bg-[#D22630] hover:bg-[#b81d26] text-white text-xs font-bold h-9 px-4 rounded-xl gap-2 shadow-xs cursor-pointer"
          >
            <Plus size={15} /> Add Material / SKU
          </Button>
        </div>
      </div>

      {/* KPI Cards (Refine Overview Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs rounded-xl">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Tracked SKUs</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {metrics.total_sku_count}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Printing, vinyl &amp; board materials</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Layers size={22} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs rounded-xl">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Warehouse Valuation</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                {fmt(metrics.total_valuation)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Current on-hand cost evaluation</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Coins size={22} />
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
          className={cn(
            "border shadow-xs rounded-xl cursor-pointer transition-all",
            stockFilter === 'low' ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          )}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle size={13} /> Low Stock Warnings
              </p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {metrics.low_stock_count}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Items near minimum threshold</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <ArrowDownRight size={22} />
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
          className={cn(
            "border shadow-xs rounded-xl cursor-pointer transition-all",
            stockFilter === 'out' ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          )}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Depleted / Out of Stock
              </p>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {metrics.out_of_stock_count}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Immediate re-order needed</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
              <Warehouse size={22} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('catalog')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all',
            activeTab === 'catalog'
              ? 'border-[#D22630] text-[#D22630]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <Package className="w-3.5 h-3.5" /> Material Inventory Catalog ({items.length})
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all',
            activeTab === 'ledger'
              ? 'border-[#D22630] text-[#D22630]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <History className="w-3.5 h-3.5" /> Stock Movement Audit Ledger ({movements.length})
        </button>
      </div>

      {/* TAB 1: Catalog Data Table (Refine-style Data Grid) */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search materials by name, SKU, or rack location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto py-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      'px-3 py-1 text-xs font-bold rounded-lg whitespace-nowrap transition-all',
                      selectedCategory === cat.id
                        ? 'bg-[#0F172A] text-white dark:bg-white dark:text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {stockFilter !== 'all' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">
                  Filtered by: <span className="uppercase text-[#D22630]">{stockFilter} stock</span>
                </span>
                <button
                  onClick={() => setStockFilter('all')}
                  className="text-xs text-slate-400 hover:text-slate-800 underline font-semibold"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>

          {/* Catalog Data Grid */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">SKU &amp; Material Name</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5 text-center">Stock Balance</th>
                    <th className="px-5 py-3.5 text-right">Cost Price</th>
                    <th className="px-5 py-3.5 text-right">Total Valuation</th>
                    <th className="px-5 py-3.5">Storage Location</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                        <div className="w-6 h-6 border-2 border-[#D22630] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading inventory records...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                        <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        No materials match your query or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const qty = Number(item.quantity_on_hand);
                      const min = Number(item.min_reorder_level);
                      const isLow = qty <= min && qty > 0;
                      const isOut = qty <= 0;
                      const valuation = qty * Number(item.cost_price || 0);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-4">
                            <div>
                              <span className="font-mono text-[11px] font-black text-[#D22630] block">
                                {item.sku}
                              </span>
                              <p className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                                {item.name}
                              </p>
                              {item.supplier_name && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Vendor: {item.supplier_company || item.supplier_name}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 capitalize">
                              {item.category.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className={cn(
                                "font-mono font-black text-sm px-2.5 py-0.5 rounded-lg border",
                                isOut ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/60" :
                                isLow ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/60" :
                                "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60"
                              )}>
                                {qty} {item.unit}
                              </span>
                              {isLow && (
                                <span className="text-[9px] font-bold text-amber-600 uppercase mt-0.5">
                                  Low Stock (&le;{min})
                                </span>
                              )}
                              {isOut && (
                                <span className="text-[9px] font-bold text-rose-600 uppercase mt-0.5">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right font-mono text-xs text-slate-600 dark:text-slate-300 font-semibold">
                            {fmt(item.cost_price)}
                          </td>
                          <td className="px-5 py-4 text-right font-mono text-xs font-black text-slate-900 dark:text-white">
                            {fmt(valuation)}
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                              <Warehouse size={13} className="text-slate-400" />
                              {item.location || 'Accra Main Factory'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenAdjust(item)}
                                className="h-7 text-[11px] font-bold px-2.5 border-slate-300 dark:border-slate-700 text-[#E04D1B] hover:bg-orange-50 hover:text-[#c93f12]"
                                title="Add stock or record usage"
                              >
                                Adjust Stock
                              </Button>

                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit Item Details"
                              >
                                <Edit2 size={14} />
                              </button>

                              <button
                                onClick={() => handleDeleteItem(item)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Item"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: Audit Movement Ledger */}
      {activeTab === 'ledger' && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Material &amp; SKU</th>
                  <th className="px-5 py-3.5 text-center">Movement Type</th>
                  <th className="px-5 py-3.5 text-right">Quantity</th>
                  <th className="px-5 py-3.5 text-right">Balance After</th>
                  <th className="px-5 py-3.5">Ref / Notes</th>
                  <th className="px-5 py-3.5">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      No stock movement ledger transactions registered yet.
                    </td>
                  </tr>
                ) : (
                  movements.map((tx) => {
                    const isAddition = tx.type === 'IN' || tx.type === 'RESTOCK' || tx.type === 'PURCHASE' || tx.type === 'OPENING_STOCK';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                          {new Date(tx.created_at).toLocaleString()}
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-[11px] font-bold text-[#D22630] block">{tx.sku}</span>
                          <span className="font-bold text-xs text-slate-900 dark:text-white">{tx.item_name}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <Badge className={cn(
                            "text-[10px] uppercase font-bold",
                            isAddition ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-rose-100 text-rose-800 border-rose-200"
                          )}>
                            {tx.type}
                          </Badge>
                        </td>
                        <td className={cn(
                          "px-5 py-4 text-right font-mono font-bold text-xs",
                          isAddition ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {isAddition ? `+${tx.quantity}` : `-${tx.quantity}`} {tx.unit}
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-black text-xs text-slate-900 dark:text-white">
                          {tx.balance_after} {tx.unit}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-400">
                          {tx.reference_number && <span className="font-mono font-bold block">{tx.reference_number}</span>}
                          {tx.notes || '—'}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500 font-medium">
                          {tx.performed_by || 'Staff'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL 1: Create or Edit Material SKU */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-[#D22630]" />
                {editingItem ? 'Edit Inventory Material' : 'Add New Inventory Material'}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createOrUpdateMutation.mutate(itemForm);
              }}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                    SKU / Item Code *
                  </label>
                  <Input
                    required
                    value={itemForm.sku}
                    onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                    placeholder="e.g. MAT-SAV-001"
                    className="font-mono font-bold h-9 uppercase"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                    Category *
                  </label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 font-medium outline-none"
                  >
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                  Material / Item Name *
                </label>
                <Input
                  required
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="e.g. Gloss White Self-Adhesive Vinyl (1.27m x 50m)"
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                    Measurement Unit
                  </label>
                  <select
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 font-medium outline-none"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                {!editingItem && (
                  <div>
                    <label className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                      Opening Stock Qty
                    </label>
                    <Input
                      type="number"
                      step="any"
                      value={itemForm.quantity_on_hand}
                      onChange={(e) => setItemForm({ ...itemForm, quantity_on_hand: parseFloat(e.target.value) || 0 })}
                      className="h-9 font-mono font-bold"
                    />
                  </div>
                )}

                <div>
                  <label className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                    Min Reorder Alert
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={itemForm.min_reorder_level}
                    onChange={(e) => setItemForm({ ...itemForm, min_reorder_level: parseFloat(e.target.value) || 0 })}
                    className="h-9 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                    Cost Price (GH₵)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={itemForm.cost_price}
                    onChange={(e) => setItemForm({ ...itemForm, cost_price: parseFloat(e.target.value) || 0 })}
                    className="h-9 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                    Storage / Factory Rack Location
                  </label>
                  <Input
                    value={itemForm.location}
                    onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                    placeholder="e.g. Roll Rack Bay 2"
                    className="h-9"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                  Default Vendor / Supplier
                </label>
                <select
                  value={itemForm.supplier_id}
                  onChange={(e) => setItemForm({ ...itemForm, supplier_id: e.target.value })}
                  className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 font-medium outline-none"
                >
                  <option value="">No specific vendor assigned</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} {s.company ? `(${s.company})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsItemModalOpen(false)}
                  className="h-9 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createOrUpdateMutation.isPending}
                  className="h-9 text-xs font-bold bg-[#D22630] hover:bg-[#b81d26] text-white"
                >
                  {createOrUpdateMutation.isPending ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Stock Adjustment / Restock / Usage */}
      {isAdjustModalOpen && adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Adjust Material Stock
                </h3>
                <p className="text-[11px] text-[#D22630] font-mono font-bold mt-0.5">
                  {adjustingItem.sku} &bull; {adjustingItem.name}
                </p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                adjustStockMutation.mutate(adjustForm);
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Current On-Hand Balance:</span>
                <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                  {adjustingItem.quantity_on_hand} {adjustingItem.unit}
                </span>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">
                  Adjustment Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, type: 'IN' })}
                    className={cn(
                      'py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all',
                      adjustForm.type === 'IN'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    + Restock (IN)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, type: 'OUT' })}
                    className={cn(
                      'py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all',
                      adjustForm.type === 'OUT'
                        ? 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    - Usage (OUT)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, type: 'SET' })}
                    className={cn(
                      'py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all',
                      adjustForm.type === 'SET'
                        ? 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950/40'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    Audit (SET)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                    Quantity ({adjustingItem.unit}) *
                  </label>
                  <Input
                    required
                    type="number"
                    step="any"
                    value={adjustForm.quantity}
                    onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                    placeholder="e.g. 5"
                    className="h-9 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                    PO / Job Invoice Ref
                  </label>
                  <Input
                    value={adjustForm.reference_number}
                    onChange={(e) => setAdjustForm({ ...adjustForm, reference_number: e.target.value })}
                    placeholder="e.g. JOB-1049"
                    className="h-9 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                  Reason / Production Notes
                </label>
                <Input
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  placeholder="e.g. Consumed for Stanbic billboard print job"
                  className="h-9"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="h-9 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={adjustStockMutation.isPending || !adjustForm.quantity}
                  className="h-9 text-xs font-bold bg-[#D22630] hover:bg-[#b81d26] text-white"
                >
                  {adjustStockMutation.isPending ? 'Processing...' : 'Apply Stock Update'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 3: Bulk Import from Excel Spreadsheet */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Import Inventory from Excel (.xlsx / .xls / .csv)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Upload your factory stock spreadsheet to bulk create or update items.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Template Download and Instructions */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">
                    Need the spreadsheet columns template?
                  </p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    Download our formatted template with columns for SKU, Material Name, Category, Quantity, Cost, etc.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadSampleExcel}
                  className="shrink-0 h-8 text-[11px] font-bold border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50 dark:bg-slate-900 dark:text-emerald-300 dark:border-emerald-700 gap-1.5"
                >
                  <Download size={13} /> Download Template (.xlsx)
                </Button>
              </div>

              {/* Upload Dropzone */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition-all group"
                >
                  {isParsingExcel ? (
                    <div className="space-y-2">
                      <Loader2 size={28} className="animate-spin text-emerald-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">Reading Excel spreadsheet...</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Upload size={20} />
                      </div>
                      <p className="font-bold text-slate-800 dark:text-white text-xs">
                        Click here to select an Excel spreadsheet from your computer
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Supports standard .xlsx, .xls, and .csv files
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Parsed Rows Preview */}
              {importedRows.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 dark:text-white">
                      Spreadsheet Preview ({importedRows.length} rows ready)
                    </span>
                    <button
                      type="button"
                      onClick={() => setImportedRows([])}
                      className="text-rose-600 hover:underline font-semibold text-[11px]"
                    >
                      Clear File
                    </button>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 uppercase font-bold sticky top-0">
                        <tr>
                          <th className="px-3 py-1.5">SKU</th>
                          <th className="px-3 py-1.5">Material Name</th>
                          <th className="px-3 py-1.5 text-right">Qty</th>
                          <th className="px-3 py-1.5 text-right">Cost (GH₵)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {importedRows.slice(0, 8).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-3 py-1.5 font-mono font-bold text-[#D22630]">
                              {row.SKU || row.sku || row['Item Code'] || `ROW-${idx + 1}`}
                            </td>
                            <td className="px-3 py-1.5 font-semibold text-slate-800 dark:text-slate-200">
                              {row['Material Name'] || row.Name || row.name || row.Description || 'Item'}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono font-bold">
                              {row.Quantity || row.quantity || row.Qty || 0}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono">
                              GH₵{Number(row['Cost Price'] || row.cost || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importedRows.length > 8 && (
                    <p className="text-[10px] text-slate-400 text-center italic">
                      + and {importedRows.length - 8} more rows will be imported
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsImportModalOpen(false)}
                  className="h-9 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={importMutation.isPending || importedRows.length === 0}
                  onClick={() => importMutation.mutate(importedRows)}
                  className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {importMutation.isPending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Importing {importedRows.length} items...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      Import {importedRows.length} Items to Inventory
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

