'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, CheckSquare, Square, FolderX, AlertTriangle, X, Edit3, PlusCircle, ChevronDown, ChevronRight, Search, FolderPlus, FolderOpen, Tag, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { notify } from '@/components/ui/Toast';

interface Item {
  id: string;
  name: string;
  itemCode?: string | null;
  brand?: string | null;
  modelNumber?: string | null;
  costPrice: number;
  retailerPrice: number;
  customerPrice: number;
  unit?: string | null;
  notes?: string | null;
  category: { id: string; name: string; parentId?: string | null };
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  children?: Category[];
  _count?: { items: number };
}

export default function ManageItemsPage() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');

  // Core Data State
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [itemSearch, setItemSearch] = useState('');
  const [filterParentId, setFilterParentId] = useState('');
  const [filterSubId, setFilterSubId] = useState('');

  // Item Management Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Item Modal State
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [editItemFormData, setEditItemFormData] = useState({
    name: '',
    itemCode: '',
    brand: '',
    modelNumber: '',
    costPrice: '',
    retailerPrice: '',
    customerPrice: '',
    unit: 'pcs',
    notes: '',
    categoryId: '',
  });

  // Category Edit / Create UI State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatParentId, setEditCatParentId] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  // Category Creation State
  const [newParentName, setNewParentName] = useState('');
  const [creatingParent, setCreatingParent] = useState(false);

  const [newSubName, setNewSubName] = useState('');
  const [newSubParentId, setNewSubParentId] = useState('');
  const [creatingSub, setCreatingSub] = useState(false);

  // Deletion Modal / Confirm State
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);
  const [deletingCat, setDeletingCat] = useState(false);
  const [showCatDeleteConfirm, setShowCatDeleteConfirm] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        fetch('/api/items?sort=name_asc', { cache: 'no-store' }),
        fetch('/api/categories', { cache: 'no-store' }),
      ]);
      const itemsData = await itemsRes.json();
      const catsData = await catsRes.json();
      if (itemsData.success) setItems(itemsData.items);
      if (catsData.success) setCategories(catsData.categories);
    } catch (err) {
      console.error('Failed to load manage data:', err);
      notify('Error loading database tables', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter items based on search and category filter
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      (item.itemCode && item.itemCode.toLowerCase().includes(itemSearch.toLowerCase())) ||
      (item.brand && item.brand.toLowerCase().includes(itemSearch.toLowerCase())) ||
      (item.modelNumber && item.modelNumber.toLowerCase().includes(itemSearch.toLowerCase()));

    const matchesCategory =
      (!filterParentId && !filterSubId) ||
      (filterSubId && item.category.id === filterSubId) ||
      (!filterSubId && filterParentId && (item.category.id === filterParentId || item.category.parentId === filterParentId));

    return matchesSearch && matchesCategory;
  });

  // Parent Categories (those with no parentId)
  const parentCategories = categories.filter((c) => !c.parentId);

  // Multi-select for items
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
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

  // Batch Delete Items Handler
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Permanently delete ${selectedIds.size} selected items?`)) return;
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
        notify(data.message || 'Failed to delete items', 'error');
      }
    } catch {
      notify('Error processing bulk deletion', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Create Parent Category
  const handleCreateParentCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParentName.trim()) return;
    setCreatingParent(true);
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
        loadData();
      } else {
        notify(data.message || 'Failed to create category', 'error');
      }
    } catch {
      notify('Error creating category', 'error');
    } finally {
      setCreatingParent(false);
    }
  };

  // Create Subcategory
  const handleCreateSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !newSubParentId) {
      notify('Please enter name and select parent category', 'error');
      return;
    }
    setCreatingSub(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubName.trim(), parentId: newSubParentId }),
      });
      const data = await res.json();
      if (data.success) {
        notify(`Created subcategory "${newSubName.trim()}"`, 'success');
        setNewSubName('');
        loadData();
      } else {
        notify(data.message || 'Failed to create subcategory', 'error');
      }
    } catch {
      notify('Error creating subcategory', 'error');
    } finally {
      setCreatingSub(false);
    }
  };

  // Delete Category & Subcategories Cascading Handler
  const handleCategoryCascadeDelete = async () => {
    if (!catToDelete) return;
    setDeletingCat(true);
    try {
      const res = await fetch(`/api/categories/${catToDelete.id}?force=true`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        notify(`Deleted category "${catToDelete.name}" and cleared related data`, 'info');
        setCatToDelete(null);
        setShowCatDeleteConfirm(false);
        loadData();
      } else {
        notify(data.message || 'Failed to delete category', 'error');
      }
    } catch {
      notify('Error processing category deletion', 'error');
    } finally {
      setDeletingCat(false);
    }
  };

  // Save Category Edit
  const handleSaveCategoryEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCatName.trim()) return;
    setSavingCat(true);
    try {
      const res = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editCatName.trim(),
          parentId: editCatParentId || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        notify('Category updated successfully', 'success');
        setEditingCategory(null);
        loadData();
      } else {
        notify(data.message || 'Failed to update category', 'error');
      }
    } catch {
      notify('Error updating category', 'error');
    } finally {
      setSavingCat(false);
    }
  };

  // Open Edit Item Modal
  const startEditItem = (item: Item) => {
    setEditingItem(item);
    setEditItemFormData({
      name: item.name,
      itemCode: item.itemCode || '',
      brand: item.brand || '',
      modelNumber: item.modelNumber || '',
      costPrice: item.costPrice.toString(),
      retailerPrice: item.retailerPrice.toString(),
      customerPrice: item.customerPrice.toString(),
      unit: item.unit || 'pcs',
      notes: item.notes || '',
      categoryId: item.category.id,
    });
  };

  // Save Item Detail Changes
  const handleSaveItemEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSavingItem(true);
    try {
      const res = await fetch(`/api/items/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editItemFormData.name.trim(),
          itemCode: editItemFormData.itemCode.trim() || null,
          brand: editItemFormData.brand.trim() || null,
          modelNumber: editItemFormData.modelNumber.trim() || null,
          costPrice: parseFloat(editItemFormData.costPrice),
          retailerPrice: parseFloat(editItemFormData.retailerPrice),
          customerPrice: parseFloat(editItemFormData.customerPrice),
          unit: editItemFormData.unit.trim(),
          notes: editItemFormData.notes.trim() || null,
          categoryId: editItemFormData.categoryId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        notify(`Updated details for "${editItemFormData.name.trim()}"`, 'success');
        setEditingItem(null);
        loadData();
      } else {
        notify(data.message || 'Failed to update item details', 'error');
      }
    } catch {
      notify('Error updating item details', 'error');
    } finally {
      setSavingItem(false);
    }
  };

  // Helper to suggest selling prices inside edit form
  const handleEditCostChange = (val: string) => {
    setEditItemFormData((prev) => {
      const num = parseFloat(val) || 0;
      return {
        ...prev,
        costPrice: val,
        retailerPrice: prev.retailerPrice ? prev.retailerPrice : num ? Math.round(num * 1.15).toString() : '',
        customerPrice: prev.customerPrice ? prev.customerPrice : num ? Math.round(num * 1.3).toString() : '',
      };
    });
  };

  const allSelected = filteredItems.length > 0 && selectedIds.size === filteredItems.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/items"
            className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Master Database Manager</h1>
            <p className="text-xs text-slate-500 font-medium">Create, edit, and restructure items, categories, and subcategories</p>
          </div>
        </div>
      </div>

      {/* Modern Glass Tab Selection */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl max-w-md border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
            activeTab === 'items'
              ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Manage Items ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
            activeTab === 'categories'
              ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Manage Category Trees ({categories.length})
        </button>
      </div>

      {/* ─── TAB 1: MANAGE ITEMS ─── */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Controls Card */}
          <div className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, code..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Parent Category Filter */}
            <div>
              <select
                value={filterParentId}
                onChange={(e) => {
                  setFilterParentId(e.target.value);
                  setFilterSubId('');
                }}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
              >
                <option value="">All Main Categories</option>
                {parentCategories.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Filter */}
            <div>
              <select
                value={filterSubId}
                onChange={(e) => setFilterSubId(e.target.value)}
                disabled={!filterParentId}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100 disabled:opacity-50"
              >
                <option value="">All Subcategories</option>
                {categories
                  .filter((sub) => sub.parentId === filterParentId)
                  .map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Select All Toggle */}
            <div className="flex items-center justify-end">
              <button
                onClick={toggleSelectAll}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-extrabold shadow-sm hover:border-slate-300"
              >
                {allSelected ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          {/* Floating Action Delete Bar */}
          {selectedIds.size > 0 && (
            <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
              <div className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center font-black text-xs text-white">
                {selectedIds.size}
              </div>
              <span className="text-xs font-bold">Selected</span>
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

          {/* Items Table container */}
          {loading ? (
            <div className="py-20 text-center text-slate-500 text-sm animate-pulse">Loading database items...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-xs text-slate-400 font-medium">
              No items match search or category criteria.
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider">
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="rounded accent-emerald-600 w-4 h-4 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4">Item Details</th>
                      <th className="py-3 px-4">Category Path</th>
                      <th className="py-3 px-4 text-rose-500">Cost</th>
                      <th className="py-3 px-4 text-cyan-500">Retailer</th>
                      <th className="py-3 px-4 text-emerald-500">Customer</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredItems.map((item) => {
                      const isSelected = selectedIds.has(item.id);
                      const catPath = item.category.parentId
                        ? `${categories.find((c) => c.id === item.category.parentId)?.name} → ${item.category.name}`
                        : item.category.name;

                      return (
                        <tr
                          key={item.id}
                          onClick={() => toggleSelectItem(item.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
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
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{item.name}</div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-medium">
                              {item.brand && <span>{item.brand}</span>}
                              {item.itemCode && <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{item.itemCode}</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold">{catPath}</td>
                          <td className="py-3 px-4 font-mono font-black text-rose-600">{formatCurrency(item.costPrice)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-cyan-600">{formatCurrency(item.retailerPrice)}</td>
                          <td className="py-3 px-4 font-mono font-black text-emerald-600">{formatCurrency(item.customerPrice)}</td>
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <Link
                                href={`/items/${item.id}`}
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all"
                                title="View Details Page"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                onClick={() => startEditItem(item)}
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center justify-center transition-all"
                                title="Edit Full Details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
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
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-500/10 text-rose-500 flex items-center justify-center transition-all"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
      )}

      {/* ─── TAB 2: MANAGE CATEGORIES & STRUCTURE ─── */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Category Hierarchy Tree */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-black text-slate-950 dark:text-slate-50 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-emerald-600" />
                <span>Categories & Subcategories Tree</span>
              </h2>

              {loading ? (
                <div className="py-12 text-center text-slate-500 text-xs animate-pulse">Loading structure…</div>
              ) : parentCategories.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-6">No parent categories found. Create one on the right.</p>
              ) : (
                <div className="space-y-4">
                  {parentCategories.map((parent) => {
                    const subCats = categories.filter((c) => c.parentId === parent.id);

                    return (
                      <div
                        key={parent.id}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 space-y-3"
                      >
                        {/* Parent Category Header */}
                        <div className="flex items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm truncate">
                              {parent.name}
                            </span>
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
                              {parent._count?.items ?? 0} direct items
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setEditingCategory(parent);
                                setEditCatName(parent.name);
                                setEditCatParentId(parent.parentId || '');
                              }}
                              className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:text-emerald-600 text-slate-600 transition-all"
                              title="Rename Parent"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setCatToDelete(parent);
                                setShowCatDeleteConfirm(true);
                              }}
                              className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-rose-50 hover:text-rose-600 text-rose-500 transition-all"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Subcategories Collapsible List */}
                        {subCats.length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic pl-6">No subcategories under this group.</p>
                        ) : (
                          <div className="pl-6 space-y-2 border-l border-slate-200 dark:border-slate-800">
                            {subCats.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {sub.name}
                                  </span>
                                  <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
                                    {sub._count?.items ?? 0} item{sub._count?.items !== 1 ? 's' : ''}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => {
                                      setEditingCategory(sub);
                                      setEditCatName(sub.name);
                                      setEditCatParentId(sub.parentId || '');
                                    }}
                                    className="p-1 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:text-emerald-600 text-slate-500 transition-all"
                                    title="Rename Subcategory"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setCatToDelete(sub);
                                      setShowCatDeleteConfirm(true);
                                    }}
                                    className="p-1 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-rose-50 hover:text-rose-600 text-rose-500 transition-all"
                                    title="Delete Subcategory"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Add Master Categories & Subcategories Form */}
          <div className="space-y-6">
            {/* Create Parent Category */}
            <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
              <h2 className="text-xs font-black text-slate-950 dark:text-slate-50 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FolderPlus className="w-4.5 h-4.5 text-emerald-600" />
                <span>Add Main Category</span>
              </h2>
              <form onSubmit={handleCreateParentCategory} className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="e.g. V-3 C.I. Submersible parts"
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingParent || !newParentName.trim()}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-md disabled:opacity-50 transition-all"
                >
                  {creatingParent ? 'Creating Parent...' : 'Create Main Category'}
                </button>
              </form>
            </div>

            {/* Create Subcategory */}
            <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
              <h2 className="text-xs font-black text-slate-950 dark:text-slate-50 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FolderPlus className="w-4.5 h-4.5 text-emerald-600" />
                <span>Add Subcategory</span>
              </h2>
              <form onSubmit={handleCreateSubCategory} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-1">Parent Category</label>
                  <select
                    value={newSubParentId}
                    onChange={(e) => setNewSubParentId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Select Main Category...</option>
                    {parentCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-1">Subcategory Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sr. No. 1 - Rotor"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingSub || !newSubName.trim() || !newSubParentId}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-md disabled:opacity-50 transition-all"
                >
                  {creatingSub ? 'Creating Subcategory...' : 'Create Subcategory'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT ITEM DETAILS ─── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSaveItemEdit}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-950 dark:text-slate-50 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                <span>Edit Item Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Item Name */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-600 mb-1">Item Name</label>
                <input
                  type="text"
                  value={editItemFormData.name}
                  onChange={(e) => setEditItemFormData({ ...editItemFormData, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-600 mb-1">Category / Subcategory</label>
                <select
                  value={editItemFormData.categoryId}
                  onChange={(e) => setEditItemFormData({ ...editItemFormData, categoryId: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                >
                  {parentCategories.map((parent) => (
                    <optgroup key={parent.id} label={parent.name}>
                      <option value={parent.id}>{parent.name} (Direct Parent)</option>
                      {categories
                        .filter((sub) => sub.parentId === parent.id)
                        .map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            — {sub.name}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Code & Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-600 mb-1">Part Code</label>
                  <input
                    type="text"
                    value={editItemFormData.itemCode}
                    onChange={(e) => setEditItemFormData({ ...editItemFormData, itemCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-600 mb-1">Brand / Make</label>
                  <input
                    type="text"
                    value={editItemFormData.brand}
                    onChange={(e) => setEditItemFormData({ ...editItemFormData, brand: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Prices Grid */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">Prices (₹) & Profit Markup</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-rose-600 mb-0.5">Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editItemFormData.costPrice}
                      onChange={(e) => handleEditCostChange(e.target.value)}
                      required
                      className="w-full px-2 py-1.5 border border-rose-300 dark:border-rose-900/40 rounded-lg text-xs font-bold text-rose-700 dark:text-rose-400 focus:outline-none bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-cyan-600 mb-0.5">Retailer</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editItemFormData.retailerPrice}
                      onChange={(e) => setEditItemFormData({ ...editItemFormData, retailerPrice: e.target.value })}
                      required
                      className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-800 rounded-lg text-xs font-bold text-cyan-700 dark:text-cyan-400 focus:outline-none bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-emerald-600 mb-0.5">Customer</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editItemFormData.customerPrice}
                      onChange={(e) => setEditItemFormData({ ...editItemFormData, customerPrice: e.target.value })}
                      required
                      className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-800 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-400 focus:outline-none bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Model & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-600 mb-1">Model / Specs</label>
                  <input
                    type="text"
                    value={editItemFormData.modelNumber}
                    onChange={(e) => setEditItemFormData({ ...editItemFormData, modelNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-600 mb-1">Unit</label>
                  <input
                    type="text"
                    value={editItemFormData.unit}
                    onChange={(e) => setEditItemFormData({ ...editItemFormData, unit: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-600 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editItemFormData.notes}
                  onChange={(e) => setEditItemFormData({ ...editItemFormData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingItem}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs shadow-md disabled:opacity-50"
              >
                {savingItem ? 'Saving Changes...' : 'Save Details'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODAL: EDIT CATEGORY DETAILS ─── */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSaveCategoryEdit}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-950 dark:text-slate-50 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                <span>Rename Category/Subcategory</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-600 mb-1">Name</label>
                <input
                  type="text"
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              {editingCategory.parentId && (
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-600 mb-1">Parent Category</label>
                  <select
                    value={editCatParentId}
                    onChange={(e) => setEditCatParentId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                  >
                    {parentCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingCat || !editCatName.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs shadow-md disabled:opacity-50"
              >
                {savingCat ? 'Saving...' : 'Save Name'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODAL: CASCADE DELETE CONFIRMATION ─── */}
      {showCatDeleteConfirm && catToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 text-center">Delete Category Name & Contents?</h3>
            <p className="text-xs text-slate-500 text-center mt-2 leading-relaxed">
              This will permanently delete the category name <strong className="text-rose-600 dark:text-rose-400">&quot;{catToDelete.name}&quot;</strong> and all subcategories or items belonging to it.
            </p>
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-rose-100 dark:border-rose-950/20 text-[11px] text-rose-700 dark:text-rose-400 font-semibold mt-3 text-center">
              ⚠️ Warning: This will delete everything inside. You can recover these items later from the Activity History logs.
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setCatToDelete(null);
                  setShowCatDeleteConfirm(false);
                }}
                className="py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCategoryCascadeDelete}
                disabled={deletingCat}
                className="py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md transition-all disabled:opacity-60"
              >
                {deletingCat ? 'Deleting All...' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
