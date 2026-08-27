'use client';

import { useState } from 'react';
import { X, Check, TrendingUp } from 'lucide-react';
import { formatCurrency, calculateProfit, calculateMarkupPercent } from '@/lib/utils';
import { notify } from '@/components/ui/Toast';

interface QuickEditModalProps {
  item: {
    id: string;
    name: string;
    costPrice: number;
    retailerPrice: number;
    customerPrice: number;
    unit?: string | null;
  };
  onClose: () => void;
  onSave: () => void;
}

export function QuickEditModal({ item, onClose, onSave }: QuickEditModalProps) {
  const [cost, setCost] = useState<string>(item.costPrice.toString());
  const [retailer, setRetailer] = useState<string>(item.retailerPrice.toString());
  const [customer, setCustomer] = useState<string>(item.customerPrice.toString());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const numCost = Number(cost) || 0;
  const numRetailer = Number(retailer) || 0;
  const numCustomer = Number(customer) || 0;

  const retailerProfit = calculateProfit(numRetailer, numCost);
  const customerProfit = calculateProfit(numCustomer, numCost);
  const retailerMarkup = calculateMarkupPercent(numRetailer, numCost);
  const customerMarkup = calculateMarkupPercent(numCustomer, numCost);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numCost < 0 || numRetailer < 0 || numCustomer < 0) {
      setError('Prices cannot be negative.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          costPrice: numCost,
          retailerPrice: numRetailer,
          customerPrice: numCustomer,
          changeNote: note || 'Quick price update',
        }),
      });

      const data = await res.json();
      if (data.success) {
        notify(`Updated prices for "${item.name}"`, 'success');
        onSave();
        onClose();
      } else {
        setError(data.message || 'Failed to update prices');
      }
    } catch (err) {
      setError('Network error updating prices.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div>
            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Quick Price Edit
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{item.name}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-3 rounded-xl border border-rose-200 dark:border-rose-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Price Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Cost Price */}
            <div className="bg-rose-50/60 dark:bg-slate-950/60 p-3 rounded-2xl border border-rose-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-rose-700 dark:text-rose-400 mb-1">Cost Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-black text-base focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            {/* Retailer Price */}
            <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-cyan-700 dark:text-cyan-400 mb-1">Retailer Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={retailer}
                onChange={(e) => setRetailer(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-black text-base focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            {/* Customer Price */}
            <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">Customer Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-black text-base focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Live Calculated Profits Preview */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-semibold">Retailer Profit:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-cyan-700 dark:text-cyan-400">{formatCurrency(retailerProfit)}</span>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 px-1.5 py-0.5 rounded font-mono font-bold">
                  {retailerMarkup}% markup
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-semibold">Customer Profit:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(customerProfit)}</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
                  {customerMarkup}% markup
                </span>
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Reason for Price Change (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Price increased by supplier"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 text-sm font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {saving ? 'Updating Neon DB...' : 'Save Prices'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
