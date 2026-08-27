'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit3, Trash2, History, Package, Tag, Clock, Calendar, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { notify } from '@/components/ui/Toast';

interface ItemDetails {
  id: string;
  name: string;
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
  category: { id: string; name: string };
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

  const [item, setItem] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadItem() {
      try {
        const res = await fetch(`/api/items/${id}`);
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
    if (!item || !confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        notify(`Deleted "${item.name}" from database`, 'info');
        router.push('/items');
      } else {
        notify(data.message || 'Failed to delete item', 'error');
      }
    } catch (err) {
      notify('Error deleting item', 'error');
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-500 text-sm animate-pulse">Loading item details from Neon DB...</div>;
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
  
  // Start with the initial creation point (or oldest known state)
  const chartData = [{
    date: new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    Cost: histories.length > 0 ? histories[0].oldCostPrice : item.costPrice,
    Retailer: histories.length > 0 ? histories[0].oldRetailerPrice : item.retailerPrice,
    Customer: histories.length > 0 ? histories[0].oldCustomerPrice : item.customerPrice,
  }];

  // Add all history changes
  histories.forEach((h) => {
    const formattedDate = new Date(h.changedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const last = chartData[chartData.length - 1];
    
    // Skip duplicate point if date and prices are exactly the same (e.g. initial log created at same time)
    if (
      formattedDate === last.date &&
      h.newCostPrice === last.Cost &&
      h.newRetailerPrice === last.Retailer &&
      h.newCustomerPrice === last.Customer
    ) {
      return;
    }

    chartData.push({
      date: formattedDate,
      Cost: h.newCostPrice,
      Retailer: h.newRetailerPrice,
      Customer: h.newCustomerPrice,
    });
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/items"
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                {item.category.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">{item.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/items/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Item</span>
          </Link>
          <button
            onClick={handleDelete}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950 border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 transition-all shadow-xs"
            title="Delete Item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timestamps Bar */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 font-medium">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Created: <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatDate(item.createdAt)}</strong></span>
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
        <div className="glass-card rounded-2xl p-5 border border-rose-200 dark:border-slate-800 relative overflow-hidden bg-rose-50/40 dark:bg-rose-950/20">
          <div className="text-xs font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Cost Price</div>
          <div className="text-3xl font-black text-rose-700 dark:text-rose-400 mt-2 font-mono">{formatCurrency(item.costPrice)}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">My purchase cost per {item.unit || 'pcs'}</div>
        </div>

        {/* Retailer Price */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">Retailer Price</span>
            <span className="text-[10px] bg-cyan-100 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded font-mono font-bold">
              +{item.retailerMarkup}% Markup
            </span>
          </div>
          <div className="text-3xl font-black text-cyan-700 dark:text-cyan-400 mt-2 font-mono">{formatCurrency(item.retailerPrice)}</div>
          <div className="text-xs text-cyan-800 dark:text-cyan-300 font-extrabold mt-1">
            Retailer Profit: +{formatCurrency(item.retailerProfit)}
          </div>
        </div>

        {/* Customer Price */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Customer Price</span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
              +{item.customerMarkup}% Markup
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-2 font-mono">{formatCurrency(item.customerPrice)}</div>
          <div className="text-xs text-emerald-800 dark:text-emerald-300 font-extrabold mt-1">
            Customer Profit: +{formatCurrency(item.customerProfit)}
          </div>
        </div>
      </div>

      {/* Item Metadata */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">
          Item Specifications
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Item Code</span>
            <span className="font-mono text-slate-900 dark:text-slate-100 font-extrabold">{item.itemCode || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Brand</span>
            <span className="text-slate-900 dark:text-slate-100 font-bold">{item.brand || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Model Number</span>
            <span className="text-slate-900 dark:text-slate-100 font-bold">{item.modelNumber || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Unit</span>
            <span className="text-slate-900 dark:text-slate-100 font-bold">{item.unit || 'pcs'}</span>
          </div>
        </div>

        {item.notes && (
          <div className="pt-2 text-xs">
            <span className="text-slate-500 block mb-1">Notes</span>
            <p className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">{item.notes}</p>
          </div>
        )}
      </div>

      {/* CRAFT.LAB INSPIRED SMOOTH PURPLE & EMERALD PRICE GRAPH */}
      {chartData.length > 1 && (
        <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Price Trend Movement Graph</span>
            </h3>
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-500/20">
              {chartData.length} Revisions Logged
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="Cost" stroke="#e11d48" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Retailer" stroke="#0891b2" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Customer" stroke="#9333ea" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Price Revision History Audit Log */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Price Revision History Log</span>
        </h3>

        <div className="space-y-3">
          {item.priceHistories.map((log) => (
            <div key={log.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-mono font-bold">{formatDateTime(log.changedAt)}</span>
                {log.changeNote && (
                  <span className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {log.changeNote}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Cost:</span>
                  <span className="text-slate-500">{formatCurrency(log.oldCostPrice)}</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-black text-rose-600 dark:text-rose-400">{formatCurrency(log.newCostPrice)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Retailer:</span>
                  <span className="text-slate-500">{formatCurrency(log.oldRetailerPrice)}</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-black text-cyan-600 dark:text-cyan-400">{formatCurrency(log.newRetailerPrice)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Customer:</span>
                  <span className="text-slate-500">{formatCurrency(log.oldCustomerPrice)}</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(log.newCustomerPrice)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
