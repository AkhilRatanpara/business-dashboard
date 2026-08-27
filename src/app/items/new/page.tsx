'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle, Plus, Check, X, FolderTree } from 'lucide-react';
import { notify } from '@/components/ui/Toast';

interface Category {
  id: string;
  name: string;
}

export default function NewItemPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCats, setFetchingCats] = useState(true);

  // Inline Category Creation State
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [addingCat, setAddingCat] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    itemCode: '',
    categoryId: '',
    brand: '',
    modelNumber: '',
    costPrice: '',
    retailerPrice: '',
    customerPrice: '',
    unit: 'pcs',
    notes: '',
  });

  const fetchCategories = async (selectCatId?: string) => {
    setFetchingCats(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
        if (selectCatId) {
          setFormData((prev) => ({ ...prev, categoryId: selectCatId }));
        } else if (data.categories.length > 0 && !formData.categoryId) {
          setFormData((prev) => ({ ...prev, categoryId: data.categories[0].id }));
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

  const handleCreateInlineCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setAddingCat(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        notify(`Created category "${newCatName.trim()}" in Neon DB`, 'success');
        setNewCatName('');
        setShowAddCatModal(false);
        await fetchCategories(data.category.id);
      } else {
        alert(data.message || 'Failed to add category');
      }
    } catch (err) {
      alert('Error creating category');
    } finally {
      setAddingCat(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId || !formData.costPrice) {
      alert('Please fill in required fields (Name, Category, Cost Price)');
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
          categoryId: formData.categoryId,
          brand: formData.brand.trim() || undefined,
          modelNumber: formData.modelNumber.trim() || undefined,
          costPrice: parseFloat(formData.costPrice),
          retailerPrice: parseFloat(formData.retailerPrice || formData.costPrice),
          customerPrice: parseFloat(formData.customerPrice || formData.costPrice),
          unit: formData.unit.trim() || 'pcs',
          notes: formData.notes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        notify(`Added "${formData.name.trim()}" to Neon DB`, 'success');
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

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
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
          <p className="text-xs text-slate-500 font-medium">Add submersible pump repair part to Neon DB</p>
        </div>
      </div>

      {/* Craft.Lab Pure White Form */}
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Item Name */}
        <div>
          <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
            Item Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Mechanical Seal 25mm Kirloskar"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Selection + Inline "+ New Category" Button for Mobile & Desktop */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">
              Category <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowAddCatModal(true)}
              className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </div>

          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            required
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
          >
            {fetchingCats ? (
              <option value="">Loading categories...</option>
            ) : categories.length === 0 ? (
              <option value="">No categories found. Add one!</option>
            ) : (
              categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))
            )}
          </select>
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
              placeholder="e.g. Kirloskar / Texmo"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
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
            <span>{loading ? 'Saving to Neon DB...' : 'Save Item'}</span>
          </button>
        </div>
      </form>

      {/* Inline Add Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-emerald-600" />
                <span>Create New Category</span>
              </h3>
              <button onClick={() => setShowAddCatModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInlineCategory} className="space-y-3">
              <input
                type="text"
                placeholder="Category Name (e.g. Impellers & Diffusers)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingCat || !newCatName.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md flex items-center gap-1 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{addingCat ? 'Creating...' : 'Create & Select'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
