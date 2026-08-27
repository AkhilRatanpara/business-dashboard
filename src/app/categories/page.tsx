'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FolderTree, Plus, Edit2, Trash2, Package, Check, X } from 'lucide-react';
import { notify } from '@/components/ui/Toast';

interface Category {
  id: string;
  name: string;
  _count: { items: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
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
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        notify(`Created category "${newCatName.trim()}" in Neon DB`, 'success');
        setNewCatName('');
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
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return;

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
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
    if (cat._count.items > 0) {
      alert(`Cannot delete category "${cat.name}" because it contains ${cat._count.items} items. Move or delete the items first.`);
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Categories</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Organize submersible pump parts into logical groups
        </p>
      </div>

      {error && (
        <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-3.5 rounded-xl border border-rose-200 dark:border-rose-500/20">
          {error}
        </div>
      )}

      {/* Add Category Form */}
      <form onSubmit={handleAddCategory} className="glass-card rounded-2xl p-4 flex gap-3 border border-slate-200 dark:border-slate-800">
        <input
          type="text"
          placeholder="New Category Name (e.g. Mechanical Seals & Gaskets)"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
        />
        <button
          type="submit"
          disabled={!newCatName.trim()}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </form>

      {/* Categories Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm animate-pulse">Loading categories from Neon DB...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const isEditing = editingId === cat.id;

            return (
              <div key={cat.id} className="glass-card rounded-2xl p-4 flex items-center justify-between border border-slate-200 dark:border-slate-800">
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
                    />
                    <button
                      onClick={() => handleSaveEdit(cat.id)}
                      className="p-2 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <FolderTree className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{cat.name}</h3>
                        <Link
                          href={`/items?categoryId=${cat.id}`}
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-0.5 font-semibold"
                        >
                          <Package className="w-3 h-3" />
                          <span>{cat._count.items} items listed</span>
                        </Link>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all"
                        title="Edit Name"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950 border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 transition-all"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
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
  );
}
