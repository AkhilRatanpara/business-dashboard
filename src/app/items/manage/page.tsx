'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, CheckSquare, Square, FolderX, AlertTriangle, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { notify } from '@/components/ui/Toast';

interface Item {
  id: string;
  name: string;
  itemCode?: string;
  brand?: string;
  costPrice: number;
  retailerPrice: number;
  customerPrice: number;
  category: { id: string; name: string };
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  _count?: { items: number };
}

export default function ManageItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const [catToDelete, setCatToDelete] = useState('');
  const [deletingCat, setDeletingCat] = useState(false);
  const [showCatDeleteConfirm, setShowCatDeleteConfirm] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        fetch('/api/items?sort=name_asc'),
        fetch('/api/categories'),
      ]);
      const itemsData = await itemsRes.json();
      const catsData = await catsRes.json();
      if (itemsData.success) setItems(itemsData.items);
      if (catsData.success) setCategories(catsData.categories);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected items permanently?`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/items/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (data.success) {
        notify(`Deleted ${data.count} items`, 'info');
        setSelectedIds(new Set());
        loadData();
      } else {
        notify(data.message || 'Failed to delete', 'error');
      }
    } catch {
      notify('Error deleting items', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCategoryBulkDelete = async () => {
    if (!catToDelete) return;
    const catObj = categories.find((c) => c.id === catToDelete);
    const catName = catObj?.name || 'selected category';
    setDeletingCat(true);
    try {
      const res = await fetch('/api/items/delete-by-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: catToDelete }),
      });
      const data = await res.json();
      if (data.success) {
        notify(`Deleted ${data.count} items from "${catName}"`, 'info');
        setCatToDelete('');
        setShowCatDeleteConfirm(false);
        loadData();
      } else {
        notify(data.message || 'Failed', 'error');
      }
    } catch {
      notify('Error deleting category items', 'error');
    } finally {
      setDeletingCat(false);
    }
  };

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const catObj = categories.find((c) => c.id === catToDelete);

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/items"
          className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Manage & Bulk Delete</h1>
          <p className="text-xs text-slate-400 font-medium">Select items or delete by category</p>
        </div>
      </div>

      {/* ── CATEGORY BULK DELETE CARD ── */}
      <div className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden">
        <div className="bg-rose-50 px-5 py-3 border-b border-rose-200 flex items-center gap-2">
          <FolderX className="w-4 h-4 text-rose-600 shrink-0" />
          <h2 className="text-sm font-black text-rose-800 tracking-tight">Delete Entire Category</h2>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-500 font-medium">
            Select a category below and delete all its items in one tap. This action cannot be undone.
          </p>

          {/* Category grid buttons — easy on mobile */}
          {categories.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No categories found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const isSelected = catToDelete === cat.id;
                const count = cat._count?.items ?? 0;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCatToDelete(isSelected ? '' : cat.id)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-rose-300 hover:bg-rose-50'
                    }`}
                  >
                    <div className="font-bold text-xs truncate">{cat.name}</div>
                    <div className={`text-[10px] mt-0.5 font-mono ${isSelected ? 'text-rose-200' : 'text-slate-400'}`}>
                      {count} item{count !== 1 ? 's' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {catToDelete && (
            <button
              type="button"
              onClick={() => setShowCatDeleteConfirm(true)}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete all items in &quot;{catObj?.name}&quot;
            </button>
          )}
        </div>
      </div>

      {/* ── ITEMS TABLE ── */}
      <div className="space-y-3">
        {/* Table Header Controls */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-700">
            <span className="text-slate-400">Total: </span>
            <span className="font-mono text-emerald-700">{items.length}</span> items
          </span>
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-sm hover:border-slate-300 transition-all"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Floating delete bar */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
            <div className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center font-black text-xs text-white">
              {selectedIds.size}
            </div>
            <span className="text-xs font-bold">Items Selected</span>
            <button
              onClick={handleBatchDelete}
              disabled={isDeleting}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs animate-pulse">Loading items…</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wide">
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="rounded accent-emerald-600 w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-rose-500">Cost</th>
                    <th className="py-3 px-4 text-cyan-500">Retailer</th>
                    <th className="py-3 px-4 text-emerald-500">Customer</th>
                    <th className="py-3 px-4 text-center">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => toggleSelectItem(item.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 hover:bg-emerald-50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectItem(item.id)}
                            className="rounded accent-emerald-600 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                          {item.itemCode && (
                            <div className="text-[10px] text-slate-400 font-mono">{item.itemCode}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-semibold">{item.category.name}</td>
                        <td className="py-3 px-4 font-mono font-black text-rose-600">
                          {formatCurrency(item.costPrice)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-cyan-600">
                          {formatCurrency(item.retailerPrice)}
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-emerald-600">
                          {formatCurrency(item.customerPrice)}
                        </td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={async () => {
                              if (!confirm(`Delete "${item.name}"?`)) return;
                              const res = await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
                              const data = await res.json();
                              if (data.success) {
                                notify(`Deleted "${item.name}"`, 'info');
                                loadData();
                              }
                            }}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-all mx-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Category Delete Confirmation Modal */}
      {showCatDeleteConfirm && catObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-rose-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center">Delete Category Items?</h3>
            <p className="text-sm text-slate-500 text-center mt-2 leading-relaxed">
              This will permanently delete{' '}
              <strong className="text-slate-800">{catObj._count?.items ?? 0} items</strong> in{' '}
              <strong className="text-rose-600">&quot;{catObj.name}&quot;</strong>. This cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => setShowCatDeleteConfirm(false)}
                className="py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCategoryBulkDelete}
                disabled={deletingCat}
                className="py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-md transition-all disabled:opacity-60"
              >
                {deletingCat ? 'Deleting…' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
