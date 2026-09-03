'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, RotateCcw, Trash2, Plus, Edit3, ShieldCheck,
  RefreshCw, Package, Layers, Calendar, ArrowRight, CheckCircle2,
  Tag, AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { notify } from '@/components/ui/Toast';

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

export default function HistoryPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'DELETE' | 'UPDATE' | 'CREATE'>('DELETE');
  const [onlyDeletedToggle, setOnlyDeletedToggle] = useState<boolean>(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      } else {
        notify('Failed to load activity logs', 'error');
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      notify('Network error loading history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRestore = async (logId: string, label: string) => {
    if (!confirm(`Are you sure you want to restore "${label}" back into your catalog?`)) return;
    setRestoringId(logId);
    try {
      const res = await fetch(`/api/audit-logs/${logId}/restore`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message || `Successfully restored "${label}"!`, 'success');
        fetchLogs();
      } else {
        notify(data.message || 'Restoration failed', 'error');
      }
    } catch {
      notify('Error communicating with server', 'error');
    } finally {
      setRestoringId(null);
    }
  };

  const filteredLogs = useMemo(() => {
    if (onlyDeletedToggle) {
      return logs.filter((l) => l.actionType === 'DELETE');
    }
    if (filter === 'ALL') return logs;
    return logs.filter((log) => log.actionType === filter);
  }, [logs, filter, onlyDeletedToggle]);

  const deletedItemsCount = useMemo(() => {
    return logs.filter((l) => l.actionType === 'DELETE').length;
  }, [logs]);

  const updatesCount = useMemo(() => {
    return logs.filter((l) => l.actionType === 'UPDATE').length;
  }, [logs]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-emerald-500" />
              <span>Activity & Recovery Vault</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              15-day backup logs with 1-click restore for deleted items and price revisions.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="self-start sm:self-auto p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-all shadow-xs flex items-center gap-2 text-xs font-bold"
          title="Refresh History"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 15-Day Automated Backup Protection Banner */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-start gap-3.5">
        <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm">
            15-Day Automated Backup Retention
          </h4>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            All deleted items, category changes, and rate revisions are safely preserved in this vault for 15 days.
            If you accidentally delete an item, restore it below in 1 click.
          </p>
        </div>
      </div>

      {/* Quick Slide Toggle: Deleted Items Only vs All Activity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-900 dark:text-slate-100">
            Vault Focus Mode:
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            {onlyDeletedToggle ? 'Showing Deleted Items Rollback only' : 'Showing all revisions & system events'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setOnlyDeletedToggle(true);
              setFilter('DELETE');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              onlyDeletedToggle
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Deleted Recovery ({deletedItemsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setOnlyDeletedToggle(false)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              !onlyDeletedToggle
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Activity ({logs.length})
          </button>
        </div>
      </div>

      {/* Filter Tabs when not in strict Deleted Items Only mode */}
      {!onlyDeletedToggle && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filter === 'ALL'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Activity ({logs.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter('DELETE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              filter === 'DELETE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Deleted Items ({deletedItemsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('UPDATE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              filter === 'UPDATE'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Price Revisions ({updatesCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('CREATE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              filter === 'CREATE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Items</span>
          </button>
        </div>
      )}

      {/* Activity Timeline List */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs animate-pulse">
          Loading 15-day backup records from Neon DB...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-800 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">No Activity Records Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {onlyDeletedToggle || filter === 'DELETE'
              ? 'No items have been deleted in the last 15 days. Your active catalog is intact!'
              : 'No log entries match your active filter within the 15-day backup retention period.'}
          </p>
          <div className="pt-2">
            <Link
              href="/items"
              className="inline-block px-5 py-2.5 bg-emerald-600 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-emerald-600/20"
            >
              Back to Price Book
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const dateStr = formatDateTime(log.createdAt);
            const isDelete = log.actionType === 'DELETE';
            const isUpdate = log.actionType === 'UPDATE';
            const isCreate = log.actionType === 'CREATE';

            // ─── PROMINENT CARD FOR DELETED ITEMS (RESTORATION FOCUS) ───────────
            if (isDelete) {
              return (
                <div
                  key={log.id}
                  className="glass-card rounded-2xl p-4 sm:p-5 border border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/15 transition-all shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                        <Trash2 className="w-3 h-3" />
                        <span>Deleted Item Backup</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{dateStr}</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRestore(log.id, log.entityName || 'item')}
                      disabled={restoringId !== null}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${restoringId === log.id ? 'animate-spin' : ''}`} />
                      <span>Restore Item Now</span>
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      {log.entityName || `Item #${log.entityId}`}
                    </h3>
                    {log.oldData?.categoryName && (
                      <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>Category: {log.oldData.categoryName}</span>
                        {log.oldData?.brand && <span>• Brand: {log.oldData.brand}</span>}
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-rose-200/80 dark:border-rose-900/50 space-y-2">
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Backed-up rates at deletion time:
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-rose-50/60 dark:bg-rose-950/30">
                        <span className="block text-[10px] uppercase font-bold text-rose-600">Cost</span>
                        <span className="font-mono font-bold text-rose-700 dark:text-rose-300">
                          ₹{log.oldData?.costPrice || 0}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-cyan-50/60 dark:bg-cyan-950/30">
                        <span className="block text-[10px] uppercase font-bold text-cyan-600">Retailer</span>
                        <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">
                          ₹{log.oldData?.retailerPrice || 0}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30">
                        <span className="block text-[10px] uppercase font-bold text-emerald-600">Customer</span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          ₹{log.oldData?.customerPrice || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // ─── MINIMAL COMPACT 1-LINE BADGE ROW FOR PRICE REVISIONS ───────────
            if (isUpdate) {
              return (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 shrink-0">
                      Rate Changed
                    </span>
                    <span className="font-black text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-xs">
                      {log.entityName || `Item #${log.entityId}`}
                    </span>
                    {log.oldData && log.newData && (
                      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                        {log.oldData.costPrice !== log.newData.costPrice && (
                          <span>Cost ₹{log.oldData.costPrice} &rarr; ₹{log.newData.costPrice}</span>
                        )}
                        {log.oldData.retailerPrice !== log.newData.retailerPrice && (
                          <span className="text-cyan-600 dark:text-cyan-400">Ret ₹{log.oldData.retailerPrice} &rarr; ₹{log.newData.retailerPrice}</span>
                        )}
                        {log.oldData.customerPrice !== log.newData.customerPrice && (
                          <span className="text-emerald-600 dark:text-emerald-400">Cust ₹{log.oldData.customerPrice} &rarr; ₹{log.newData.customerPrice}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {dateStr}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRestore(log.id, log.entityName || 'item')}
                      disabled={restoringId !== null}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-600 text-[10px] font-bold flex items-center gap-1 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                      title="Revert prices to previous values"
                    >
                      <RotateCcw className={`w-3 h-3 ${restoringId === log.id ? 'animate-spin text-amber-500' : ''}`} />
                      <span>Revert</span>
                    </button>
                  </div>
                </div>
              );
            }

            // ─── COMPACT ROW FOR NEW ITEM CREATIONS ─────────────────────────────
            return (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                    New Added
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {log.entityName || `Item #${log.entityId}`}
                  </span>
                  {log.newData && (
                    <span className="font-mono text-[11px] text-slate-400">
                      (Cost ₹{log.newData.costPrice} • Ret ₹{log.newData.retailerPrice} • Cust ₹{log.newData.customerPrice})
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {dateStr}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
