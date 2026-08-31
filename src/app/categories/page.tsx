'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FolderTree, Plus, Edit2, Trash2, Package, Check, X, ChevronRight,
  Layers, Folder, FolderPlus, ArrowRight, CornerDownRight, Search
} from 'lucide-react';
import { notify } from '@/components/ui/Toast';

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  parent?: Category | null;
  children?: Category[];
  _count: { items: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Add modal/inline state
  const [newCatName, setNewCatName] = useState('');
  const [newCatParentId, setNewCatParentId] = useState('');
  
  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingParentId, setEditingParentId] = useState<string | null>('');
  
  // Quick Add Child under specific parent
  const [quickAddParentId, setQuickAddParentId] = useState<string | null>(null);
  const [quickAddName, setQuickAddName] = useState('');

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

  // Compute category map and paths
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(c => map.set(c.id, c));
    return map;
  }, [categories]);

  const getCategoryPath = (catId: string): string => {
    const parts: string[] = [];
    let curr = categoryMap.get(catId);
    while (curr) {
      parts.unshift(curr.name);
      curr = curr.parentId ? categoryMap.get(curr.parentId) : undefined;
    }
    return parts.join(' > ');
  };

  // Build recursive tree
  const categoryTree = useMemo(() => {
    const roots: Category[] = [];
    const childrenMap = new Map<string, Category[]>();

    categories.forEach(cat => {
      if (!cat.parentId) {
        roots.push(cat);
      } else {
        if (!childrenMap.has(cat.parentId)) {
          childrenMap.set(cat.parentId, []);
        }
        childrenMap.get(cat.parentId)!.push(cat);
      }
    });

    const attachChildren = (node: Category): Category => {
      const kids = childrenMap.get(node.id) || [];
      return {
        ...node,
        children: kids.map(attachChildren)
      };
    };

    return roots.map(attachChildren);
  }, [categories]);

  // Calculate total recursive items
  const getTotalItemsCount = (node: Category): number => {
    let sum = node._count?.items || 0;
    if (node.children) {
      node.children.forEach(child => {
        sum += getTotalItemsCount(child);
      });
    }
    return sum;
  };

  const handleAddCategory = async (name: string, parentId: string | null) => {
    if (!name.trim()) return;
    setError('');

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          parentId: parentId || null,
        }),
      });
      const data = await res.json();

      if (data.success) {
        notify(`Created category "${name.trim()}"`, 'success');
        setNewCatName('');
        setNewCatParentId('');
        setQuickAddParentId(null);
        setQuickAddName('');
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
    if (cat._count.items > 0) {
      alert(`Cannot delete category "${cat.name}" because it contains ${cat._count.items} items. Please move or delete the items first.`);
      return;
    }

    const hasChildren = categories.some((c) => c.parentId === cat.id);
    if (hasChildren) {
      alert(`Cannot delete category "${cat.name}" because it contains subcategories. Please remove its subcategories first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete "${cat.name}"?`)) return;

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

  // Render a recursive node in the tree
  const renderTreeNode = (node: Category, depth = 0) => {
    const isEditing = editingId === node.id;
    const isQuickAdding = quickAddParentId === node.id;
    const directCount = node._count?.items || 0;
    const totalCount = getTotalItemsCount(node);
    const hasChildren = node.children && node.children.length > 0;

    // Filter by search
    if (search) {
      const path = getCategoryPath(node.id).toLowerCase();
      const query = search.toLowerCase();
      const matchesSelfOrDescendant = path.includes(query) || (node.children && node.children.some(c => getCategoryPath(c.id).toLowerCase().includes(query)));
      if (!matchesSelfOrDescendant) return null;
    }

    return (
      <div key={node.id} className="group/node">
        {/* Node Row */}
        <div
          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
            depth === 0
              ? 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 shadow-xs'
              : depth === 1
              ? 'bg-white/80 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/60 ml-4 sm:ml-6'
              : 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/40 dark:border-emerald-900/30 ml-8 sm:ml-12'
          }`}
        >
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1 mr-2">
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-emerald-500 rounded-lg px-3 py-1 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => handleSaveEdit(node.id)}
                className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                title="Save Name"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                {depth === 0 ? (
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <Layers className="w-4 h-4" />
                  </div>
                ) : depth === 1 ? (
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
                    <Folder className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-md bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                    <CornerDownRight className="w-3 h-3" />
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold text-slate-900 dark:text-slate-100 truncate ${depth === 0 ? 'text-xs sm:text-sm uppercase tracking-wide font-black' : depth === 1 ? 'text-xs sm:text-sm font-extrabold' : 'text-xs font-semibold'}`}>
                      {node.name}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${depth === 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : depth === 1 ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                      {depth === 0 ? 'L1 Main' : depth === 1 ? 'L2 Sub' : 'L3 Sub-Sub'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <Link
                      href={`/items?categoryId=${node.id}`}
                      className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
                    >
                      <Package className="w-3 h-3" />
                      <span>{directCount} direct items</span>
                    </Link>
                    {hasChildren && totalCount !== directCount && (
                      <span className="text-slate-400 dark:text-slate-500 font-normal">
                        • {totalCount} total in subtree
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    setQuickAddParentId(node.id);
                    setQuickAddName('');
                  }}
                  className="p-1.5 sm:px-2 sm:py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-[11px] font-bold flex items-center gap-1 transition-all"
                  title="Add child subcategory"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">+ Subcategory</span>
                </button>
                <button
                  onClick={() => handleStartEdit(node)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  title="Rename"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(node)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Quick Add Child Input on this node */}
        {isQuickAdding && (
          <div className={`mt-2 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/30 flex items-center gap-2 ${depth === 0 ? 'ml-4 sm:ml-6' : 'ml-8 sm:ml-12'}`}>
            <CornerDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <input
              type="text"
              placeholder={`Add subcategory inside "${node.name}"...`}
              value={quickAddName}
              onChange={(e) => setQuickAddName(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCategory(quickAddName, node.id);
                if (e.key === 'Escape') setQuickAddParentId(null);
              }}
            />
            <button
              onClick={() => handleAddCategory(quickAddName, node.id)}
              disabled={!quickAddName.trim()}
              className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => setQuickAddParentId(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Render Children Recursively */}
        {hasChildren && (
          <div className="space-y-2 mt-2">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <FolderTree className="w-7 h-7 text-emerald-500" />
            <span>Category Tree & Hierarchy</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Manage Main Categories (L1), Subcategories (L2), and Sub-subcategories (L3) with automatic item counts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/items"
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5" />
            <span>View All Items</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-3.5 rounded-xl border border-rose-200 dark:border-rose-500/20 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-rose-500"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Global Add Category Form */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-500" />
          <span>Add New Category / Subcategory</span>
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Category Name (e.g. Raj & Raj Rubber)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
          />
          
          <select
            value={newCatParentId}
            onChange={(e) => setNewCatParentId(e.target.value)}
            className="w-full sm:w-72 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 font-semibold"
          >
            <option value="">📁 None (Create as L1 Root Category)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                ↳ Parent: {getCategoryPath(c.id)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => handleAddCategory(newCatName, newCatParentId || null)}
            disabled={!newCatName.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create</span>
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search category hierarchy..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Recursive Category Tree */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm font-semibold animate-pulse">
          Loading multi-level category hierarchy...
        </div>
      ) : categoryTree.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No categories found.</div>
      ) : (
        <div className="space-y-4">
          {categoryTree.map((rootNode) => renderTreeNode(rootNode, 0))}
        </div>
      )}
    </div>
  );
}
