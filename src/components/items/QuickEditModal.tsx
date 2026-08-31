'use client';

import { useState, useEffect } from 'react';
import { X, Check, TrendingUp, Pencil, Tag, FolderTree, Building2, Layers } from 'lucide-react';
import { formatCurrency, calculateProfit, calculateMarkupPercent } from '@/lib/utils';
import { notify } from '@/components/ui/Toast';

interface QuickEditModalProps {
  item: {
    id: string;
    name: string;
    srNo?: string | null;
    brand?: string | null;
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
  const [srNo, setSrNo] = useState(item.srNo || '');
  const [brand, setBrand] = useState(item.brand || '');
  const [modelNumber, setModelNumber] = useState('');
  const [unit, setUnit] = useState(item.unit || 'pcs');
  const [notes, setNotes] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');

  // Categories & Brands list
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  // Fetch full item details & categories list on mount
  useEffect(() => {
    async function loadMetadata() {
      setFetchingDetails(true);
      try {
        const [itemRes, catsRes, brandsRes] = await Promise.all([
          fetch(`/api/items/${item.id}`, { cache: 'no-store' }),
          fetch('/api/categories', { cache: 'no-store' }),
          fetch('/api/brands', { cache: 'no-store' }),
        ]);

        const itemData = await itemRes.json();
        const catsData = await catsRes.json();
        const brandsData = await brandsRes.json();

        if (catsData.success) {
          setCategories(catsData.categories);
        }

        if (brandsData.success) {
          setBrands(brandsData.brands);
        }

        if (itemData.success) {
          const detail = itemData.item;
          setName(detail.name || '');
          setSrNo(detail.srNo || '');
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
            srNo: srNo.trim() || null,
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
        notify(`Updated "${name}"`, 'success');
        onSave();
        onClose();
      } else {
        setError(data.message || 'Failed to update item details');
      }
    } catch {
      setError('Network error updating item.');
    } finally {
      setSaving(false);
    }
  };

  const parentCategories = categories.filter((c) => !c.parentId);
  const subCategories = categories.filter((c) => c.parentId === parentCategoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="glass-card w-full max-w-lg rounded-2xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/60">
                Quick Edit
              </span>
              {brand && (
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {brand}
                </span>
              )}
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1 line-clamp-1">
              {name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Toggle Full Details Editor */}
          <div className="flex items-center justify-between py-2 border-y border-slate-100 dark:border-slate-800/80">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-500" />
              <span>Full Item Specifications</span>
            </span>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                showDetails
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
              }`}
            >
              <Pencil className="w-3 h-3" />
              <span>{showDetails ? 'Hide Specs' : 'Edit Specs'}</span>
            </button>
          </div>

          {/* Full Specifications Section */}
          {showDetails && (
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-3 animate-fade-in text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Item Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Sr. No.</label>
                  <input
                    type="text"
                    value={srNo}
                    onChange={(e) => setSrNo(e.target.value)}
                    placeholder="1 or 1.1"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Company / Brand</label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold"
                  >
                    <option value="">(No Brand / General)</option>
                    {brands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={parentCategoryId}
                    onChange={(e) => handleParentChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    {parentCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Subcategory</label>
                  <select
                    value={subCategoryId}
                    onChange={(e) => setSubCategoryId(e.target.value)}
                    disabled={subCategories.length === 0}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-50"
                  >
                    <option value="">(None / Direct to Main)</option>
                    {subCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Cost */}
            <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-1.5">
              <label className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block">Cost (₹)</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 font-mono font-bold text-xs"
              />
            </div>

            {/* Retailer */}
            <div className="p-3 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-cyan-800 dark:text-cyan-300">Retailer (₹)</label>
                {numCost > 0 && numRetailer > 0 && (
                  <span className="text-[9px] font-mono font-bold text-cyan-700 dark:text-cyan-300">
                    +{retailerMarkup.toFixed(0)}%
                  </span>
                )}
              </div>
              <input
                type="number"
                step="any"
                min="0"
                value={retailer}
                onChange={(e) => setRetailer(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-900/60 font-mono font-bold text-xs"
              />
            </div>

            {/* Customer */}
            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">Customer (₹)</label>
                {numCost > 0 && numCustomer > 0 && (
                  <span className="text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    +{customerMarkup.toFixed(0)}%
                  </span>
                )}
              </div>
              <input
                type="number"
                step="any"
                min="0"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 font-mono font-bold text-xs"
              />
            </div>
          </div>

          {/* Change Note */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Change Note (Optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Rate revision from supplier"
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              {saving ? 'Saving...' : 'Save Prices'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
