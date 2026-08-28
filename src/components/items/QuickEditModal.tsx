'use client';

import { useState, useEffect } from 'react';
import { X, Check, TrendingUp, Pencil, Tag, FolderTree } from 'lucide-react';
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

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
}

export function QuickEditModal({ item, onClose, onSave }: QuickEditModalProps) {
  // Price form states
  const [cost, setCost] = useState<string>(item.costPrice.toString());
  const [retailer, setRetailer] = useState<string>(item.retailerPrice.toString());
  const [customer, setCustomer] = useState<string>(item.customerPrice.toString());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Details editing state (toggled by pencil icon)
  const [showDetails, setShowDetails] = useState(false);
  const [name, setName] = useState(item.name);
  const [brand, setBrand] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [unit, setUnit] = useState(item.unit || 'pcs');
  const [notes, setNotes] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');

  // Categories list
  const [categories, setCategories] = useState<Category[]>([]);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  // Fetch full item details & categories list on mount
  useEffect(() => {
    async function loadMetadata() {
      setFetchingDetails(true);
      try {
        const [itemRes, catsRes] = await Promise.all([
          fetch(`/api/items/${item.id}`, { cache: 'no-store' }),
          fetch('/api/categories', { cache: 'no-store' }),
        ]);

        const itemData = await itemRes.json();
        const catsData = await catsRes.json();

        if (catsData.success) {
          setCategories(catsData.categories);
        }

        if (itemData.success) {
          const detail = itemData.item;
          setName(detail.name || '');
          setBrand(detail.brand || '');
          setModelNumber(detail.modelNumber || '');
          setUnit(detail.unit || 'pcs');
          setNotes(detail.notes || '');

          if (detail.category) {
            if (detail.category.parentId) {
              setParentCategoryId(detail.category.parentId);
              setSubCategoryId(detail.categoryId);
            } else {
              setParentCategoryId(detail.categoryId);
              setSubCategoryId('');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load item metadata in modal:', err);
      } finally {
        setFetchingDetails(false);
      }
    }
    loadMetadata();
  }, [item.id]);

  const numCost = Number(cost) || 0;
  const numRetailer = Number(retailer) || 0;
  const numCustomer = Number(customer) || 0;

  const retailerProfit = calculateProfit(numRetailer, numCost);
  const customerProfit = calculateProfit(numCustomer, numCost);
  const retailerMarkup = calculateMarkupPercent(numRetailer, numCost);
  const customerMarkup = calculateMarkupPercent(numCustomer, numCost);

  const handleParentChange = (parentId: string) => {
    setParentCategoryId(parentId);
    const subs = categories.filter((c) => c.parentId === parentId);
    setSubCategoryId(subs.length > 0 ? subs[0].id : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numCost < 0 || numRetailer < 0 || numCustomer < 0) {
      setError('Prices cannot be negative.');
      return;
    }

    setSaving(true);
    setError('');

    // Selected leaf categoryId
    const finalCategoryId = showDetails ? (subCategoryId || parentCategoryId) : undefined;

    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          costPrice: numCost,
          retailerPrice: numRetailer,
          customerPrice: numCustomer,
          changeNote: note || (showDetails ? 'Item details & prices updated' : 'Quick price update'),
          ...(showDetails ? {
            name: name.trim(),
            brand: brand.trim() || null,
            modelNumber: modelNumber.trim() || null,
            unit: unit.trim(),
            notes: notes.trim() || null,
            categoryId: finalCategoryId,
          } : {}),
        }),
      });

      const data = await res.json();
      if (data.success) {
        notify(`Updated master record for "${name}"`, 'success');
        onSave();
        onClose();
      } else {
        setError(data.message || 'Failed to update item details');
      }
    } catch (err) {
      setError('Network error updating item.');
    } finally {
      setSaving(false);
    }
  };

  const parentCategories = categories.filter((c) => !c.parentId);
  const subCategories = categories.filter((c) => c.parentId === parentCategoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-955/80 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 overflow-hidden animate-in slide-in-from-bottom duration-200 max-h-[95vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div className="min-w-0 flex-1 mr-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                {showDetails ? 'Full Edit Mode' : 'Quick Price Edit'}
              </span>
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                  showDetails ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
                title={showDetails ? 'Show prices only' : 'Edit item details like name/make'}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1 truncate">{name}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-3 rounded-xl border border-rose-200 dark:border-rose-500/20 animate-in fade-in">
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
          <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-1.5">
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

          {/* ─── DETAILED EDITING FIELD ACCORDION ─── */}
          {showDetails && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 bg-slate-50 dark:bg-slate-950 animate-in slide-in-from-top-4 duration-200">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Pencil className="w-3 h-3 text-emerald-600" /> Item Details Specifications
              </h4>

              {fetchingDetails ? (
                <p className="text-xs text-slate-400 italic">Syncing metadata from server…</p>
              ) : (
                <div className="space-y-3">
                  {/* Name field */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-350 mb-0.5">Item Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-905 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  {/* Category Dropdowns */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-350 mb-0.5">Main Category</label>
                      <select
                        value={parentCategoryId}
                        onChange={(e) => handleParentChange(e.target.value)}
                        className="w-full bg-white dark:bg-slate-905 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
                      >
                        <option value="">Select Main...</option>
                        {parentCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-350 mb-0.5">Subcategory</label>
                      <select
                        value={subCategoryId}
                        onChange={(e) => setSubCategoryId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-905 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
                      >
                        {subCategories.length === 0 ? (
                          <option value="">No subcategories</option>
                        ) : (
                          <>
                            <option value="">None (Link directly)</option>
                            {subCategories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Brand & Model */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-350 mb-0.5">Brand / Make</label>
                      <input
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full bg-white dark:bg-slate-905 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-350 mb-0.5">Model / Specs</label>
                      <input
                        type="text"
                        value={modelNumber}
                        onChange={(e) => setModelNumber(e.target.value)}
                        className="w-full bg-white dark:bg-slate-905 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Unit & Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-350 mb-0.5">Unit</label>
                      <input
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full bg-white dark:bg-slate-905 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-350 mb-0.5">Notes</label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-white dark:bg-slate-905 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reason for Change (Optional) */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Reason for Price Change (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Copper price revision"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Buttons */}
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
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-955 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {saving ? 'Updating Neon DB...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
