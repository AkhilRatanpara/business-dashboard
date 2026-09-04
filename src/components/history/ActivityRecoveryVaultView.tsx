'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw, Trash2, Plus, Edit3, ShieldCheck,
  RefreshCw, Package, Layers, Calendar, ArrowRight,
  CheckCircle2, Search, AlertTriangle, Sparkles,
  ChevronDown, ChevronUp, Clock, Info, History
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { notify } from '@/components/ui/Toast';

export interface AuditLog {
  id: string;
  actionType: 'DELETE' | 'UPDATE' | 'CREATE' | string;
  entityType: 'ITEM' | 'CATEGORY' | 'BATCH_ITEMS' | string;
  entityId: string;
  entityName: string;
  oldData: any;
  newData: any;
  createdAt: string;
}

interface ActivityRecoveryVaultViewProps {
  initialFilter?: 'ALL' | 'DELETE' | 'UPDATE' | 'CREATE';
  showBackToSettings?: boolean;
}

export function ActivityRecoveryVaultView({
  initialFilter = 'ALL',
}: ActivityRecoveryVaultViewProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'DELETE' | 'UPDATE' | 'CREATE'>(initialFilter);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    logId: string;
    label: string;
    actionType: string;
    itemDetails?: any;
  } | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
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

  const handleConfirmRestore = async () => {
    if (!confirmModal) return;
    const { logId, label } = confirmModal;
    setRestoringId(logId);
    setConfirmModal(null);

    try {
      const res = await fetch(`/api/audit-logs/${logId}/restore`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message || `Successfully restored "${label}" to catalog!`, 'success');
        fetchLogs();
      } else {
        notify(data.message || 'Restoration failed', 'error');
      }
    } catch {
      notify('Server connection error during restoration', 'error');
    } finally {
      setRestoringId(null);
    }
  };

  // Filter logs by type and search query
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Type filter
      if (filter !== 'ALL' && log.actionType !== filter) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const nameMatch = (log.entityName || '').toLowerCase().includes(q);
        const typeMatch = (log.entityType || '').toLowerCase().includes(q);
        const codeMatch = log.oldData?.itemCode
          ? String(log.oldData.itemCode).toLowerCase().includes(q)
          : false;
        const srMatch = log.oldData?.srNo
          ? String(log.oldData.srNo).toLowerCase().includes(q)
          : false;
        return nameMatch || typeMatch || codeMatch || srMatch;
      }

      return true;
    });
  }, [logs, filter, search]);

  const counts = useMemo(() => {
    return {
      all: logs.length,
      deleted: logs.filter((l) => l.actionType === 'DELETE').length,
      updates: logs.filter((l) => l.actionType === 'UPDATE').length,
      creates: logs.filter((l) => l.actionType === 'CREATE').length,
    };
  }, [logs]);

  return (
    <div className="space-y-5 select-none">
      {/* ── 15-Day Automated Recovery Vault Status Header ── */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-emerald-500/30 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 dark:from-emerald-950/30 dark:via-slate-900 dark:to-teal-950/20 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Activity & Recovery Vault
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>15-Day Automated Backup Active</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                Accidentally deleted an item or entered the wrong rate? Restore any item back into your catalog in 1 click.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
            <span>Sync Vault</span>
          </button>
        </div>

        {/* Quick Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 mt-3 border-t border-slate-200/80 dark:border-slate-800/80">
          <div
            onClick={() => setFilter('DELETE')}
            className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
              filter === 'DELETE'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 shadow-2xs'
                : 'bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <span className="block text-base sm:text-lg font-black font-mono text-rose-600 dark:text-rose-400">
              {counts.deleted}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Deleted Items
            </span>
          </div>

          <div
            onClick={() => setFilter('UPDATE')}
            className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
              filter === 'UPDATE'
                ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-800 shadow-2xs'
                : 'bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <span className="block text-base sm:text-lg font-black font-mono text-cyan-600 dark:text-cyan-400">
              {counts.updates}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Price Revisions
            </span>
          </div>

          <div
            onClick={() => setFilter('CREATE')}
            className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
              filter === 'CREATE'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-2xs'
                : 'bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <span className="block text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
              {counts.creates}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              New Additions
            </span>
          </div>

          <div
            onClick={() => setFilter('ALL')}
            className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
              filter === 'ALL'
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 shadow-2xs'
                : 'bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <span className="block text-base sm:text-lg font-black font-mono text-slate-800 dark:text-slate-200">
              {counts.all}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Logged
            </span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Tabs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vault (e.g. item name, code, 283050)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              filter === 'ALL'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
            }`}
          >
            All Logs ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => setFilter('DELETE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              filter === 'DELETE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/40'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Recycle Bin ({counts.deleted})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('UPDATE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              filter === 'UPDATE'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 border border-cyan-200 dark:border-cyan-900/40'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Revisions ({counts.updates})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('CREATE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              filter === 'CREATE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-900/40'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Created ({counts.creates})</span>
          </button>
        </div>
      </div>

      {/* ── Log List ── */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs animate-pulse flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
          <p className="font-bold">Syncing Activity & Recovery Vault...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-3 border border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            {filter === 'DELETE' ? 'Recycle Bin is Empty' : 'No Activity Logs Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filter === 'DELETE'
              ? 'Great news! No deleted items are waiting for recovery in your catalog.'
              : search
              ? `No logs matched your search "${search}". Try clearing search.`
              : 'Every deletion, rate revision, and category change will appear here automatically.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const isDelete = log.actionType === 'DELETE';
            const isUpdate = log.actionType === 'UPDATE';
            const isCreate = log.actionType === 'CREATE';
            const isRestoring = restoringId === log.id;
            const isExpanded = expandedLogId === log.id;

            // Extract item snapshot
            const backup = log.oldData || log.newData || {};
            const label = log.entityName || backup.name || `Item #${log.entityId}`;

            return (
              <div
                key={log.id}
                className={`glass-card rounded-2xl p-4 sm:p-5 border transition-all shadow-xs ${
                  isDelete
                    ? 'border-rose-200/90 dark:border-rose-900/40 bg-white/90 dark:bg-slate-900/90 hover:border-rose-400'
                    : isUpdate
                    ? 'border-cyan-200/90 dark:border-cyan-900/40 bg-white/90 dark:bg-slate-900/90 hover:border-cyan-400'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Top Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold">
                      {isDelete && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 flex items-center gap-1 font-black">
                          <Trash2 className="w-3 h-3" />
                          <span>DELETED ITEM</span>
                        </span>
                      )}
                      {isUpdate && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900/60 flex items-center gap-1 font-black">
                          <Edit3 className="w-3 h-3" />
                          <span>PRICE REVISION</span>
                        </span>
                      )}
                      {isCreate && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-1 font-black">
                          <Plus className="w-3 h-3" />
                          <span>CREATED ITEM</span>
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                        {log.entityType}
                      </span>

                      <span className="text-slate-400 font-mono">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>

                    {/* Item Title & Metadata */}
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 leading-snug">
                      {label}
                    </h3>

                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 font-medium pt-0.5">
                      {backup.categoryName && (
                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          <Layers className="w-3 h-3 text-emerald-500" />
                          <span>{backup.categoryName}</span>
                        </span>
                      )}
                      {backup.srNo && (
                        <span className="font-mono text-[11px] font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Sr. {backup.srNo}
                        </span>
                      )}
                      {backup.itemCode && (
                        <span className="font-mono text-[11px] font-bold text-slate-400">
                          {backup.itemCode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons: 1-Click Restore */}
                  {(isDelete || isUpdate) && (
                    <div className="shrink-0 pt-1 sm:pt-0">
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmModal({
                            logId: log.id,
                            label,
                            actionType: log.actionType,
                            itemDetails: backup,
                          })
                        }
                        disabled={isRestoring}
                        className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                          isDelete
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                            : 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white shadow-cyan-500/20'
                        }`}
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                        <span>{isDelete ? 'Restore Item to Catalog' : 'Rollback Changes'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Visual Snapshot & Price Diff Block */}
                {isDelete && backup.costPrice !== undefined && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">Cost</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(backup.costPrice)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">Retailer</span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">{formatCurrency(backup.retailerPrice || 0)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">Customer</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(backup.customerPrice || 0)}</span>
                    </div>
                  </div>
                )}

                {/* Price Update Diff View */}
                {isUpdate && log.oldData && log.newData && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs font-mono">
                    {Number(log.oldData.costPrice) !== Number(log.newData.costPrice) && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans font-bold text-[11px]">Cost Price:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">{formatCurrency(log.oldData.costPrice)}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(log.newData.costPrice)}</span>
                        </div>
                      </div>
                    )}
                    {Number(log.oldData.retailerPrice) !== Number(log.newData.retailerPrice) && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans font-bold text-[11px]">Retailer Price:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">{formatCurrency(log.oldData.retailerPrice)}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-cyan-600 dark:text-cyan-400">{formatCurrency(log.newData.retailerPrice)}</span>
                        </div>
                      </div>
                    )}
                    {Number(log.oldData.customerPrice) !== Number(log.newData.customerPrice) && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans font-bold text-[11px]">Customer Price:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">{formatCurrency(log.oldData.customerPrice)}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(log.newData.customerPrice)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Inspect Details Toggle */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Technical Details' : 'View Snapshot Details'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {log.id.slice(0, 8)}...
                  </span>
                </div>

                {/* Expanded Raw JSON View */}
                {isExpanded && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-950 text-slate-300 font-mono text-[10px] overflow-x-auto max-h-48">
                    <pre>{JSON.stringify(log.oldData || log.newData, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Confirmation Modal ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                  {confirmModal.actionType === 'DELETE' ? 'Restore Deleted Item?' : 'Rollback Changes?'}
                </h3>
                <p className="text-xs text-slate-500">
                  {confirmModal.actionType === 'DELETE'
                    ? 'This item will be restored back to your catalog with all original details.'
                    : 'This item will be reverted back to its previous pricing and state.'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {confirmModal.label}
              </div>
              {confirmModal.itemDetails && (
                <div className="text-slate-500 space-y-0.5 font-mono text-[11px]">
                  {confirmModal.itemDetails.categoryName && (
                    <div>Category: {confirmModal.itemDetails.categoryName}</div>
                  )}
                  {confirmModal.itemDetails.costPrice !== undefined && (
                    <div>Cost Price: {formatCurrency(confirmModal.itemDetails.costPrice)}</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95"
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
