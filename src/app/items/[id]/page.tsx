'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit3, Trash2, History, Package, Tag, Clock, Calendar, Copy, Building2 } from 'lucide-react';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { notify } from '@/components/ui/Toast';

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
    } catch {
      notify('Error deleting item', 'error');
    }
  };

  const handleDuplicate = () => {
    if (!item) return;
    const searchParams = new URLSearchParams({
      duplicateFrom: item.id,
      name: item.name,
      srNo: item.srNo || '',
      categoryId: item.category.id,
      brand: '', // Clear brand so user can easily choose new company
      costPrice: String(item.costPrice),
      retailerPrice: String(item.retailerPrice),
      customerPrice: String(item.customerPrice),
      unit: item.unit || 'pcs',
      notes: item.notes || '',
    });
    router.push(`/items/new?${searchParams.toString()}`);
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
  
  const chartData = [{
    date: new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    Cost: histories.length > 0 ? histories[0].oldCostPrice : item.costPrice,
    Retailer: histories.length > 0 ? histories[0].oldRetailerPrice : item.retailerPrice,
    Customer: histories.length > 0 ? histories[0].oldCustomerPrice : item.customerPrice,
  }];

  histories.forEach((h) => {
    const formattedDate = new Date(h.changedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const last = chartData[chartData.length - 1];
    
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
                <span className="text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300">
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
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Purchase cost per {item.unit || 'pcs'}</div>
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
      {histories.length > 1 && (
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
                  formatter={(value: any) => [`₹${value}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Cost" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Retailer" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Customer" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed History Table */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">
          Audit & Price Change Logs
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Cost Price</th>
                <th className="py-2.5 px-3">Retailer Price</th>
                <th className="py-2.5 px-3">Customer Price</th>
                <th className="py-2.5 px-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {item.priceHistories.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40">
                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">{formatDateTime(h.changedAt)}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-rose-600 dark:text-rose-400">{formatCurrency(h.newCostPrice)}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">{formatCurrency(h.newRetailerPrice)}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(h.newCustomerPrice)}</td>
                  <td className="py-2.5 px-3 text-slate-500">{h.changeNote || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
