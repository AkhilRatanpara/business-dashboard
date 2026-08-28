'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  History, Search, ArrowUpRight, ArrowDownRight, RefreshCw,
  Clock, HelpCircle, RotateCcw, Trash2, Plus, Edit3, Terminal, Layers
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { notify } from '@/components/ui/Toast';

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

interface AuditLog {
  id: string;
  actionType: string;
  entityType: string;
  entityId: string;
  entityName: string;
  oldData: any;
  newData: any;
  createdAt: string;
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

  // Tab 2 (Activity & Recovery) State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingRecovery, setLoadingRecovery] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

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

  // Fetch Recovery Logs (Tab 2)
  const fetchRecoveryLogs = async () => {
    setLoadingRecovery(true);
    try {
      const res = await fetch('/api/audit-logs', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      } else {
        notify('Failed to load recovery logs', 'error');
      }
    } catch (err) {
      console.error('Error fetching recovery logs:', err);
      notify('Network error loading history', 'error');
    } finally {
      setLoadingRecovery(false);
    }
  };

  // Trigger Fetching depending on tab
  useEffect(() => {
    if (activeTab === 'revisions') {
      const timer = setTimeout(() => fetchRevisions(), 200);
      return () => clearTimeout(timer);
    } else {
      fetchRecoveryLogs();
    }
  }, [activeTab, fetchRevisions]);

  // Sync tab with query param changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  // Update query param when tab is manually clicked
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/price-history?tab=${tab}`);
  };

  // Restore Handler (Tab 2)
  const handleRestore = async (logId: string, label: string) => {
    if (!confirm(`Are you sure you want to restore "${label}"?`)) return;
    setRestoringId(logId);
    try {
      const res = await fetch(`/api/audit-logs/${logId}/restore`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message || 'Restored successfully', 'success');
        fetchRecoveryLogs();
      } else {
        notify(data.message || 'Restoration failed', 'error');
      }
    } catch (err) {
      notify('Error communicating with server', 'error');
    } finally {
      setRestoringId(null);
    }
  };

  // Action badge resolver (Tab 2)
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <Plus className="w-3 h-3" /> Created
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <Edit3 className="w-3 h-3" /> Updated
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
            <Trash2 className="w-3 h-3" /> Deleted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {action}
          </span>
        );
    }
  };

  // Render change log details (Tab 2)
  const renderChangesDescription = (log: AuditLog) => {
    const { actionType, entityType, oldData, newData } = log;

    if (actionType === 'DELETE') {
      if (entityType === 'BATCH_ITEMS') {
        const items = oldData?.items || [];
        return (
          <div className="text-xs space-y-1.5 mt-2 bg-slate-950 p-3.5 rounded-xl font-mono text-slate-300 border border-slate-205 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-850 pb-1.5 mb-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>System Event: Batch Items Deleted ({items.length})</span>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-[11px] font-semibold leading-relaxed">
              {items.map((item: any, idx: number) => (
                <p key={idx} className="truncate text-slate-400 hover:text-slate-200">
                  <span className="text-slate-600 font-bold">[{idx + 1}]</span> {item.name}
                  {item.brand && ` (${item.brand})`} - ₹{item.costPrice} Cost
                </p>
              ))}
            </div>
          </div>
        );
      }

      if (entityType === 'ITEM') {
        return (
          <div className="text-xs space-y-1.5 mt-2 bg-slate-950 p-3.5 rounded-xl font-mono text-slate-300 border border-slate-205 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-850 pb-1.5 mb-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>System Event: Single Item Deleted</span>
            </div>
            <div className="space-y-0.5 text-[11px] font-semibold text-slate-400">
              <p><span className="text-slate-600">ID:</span> {oldData?.id}</p>
              <p><span className="text-slate-600">Name:</span> {oldData?.name}</p>
              {oldData?.brand && <p><span className="text-slate-600">Brand:</span> {oldData?.brand}</p>}
              <p>
                <span className="text-slate-600">Prices:</span> Cost ₹{oldData?.costPrice} | Retailer ₹{oldData?.retailerPrice} | Customer ₹{oldData?.customerPrice}
              </p>
            </div>
          </div>
        );
      }

      // Category Delete
      const itemLen = oldData?.items?.length || 0;
      return (
        <div className="text-xs space-y-1.5 mt-2 bg-slate-950 p-3.5 rounded-xl font-mono text-slate-300 border border-slate-205 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-850 pb-1.5 mb-1.5">
            <Terminal className="w-3.5 h-3.5" />
            <span>System Event: Category Deleted</span>
          </div>
          <div className="space-y-0.5 text-[11px] font-semibold text-slate-400">
            <p><span className="text-slate-600">Category:</span> {oldData?.name}</p>
            {itemLen > 0 && (
              <p className="text-[10px] text-amber-500 dark:text-amber-400 font-bold mt-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg inline-block font-sans">
                ⚠ Cascade Warning: Restoring this category will also restore its {itemLen} items.
              </p>
            )}
          </div>
        </div>
      );
    }

    if (actionType === 'CREATE') {
      return (
        <div className="text-xs mt-2 bg-slate-950 p-3.5 rounded-xl font-mono text-slate-300 border border-slate-205 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-850 pb-1.5 mb-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>System Event: Master Record Inserted</span>
          </div>
          <p className="text-[11px] font-semibold text-slate-400">
            Inserted {entityType.toLowerCase()} &quot;<span className="text-slate-200 font-bold">{newData?.name}</span>&quot; under category &quot;<span className="text-emerald-400">{newData?.categoryName || 'Master Root'}</span>&quot;
          </p>
        </div>
      );
    }

    if (actionType === 'UPDATE') {
      if (entityType === 'ITEM') {
        const changes: string[] = [];
        if (oldData && newData) {
          if (oldData.name !== newData.name) {
            changes.push(`[Name]  "${oldData.name}" -> "${newData.name}"`);
          }
          if (Number(oldData.costPrice) !== Number(newData.costPrice)) {
            changes.push(`[Cost]  ₹${oldData.costPrice} -> ₹${newData.costPrice}`);
          }
          if (Number(oldData.retailerPrice) !== Number(newData.retailerPrice)) {
            changes.push(`[Retail] ₹${oldData.retailerPrice} -> ₹${newData.retailerPrice}`);
          }
          if (Number(oldData.customerPrice) !== Number(newData.customerPrice)) {
            changes.push(`[Cust]   ₹${oldData.customerPrice} -> ₹${newData.customerPrice}`);
          }
          if (oldData.brand !== newData.brand) {
            changes.push(`[Brand]  "${oldData.brand || 'None'}" -> "${newData.brand || 'None'}"`);
          }
        }
        return (
          <div className="text-xs space-y-1 mt-2 bg-slate-950 p-3.5 rounded-xl font-mono text-slate-300 border border-slate-205 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-850 pb-1.5 mb-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>System Event: State Delta Change</span>
            </div>
            {changes.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">No primary fields updated</p>
            ) : (
              <div className="space-y-0.5 text-[11px] font-semibold text-emerald-400">
                {changes.map((c, i) => (
                  <p key={i}>• {c}</p>
                ))}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div className="text-xs mt-2 bg-slate-950 p-3.5 rounded-xl font-mono text-slate-300 border border-slate-205 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-850 pb-1.5 mb-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>System Event: Category Updated</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400">
              Renamed Category: "{oldData?.name}" &rarr; "{newData?.name}"
            </p>
          </div>
        );
      }
    }

    return null;
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

        <button
          onClick={activeTab === 'revisions' ? fetchRevisions : fetchRecoveryLogs}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all shadow-xs"
          title="Refresh Feed"
        >
          <RefreshCw className={`w-4 h-4 ${(activeTab === 'revisions' ? loadingRevisions : loadingRecovery) ? 'animate-spin text-emerald-500' : ''}`} />
        </button>
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

      {/* ── TAB 2: ACTIVITY & RECOVERY ── */}
      {activeTab === 'activity' && (
        <div className="space-y-5">
          {/* Info Retention Banner */}
          <div className="bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
            <Clock className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="text-xs">
              <h4 className="font-black mb-0.5">7-Day Recovery retention</h4>
              <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                System activities are kept for 7 days. You can rollback price updates or recover deleted items inside this window.
              </p>
            </div>
          </div>

          {loadingRecovery ? (
            <div className="py-14 text-center text-slate-550 text-xs animate-pulse flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
              <span>Fetching recovery logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="glass-card rounded-2xl p-16 text-center border border-slate-205 dark:border-slate-800 space-y-3">
              <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">No Recovery Logs Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No deletion or update logs exist in the current 7-day window.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const dateStr = formatDateTime(log.createdAt);
                const label = log.entityName || `Entity #${log.entityId}`;
                const canRestore = log.actionType === 'DELETE' || log.actionType === 'UPDATE';

                return (
                  <div
                    key={log.id}
                    className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-xs gap-3"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {getActionBadge(log.actionType)}
                        <span className="text-[10px] font-mono font-bold text-purple-650 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                          {log.entityType}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono font-bold">{dateStr}</span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-tight truncate">
                          {label}
                        </h3>

                        {canRestore && (
                          <button
                            onClick={() => handleRestore(log.id, label)}
                            disabled={restoringId !== null}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 dark:bg-amber-600 hover:bg-amber-400 hover:scale-[1.01] active:scale-[0.98] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-50 h-9 shrink-0"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${restoringId === log.id ? 'animate-spin' : ''}`} />
                            <span>{log.actionType === 'DELETE' ? 'Restore Deleted' : 'Rollback Update'}</span>
                          </button>
                        )}
                      </div>

                      {renderChangesDescription(log)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
