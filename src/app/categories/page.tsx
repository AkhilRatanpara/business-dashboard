'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FolderTree, Plus, Edit2, Trash2, Package, Check, X, ChevronRight,
  ChevronDown, Layers, Folder, FolderPlus, GripVertical, Search, CornerDownRight,
  ArrowRight, Sparkles
} from 'lucide-react';
import { Reorder, motion } from 'framer-motion';
import { notify } from '@/components/ui/Toast';

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  sortOrder?: number;
  parent?: Category | null;
  children?: Category[];
  _count: { items: number };
}

interface TreeNode extends Category {
  children: TreeNode[];
  totalItemCount: number;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Expand / collapse state map for tree nodes
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  // Adding modal / inline state
  const [showAddRoot, setShowAddRoot] = useState(false);
  const [rootCatName, setRootCatName] = useState('');

  // Quick add child subcategory
  const [activeAddParent, setActiveAddParent] = useState<{ id: string; name: string } | null>(null);
  const [newChildName, setNewChildName] = useState('');

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      notify('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Build recursive tree from categories list
  const categoryTree = useMemo(() => {
    const roots: Category[] = [];
    const childrenMap = new Map<string, Category[]>();

    // Sort categories by sortOrder then name
    const sorted = [...categories].sort((a, b) => {
      const sA = a.sortOrder ?? 0;
      const sB = b.sortOrder ?? 0;
      if (sA !== sB) return sA - sB;
      return a.name.localeCompare(b.name);
    });

    sorted.forEach((cat) => {
      if (!cat.parentId) {
        roots.push(cat);
      } else {
        if (!childrenMap.has(cat.parentId)) {
          childrenMap.set(cat.parentId, []);
        }
        childrenMap.get(cat.parentId)!.push(cat);
      }
    });

    const buildNode = (cat: Category): TreeNode => {
      const kids = childrenMap.get(cat.id) || [];
      const childrenNodes = kids.map(buildNode);
      let total = cat._count?.items || 0;
      childrenNodes.forEach((child) => {
        total += child.totalItemCount;
      });

      return {
        ...cat,
        children: childrenNodes,
        totalItemCount: total,
      };
    };

    return roots.map(buildNode);
  }, [categories]);

  const toggleExpand = (catId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedMap((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleCreateRoot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootCatName.trim()) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: rootCatName.trim(),
          parentId: null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        notify(`Created main category "${rootCatName.trim()}"`, 'success');
        setRootCatName('');
        setShowAddRoot(false);
        fetchCategories();
      } else {
        notify(data.message || 'Failed to create category', 'error');
      }
    } catch {
      notify('Network error creating category', 'error');
    }
  };

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAddParent || !newChildName.trim()) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChildName.trim(),
          parentId: activeAddParent.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        notify(`Created subcategory inside "${activeAddParent.name}"`, 'success');
        // Automatically expand the parent node
        setExpandedMap((prev) => ({ ...prev, [activeAddParent.id]: true }));
        setNewChildName('');
        setActiveAddParent(null);
        fetchCategories();
      } else {
        notify(data.message || 'Failed to create subcategory', 'error');
      }
    } catch {
      notify('Network error creating subcategory', 'error');
    }
  };

  const handleSaveRename = async (catId: string) => {
    if (!editingName.trim()) return;
    try {
      const res = await fetch(`/api/categories/${catId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        notify(`Renamed category to "${editingName.trim()}"`, 'success');
        setEditingId(null);
        fetchCategories();
      } else {
        notify(data.message || 'Failed to rename category', 'error');
      }
    } catch {
      notify('Network error updating category', 'error');
    }
  };

  const handleDelete = async (cat: TreeNode) => {
    if (cat.totalItemCount > 0) {
      if (!confirm(`Warning: "${cat.name}" contains ${cat.totalItemCount} item(s). Are you sure you want to delete it?`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    }

    setDeletingId(cat.id);
    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        notify(`Deleted category "${cat.name}"`, 'info');
        fetchCategories();
      } else {
        notify(data.message || 'Failed to delete category', 'error');
      }
    } catch {
      notify('Network error deleting category', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Drag and drop reordering for root categories
  const handleReorderRoots = async (newRoots: TreeNode[]) => {
    const orderedIds = newRoots.map((r) => r.id);

    // Optimistically update state
    setCategories((prev) => {
      const remaining = prev.filter((c) => c.parentId);
      const rootMap = new Map(newRoots.map((r, i) => [r.id, i]));
      const updatedRoots = prev
        .filter((c) => !c.parentId)
        .map((r) => ({
          ...r,
          sortOrder: rootMap.get(r.id) ?? r.sortOrder,
        }));
      return [...updatedRoots, ...remaining];
    });

    try {
      const res = await fetch('/api/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      const data = await res.json();
      if (data.success) {
        notify('Category order saved', 'success');
      }
    } catch {
      notify('Error saving category order to database', 'error');
    }
  };

  // Drag and drop reordering for subcategories within their parent
  const handleReorderSubcategories = async (parentId: string, newChildren: TreeNode[]) => {
    const orderedIds = newChildren.map((c) => c.id);

    // Optimistically update state
    setCategories((prev) => {
      const childMap = new Map(newChildren.map((c, i) => [c.id, i]));
      return prev.map((c) => {
        if (c.parentId === parentId && childMap.has(c.id)) {
          return {
            ...c,
            sortOrder: childMap.get(c.id) ?? c.sortOrder,
          };
        }
        return c;
      });
    });

    try {
      const res = await fetch('/api/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      const data = await res.json();
      if (data.success) {
        notify('Subcategory order saved', 'success');
      }
    } catch {
      notify('Error saving subcategory order', 'error');
    }
  };

  // Recursive Category Node Renderer
  const renderCategoryNode = (node: TreeNode, depth = 0) => {
    const isExpanded = !!expandedMap[node.id];
    const hasChildren = node.children.length > 0;
    const isEditing = editingId === node.id;
    const isAddingChildHere = activeAddParent?.id === node.id;

    // Filter check if search is active
    if (search.trim()) {
      const matchesSelf = node.name.toLowerCase().includes(search.toLowerCase());
      const matchesChild = node.children.some((c) => c.name.toLowerCase().includes(search.toLowerCase()));
      if (!matchesSelf && !matchesChild) return null;
    }

    const handleNodeClick = () => {
      if (hasChildren) {
        toggleExpand(node.id);
      } else {
        // Leaf node: redirect straight to items in Price Book!
        router.push(`/items?categoryId=${node.id}`);
      }
    };

    return (
      <div key={node.id} className="space-y-1 select-none">
        <div
          onClick={handleNodeClick}
          className={`group flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
            depth === 0
              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 shadow-xs'
              : depth === 1
              ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800/80 hover:border-cyan-500/50 ml-4 sm:ml-7'
              : 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/40 hover:border-emerald-500/50 ml-8 sm:ml-14'
          }`}
        >
          {/* Left section: Drag handle, Chevron, Icon, Name */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {depth === 0 && (
              <span
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing p-1 -ml-1 rounded"
                title="Drag to reorder"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-4 h-4" />
              </span>
            )}

            {/* Chevron toggle if children exist, otherwise leaf point indicator */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(node.id, e)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <span className="w-6 flex items-center justify-center text-slate-300 dark:text-slate-700">
                <CornerDownRight className="w-3.5 h-3.5" />
              </span>
            )}

            {/* Icon */}
            {depth === 0 ? (
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-500/20">
                <Layers className="w-4 h-4" />
              </div>
            ) : depth === 1 ? (
              <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-200 dark:border-cyan-500/20">
                <Folder className="w-3.5 h-3.5" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-500/20">
                <Folder className="w-3 h-3" />
              </div>
            )}

            {/* Category Name / Inline Rename Input */}
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    autoFocus
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-950 border border-emerald-500 font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(node.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <button
                    onClick={() => handleSaveRename(node.id)}
                    className="p-1 rounded bg-emerald-500 text-slate-950 font-bold"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`font-black tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors ${
                      depth === 0 ? 'text-sm' : depth === 1 ? 'text-xs' : 'text-xs font-semibold'
                    }`}
                  >
                    {node.name}
                  </span>

                  {/* Badges */}
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {node._count?.items || 0} items
                    {hasChildren && node.totalItemCount !== node._count?.items ? ` (${node.totalItemCount} total)` : ''}
                  </span>

                  {!hasChildren && (
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40 flex items-center gap-0.5">
                      <span>View items</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right section: Action Buttons */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* "+" Icon: Creates a nested subcategory inside THIS category */}
            <button
              type="button"
              onClick={() => {
                setActiveAddParent({ id: node.id, name: node.name });
                setNewChildName('');
              }}
              className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-xs font-bold flex items-center gap-1 transition-all border border-emerald-200/60 dark:border-emerald-500/20"
              title={`Add child category inside "${node.name}"`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Add Sub</span>
            </button>

            {/* Rename */}
            <button
              type="button"
              onClick={() => {
                setEditingId(node.id);
                setEditingName(node.name);
              }}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
              title="Rename category"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => handleDelete(node)}
              disabled={deletingId === node.id}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50"
              title="Delete category"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Inline Add Child Form under this specific node */}
        {isAddingChildHere && (
          <form
            onSubmit={handleCreateChild}
            className={`flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-500/40 animate-fade-in ${
              depth === 0 ? 'ml-6 sm:ml-9' : 'ml-10 sm:ml-16'
            }`}
          >
            <CornerDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder={`Create new subcategory inside "${node.name}"...`}
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!newChildName.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 disabled:opacity-50 shadow-xs"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setActiveAddParent(null)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Render nested children if expanded with drag-and-drop reordering */}
        {hasChildren && isExpanded && (
          <Reorder.Group
            axis="y"
            values={node.children}
            onReorder={(newChildren) => handleReorderSubcategories(node.id, newChildren)}
            className="space-y-1 mt-1"
          >
            {node.children.map((child) => (
              <Reorder.Item key={child.id} value={child}>
                {renderCategoryNode(child, depth + 1)}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <FolderTree className="w-7 h-7 text-emerald-500" />
            <span>Categories & Hierarchy</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Manage main categories, subcategories, drag & drop sort order, and item counts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddRoot(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Main Category</span>
          </button>
        </div>
      </div>

      {/* Add New Root Main Category Modal / Dropdown Card */}
      {showAddRoot && (
        <form
          onSubmit={handleCreateRoot}
          className="glass-card rounded-2xl p-4 sm:p-5 border border-emerald-500/40 bg-white dark:bg-slate-900 shadow-xl space-y-3 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span>Create New Root / Main Category</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddRoot(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              autoFocus
              placeholder="e.g. V-4 SUBMERSIBLE PUMP SPARES, RAJ RUBBER..."
              value={rootCatName}
              onChange={(e) => setRootCatName(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!rootCatName.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              Save Main Category
            </button>
          </div>
        </form>
      )}

      {/* Search Filter & Instructions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 self-start sm:self-auto">
          <span>Tip: Click any leaf category to view its items in Price Book</span>
        </div>
      </div>

      {/* Categories Tree List */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs animate-pulse">
          Loading categories from Neon DB...
        </div>
      ) : categoryTree.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-3">
          <FolderTree className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No categories found</h3>
          <p className="text-xs text-slate-500">Create your first main category above to begin organizing pump parts.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Reorderable list for Root categories */}
          <Reorder.Group
            axis="y"
            values={categoryTree}
            onReorder={handleReorderRoots}
            className="space-y-2"
          >
            {categoryTree.map((rootNode) => (
              <Reorder.Item key={rootNode.id} value={rootNode}>
                {renderCategoryNode(rootNode, 0)}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      )}
    </div>
  );
}
