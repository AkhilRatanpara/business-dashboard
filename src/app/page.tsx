'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, FolderTree, RefreshCw, History, ArrowUpRight, ArrowDownRight, Edit3, PlusCircle, Layers, Folder, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { QuickEditModal } from '@/components/items/QuickEditModal';
import { notify } from '@/components/ui/Toast';

interface DashboardData {
  stats: {
    totalItems: number;
    totalCategories: number;
    updatedTodayCount: number;
    priceChanges7DaysCount: number;
  };
  recentItems: Array<{
    id: string;
    name: string;
    itemCode?: string;
    brand?: string;
    costPrice: number;
    retailerPrice: number;
    customerPrice: number;
    retailerProfit: number;
    customerProfit: number;
    retailerMarkup: number;
    customerMarkup: number;
    category?: { id: string; name: string };
    updatedAt: string;
  }>;
  recentPriceChanges: Array<{
    id: string;
    itemId: string;
    oldCostPrice: number;
    newCostPrice: number;
    oldRetailerPrice: number;
    newRetailerPrice: number;
    oldCustomerPrice: number;
    newCustomerPrice: number;
    costDiff: number;
    retailerDiff: number;
    customerDiff: number;
    changedAt: string;
    item: { id: string; name: string };
  }>;
  categoryStats: Array<{
    id: string;
    name: string;
    parentId?: string | null;
    sortOrder?: number;
    count: number;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<any>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategoryExpand = (catId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const categoryTree = useMemo(() => {
    if (!data?.categoryStats) return [];
    const childrenMap = new Map<string, any[]>();
    data.categoryStats.forEach((c) => {
      if (c.parentId) {
        if (!childrenMap.has(c.parentId)) childrenMap.set(c.parentId, []);
        childrenMap.get(c.parentId)!.push(c);
      }
    });

    const buildNode = (cat: any): any => {
      const kids = childrenMap.get(cat.id) || [];
      const childNodes = kids.map(buildNode);
      const totalCount = cat.count + childNodes.reduce((sum: number, ch: any) => sum + ch.totalCount, 0);
      return {
        ...cat,
        children: childNodes,
        totalCount,
      };
    };

    const roots = data.categoryStats.filter((c) => !c.parentId);
    return roots.map(buildNode);
  }, [data?.categoryStats]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Shop Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Gunatit Submersible • 9925531065
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchDashboardData();
              notify('Dashboard refreshed from Neon DB', 'info');
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/items/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Item</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards (Craft.Lab Design) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Items */}
        <Link href="/items" className="glass-card glass-card-hover rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Total Items</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {loading ? '...' : data?.stats.totalItems || 0}
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Active in price book</p>
          </div>
        </Link>

        {/* Categories */}
        <Link href="/categories" className="glass-card glass-card-hover rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Categories</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {loading ? '...' : data?.stats.totalCategories || 0}
            </div>
            <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold mt-0.5">Product groups</p>
          </div>
        </Link>

        {/* Updated Today */}
        <Link href="/items?sort=updated_desc" className="glass-card glass-card-hover rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Updated Today</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {loading ? '...' : data?.stats.updatedTodayCount || 0}
            </div>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">Items edited today</p>
          </div>
        </Link>

        {/* 7-Day Revisions */}
        <Link href="/price-history" className="glass-card glass-card-hover rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">7-Day Revisions</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {loading ? '...' : data?.stats.priceChanges7DaysCount || 0}
            </div>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-0.5">Price log entries</p>
          </div>
        </Link>
      </div>

      {/* Main Grid: Recently Updated Items & Price History Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recently Updated Items Table / Mobile Cards */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Recently Updated Items</span>
            </h2>
            <Link href="/items" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-extrabold">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-500 text-xs animate-pulse">Loading recently updated items...</div>
          ) : !data?.recentItems.length ? (
            <div className="py-8 text-center text-slate-500 text-xs">No items found yet.</div>
          ) : (
            <div className="space-y-3">
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3 text-rose-700 dark:text-rose-400">Cost</th>
                      <th className="py-2.5 px-3 text-cyan-700 dark:text-cyan-400">Retailer</th>
                      <th className="py-2.5 px-3 text-emerald-700 dark:text-emerald-400">Customer</th>
                      <th className="py-2.5 px-3">Cust. Profit</th>
                      <th className="py-2.5 px-3 text-right">Quick Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {data.recentItems.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => router.push(`/items/${item.id}`)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400">
                            {item.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {item.brand && (
                              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                {item.brand} •
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500">{item.category?.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20">{formatCurrency(item.costPrice)}</td>
                        <td className="py-3 px-3 font-mono font-bold text-cyan-700 dark:text-cyan-400">{formatCurrency(item.retailerPrice)}</td>
                        <td className="py-3 px-3 font-mono font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(item.customerPrice)}</td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-300">
                          +{formatCurrency(item.customerProfit)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItemForEdit(item);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 transition-all"
                            title="Quick Edit Price"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Grid View (Clicking opens /items/[id]) */}
              <div className="sm:hidden space-y-2.5">
                {data.recentItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => router.push(`/items/${item.id}`)}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 space-y-3 cursor-pointer hover:border-emerald-500/40 hover:shadow-md transition-all select-none"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs">
                          {item.brand && (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {item.brand} •
                            </span>
                          )}
                          <span className="text-slate-500 dark:text-slate-400">{item.category?.name}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItemForEdit(item);
                        }}
                        className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 border border-emerald-200/60 dark:border-emerald-800/40 shrink-0 cursor-pointer shadow-2xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs text-center items-center">
                      <div className="bg-rose-50/80 dark:bg-rose-950/30 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40 flex flex-col items-center justify-center">
                        <span className="text-[10px] text-rose-700 dark:text-rose-400 font-black block uppercase tracking-wider">Cost</span>
                        <span className="font-mono font-black text-rose-700 dark:text-rose-400 text-sm mt-0.5">{formatCurrency(item.costPrice)}</span>
                      </div>
                      <div className="p-1.5 flex flex-col items-center justify-center">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-bold">Retailer</span>
                        <span className="font-mono font-black text-cyan-600 dark:text-cyan-400 text-sm mt-0.5">{formatCurrency(item.retailerPrice)}</span>
                        {item.retailerProfit !== undefined && item.retailerProfit > 0 && (
                          <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">
                            +{formatCurrency(item.retailerProfit)}
                          </span>
                        )}
                      </div>
                      <div className="p-1.5 flex flex-col items-center justify-center">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-bold">Customer</span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">{formatCurrency(item.customerPrice)}</span>
                        {item.customerProfit !== undefined && item.customerProfit > 0 && (
                          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            +{formatCurrency(item.customerProfit)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SELECTIVE PRICE CHANGES FEED (LISTS ONLY SPECIFIC CHANGED PRICES) */}
        <div className="glass-card rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Recent Price Changes</span>
            </h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-500 text-xs animate-pulse">Loading price history...</div>
          ) : !data?.recentPriceChanges.length ? (
            <div className="py-8 text-center text-slate-500 text-xs">No price revisions logged yet.</div>
          ) : (
            <div className="space-y-3">
              {data.recentPriceChanges.map((change) => {
                const itemID = change.itemId || change.item?.id;

                // Detect specifically which prices changed
                const changesList: Array<{ label: string; oldVal: number; newVal: number; colorClass: string }> = [];

                if (change.oldCostPrice !== change.newCostPrice) {
                  changesList.push({
                    label: 'Cost',
                    oldVal: change.oldCostPrice,
                    newVal: change.newCostPrice,
                    colorClass: 'text-rose-700 dark:text-rose-400 font-black',
                  });
                }
                if (change.oldRetailerPrice !== change.newRetailerPrice) {
                  changesList.push({
                    label: 'Retailer',
                    oldVal: change.oldRetailerPrice,
                    newVal: change.newRetailerPrice,
                    colorClass: 'text-cyan-700 dark:text-cyan-400 font-bold',
                  });
                }
                if (change.oldCustomerPrice !== change.newCustomerPrice) {
                  changesList.push({
                    label: 'Customer',
                    oldVal: change.oldCustomerPrice,
                    newVal: change.newCustomerPrice,
                    colorClass: 'text-emerald-700 dark:text-emerald-400 font-black',
                  });
                }

                return (
                  <div
                    key={change.id}
                    onClick={() => itemID && router.push(`/items/${itemID}`)}
                    className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1.5 text-xs cursor-pointer hover:border-purple-500/40 transition-all shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 hover:text-purple-600 dark:hover:text-purple-400 truncate max-w-[160px]">
                        {change.item?.name || 'Shop Item'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{formatDateTime(change.changedAt)}</span>
                    </div>

                    {/* DYNAMICALLY LIST ONLY SPECIFIC CHANGED PRICES */}
                    <div className="space-y-1 font-mono pt-1">
                      {changesList.length === 0 ? (
                        <span className="text-[11px] text-slate-500 italic">Initial price setup</span>
                      ) : (
                        changesList.map((c, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-500 font-semibold">{c.label}:</span>
                            <span className="text-slate-500">{formatCurrency(c.oldVal)}</span>
                            <span className="text-slate-400">→</span>
                            <span className={c.colorClass}>{formatCurrency(c.newVal)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Category Overview - Minimal Collapsible Tree */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
              Category Catalog Hierarchy
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
              {categoryTree.length} Groups
            </span>
          </div>
          <Link
            href="/categories"
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-extrabold flex items-center gap-1"
          >
            <span>Manage Categories</span>
            <span>&rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoryTree.map((rootCat) => {
            const hasChildren = rootCat.children.length > 0;
            const isExpanded = !!expandedCategories[rootCat.id];

            return (
              <div
                key={rootCat.id}
                className="bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 transition-all space-y-2.5 shadow-2xs hover:border-emerald-500/40"
              >
                {/* Parent Row */}
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/items?categoryId=${rootCat.id}`}
                    className="flex items-center gap-2.5 min-w-0 flex-1 group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-800 shrink-0 group-hover:border-emerald-500/40 transition-colors">
                      <Folder className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate tracking-tight transition-colors">
                        {rootCat.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {rootCat.totalCount} {rootCat.totalCount === 1 ? 'part' : 'parts'} total
                      </p>
                    </div>
                  </Link>

                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={(e) => toggleCategoryExpand(rootCat.id, e)}
                      className="p-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold flex items-center gap-1 transition-all shrink-0 border border-slate-200 dark:border-slate-800 cursor-pointer"
                      title={isExpanded ? 'Collapse subcategories' : 'Expand subcategories'}
                    >
                      <span className="text-[10px] font-mono">{rootCat.children.length} sub</span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <Link
                      href={`/items?categoryId=${rootCat.id}`}
                      className="p-1.5 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shrink-0"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                {/* Nested Collapsible Subcategories Tree */}
                {hasChildren && isExpanded && (
                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1 pl-1 animate-fade-in">
                    {rootCat.children.map((sub: any) => (
                      <div key={sub.id} className="space-y-0.5">
                        <Link
                          href={`/items?categoryId=${sub.id}`}
                          className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-slate-300 dark:text-slate-600 font-mono text-[11px]">└</span>
                            <span className="truncate font-semibold text-[11px] group-hover:underline">
                              {sub.name}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800 shrink-0">
                            {sub.totalCount ?? sub.count}
                          </span>
                        </Link>
                        {sub.children && sub.children.length > 0 && (
                          <div className="pl-4 space-y-0.5">
                            {sub.children.map((subsub: any) => (
                              <Link
                                key={subsub.id}
                                href={`/items?categoryId=${subsub.id}`}
                                className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-slate-300 dark:text-slate-700 font-mono text-[9px]">├</span>
                                  <span className="truncate group-hover:underline">
                                    {subsub.name}
                                  </span>
                                </div>
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 shrink-0">
                                  {subsub.count}
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Edit Modal */}
      {selectedItemForEdit && (
        <QuickEditModal
          item={selectedItemForEdit}
          onClose={() => setSelectedItemForEdit(null)}
          onSave={fetchDashboardData}
        />
      )}
    </div>
  );
}
