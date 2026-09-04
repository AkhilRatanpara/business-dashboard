'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderTree, Plus, Edit2, Trash2, Check, X, ChevronRight,
  ChevronDown, Layers, Folder, GripVertical, Search, CornerDownRight,
  ArrowRight, Sparkles
} from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
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

interface CategoryNodeItemProps {
  node: TreeNode;
  depth: number;
  canDrag: boolean;
  isExpanded: boolean;
  onToggleExpand: (id: string, e?: React.MouseEvent) => void;
  isEditing: boolean;
  editingName: string;
  setEditingName: (name: string) => void;
  onStartEdit: (node: TreeNode) => void;
  onCancelEdit: () => void;
  onSaveRename: (id: string) => void;
  onDelete: (node: TreeNode) => void;
  deletingId: string | null;
  activeAddParent: { id: string; name: string } | null;
  setActiveAddParent: (parent: { id: string; name: string } | null) => void;
  newChildName: string;
  setNewChildName: (name: string) => void;
  onCreateChild: (e: React.FormEvent) => void;
  onReorderChildren: (parentId: string, newChildren: TreeNode[]) => void;
  expandedMap: Record<string, boolean>;
  search: string;
  router: ReturnType<typeof useRouter>;
}

function CategoryNodeItem({
  node,
  depth,
  canDrag,
  isExpanded,
  onToggleExpand,
  isEditing,
  editingName,
  setEditingName,
  onStartEdit,
  onCancelEdit,
  onSaveRename,
  onDelete,
  deletingId,
  activeAddParent,
  setActiveAddParent,
  newChildName,
  setNewChildName,
  onCreateChild,
  onReorderChildren,
  expandedMap,
  search,
  router,
}: CategoryNodeItemProps) {
  const dragControls = useDragControls();
  const hasChildren = node.children.length > 0;
  const isAddingChildHere = activeAddParent?.id === node.id;

  // Filter check if search is active
  if (search.trim()) {
    const q = search.toLowerCase();
    const matchesSelf = node.name.toLowerCase().includes(q);
    const hasMatchingDescendant = (kids: TreeNode[]): boolean =>
      kids.some((k) => k.name.toLowerCase().includes(q) || hasMatchingDescendant(k.children));

    if (!matchesSelf && !hasMatchingDescendant(node.children)) {
      return null;
    }
  }

  const handleNodeClick = () => {
    if (hasChildren) {
      onToggleExpand(node.id);
    } else {
      router.push(`/items?categoryId=${node.id}`);
    }
  };

  return (
    <Reorder.Item
      value={node}
      dragListener={false}
      dragControls={dragControls}
      className="relative select-none"
    >
      <div className="space-y-1">
        <div
          onClick={handleNodeClick}
          className={`group flex items-center justify-between gap-1.5 sm:gap-2 px-2 py-2 sm:px-3 sm:py-2.5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer min-h-[50px] ${
            depth === 0
              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 shadow-xs'
              : depth === 1
              ? 'bg-slate-50/90 dark:bg-slate-950/70 border-slate-200/80 dark:border-slate-800/80 hover:border-cyan-500/50 ml-2.5 sm:ml-6 pl-2 sm:pl-3 border-l-2 border-l-cyan-500/40'
              : 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/40 hover:border-emerald-500/50 ml-4 sm:ml-12 pl-2 sm:pl-3 border-l-2 border-l-emerald-500/50'
          }`}
        >
          {/* Left section: Drag Handle (::), Chevron, Icon, Name + Counts */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            {/* Dedicated Drag Handle (::) - ONLY element that triggers dragging */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                if (canDrag) {
                  dragControls.start(e);
                }
              }}
              className={`touch-none select-none p-1 sm:p-1.5 rounded-lg shrink-0 flex items-center justify-center transition-colors ${
                canDrag
                  ? 'cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
              }`}
              title={canDrag ? "Hold '::' and drag to reorder" : 'Clear search to reorder'}
            >
              <GripVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>

            {/* Chevron toggle if children exist, otherwise leaf point indicator */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => onToggleExpand(node.id, e)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-5 flex items-center justify-center text-slate-300 dark:text-slate-700 shrink-0">
                <CornerDownRight className="w-3 h-3" />
              </span>
            )}

            {/* Node Icon */}
            {depth === 0 ? (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-500/20">
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            ) : depth === 1 ? (
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-200 dark:border-cyan-500/20">
                <Folder className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
            ) : (
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-500/20">
                <Folder className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </div>
            )}

            {/* Name + Item Counts (Single compact column to prevent ballooning height) */}
            <div className="min-w-0 flex-1 flex flex-col justify-center overflow-hidden">
              {isEditing ? (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    autoFocus
                    className="w-full max-w-[150px] sm:max-w-xs px-2 py-1 rounded-lg bg-white dark:bg-slate-950 border border-emerald-500 font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSaveRename(node.id);
                      if (e.key === 'Escape') onCancelEdit();
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => onSaveRename(node.id)}
                    className="p-1 rounded bg-emerald-500 text-slate-950 font-bold shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate ${
                        depth === 0
                          ? 'text-xs sm:text-sm font-black'
                          : depth === 1
                          ? 'text-xs font-bold'
                          : 'text-xs font-semibold'
                      }`}
                    >
                      {node.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 min-w-0">
                    <span className="font-semibold font-mono whitespace-nowrap">
                      {node._count?.items || 0} items
                    </span>
                    {hasChildren && node.totalItemCount !== node._count?.items && (
                      <span className="text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        • {node.totalItemCount} total
                      </span>
                    )}
                    {!hasChildren && (
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 whitespace-nowrap">
                        <span>View items</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right section: Action Buttons */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* "+" Icon: Add subcategory if depth < 2 (supports 3 hierarchical tiers) */}
            {depth < 2 && (
              <button
                type="button"
                onClick={() => {
                  setActiveAddParent({ id: node.id, name: node.name });
                  setNewChildName('');
                }}
                className="p-1.5 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-xs font-bold flex items-center gap-1 transition-all border border-emerald-200/60 dark:border-emerald-500/20 shrink-0"
                title={`Add child category inside "${node.name}"`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">
                  {depth === 0 ? 'Add Sub' : 'Add Sub-Sub'}
                </span>
              </button>
            )}

            {/* Rename */}
            <button
              type="button"
              onClick={() => onStartEdit(node)}
              className="p-1.5 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors shrink-0"
              title="Rename category"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => onDelete(node)}
              disabled={deletingId === node.id}
              className="p-1.5 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50 shrink-0"
              title="Delete category"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Inline Add Child Form under this specific node */}
        {isAddingChildHere && (
          <form
            onSubmit={onCreateChild}
            className={`flex items-center gap-1.5 sm:gap-2 p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-500/40 animate-fade-in ${
              depth === 0 ? 'ml-3 sm:ml-6' : 'ml-6 sm:ml-12'
            }`}
          >
            <CornerDownRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder={`New ${depth === 0 ? 'subcategory' : 'sub-subcategory'} name...`}
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!newChildName.trim()}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 disabled:opacity-50 shadow-xs shrink-0"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setActiveAddParent(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Render nested children with handle-only drag reordering */}
        {hasChildren && isExpanded && (
          <Reorder.Group
            axis="y"
            values={node.children}
            onReorder={(newChildren) => onReorderChildren(node.id, newChildren)}
            className="space-y-1 mt-1"
          >
            {node.children.map((child) => (
              <CategoryNodeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                canDrag={canDrag}
                isExpanded={!!expandedMap[child.id]}
                onToggleExpand={onToggleExpand}
                isEditing={isEditing}
                editingName={editingName}
                setEditingName={setEditingName}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSaveRename={onSaveRename}
                onDelete={onDelete}
                deletingId={deletingId}
                activeAddParent={activeAddParent}
                setActiveAddParent={setActiveAddParent}
                newChildName={newChildName}
                setNewChildName={setNewChildName}
                onCreateChild={onCreateChild}
                onReorderChildren={onReorderChildren}
                expandedMap={expandedMap}
                search={search}
                router={router}
              />
            ))}
          </Reorder.Group>
        )}
      </div>
    </Reorder.Item>
  );
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

  // Auto-expand nodes when searching so matched results are visible immediately
  useEffect(() => {
    if (search.trim()) {
      const newExpanded: Record<string, boolean> = {};
      const markExpanded = (nodes: TreeNode[]) => {
        nodes.forEach((n) => {
          if (n.children.length > 0) {
            newExpanded[n.id] = true;
            markExpanded(n.children);
          }
        });
      };
      markExpanded(categoryTree);
      setExpandedMap(newExpanded);
    }
  }, [search, categoryTree]);

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

  const handleStartEdit = (node: TreeNode) => {
    setEditingId(node.id);
    setEditingName(node.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
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

  // Drag and drop reordering for subcategories/sub-subcategories within their parent
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
        notify('Category order saved', 'success');
      }
    } catch {
      notify('Error saving subcategory order', 'error');
    }
  };

  const canDrag = !search.trim();

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-16 animate-fade-in px-1 sm:px-0">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FolderTree className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500 shrink-0" />
            <span>Categories & Hierarchy</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Organize main categories, subcategories, sort order, and item counts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddRoot(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
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
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
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
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 shrink-0"
            >
              Save Main Category
            </button>
          </div>
        </form>
      )}

      {/* Search Filter & Drag Instructions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 px-1">
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">::</span>
          <span>Hold & drag from the <b>::</b> handle to reorder</span>
        </div>
      </div>

      {/* Categories Tree List */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs animate-pulse">
          Loading categories from database...
        </div>
      ) : categoryTree.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-3">
          <FolderTree className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No categories found</h3>
          <p className="text-xs text-slate-500">Create your first main category above to begin organizing items.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Reorder.Group
            axis="y"
            values={categoryTree}
            onReorder={handleReorderRoots}
            className="space-y-1.5"
          >
            {categoryTree.map((rootNode) => (
              <CategoryNodeItem
                key={rootNode.id}
                node={rootNode}
                depth={0}
                canDrag={canDrag}
                isExpanded={!!expandedMap[rootNode.id]}
                onToggleExpand={toggleExpand}
                isEditing={editingId === rootNode.id}
                editingName={editingName}
                setEditingName={setEditingName}
                onStartEdit={handleStartEdit}
                onCancelEdit={handleCancelEdit}
                onSaveRename={handleSaveRename}
                onDelete={handleDelete}
                deletingId={deletingId}
                activeAddParent={activeAddParent}
                setActiveAddParent={setActiveAddParent}
                newChildName={newChildName}
                setNewChildName={setNewChildName}
                onCreateChild={handleCreateChild}
                onReorderChildren={handleReorderSubcategories}
                expandedMap={expandedMap}
                search={search}
                router={router}
              />
            ))}
          </Reorder.Group>
        </div>
      )}
    </div>
  );
}
