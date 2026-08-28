'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { formatCurrency, calculateProfit, calculateMarkupPercent } from '@/lib/utils';
import { notify } from '@/components/ui/Toast';

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
}

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [itemCode, setItemCode] = useState('');
  
  // Parent & Subcategory state
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');

  const [brand, setBrand] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [retailerPrice, setRetailerPrice] = useState('');
  const [customerPrice, setCustomerPrice] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [notes, setNotes] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [catalogSrNo, setCatalogSrNo] = useState('');
  const [variantSrNo, setVariantSrNo] = useState('');
  const [catalogGroup, setCatalogGroup] = useState('');
  const [sourcePage, setSourcePage] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, itemRes] = await Promise.all([
          fetch('/api/categories', { cache: 'no-store' }),
          fetch(`/api/items/${id}`, { cache: 'no-store' }),
        ]);

        const catData = await catRes.json();
        const itemData = await itemRes.json();

        if (catData.success) {
          setCategories(catData.categories);
        }

        if (itemData.success) {
          const item = itemData.item;
          setName(item.name || '');
          setItemCode(item.itemCode || '');
          setBrand(item.brand || '');
          setModelNumber(item.modelNumber || '');
          setCostPrice(item.costPrice.toString());
          setRetailerPrice(item.retailerPrice.toString());
          setCustomerPrice(item.customerPrice.toString());
          setUnit(item.unit || 'pcs');
          setNotes(item.notes || '');
          setCatalogSrNo(item.catalogSrNo !== null && item.catalogSrNo !== undefined ? item.catalogSrNo.toString() : '');
          setVariantSrNo(item.variantSrNo !== null && item.variantSrNo !== undefined ? item.variantSrNo.toString() : '');
          setCatalogGroup(item.catalogGroup || '');
          setSourcePage(item.sourcePage !== null && item.sourcePage !== undefined ? item.sourcePage.toString() : '');

          // Restructure category hierarchy selection
          if (item.category) {
            if (item.category.parentId) {
              setParentCategoryId(item.category.parentId);
              setSubCategoryId(item.categoryId);
            } else {
              setParentCategoryId(item.categoryId);
              setSubCategoryId('');
            }
          }
        }
      } catch (err) {
        console.error('Error loading item for edit:', err);
        setError('Error loading master records from database');
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

  const handleParentChange = (parentId: string) => {
    setParentCategoryId(parentId);
    const subs = categories.filter((c) => c.parentId === parentId);
    setSubCategoryId(subs.length > 0 ? subs[0].id : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategoryId = subCategoryId || parentCategoryId;

    if (!name.trim()) {
      setError('Item Name is required.');
      return;
    }
    if (!finalCategoryId) {
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
          categoryId: finalCategoryId,
          brand: brand.trim() || null,
          modelNumber: modelNumber.trim() || null,
          costPrice: numCost,
          retailerPrice: numRetailer,
          customerPrice: numCustomer,
          unit: unit.trim() || 'pcs',
          notes: notes.trim() || null,
          changeNote: changeNote.trim() || 'Item details updated',
          catalogSrNo: catalogSrNo ? parseInt(catalogSrNo) : null,
          variantSrNo: variantSrNo ? parseInt(variantSrNo) : null,
          catalogGroup: catalogGroup.trim() || null,
          sourcePage: sourcePage ? parseInt(sourcePage) : null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        notify(`Updated details for "${name.trim()}"`, 'success');
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

  const handleCostChange = (val: string) => {
    setCostPrice(val);
    const num = parseFloat(val) || 0;
    setRetailerPrice(Math.round(num * 1.15).toString());
    setCustomerPrice(Math.round(num * 1.30).toString());
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-500 text-sm animate-pulse">Loading item form from database...</div>;
  }

  const parentCategories = categories.filter((c) => !c.parentId);
  const subCategories = categories.filter((c) => c.parentId === parentCategoryId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center gap-3">
        <Link
          href={`/items/${id}`}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-all shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Edit Shop Item</h1>
          <p className="text-xs sm:text-sm text-slate-500">Update item details or price structure</p>
        </div>
      </div>

      {error && (
        <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-4 rounded-2xl border border-rose-200 dark:border-rose-500/20">
          {error}
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-950 dark:text-slate-55 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
            <span>Item Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Item Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {/* Parent Category Selection */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                Main Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={parentCategoryId}
                onChange={(e) => handleParentChange(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
              >
                {parentCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Selection */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                Subcategory
              </label>
              <select
                value={subCategoryId}
                onChange={(e) => setSubCategoryId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
              >
                {subCategories.length === 0 ? (
                  <option value="">No subcategories (Direct Category Item)</option>
                ) : (
                  <>
                    <option value="">None (Link directly to Main Category)</option>
                    {subCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Code */}
            <div>
              <label className="block text-xs font-bold text-slate-755 mb-1">Item Code / Part No.</label>
              <input
                type="text"
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-bold text-slate-755 mb-1">Brand / Make</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-bold text-slate-755 mb-1">Model Number / Specs</label>
              <input
                type="text"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-bold text-slate-755 mb-1">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Catalog Ordering & Group Fields */}
            <div className="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mt-2">
              <div className="col-span-2 sm:col-span-4 mb-1">
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">PDF Catalog Info (Optional)</span>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Catalog Sr No</label>
                <input
                  type="number"
                  placeholder="e.g. 12"
                  value={catalogSrNo}
                  onChange={(e) => setCatalogSrNo(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Variant Sr No</label>
                <input
                  type="number"
                  placeholder="e.g. 1"
                  value={variantSrNo}
                  onChange={(e) => setVariantSrNo(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Catalog Group</label>
                <input
                  type="text"
                  placeholder="e.g. V-4 SUCTION"
                  value={catalogGroup}
                  onChange={(e) => setCatalogGroup(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Source Page</label>
                <input
                  type="number"
                  placeholder="e.g. 2"
                  value={sourcePage}
                  onChange={(e) => setSourcePage(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3 Price Tiers Section */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-black text-slate-950 dark:text-slate-55 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
            Pricing & Markup Calculations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-55 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1.5">Cost Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => handleCostChange(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-base font-black text-rose-700 dark:text-rose-400 focus:outline-none"
                required
              />
            </div>

            <div className="bg-slate-55 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-1.5">Retailer Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={retailerPrice}
                onChange={(e) => setRetailerPrice(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-base font-bold text-cyan-700 dark:text-cyan-400 focus:outline-none"
                required
              />
            </div>

            <div className="bg-slate-55 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">Customer Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={customerPrice}
                onChange={(e) => setCustomerPrice(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-base font-black text-emerald-700 dark:text-emerald-400 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Retailer Profit:</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">{formatCurrency(retailerProfit)}</span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded font-mono font-bold">
                {retailerMarkup}% markup
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Customer Profit:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(customerProfit)}</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                {customerMarkup}% markup
              </span>
            </div>
          </div>
        </div>

        {/* Change Reason */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">Reason for Price Change (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Copper wire price revision"
            value={changeNote}
            onChange={(e) => setChangeNote(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link
            href={`/items/${id}`}
            className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <span>{saving ? 'Saving to Database...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
