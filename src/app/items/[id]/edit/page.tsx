'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { formatCurrency, calculateProfit, calculateMarkupPercent } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
}

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [retailerPrice, setRetailerPrice] = useState('');
  const [customerPrice, setCustomerPrice] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [notes, setNotes] = useState('');
  const [changeNote, setChangeNote] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, itemRes] = await Promise.all([
          fetch('/api/categories'),
          fetch(`/api/items/${id}`),
        ]);

        const catData = await catRes.json();
        const itemData = await itemRes.json();

        if (catData.success) setCategories(catData.categories);

        if (itemData.success) {
          const item = itemData.item;
          setName(item.name || '');
          setItemCode(item.itemCode || '');
          setCategoryId(item.categoryId || '');
          setBrand(item.brand || '');
          setModelNumber(item.modelNumber || '');
          setCostPrice(item.costPrice.toString());
          setRetailerPrice(item.retailerPrice.toString());
          setCustomerPrice(item.customerPrice.toString());
          setUnit(item.unit || 'pcs');
          setNotes(item.notes || '');
        }
      } catch (err) {
        console.error('Error loading item for edit:', err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadData();
  }, [id]);

  const numCost = Number(costPrice) || 0;
  const numRetailer = Number(retailerPrice) || 0;
  const numCustomer = Number(customerPrice) || 0;

  const retailerProfit = calculateProfit(numRetailer, numCost);
  const customerProfit = calculateProfit(numCustomer, numCost);
  const retailerMarkup = calculateMarkupPercent(numRetailer, numCost);
  const customerMarkup = calculateMarkupPercent(numCustomer, numCost);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Item Name is required.');
      return;
    }
    if (!categoryId) {
      setError('Please select a Category.');
      return;
    }
    if (numCost < 0 || numRetailer < 0 || numCustomer < 0) {
      setError('Prices cannot be negative.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          itemCode: itemCode.trim() || null,
          categoryId,
          brand: brand.trim() || null,
          modelNumber: modelNumber.trim() || null,
          costPrice: numCost,
          retailerPrice: numRetailer,
          customerPrice: numCustomer,
          unit: unit.trim() || 'pcs',
          notes: notes.trim() || null,
          changeNote: changeNote.trim() || 'Item details updated',
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/items/${id}`);
      } else {
        setError(data.message || 'Failed to update item');
      }
    } catch (err) {
      setError('Network error updating item.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-500 text-sm animate-pulse">Loading item form from Neon DB...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/items/${id}`}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">Edit Shop Item</h1>
          <p className="text-xs sm:text-sm text-slate-400">Update item details or price structure</p>
        </div>
      </div>

      {error && (
        <div className="text-xs font-semibold text-rose-400 bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 space-y-6 border border-slate-800">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            Item Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Item Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Item Code / Part No.</label>
              <input
                type="text"
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Model Number</label>
              <input
                type="text"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Unit of Measurement</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="pcs">pcs (Pieces)</option>
                <option value="kg">kg (Kilogram)</option>
                <option value="set">set (Set)</option>
                <option value="meter">meter (Meter)</option>
                <option value="unit">unit (Unit)</option>
                <option value="box">box (Box)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3 Price Tiers Section */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            Three Primary Prices
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <label className="block text-xs font-semibold text-rose-400 mb-1.5">Cost Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-bold text-slate-100 focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <label className="block text-xs font-semibold text-cyan-400 mb-1.5">Retailer Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={retailerPrice}
                onChange={(e) => setRetailerPrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-bold text-slate-100 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <label className="block text-xs font-semibold text-emerald-400 mb-1.5">Customer Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={customerPrice}
                onChange={(e) => setCustomerPrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Retailer Profit:</span>
              <span className="font-bold text-cyan-400">{formatCurrency(retailerProfit)}</span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-mono">
                {retailerMarkup}% markup
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Customer Profit:</span>
              <span className="font-bold text-emerald-400">{formatCurrency(customerProfit)}</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono">
                {customerMarkup}% markup
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Price Change (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Copper price increased by 5%"
            value={changeNote}
            onChange={(e) => setChangeNote(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Link
            href={`/items/${id}`}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Updating Neon DB...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
