'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, Trash2, Plus, Edit3, Clock, HelpCircle, RefreshCw, Terminal, Layers } from 'lucide-react';
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
    if (!confirm(`Are you sure you want to restore "${label}"?`)) return;
    setRestoringId(logId);
    try {
      const res = await fetch(`/api/audit-logs/${logId}/restore`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message || 'Restored successfully', 'success');
        fetchLogs();
      } else {
        notify(data.message || 'Restoration failed', 'error');
      }
    } catch (err) {
      notify('Error communicating with server', 'error');
    } finally {
      setRestoringId(null);
    }
  };

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

  const renderChangesDescription = (log: AuditLog) => {
    const { actionType, entityType, oldData, newData } = log;

    if (actionType === 'DELETE') {
      if (entityType === 'BATCH_ITEMS') {
        const items = oldData?.items || [];
        return (
          <div className="text-xs space-y-1.5 mt-2 bg-slate-950 dark:bg-black/45 p-3.5 rounded-xl font-mono text-slate-300 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1.5">
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
          <div className="text-xs space-y-1.5 mt-2 bg-slate-950 dark:bg-black/45 p-3.5 rounded-xl font-mono text-slate-300 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1.5">
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
        <div className="text-xs space-y-1.5 mt-2 bg-slate-955 dark:bg-black/45 p-3.5 rounded-xl font-mono text-slate-300 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1.5">
            <Terminal className="w-3.5 h-3.5" />
            <span>System Event: Category Deleted</span>
          </div>
          <div className="space-y-0.5 text-[11px] font-semibold text-slate-400">
            <p><span className="text-slate-600">Category:</span> {oldData?.name}</p>
            {itemLen > 0 && (
              <p className="text-[10px] text-amber-500 dark:text-amber-400 font-bold mt-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg inline-block">
                ⚠ Cascade Warning: Restoring this category will also restore its {itemLen} items.
              </p>
            )}
          </div>
        </div>
      );
    }

    if (actionType === 'CREATE') {
      return (
        <div className="text-xs mt-2 bg-slate-950 dark:bg-black/45 p-3.5 rounded-xl font-mono text-slate-300 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1.5">
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
            changes.push(`[Name]  &quot;${oldData.name}&quot; -> &quot;${newData.name}&quot;`);
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
            changes.push(`[Brand]  &quot;${oldData.brand || 'None'}&quot; -> &quot;${newData.brand || 'None'}&quot;`);
          }
        }
        return (
          <div className="text-xs space-y-1 mt-2 bg-slate-950 dark:bg-black/45 p-3.5 rounded-xl font-mono text-slate-300 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>System Event: State Delta Change</span>
            </div>
            {changes.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">No primary fields updated</p>
            ) : (
              <div className="space-y-0.5 text-[11px] font-semibold text-emerald-400">
                {changes.map((c, i) => (
                  <p key={i} dangerouslySetInnerHTML={{ __html: `• ${c}` }} />
                ))}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div className="text-xs mt-2 bg-slate-955 dark:bg-black/45 p-3.5 rounded-xl font-mono text-slate-300 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>System Event: Category Updated</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400">
              Renamed Category: &quot;{oldData?.name}&quot; &rarr; &quot;{newData?.name}&quot;
            </p>
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all shadow-xs animate-in fade-in"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Layers className="w-7 h-7 text-emerald-600" />
              <span>Activity History Log</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Recover deleted items or rollback changes from the last 7 days
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-all"
          title="Refresh History"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Info Warning Banner */}
      <div className="bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
        <Clock className="w-5 h-5 mt-0.5 shrink-0" />
        <div className="text-xs">
          <h4 className="font-extrabold mb-0.5">7-Day Rolling Retention Window</h4>
          <p className="leading-relaxed">
            All logs are automatically purged after 7 days to conserve database space. Deletions and edits performed within this window can be reverted or recovered with a single tap.
          </p>
        </div>
      </div>

      {/* History Feed */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm animate-pulse">Loading recovery log entries...</div>
      ) : logs.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-800 space-y-3">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">No Recovery Logs Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You haven&apos;t made any changes in the last 7 days, or logs were recently purged. Delete or edit some items to test the backtrack feature.
          </p>
          <div className="pt-2">
            <Link
              href="/items"
              className="inline-block px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
            >
              Back to Price Book
            </Link>
          </div>
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
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col transition-all hover:border-slate-350 dark:hover:border-slate-700 shadow-sm gap-3"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {getActionBadge(log.actionType)}
                    <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      {log.entityType}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">{dateStr}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm leading-tight truncate">
                      {label}
                    </h3>

                    {canRestore && (
                      <button
                        onClick={() => handleRestore(log.id, label)}
                        disabled={restoringId !== null}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/10 transition-all disabled:opacity-50 h-9 shrink-0"
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
  );
}
