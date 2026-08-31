'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit3, Trash2, History, Building2, Calendar, Clock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatDateTime, formatDate, formatMaskedPrice, formatProfit } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { notify } from '@/components/ui/Toast';
import { useAuth } from '@/components/auth/AuthContext';

interface ItemDetails {
  id: string;
  name: string;
  srNo?: string;
  itemCode?: string;
  brand?: string;
  modelNumber?: string;
  costPrice: number;
  retailerPrice: number;
  customerPrice: number;
  retailerProfit: number;
  customerProfit: number;
  retailerMarkup: number;
  customerMarkup: number;
  unit?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    parent?: {
      id: string;
      name: string;
      parent?: { id: string; name: string } | null;
    } | null;
  };
  priceHistories: Array<{
    id: string;
    oldCostPrice: number;
    newCostPrice: number;
    oldRetailerPrice: number;
    newRetailerPrice: number;
    oldCustomerPrice: number;
    newCustomerPrice: number;
    changeNote?: string;
    changedAt: string;
  }>;
}

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { isEditor } = useAuth();

  const [item, setItem] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const savedPrivacy = localStorage.getItem('gunatit_privacy_mode');
    if (savedPrivacy === 'true') {
      setIsPrivacyMode(true);
    }
  }, []);

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => {
      const next = !prev;
      localStorage.setItem('gunatit_privacy_mode', next.toString());
      notify(next ? 'Privacy Mode ON (Cost & Profit hidden)' : 'Privacy Mode OFF (All prices shown)', 'info');
      return next;
    });
  };

  useEffect(() => {
    async function loadItem() {
      try {
        const res = await fetch(`/api/items/${id}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setItem(data.item);
        }
      } catch (err) {
        console.error('Error fetching item details:', err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadItem();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        notify(`Deleted "${item?.name}" from database`, 'info');
        router.push('/items');
      } else {
        notify(data.message || 'Failed to delete item', 'error');
      }
    } catch {
      notify('Error deleting item', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-slate-500 text-sm animate-pulse">Loading item details from database...</div>;
  }

  if (!item) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Item Not Found</h2>
        <Link href="/items" className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
          ← Back to Items Price Book
        </Link>
      </div>
    );
  }

  // Format history chart data (sorted chronological)
  const histories = [...item.priceHistories].reverse();
  
  const chartData = [];
  
  if (histories.length === 0) {
    // Initial baseline registered price
    chartData.push({
      date: new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      Cost: item.costPrice,
      Retailer: item.retailerPrice,
      Customer: item.customerPrice,
    });
    chartData.push({
      date: 'Current',
      Cost: item.costPrice,
      Retailer: item.retailerPrice,
      Customer: item.customerPrice,
    });
  } else {
    chartData.push({
      date: new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      Cost: histories[0].oldCostPrice,
      Retailer: histories[0].oldRetailerPrice,
      Customer: histories[0].oldCustomerPrice,
    });

    histories.forEach((h) => {
      const formattedDate = new Date(h.changedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      chartData.push({
        date: formattedDate,
        Cost: h.newCostPrice,
        Retailer: h.newRetailerPrice,
        Customer: h.newCustomerPrice,
      });
    });
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/items"
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all shadow-xs shrink-0 mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {item.category.parent?.parent && (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {item.category.parent.parent.name}
                </span>
              )}
              {item.category.parent && (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {item.category.parent.name}
                </span>
              )}
              <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                {item.category.name}
              </span>
              {item.srNo && (
                <span className="text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Sr. {item.srNo}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">{item.name}</h1>
            {item.brand && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>{item.brand}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Privacy Mode Eye Button */}
          <button
            type="button"
            onClick={togglePrivacyMode}
            className={`p-2.5 rounded-xl border transition-all ${
              isPrivacyMode
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md font-bold'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title={isPrivacyMode ? 'Privacy Mode ON (Cost hidden)' : 'Hide Cost for Customer View'}
          >
            {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Edit & Delete Action Buttons (Editor Only) */}
          {isEditor && (
            <>
              <Link
                href={`/items/${id}/edit`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Item</span>
              </Link>

              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950 border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 transition-all shadow-xs cursor-pointer"
                  title="Delete Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5 animate-fade-in">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/30 transition-all active:scale-95 cursor-pointer"
                  >
                    {deleting ? 'Deleting...' : 'Confirm?'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Timestamps Bar */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 font-medium">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Registered: <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatDate(item.createdAt)}</strong></span>
        </div>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <div className="flex items-center gap-1.5 font-medium">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Last Updated: <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatDateTime(item.updatedAt)}</strong></span>
        </div>
      </div>

      {/* 3 Prices & Profits Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cost Price */}
        <div className="glass-card rounded-2xl p-5 border border-rose-200 dark:border-slate-800 relative overflow-hidden bg-rose-50/40 dark:bg-rose-950/20 text-center flex flex-col justify-center">
          <div className="text-xs font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Cost Price</div>
          <div className="text-3xl font-black text-rose-700 dark:text-rose-400 mt-2 font-mono">
            {formatMaskedPrice(item.costPrice, isPrivacyMode)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Purchase cost per {item.unit || 'pcs'}</div>
        </div>

        {/* Retailer Price */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 relative overflow-hidden text-center flex flex-col justify-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-extrabold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">Retailer Price</span>
            {!isPrivacyMode && (
              <span className="text-[10px] bg-cyan-100 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded font-mono font-bold">
                +{item.retailerMarkup}%
              </span>
            )}
          </div>
          <div className="text-3xl font-black text-cyan-700 dark:text-cyan-400 mt-2 font-mono">{formatCurrency(item.retailerPrice)}</div>
          {!isPrivacyMode && (
            <div className="text-xs text-cyan-800 dark:text-cyan-300 font-extrabold mt-1">
              Retailer Profit: +{formatCurrency(item.retailerProfit)}
            </div>
          )}
        </div>

        {/* Customer Price */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 relative overflow-hidden text-center flex flex-col justify-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Customer Price</span>
            {!isPrivacyMode && (
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                +{item.customerMarkup}%
              </span>
            )}
          </div>
          <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-2 font-mono">{formatCurrency(item.customerPrice)}</div>
          {!isPrivacyMode && (
            <div className="text-xs text-emerald-800 dark:text-emerald-300 font-extrabold mt-1">
              Customer Profit: +{formatCurrency(item.customerProfit)}
            </div>
          )}
        </div>
      </div>

      {/* Item Specifications */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">
          Item Specifications
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Company / Brand</span>
            <span className="text-slate-900 dark:text-slate-100 font-bold">{item.brand || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Sr. No.</span>
            <span className="font-mono text-slate-900 dark:text-slate-100 font-extrabold">{item.srNo || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Part / Item Code</span>
            <span className="font-mono text-slate-900 dark:text-slate-100 font-extrabold">{item.itemCode || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Unit</span>
            <span className="text-slate-900 dark:text-slate-100 font-bold">{item.unit || 'pcs'}</span>
          </div>
        </div>

        {item.notes && (
          <div className="pt-2 text-xs">
            <span className="text-slate-500 block mb-1">Notes / Description</span>
            <p className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">{item.notes}</p>
          </div>
        )}
      </div>

      {/* Price Evolution Chart */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
          <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Price Trend History</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(value: any, name: any) => {
                  if (name === 'Cost' && isPrivacyMode) return ['••••', 'Cost'];
                  return [`₹${value}`, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {!isPrivacyMode && <Line type="monotone" dataKey="Cost" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />}
              <Line type="monotone" dataKey="Retailer" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Customer" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed History Table */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Audit & Price Revision Logs</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400 font-bold">
            {item.priceHistories.length + 1} Entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-center">
                <th className="py-2.5 px-3 text-left">Date & Time</th>
                <th className="py-2.5 px-3 text-center text-rose-600 dark:text-rose-400">Cost Price</th>
                <th className="py-2.5 px-3 text-center text-cyan-600 dark:text-cyan-400">Retailer Price</th>
                <th className="py-2.5 px-3 text-center text-emerald-600 dark:text-emerald-400">Customer Price</th>
                <th className="py-2.5 px-3 text-left">Event / Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {item.priceHistories.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40 text-center">
                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 text-left">{formatDateTime(h.changedAt)}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-rose-600 dark:text-rose-400 text-center">
                    {formatMaskedPrice(h.newCostPrice, isPrivacyMode)}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400 text-center">{formatCurrency(h.newRetailerPrice)}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-center">{formatCurrency(h.newCustomerPrice)}</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 text-left font-medium">{h.changeNote || 'Price Revision'}</td>
                </tr>
              ))}

              {/* Baseline Creation Log */}
              <tr className="bg-slate-50/50 dark:bg-slate-950/30 text-center font-medium">
                <td className="py-2.5 px-3 font-mono text-slate-500 text-left">{formatDateTime(item.createdAt)}</td>
                <td className="py-2.5 px-3 font-mono font-bold text-rose-600 dark:text-rose-400 text-center">
                  {formatMaskedPrice(item.costPrice, isPrivacyMode)}
                </td>
                <td className="py-2.5 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400 text-center">{formatCurrency(item.retailerPrice)}</td>
                <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-center">{formatCurrency(item.customerPrice)}</td>
                <td className="py-2.5 px-3 text-emerald-700 dark:text-emerald-400 text-left font-bold">
                  Initial Catalog Registration
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
