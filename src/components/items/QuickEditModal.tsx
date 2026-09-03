'use client';

import { useState, useEffect } from 'react';
import { X, Check, TrendingUp, Pencil, Tag, FolderTree, Building2, Layers, Trash2, Folder } from 'lucide-react';
import { ModernDropdown } from '@/components/ui/ModernDropdown';
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        notify(`Deleted "${name}"`, 'info');
        onSave();
        onClose();
      } else {
        setError(data.message || 'Failed to delete item');
      }
    } catch {
      setError('Network error deleting item');
    } finally {
      setDeleting(false);
    }
  };

  const parentCategories = categories.filter((c) => !c.parentId);
  const subCategories = categories.filter((c) => c.parentId === parentCategoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div className="glass-card w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Mobile Drag Indicator Bar */}
        <div className="sm:hidden w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto -mt-1 mb-2" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/60">
                Quick Price Edit
              </span>
              {brand && (
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {brand}
                </span>
              )}
              {srNo && (
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                  Sr. {srNo}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1 truncate">
              {name}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Redirect to full item edit page */}
            <a
              href={`/items/${item.id}/edit`}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1 transition-all"
              title="Open full item editing page"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Full Edit</span>
            </a>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Big, Clear 3 Price Cards Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* COST CARD */}
            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-900/50 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  Cost Price
                </label>
                <span className="text-[10px] text-rose-500/80 dark:text-rose-400/70 font-semibold">Purchase</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 font-mono font-black text-base text-rose-700 dark:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 text-center sm:text-left">Base cost per {unit}</p>
            </div>

            {/* RETAILER CARD */}
            <div className="p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/25 border border-cyan-200 dark:border-cyan-900/50 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
                  Retailer
                </label>
                {numCost > 0 && numRetailer > 0 && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300">
                    +{retailerMarkup.toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={retailer}
                  onChange={(e) => setRetailer(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-900/60 font-mono font-black text-base text-cyan-700 dark:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
              <div className="text-[11px] font-bold text-cyan-700 dark:text-cyan-400 font-mono mt-1.5 flex items-center justify-between">
                <span>Profit:</span>
                <span>+{formatCurrency(retailerProfit)}</span>
              </div>
            </div>

            {/* CUSTOMER CARD */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900/50 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Customer
                </label>
                {numCost > 0 && numCustomer > 0 && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                    +{customerMarkup.toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 font-mono font-black text-base text-emerald-700 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-1.5 flex items-center justify-between">
                <span>Profit:</span>
                <span>+{formatCurrency(customerProfit)}</span>
              </div>
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
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-semibold"
            />
          </div>

          {/* Footer Actions with Safe Deletion */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-bold transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 animate-fade-in">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/30 transition-all active:scale-95"
                  >
                    {deleting ? 'Deleting...' : 'Confirm?'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/items/${item.id}/edit`}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit All Details</span>
              </a>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Prices'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
