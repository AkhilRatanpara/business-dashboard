'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle, Plus, Check, X, FolderTree, Tag } from 'lucide-react';
import { notify } from '@/components/ui/Toast';

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
}

export default function NewItemPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCats, setFetchingCats] = useState(true);

  // Parent & Subcategory selections
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('');

  // Inline Category Creation State
  const [showAddParentModal, setShowAddParentModal] = useState(false);
  const [newParentName, setNewParentName] = useState('');
  const [addingParent, setAddingParent] = useState(false);

  // Inline Subcategory Creation State
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [addingSub, setAddingSub] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    itemCode: '',
    brand: '',
    modelNumber: '',
    costPrice: '',
    retailerPrice: '',
    customerPrice: '',
    unit: 'pcs',
    notes: '',
    catalogSrNo: '',
    variantSrNo: '',
    catalogGroup: '',
    sourcePage: '',
  });

  const fetchCategories = async (selectParentId?: string, selectSubId?: string) => {
    setFetchingCats(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);

        // Compute parents
        const parents = data.categories.filter((c: Category) => !c.parentId);
        
        if (selectParentId) {
          setSelectedParentId(selectParentId);
          if (selectSubId) {
            setSelectedSubId(selectSubId);
          } else {
            // Find first sub of selectParentId if any
            const subs = data.categories.filter((c: Category) => c.parentId === selectParentId);
            setSelectedSubId(subs.length > 0 ? subs[0].id : '');
          }
        } else {
          // Default selection
          if (parents.length > 0 && !selectedParentId) {
            const firstParent = parents[0].id;
            setSelectedParentId(firstParent);
            const subs = data.categories.filter((c: Category) => c.parentId === firstParent);
            setSelectedSubId(subs.length > 0 ? subs[0].id : '');
          }
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setFetchingCats(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // When parent selection changes, auto update subcategory selection
  const handleParentChange = (parentId: string) => {
    setSelectedParentId(parentId);
    const subs = categories.filter((c) => c.parentId === parentId);
    setSelectedSubId(subs.length > 0 ? subs[0].id : '');
  };

  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParentName.trim()) return;

    setAddingParent(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newParentName.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        notify(`Created main category "${newParentName.trim()}"`, 'success');
        setNewParentName('');
        setShowAddParentModal(false);
        await fetchCategories(data.category.id);
      } else {
        alert(data.message || 'Failed to add parent category');
      }
    } catch (err) {
      alert('Error creating parent category');
    } finally {
      setAddingParent(false);
    }
  };

  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !selectedParentId) return;

    setAddingSub(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubName.trim(), parentId: selectedParentId }),
      });
      const data = await res.json();

      if (data.success) {
        notify(`Created subcategory "${newSubName.trim()}"`, 'success');
        setNewSubName('');
        setShowAddSubModal(false);
        await fetchCategories(selectedParentId, data.category.id);
      } else {
        alert(data.message || 'Failed to add subcategory');
      }
    } catch (err) {
      alert('Error creating subcategory');
    } finally {
      setAddingSub(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategoryId = selectedSubId || selectedParentId;

    if (!formData.name || !finalCategoryId || !formData.costPrice) {
      alert('Please fill in required fields (Name, Category/Subcategory, Cost Price)');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          itemCode: formData.itemCode.trim() || undefined,
          categoryId: finalCategoryId,
          brand: formData.brand.trim() || undefined,
          modelNumber: formData.modelNumber.trim() || undefined,
          costPrice: parseFloat(formData.costPrice),
          retailerPrice: parseFloat(formData.retailerPrice || formData.costPrice),
          customerPrice: parseFloat(formData.customerPrice || formData.costPrice),
          unit: formData.unit.trim() || 'pcs',
          notes: formData.notes.trim() || undefined,
          catalogSrNo: formData.catalogSrNo ? parseInt(formData.catalogSrNo) : undefined,
          variantSrNo: formData.variantSrNo ? parseInt(formData.variantSrNo) : undefined,
          catalogGroup: formData.catalogGroup.trim() || undefined,
          sourcePage: formData.sourcePage ? parseInt(formData.sourcePage) : undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        notify(`Added "${formData.name.trim()}" successfully`, 'success');
        router.push('/items');
      } else {
        alert(data.message || 'Failed to create item');
      }
    } catch (err) {
      alert('Error saving item');
    } finally {
      setLoading(false);
    }
  };

  // Auto calculate suggested prices based on cost
  const handleCostChange = (val: string) => {
    setFormData((prev) => {
      const num = parseFloat(val) || 0;
      return {
        ...prev,
        costPrice: val,
        retailerPrice: prev.retailerPrice ? prev.retailerPrice : num ? Math.round(num * 1.15).toString() : '',
        customerPrice: prev.customerPrice ? prev.customerPrice : num ? Math.round(num * 1.30).toString() : '',
      };
    });
  };

  const parentCategories = categories.filter((c) => !c.parentId);
  const subCategories = categories.filter((c) => c.parentId === selectedParentId);

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="flex items-center gap-3">
        <Link
          href="/items"
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-all shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Add New Item
          </h1>
          <p className="text-xs text-slate-500 font-medium">Add a submersible pump repair part with category hierarchy</p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Item Name */}
        <div>
          <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
            Item Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Rotor 1.5 HP V-3 Submersible"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category & Subcategory selection grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Parent Category Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Main Category <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddParentModal(true)}
                className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20"
              >
                <Plus className="w-3 h-3" /> Add Main
              </button>
            </div>

            <select
              value={selectedParentId}
              onChange={(e) => handleParentChange(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
            >
              {fetchingCats ? (
                <option value="">Loading categories...</option>
              ) : parentCategories.length === 0 ? (
                <option value="">No categories found. Add one!</option>
              ) : (
                parentCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Subcategory Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Subcategory
              </label>
              <button
                type="button"
                onClick={() => setShowAddSubModal(true)}
                disabled={!selectedParentId}
                className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 disabled:opacity-55"
              >
                <Plus className="w-3 h-3" /> Add Sub
              </button>
            </div>

            <select
              value={selectedSubId}
              onChange={(e) => setSelectedSubId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
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
        </div>

        {/* Code & Brand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Item Code / Part No.</label>
            <input
              type="text"
              placeholder="e.g. MS-25K"
              value={formData.itemCode}
              onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Brand / Make</label>
            <input
              type="text"
              placeholder="e.g. SKF / Kirloskar"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Catalog Ordering & Group Fields */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="col-span-2 sm:col-span-4 mb-1">
            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">PDF Catalog Info (Optional)</span>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Catalog Sr No</label>
            <input
              type="number"
              placeholder="e.g. 12"
              value={formData.catalogSrNo}
              onChange={(e) => setFormData({ ...formData, catalogSrNo: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Variant Sr No</label>
            <input
              type="number"
              placeholder="e.g. 1"
              value={formData.variantSrNo}
              onChange={(e) => setFormData({ ...formData, variantSrNo: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Catalog Group</label>
            <input
              type="text"
              placeholder="e.g. V-4 SUCTION"
              value={formData.catalogGroup}
              onChange={(e) => setFormData({ ...formData, catalogGroup: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Source Page</label>
            <input
              type="number"
              placeholder="e.g. 2"
              value={formData.sourcePage}
              onChange={(e) => setFormData({ ...formData, sourcePage: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
            />
          </div>
        </div>

        {/* Prices Grid */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider block">Pricing & Profit Markup</span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Cost Price */}
            <div>
              <label className="block text-[11px] font-black text-rose-700 dark:text-rose-400 mb-1">
                Cost Price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.costPrice}
                onChange={(e) => handleCostChange(e.target.value)}
                required
                className="w-full bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/40 rounded-xl px-3 py-2 text-sm text-rose-700 dark:text-rose-400 font-mono font-black focus:outline-none"
              />
            </div>

            {/* Retailer Price */}
            <div>
              <label className="block text-[11px] font-bold text-cyan-700 dark:text-cyan-400 mb-1">Retailer Price (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.retailerPrice}
                onChange={(e) => setFormData({ ...formData, retailerPrice: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-cyan-700 dark:text-cyan-400 font-mono font-bold focus:outline-none"
              />
            </div>

            {/* Customer Price */}
            <div>
              <label className="block text-[11px] font-black text-emerald-700 dark:text-emerald-400 mb-1">Customer Price (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.customerPrice}
                onChange={(e) => setFormData({ ...formData, customerPrice: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400 font-mono font-black focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Unit & Model */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Unit</label>
            <input
              type="text"
              placeholder="pcs / set / kg / meter"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Model Number / Specs</label>
            <input
              type="text"
              placeholder="e.g. V4 / V6 Submersible"
              value={formData.modelNumber}
              onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
          <textarea
            rows={2}
            placeholder="Special shop notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/items"
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{loading ? 'Saving to Database...' : 'Save Item'}</span>
          </button>
        </div>
      </form>

      {/* Inline Add Parent Category Modal */}
      {showAddParentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <FolderTree className="w-4.5 h-4.5 text-emerald-600" />
                <span>Create Main Category</span>
              </h3>
              <button onClick={() => setShowAddParentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateParent} className="space-y-3.5">
              <input
                type="text"
                placeholder="Category Name (e.g. V-3 C.I. Submersible parts)"
                value={newParentName}
                onChange={(e) => setNewParentName(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
              />

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddParentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingParent || !newParentName.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>{addingParent ? 'Creating...' : 'Create & Select'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Add Subcategory Modal */}
      {showAddSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Tag className="w-4.5 h-4.5 text-emerald-600" />
                <span>Create Subcategory</span>
              </h3>
              <button onClick={() => setShowAddSubModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSub} className="space-y-3.5">
              <div className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-400 font-semibold">Under Parent:</span>{' '}
                <strong className="text-slate-800 dark:text-slate-100 font-bold">
                  {parentCategories.find((c) => c.id === selectedParentId)?.name}
                </strong>
              </div>
              <input
                type="text"
                placeholder="Subcategory Name (e.g. Sr. No. 1 - Rotor)"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
              />

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingSub || !newSubName.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>{addingSub ? 'Creating...' : 'Create & Select'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
