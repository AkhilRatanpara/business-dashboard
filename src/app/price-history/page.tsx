'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { History, Search, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

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

export default function PriceHistoryPage() {
  const router = useRouter();
  const [histories, setHistories] = useState<PriceHistoryRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [filter, setFilter] = useState(''); // 'today', '7days', '30days'

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

  const fetchHistory = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, [search, categoryId, filter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchHistory]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Price History Audit Log
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Permanent log of all item price updates & revision dates
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search item name in log..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category */}
        <div className="sm:col-span-4">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="sm:col-span-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
          >
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* History Content */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs animate-pulse flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-purple-600 dark:text-purple-400" />
          <span>Fetching history from Neon DB...</span>
        </div>
      ) : !histories.length ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-2">
          <div className="text-slate-700 dark:text-slate-300 text-sm font-semibold">No price history entries found.</div>
          <p className="text-xs text-slate-500">Every price update creates a permanent log entry here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono px-1 font-bold">
            Showing <span className="text-purple-600 dark:text-purple-400">{histories.length}</span> price logs
          </div>

          {/* Desktop Table View (Clicking item opens /items/[id]) */}
          <div className="hidden lg:block glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4 text-rose-700 dark:text-rose-400">Cost Change</th>
                  <th className="py-3 px-4 text-cyan-700 dark:text-cyan-400">Retailer Change</th>
                  <th className="py-3 px-4 text-emerald-700 dark:text-emerald-400">Customer Change</th>
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
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-500 text-[11px] font-sans font-medium">{formatDateTime(h.changedAt)}</td>
                      <td className="py-3 px-4 font-sans">
                        <div className="font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400">
                          {h.item.name}
                        </div>
                        <div className="text-[10px] text-slate-500">{h.item.category.name}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">{formatCurrency(h.oldCostPrice)}</span>
                          <span className="text-slate-400">→</span>
                          <span className="font-black text-rose-700 dark:text-rose-400">{formatCurrency(h.newCostPrice)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">{formatCurrency(h.oldRetailerPrice)}</span>
                          <span className="text-slate-400">→</span>
                          <span className="font-bold text-cyan-700 dark:text-cyan-400">{formatCurrency(h.newRetailerPrice)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">{formatCurrency(h.oldCustomerPrice)}</span>
                          <span className="text-slate-400">→</span>
                          <span className="font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(h.newCustomerPrice)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-400 text-[11px]">
                        {h.changeNote || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Timeline Cards (Clicking item opens /items/[id]) */}
          <div className="lg:hidden space-y-3">
            {histories.map((h) => {
              const targetItemId = h.itemId || h.item?.id;

              return (
                <div
                  key={h.id}
                  onClick={() => targetItemId && router.push(`/items/${targetItemId}`)}
                  className="glass-card rounded-2xl p-4 space-y-2 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-purple-500/40 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm hover:text-emerald-600 dark:hover:text-emerald-400">
                      {h.item.name}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{formatDateTime(h.changedAt)}</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px] font-bold">Cost:</span>
                      <div>
                        <span className="text-slate-500">{formatCurrency(h.oldCostPrice)}</span>
                        <span className="text-slate-400 px-1">→</span>
                        <span className="font-black text-rose-700 dark:text-rose-400">{formatCurrency(h.newCostPrice)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px] font-bold">Retailer:</span>
                      <div>
                        <span className="text-slate-500">{formatCurrency(h.oldRetailerPrice)}</span>
                        <span className="text-slate-400 px-1">→</span>
                        <span className="font-bold text-cyan-700 dark:text-cyan-400">{formatCurrency(h.newRetailerPrice)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px] font-bold">Customer:</span>
                      <div>
                        <span className="text-slate-500">{formatCurrency(h.oldCustomerPrice)}</span>
                        <span className="text-slate-400 px-1">→</span>
                        <span className="font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(h.newCustomerPrice)}</span>
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
  );
}
