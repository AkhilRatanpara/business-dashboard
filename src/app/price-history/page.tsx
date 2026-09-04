'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  History, Search, ArrowUpRight, ArrowDownRight, RefreshCw,
  Layers
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { notify } from '@/components/ui/Toast';
import { ActivityRecoveryVaultView } from '@/components/history/ActivityRecoveryVaultView';

interface PriceHistoryRecord {
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
  changeNote?: string;
  changedAt: string;
  item: {
    id: string;
    name: string;
    category: { name: string };
  };
}

interface Category {
  id: string;
  name: string;
}

function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'revisions';

  const [activeTab, setActiveTab] = useState(initialTab);

  // Tab 1 (Price Revisions) State
  const [histories, setHistories] = useState<PriceHistoryRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [filter, setFilter] = useState(''); // 'today', '7days', '30days'

  // Load Categories for Filter (Tab 1)
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories', { cache: 'no-store' });
        const data = await res.json();
        if (data.success) setCategories(data.categories);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch Revisions (Tab 1)
  const fetchRevisions = useCallback(async () => {
    setLoadingRevisions(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (categoryId) query.set('categoryId', categoryId);
      if (filter) query.set('filter', filter);

      const res = await fetch(`/api/price-history?${query.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setHistories(data.histories);
      }
    } catch (err) {
      console.error('Error fetching price history:', err);
    } finally {
      setLoadingRevisions(false);
    }
  }, [search, categoryId, filter]);

  // Sync tab with query param changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  // Fetch revisions when on revisions tab
  useEffect(() => {
    if (activeTab === 'revisions') {
      const timer = setTimeout(() => fetchRevisions(), 200);
      return () => clearTimeout(timer);
    }
  }, [activeTab, fetchRevisions]);

  // Update query param when tab is manually clicked
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/price-history?tab=${tab}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <History className="w-7 h-7 text-emerald-600 dark:text-emerald-450" />
            <span>Audit & Activity Logs</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Monitor price changes and rollback/restore recent shop actions.
          </p>
        </div>

        {activeTab === 'revisions' && (
          <button
            onClick={fetchRevisions}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all shadow-xs cursor-pointer"
            title="Refresh Price Revisions"
          >
            <RefreshCw className={`w-4 h-4 ${loadingRevisions ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        )}
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 max-w-md">
        <button
          onClick={() => handleTabChange('revisions')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
            activeTab === 'revisions'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Price Revisions
        </button>
        <button
          onClick={() => handleTabChange('activity')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
            activeTab === 'activity'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Activity & Recovery
        </button>
      </div>

      {/* ── TAB 1: PRICE REVISIONS ── */}
      {activeTab === 'revisions' && (
        <div className="space-y-5">
          {/* Filters Row */}
          <div className="glass-card rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 border border-slate-200 dark:border-slate-800">
            {/* Search */}
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search item name in price revisions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            {/* Category Filter */}
            <div className="sm:col-span-4">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-bold"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date filter */}
            <div className="sm:col-span-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-bold"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>
          </div>

          {loadingRevisions ? (
            <div className="py-14 text-center text-slate-500 text-xs animate-pulse flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
              <span>Fetching price logs...</span>
            </div>
          ) : !histories.length ? (
            <div className="glass-card rounded-2xl p-12 text-center space-y-2 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-700 dark:text-slate-300 text-sm font-semibold">No price history entries found.</div>
              <p className="text-xs text-slate-500">Every price update creates a permanent log entry here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono px-1 font-bold">
                Showing <span className="text-emerald-600 dark:text-emerald-400">{histories.length}</span> price logs
              </div>

              {/* Desktop Table */}
              <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-450 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4 text-rose-700 dark:text-rose-455">Cost Change</th>
                      <th className="py-3 px-4 text-cyan-700 dark:text-cyan-400">Retailer Change</th>
                      <th className="py-3 px-4 text-emerald-700 dark:text-emerald-455">Customer Change</th>
                      <th className="py-3 px-4">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                    {histories.map((h) => {
                      const targetItemId = h.itemId || h.item?.id;
                      return (
                        <tr
                          key={h.id}
                          onClick={() => targetItemId && router.push(`/items/${targetItemId}`)}
                          className="hover:bg-slate-55 dark:hover:bg-slate-950/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 px-4 text-slate-500 text-[11px] font-sans font-semibold">{formatDateTime(h.changedAt)}</td>
                          <td className="py-3.5 px-4 font-sans">
                            <div className="font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400">
                              {h.item.name}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{h.item.category.name}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-450">{formatCurrency(h.oldCostPrice)}</span>
                              <span className="text-slate-400">&rarr;</span>
                              <span className="font-black text-rose-700 dark:text-rose-400">{formatCurrency(h.newCostPrice)}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-455">{formatCurrency(h.oldRetailerPrice)}</span>
                              <span className="text-slate-400">&rarr;</span>
                              <span className="font-bold text-cyan-700 dark:text-cyan-400">{formatCurrency(h.newRetailerPrice)}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-455">{formatCurrency(h.oldCustomerPrice)}</span>
                              <span className="text-slate-400">&rarr;</span>
                              <span className="font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(h.newCustomerPrice)}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-400 text-[11px]">{h.changeNote || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Timeline Cards */}
              <div className="lg:hidden space-y-3">
                {histories.map((h) => {
                  const targetItemId = h.itemId || h.item?.id;
                  return (
                    <div
                      key={h.id}
                      onClick={() => targetItemId && router.push(`/items/${targetItemId}`)}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-4 space-y-2 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-500/40 transition-all shadow-xs"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm hover:text-emerald-600 dark:hover:text-emerald-400 leading-snug">
                          {h.item.name}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono font-medium whitespace-nowrap ml-2">
                          {formatDateTime(h.changedAt)}
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1.5 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-500 text-[11px] font-bold">Cost:</span>
                          <div>
                            <span className="text-slate-455">{formatCurrency(h.oldCostPrice)}</span>
                            <span className="text-slate-400 px-1">&rarr;</span>
                            <span className="font-black text-rose-700 dark:text-rose-455">{formatCurrency(h.newCostPrice)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-500 text-[11px] font-bold">Retailer:</span>
                          <div>
                            <span className="text-slate-455">{formatCurrency(h.oldRetailerPrice)}</span>
                            <span className="text-slate-400 px-1">&rarr;</span>
                            <span className="font-bold text-cyan-700 dark:text-cyan-400">{formatCurrency(h.newRetailerPrice)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-500 text-[11px] font-bold">Customer:</span>
                          <div>
                            <span className="text-slate-455">{formatCurrency(h.oldCustomerPrice)}</span>
                            <span className="text-slate-400 px-1">&rarr;</span>
                            <span className="font-black text-emerald-700 dark:text-emerald-455">{formatCurrency(h.newCustomerPrice)}</span>
                          </div>
                        </div>
                      </div>

                      {h.changeNote && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 italic bg-slate-100/80 dark:bg-slate-900/50 px-2.5 py-1 rounded-lg">
                          Note: {h.changeNote}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: ACTIVITY & RECOVERY VAULT (15-DAY AUTOMATED BACKUP & 1-CLICK RESTORE) ── */}
      {activeTab === 'activity' && (
        <ActivityRecoveryVaultView />
      )}
    </div>
  );
}

export default function PriceHistoryPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-slate-400 text-xs">Loading logs…</div>}>
      <HistoryContent />
    </Suspense>
  );
}
