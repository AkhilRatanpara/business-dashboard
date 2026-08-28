'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FolderTree, Plus, Edit2, Trash2, Package, Check, X, ChevronRight, Layers } from 'lucide-react';
import { notify } from '@/components/ui/Toast';

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  _count: { items: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParentId, setNewCatParentId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingParentId, setEditingParentId] = useState<string | null>('');
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setError('');
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          parentId: newCatParentId || null,
        }),
      });
      const data = await res.json();

      if (data.success) {
        notify(`Created category "${newCatName.trim()}" in Neon DB`, 'success');
        setNewCatName('');
        setNewCatParentId('');
        fetchCategories();
      } else {
        setError(data.message || 'Failed to add category');
      }
    } catch (err) {
      setError('Network error adding category');
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setEditingParentId(cat.parentId || '');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return;

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingName.trim(),
          parentId: editingParentId || null,
        }),
      });
      const data = await res.json();

      if (data.success) {
        notify(`Category updated to "${editingName.trim()}"`, 'success');
        setEditingId(null);
        fetchCategories();
      } else {
        alert(data.message || 'Failed to update category');
      }
    } catch (err) {
      alert('Error updating category');
    }
  };

  const handleDelete = async (cat: Category) => {
    // Check if category has items
    if (cat._count.items > 0) {
      alert(`Cannot delete category "${cat.name}" because it contains ${cat._count.items} items. Move or delete the items first.`);
      return;
    }

    // Check if category has children subcategories
    const hasChildren = categories.some((c) => c.parentId === cat.id);
    if (hasChildren) {
      alert(`Cannot delete category "${cat.name}" because it contains subcategories. Delete or update the subcategories first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        notify(`Deleted category "${cat.name}"`, 'info');
        fetchCategories();
      } else {
        alert(data.message || 'Failed to delete category');
      }
    } catch (err) {
      alert('Error deleting category');
    }
  };

  // Filter parents and children
  const parentCategories = categories.filter((c) => !c.parentId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Category Hierarchy</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Create and manage parent categories and subcategories for the pricing list.
        </p>
      </div>

      {error && (
        <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-3.5 rounded-xl border border-rose-200 dark:border-rose-500/20">
          {error}
        </div>
      )}

      {/* Add Category Form */}
      <form onSubmit={handleAddCategory} className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Category Name (e.g. V-4 Parts)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
            required
          />
          
          <select
            value={newCatParentId}
            onChange={(e) => setNewCatParentId(e.target.value)}
            className="w-full sm:w-60 bg-slate-50 dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 font-semibold"
          >
            <option value="">None (Create as Root Category)</option>
            {parentCategories.map((p) => (
              <option key={p.id} value={p.id}>
                Parent: {p.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!newCatName.trim()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </form>

      {/* Categories Tree View */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm animate-pulse">Loading categories from Neon DB...</div>
      ) : (
        <div className="space-y-6">
          {parentCategories.map((parent) => {
            const subcats = categories.filter((c) => c.parentId === parent.id);
            const isEditingParent = editingId === parent.id;

            return (
              <div key={parent.id} className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                {/* Parent Category Row */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  {isEditingParent ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-emerald-500 rounded-xl px-3 py-1 text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveEdit(parent.id)}
                        className="p-1.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Layers className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm tracking-wide uppercase">{parent.name}</h3>
                          <Link
                            href={`/items?categoryId=${parent.id}`}
                            className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-0.5 font-bold"
                          >
                            <Package className="w-3 h-3" />
                            <span>{parent._count.items} direct items</span>
                          </Link>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(parent)}
                          className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all"
                          title="Edit Parent"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(parent)}
                          className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 transition-all"
                          title="Delete Parent"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Subcategories List */}
                <div className="p-3 sm:p-4 space-y-3 bg-white dark:bg-slate-900/40">
                  {subcats.length === 0 ? (
                    <p className="text-slate-400 dark:text-slate-500 text-[11px] font-semibold italic pl-12 py-1">No nested subcategories under this group.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {subcats.map((sub) => {
                        const isEditingSub = editingId === sub.id;

                        return (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800/60 ml-8 relative before:content-[''] before:absolute before:-left-5 before:top-1/2 before:-translate-y-1/2 before:w-5 before:h-[1px] before:bg-slate-200 dark:before:bg-slate-800"
                          >
                            {isEditingSub ? (
                              <div className="flex items-center gap-2 flex-1 mr-2">
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900 border border-emerald-500 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
                                />
                                
                                <select
                                  value={editingParentId || ''}
                                  onChange={(e) => setEditingParentId(e.target.value)}
                                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300"
                                >
                                  <option value="">Move to Root</option>
                                  {parentCategories.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      Parent: {p.name}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  onClick={() => handleSaveEdit(sub.id)}
                                  className="p-1 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-1 rounded-lg bg-slate-200 dark:bg-slate-850 text-slate-600 dark:text-slate-400"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2.5">
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-450 dark:text-slate-600 shrink-0" />
                                  <div>
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{sub.name}</h4>
                                    <Link
                                      href={`/items?categoryId=${sub.id}`}
                                      className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 mt-0.5 font-bold"
                                    >
                                      <Package className="w-2.5 h-2.5" />
                                      <span>{sub._count.items} items listed</span>
                                    </Link>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => handleStartEdit(sub)}
                                    className="p-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                    title="Edit Subcategory"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(sub)}
                                    className="p-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/80 dark:border-slate-800 text-rose-600 dark:text-rose-400"
                                    title="Delete Subcategory"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
