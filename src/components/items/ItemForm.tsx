'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, Plus, PlusCircle, Check, X,
  FolderTree, Tag, Building2, Layers, AlertTriangle, Trash2,
  TrendingUp, Sparkles, RefreshCw, FilePlus, Folder, CornerDownRight, Package
} from 'lucide-react';
import { ModernDropdown } from '@/components/ui/ModernDropdown';
import { formatCurrency, calculateProfit, calculateMarkupPercent, matchSmartSearch } from '@/lib/utils';
import { notify } from '@/components/ui/Toast';

export interface ItemFormData {
  id?: string;
  name: string;
  srNo?: string;
  categoryId: string;
  brand?: string;
  itemCode?: string;
  modelNumber?: string;
  costPrice: number | string;
  retailerPrice: number | string;
  customerPrice: number | string;
  unit?: string;
  notes?: string;
  changeNote?: string;
}

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
}

interface ExistingItem {
  id: string;
  name: string;
  srNo?: string | null;
  itemCode?: string | null;
  brand?: string | null;
  modelNumber?: string | null;
  costPrice: number;
  retailerPrice: number;
  customerPrice: number;
  unit?: string | null;
  notes?: string | null;
  category: { id: string; name: string; parentId?: string | null };
}

interface ItemFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<ItemFormData>;
  itemId?: string;
  onSuccess?: (savedItem: any) => void;
  onCancel?: () => void;
}

export function ItemForm({ mode, initialData, itemId, onSuccess, onCancel }: ItemFormProps) {
  const router = useRouter();
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Categories, Brands, & Existing Items for Smart Auto-Suggest
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [existingItems, setExistingItems] = useState<ExistingItem[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // Auto-Suggest & Prefill State in Create Mode
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [prefilledFromName, setPrefilledFromName] = useState('');

  // Parent, Subcategory, & Sub-Subcategory selections
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [subSubCategoryId, setSubSubCategoryId] = useState('');

  // Inline Category / Subcategory Creation Modals
  const [showAddParentModal, setShowAddParentModal] = useState(false);
  const [newParentName, setNewParentName] = useState('');
  const [addingParent, setAddingParent] = useState(false);

  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [addingSub, setAddingSub] = useState(false);

  const [showAddSubSubModal, setShowAddSubSubModal] = useState(false);
  const [newSubSubName, setNewSubSubName] = useState('');
  const [addingSubSub, setAddingSubSub] = useState(false);

  // Inline Brand Creation Modal
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [addingBrand, setAddingBrand] = useState(false);

  // Form Fields
  const [name, setName] = useState(initialData?.name || '');
  const [srNo, setSrNo] = useState(initialData?.srNo || '');
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [itemCode, setItemCode] = useState(initialData?.itemCode || '');
  const [modelNumber, setModelNumber] = useState(initialData?.modelNumber || '');
  const [costPrice, setCostPrice] = useState(initialData?.costPrice !== undefined ? String(initialData.costPrice) : '');
  const [retailerPrice, setRetailerPrice] = useState(initialData?.retailerPrice !== undefined ? String(initialData.retailerPrice) : '');
  const [customerPrice, setCustomerPrice] = useState(initialData?.customerPrice !== undefined ? String(initialData.customerPrice) : '');
  const [unit, setUnit] = useState(initialData?.unit || 'pcs');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [changeNote, setChangeNote] = useState('');

  // Execution States
  const [saving, setSaving] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // Helper to trace 3-level categories from target ID
  const traceCategoryHierarchy = (leafId: string, allCats: Category[]) => {
    const catMap = new Map(allCats.map((c) => [c.id, c]));
    const leaf = catMap.get(leafId);
    if (!leaf) return;

    if (leaf.parentId) {
      const parent = catMap.get(leaf.parentId);
      if (parent?.parentId) {
        // Level 3: leaf is sub-sub
        setParentCategoryId(parent.parentId);
        setSubCategoryId(parent.id);
        setSubSubCategoryId(leaf.id);
      } else {
        // Level 2: leaf is sub
        setParentCategoryId(parent ? parent.id : leaf.parentId);
        setSubCategoryId(leaf.id);
        setSubSubCategoryId('');
      }
    } else {
      // Level 1: leaf is root
      setParentCategoryId(leaf.id);
      setSubCategoryId('');
      setSubSubCategoryId('');
    }
  };

  // Load Categories, Brands & Items
  const fetchMetadata = async () => {
    setLoadingMetadata(true);
    try {
      const [catsRes, brandsRes, itemsRes] = await Promise.all([
        fetch('/api/categories', { cache: 'no-store' }),
        fetch('/api/brands', { cache: 'no-store' }),
        fetch('/api/items?sort=name_asc', { cache: 'no-store' }),
      ]);
      const catsData = await catsRes.json();
      const brandsData = await brandsRes.json();
      const itemsData = await itemsRes.json();

      if (catsData.success) {
        setCategories(catsData.categories);

        // Compute initial parent/sub selection if initialData provided
        if (initialData?.categoryId) {
          traceCategoryHierarchy(initialData.categoryId, catsData.categories);
        } else if (catsData.categories.length > 0 && !parentCategoryId) {
          const parents = catsData.categories.filter((c: Category) => !c.parentId);
          if (parents.length > 0) {
            const firstParent = parents[0].id;
            setParentCategoryId(firstParent);
            const subs = catsData.categories.filter((c: Category) => c.parentId === firstParent);
            if (subs.length > 0) {
              setSubCategoryId(subs[0].id);
              const subsubs = catsData.categories.filter((c: Category) => c.parentId === subs[0].id);
              setSubSubCategoryId(subsubs.length > 0 ? subsubs[0].id : '');
            } else {
              setSubCategoryId('');
              setSubSubCategoryId('');
            }
          }
        }
      }

      if (brandsData.success) {
        setBrands(brandsData.brands);
      }

      if (itemsData.success) {
        setExistingItems(itemsData.items);
      }
    } catch (err) {
      console.error('Failed to load form metadata:', err);
    } finally {
      setLoadingMetadata(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Sync state if initialData changes (e.g. for edit mode)
  useEffect(() => {
    if (initialData) {
      if (initialData.name !== undefined) setName(initialData.name);
      if (initialData.srNo !== undefined) setSrNo(initialData.srNo);
      if (initialData.brand !== undefined) setBrand(initialData.brand);
      if (initialData.itemCode !== undefined) setItemCode(initialData.itemCode);
      if (initialData.modelNumber !== undefined) setModelNumber(initialData.modelNumber);
      if (initialData.costPrice !== undefined) setCostPrice(String(initialData.costPrice));
      if (initialData.retailerPrice !== undefined) setRetailerPrice(String(initialData.retailerPrice));
      if (initialData.customerPrice !== undefined) setCustomerPrice(String(initialData.customerPrice));
      if (initialData.unit !== undefined) setUnit(initialData.unit || 'pcs');
      if (initialData.notes !== undefined) setNotes(initialData.notes || '');

      if (categories.length > 0 && initialData.categoryId) {
        traceCategoryHierarchy(initialData.categoryId, categories);
      }
    }
  }, [initialData, categories]);

  // Close suggestions dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live auto-suggestions as user types item name in create mode
  const suggestions = useMemo(() => {
    if (mode !== 'create' || !name.trim() || name.trim().length < 2) return [];
    return existingItems
      .filter((it) => matchSmartSearch(it.name, name))
      .slice(0, 6);
  }, [mode, name, existingItems]);

  // Handle selecting an existing item to auto-fill details
  const handleSelectSuggestion = (suggested: ExistingItem) => {
    setName(suggested.name);
    if (suggested.srNo) setSrNo(suggested.srNo);
    if (suggested.brand) setBrand(suggested.brand);
    if (suggested.itemCode) setItemCode(suggested.itemCode);
    if (suggested.modelNumber) setModelNumber(suggested.modelNumber);
    setCostPrice(String(suggested.costPrice));
    setRetailerPrice(String(suggested.retailerPrice));
    setCustomerPrice(String(suggested.customerPrice));
    if (suggested.unit) setUnit(suggested.unit);
    if (suggested.notes) setNotes(suggested.notes);

    if (suggested.category?.id && categories.length > 0) {
      traceCategoryHierarchy(suggested.category.id, categories);
    }

    setPrefilledFromName(suggested.name);
    setShowSuggestions(false);
    notify(`Auto-filled details from "${suggested.name}". Modify any details and save as new item.`, 'info');
  };

  // Handle parent category selection change
  const handleParentChange = (parentId: string) => {
    setParentCategoryId(parentId);
    const subs = categories.filter((c) => c.parentId === parentId);
    if (subs.length > 0) {
      setSubCategoryId(subs[0].id);
      const subsubs = categories.filter((c) => c.parentId === subs[0].id);
      setSubSubCategoryId(subsubs.length > 0 ? subsubs[0].id : '');
    } else {
      setSubCategoryId('');
      setSubSubCategoryId('');
    }
  };

  // Handle subcategory selection change
  const handleSubChange = (subId: string) => {
    setSubCategoryId(subId);
    if (subId) {
      const subsubs = categories.filter((c) => c.parentId === subId);
      setSubSubCategoryId(subsubs.length > 0 ? subsubs[0].id : '');
    } else {
      setSubSubCategoryId('');
    }
  };

  // Profit & Markup Calculations
  const numCost = parseFloat(costPrice) || 0;
  const numRetailer = parseFloat(retailerPrice) || 0;
  const numCustomer = parseFloat(customerPrice) || 0;

  const retailerProfit = calculateProfit(numRetailer, numCost);
  const customerProfit = calculateProfit(numCustomer, numCost);
  const retailerMarkup = calculateMarkupPercent(numRetailer, numCost);
  const customerMarkup = calculateMarkupPercent(numCustomer, numCost);

  // Inline Parent Category Creator
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
        notify(`Created category "${newParentName.trim()}"`, 'success');
        setNewParentName('');
        setShowAddParentModal(false);
        setCategories((prev) => [...prev, data.category]);
        setParentCategoryId(data.category.id);
        setSubCategoryId('');
        setSubSubCategoryId('');
      } else {
        notify(data.message || 'Failed to add category', 'error');
      }
    } catch {
      notify('Error creating category', 'error');
    } finally {
      setAddingParent(false);
    }
  };

  // Inline Subcategory Creator
  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !parentCategoryId) return;
    setAddingSub(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubName.trim(), parentId: parentCategoryId }),
      });
      const data = await res.json();
      if (data.success) {
        notify(`Created subcategory "${newSubName.trim()}"`, 'success');
        setNewSubName('');
        setShowAddSubModal(false);
        setCategories((prev) => [...prev, data.category]);
        setSubCategoryId(data.category.id);
        setSubSubCategoryId('');
      } else {
        notify(data.message || 'Failed to add subcategory', 'error');
      }
    } catch {
      notify('Error creating subcategory', 'error');
    } finally {
      setAddingSub(false);
    }
  };

  // Inline Sub-Subcategory Creator
  const handleCreateSubSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubSubName.trim() || !subCategoryId) return;
    setAddingSubSub(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubSubName.trim(), parentId: subCategoryId }),
      });
      const data = await res.json();
      if (data.success) {
        notify(`Created sub-subcategory "${newSubSubName.trim()}"`, 'success');
        setNewSubSubName('');
        setShowAddSubSubModal(false);
        setCategories((prev) => [...prev, data.category]);
        setSubSubCategoryId(data.category.id);
      } else {
        notify(data.message || 'Failed to add sub-subcategory', 'error');
      }
    } catch {
      notify('Error creating sub-subcategory', 'error');
    } finally {
      setAddingSubSub(false);
    }
  };

  // Inline Brand Creator
  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    const brandTrimmed = newBrandName.trim();
    if (!brandTrimmed) return;
    setAddingBrand(true);
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: brandTrimmed }),
      });
      const data = await res.json();
      if (data.success) {
        notify(`Added brand "${brandTrimmed}"`, 'success');
        if (!brands.includes(brandTrimmed)) {
          setBrands((prev) => [...prev, brandTrimmed].sort((a, b) => a.localeCompare(b)));
        }
        setBrand(brandTrimmed);
        setNewBrandName('');
        setShowAddBrandModal(false);
      } else {
        notify(data.message || 'Failed to add brand', 'error');
      }
    } catch {
      notify('Error creating brand', 'error');
    } finally {
      setAddingBrand(false);
    }
  };

  // Form Submit Handler
  // actionType:
  // - 'save': updates existing item in edit mode, or creates in create mode
  // - 'saveAndAddAnother': creates in create mode and resets form
  // - 'saveAsNew': in edit mode, creates a BRAND NEW item in DB with form values without altering the existing item!
  const handleSubmit = async (e?: React.FormEvent, actionType: 'save' | 'saveAndAddAnother' | 'saveAsNew' = 'save') => {
    if (e) e.preventDefault();
    setError('');

    let targetCategoryId = subSubCategoryId || subCategoryId || parentCategoryId;
    if (!name.trim()) {
      setError('Item Name is required.');
      return;
    }
    if (!targetCategoryId) {
      // Auto-fallback to "Other" category if left unselected
      const otherCat = categories.find((c) => c.name.toLowerCase() === 'other' || c.name.toLowerCase() === 'others' || c.id === 'other');
      targetCategoryId = otherCat ? otherCat.id : 'other';
    }

    if (numCost < 0 || numRetailer < 0 || numCustomer < 0) {
      setError('Prices cannot be negative.');
      return;
    }

    if (actionType === 'saveAsNew') {
      setSavingNew(true);
    } else {
      setSaving(true);
    }

    const payload = {
      name: name.trim(),
      srNo: srNo.trim() || null,
      categoryId: targetCategoryId,
      brand: brand.trim() || null,
      itemCode: itemCode.trim() || null,
      modelNumber: modelNumber.trim() || null,
      costPrice: numCost,
      retailerPrice: numRetailer,
      customerPrice: numCustomer,
      unit: unit.trim() || 'pcs',
      notes: notes.trim() || null,
      changeNote: actionType === 'saveAsNew' ? `Created as copy from ${itemId}` : (changeNote.trim() || undefined),
    };

    try {
      let res: Response;
      if (mode === 'edit' && actionType === 'save' && itemId) {
        // Save changes to current existing item
        res = await fetch(`/api/items/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create brand new item in DB (either create mode or "Save & Create New" in edit mode)
        res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        if (actionType === 'saveAsNew') {
          notify(`Created brand new item "${name.trim()}" (Original item preserved)`, 'success');
          router.push(`/items/${data.item.id}`);
          return;
        }

        notify(mode === 'edit' ? `Updated "${name.trim()}"` : `Created "${name.trim()}"`, 'success');

        if (actionType === 'saveAndAddAnother') {
          setName('');
          setItemCode('');
          setModelNumber('');
          setCostPrice('');
          setRetailerPrice('');
          setCustomerPrice('');
          setNotes('');
          setPrefilledFromName('');
          setSaving(false);
          return;
        }

        if (onSuccess) {
          onSuccess(data.item);
        } else {
          router.push(`/items/${data.item.id}`);
        }
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Error submitting item:', err);
      setError('An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
      setSavingNew(false);
    }
  };

  // Delete Item Handler
  const handleDelete = async () => {
    if (!itemId) return;
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/items/${itemId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        notify(`Deleted "${name}"`, 'info');
        router.push('/items');
      } else {
        notify(data.message || 'Failed to delete item', 'error');
      }
    } catch {
      notify('Error deleting item', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Parent, Sub, and Sub-sub categories lists
  const parentCategories = categories.filter((c) => !c.parentId);
  const subCategories = parentCategoryId ? categories.filter((c) => c.parentId === parentCategoryId) : [];
  const subSubCategories = subCategoryId ? categories.filter((c) => c.parentId === subCategoryId) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={onCancel ? '#' : (mode === 'edit' && itemId ? `/items/${itemId}` : '/items')}
            onClick={onCancel ? (e) => { e.preventDefault(); onCancel(); } : undefined}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              {mode === 'edit' ? (
                <>
                  <span>Edit Item</span>
                  {brand && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800/60">
                      {brand}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span>Create New Item</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-200 dark:border-cyan-800/60">
                    Price Book
                  </span>
                </>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mode === 'edit'
                ? 'Update item specifications, prices, or save as a new item'
                : 'Add a new product with rates, margins & category classification'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2.5 animate-shake">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, 'save')} className="space-y-6">
        {/* ─── SECTION 1: CATEGORY SELECTION ─────────────────────────────────── */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xs space-y-4 relative z-30 overflow-visible">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
              <FolderTree className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Category & Classification (Multi-Level Hierarchy)</span>
            </div>
            <div className="text-[11px] text-slate-400">Step 1 of 3</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* L1 Main Parent Category */}
            <ModernDropdown
              label="Main Category (L1)"
              icon={<Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              placeholder="Select Category (Optional - Default: Other)"
              value={parentCategoryId}
              onChange={handleParentChange}
              onAddNew={() => setShowAddParentModal(true)}
              addNewText="New Category"
              options={parentCategories.map((cat) => ({
                value: cat.id,
                label: cat.name,
                icon: <Layers className="w-3.5 h-3.5" />,
              }))}
            />

            {/* L2 Subcategory */}
            <ModernDropdown
              label="Subcategory (L2)"
              icon={<Folder className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
              placeholder={subCategories.length === 0 ? '(No Subcategories - Direct to Main)' : 'Select Subcategory'}
              disabled={!parentCategoryId || subCategories.length === 0}
              disabledPlaceholder={!parentCategoryId ? 'Select Main Category first' : '(None - Direct to Main)'}
              value={subCategoryId}
              onChange={handleSubChange}
              onAddNew={parentCategoryId ? () => setShowAddSubModal(true) : undefined}
              addNewText="New Subcategory"
              options={subCategories.map((cat) => ({
                value: cat.id,
                label: cat.name,
                icon: <Folder className="w-3.5 h-3.5" />,
              }))}
            />

            {/* L3 Sub-Subcategory */}
            <ModernDropdown
              label="Sub-Subcategory (L3)"
              icon={<CornerDownRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
              placeholder={subSubCategories.length === 0 ? '(None - Use Subcategory)' : 'Select Sub-Subcategory'}
              disabled={!subCategoryId || subSubCategories.length === 0}
              disabledPlaceholder={!subCategoryId ? 'Select Subcategory first' : '(None - Use Subcategory)'}
              value={subSubCategoryId}
              onChange={setSubSubCategoryId}
              onAddNew={subCategoryId ? () => setShowAddSubSubModal(true) : undefined}
              addNewText="New Sub-Sub"
              options={subSubCategories.map((cat) => ({
                value: cat.id,
                label: cat.name,
                icon: <CornerDownRight className="w-3.5 h-3.5" />,
              }))}
            />
          </div>
        </div>

        {/* ─── SECTION 2: BASIC PRODUCT INFORMATION & AUTO-SUGGEST ────────────── */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xs space-y-4 relative z-20 overflow-visible">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
              <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Basic Item Details</span>
            </div>
            <div className="text-[11px] text-slate-400">Step 2 of 3</div>
          </div>

          {/* Banner if auto-filled from suggestion */}
          {prefilledFromName && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Auto-filled from <strong>&quot;{prefilledFromName}&quot;</strong>. You can modify brand/prices and save as a new item.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPrefilledFromName('')}
                className="text-slate-400 hover:text-slate-600 p-1"
                title="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Item Name with Floating Auto-Suggestions */}
            <div className="sm:col-span-8 space-y-1.5 relative" ref={suggestionsRef}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Item / Product Name <span className="text-rose-500">*</span>
                </label>
                {mode === 'create' && (
                  <span className="text-[10px] text-slate-400 font-medium">Type to auto-suggest & prefill</span>
                )}
              </div>

              <input
                type="text"
                required
                value={name}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setName(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="e.g. L.B. BUSH 28x30x50 or V-4 Impeller"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />

              {/* Floating Suggestions Dropdown */}
              {mode === 'create' && showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-xl p-2 space-y-1 max-h-64 overflow-y-auto animate-fade-in backdrop-blur-md">
                  <div className="px-2 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Existing Items (Click to Auto-fill)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Found {suggestions.length}</span>
                  </div>
                  {suggestions.map((sug) => (
                    <button
                      key={sug.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(sug)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/60 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                          {sug.name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          {sug.brand && (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {sug.brand}
                            </span>
                          )}
                          {sug.category?.name && <span>• {sug.category.name}</span>}
                          {sug.srNo && <span className="font-mono">Sr. {sug.srNo}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-price font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(sug.customerPrice)}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">
                          Cost: {formatCurrency(sug.costPrice)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Serial Number (Sr. No.) */}
            <div className="sm:col-span-4 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Sr. No.</span>
                <span className="text-[10px] font-normal text-slate-400">e.g. 1, 1.1, 2.3</span>
              </label>
              <input
                type="text"
                value={srNo}
                onChange={(e) => setSrNo(e.target.value)}
                placeholder="1 or 1.1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Company / Brand Selection */}
            <div className="sm:col-span-6">
              <ModernDropdown
                label="Company / Brand"
                icon={<Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                placeholder="Select Brand (Optional)"
                value={brand}
                onChange={setBrand}
                onAddNew={() => setShowAddBrandModal(true)}
                addNewText="+ New Brand"
                options={[
                  { value: '', label: '(No Brand / Generic)' },
                  ...brands.map((b) => ({
                    value: b,
                    label: b,
                    icon: <Building2 className="w-3.5 h-3.5" />,
                  })),
                ]}
              />
            </div>

            {/* Item Code */}
            <div className="sm:col-span-3 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Item Code
              </label>
              <input
                type="text"
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                placeholder="e.g. JK-101"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Unit */}
            <div className="sm:col-span-3">
              <ModernDropdown
                label="Unit of Measure"
                icon={<Package className="w-3.5 h-3.5 text-slate-400" />}
                value={unit}
                onChange={setUnit}
                searchable={false}
                options={[
                  { value: 'pcs', label: 'Pieces (pcs)' },
                  { value: 'set', label: 'Set (set)' },
                  { value: 'pkt', label: 'Packet (pkt)' },
                  { value: 'box', label: 'Box (box)' },
                  { value: 'mtr', label: 'Meter (mtr)' },
                  { value: 'kg', label: 'Kilogram (kg)' },
                  { value: 'ltr', label: 'Liter (ltr)' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* ─── SECTION 3: PRICING & MARGIN ANALYSIS ───────────────────────────── */}
        {/* ─── SECTION 3: PRICING & MARGIN ANALYSIS ───────────────────────────── */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xs space-y-5 relative z-10 overflow-visible">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Pricing & Profit Margins</span>
            </div>
            <div className="text-[11px] text-slate-400">Step 3 of 3</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Cost Price */}
            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/30 space-y-2">
              <label className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center justify-between">
                <span>Cost Price (₹)</span>
                <span className="text-[10px] text-rose-500 font-normal">Purchase Rate</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-rose-600 dark:text-rose-400 text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 font-mono font-bold text-base focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Base purchase cost per {unit}
              </div>
            </div>

            {/* Retailer Price */}
            <div className="p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200/80 dark:border-cyan-900/30 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-cyan-700 dark:text-cyan-400">
                  Retailer Price (₹)
                </label>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-300 font-mono font-bold">
                  +{retailerMarkup}%
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-cyan-600 dark:text-cyan-400 text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={retailerPrice}
                  onChange={(e) => setRetailerPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-cyan-200 dark:border-cyan-900/50 text-cyan-700 dark:text-cyan-300 font-mono font-bold text-base focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                />
              </div>
              <div className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                Profit: +{formatCurrency(retailerProfit)}
              </div>
            </div>

            {/* Customer Price */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/30 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Customer Price (₹)
                </label>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-mono font-bold">
                  +{customerMarkup}%
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-emerald-600 dark:text-emerald-400 text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={customerPrice}
                  onChange={(e) => setCustomerPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-base focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                Profit: +{formatCurrency(customerProfit)}
              </div>
            </div>
          </div>

          {/* Notes & Optional Reason for change */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Item Notes & Specifications
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Dimensions, grade, or packaging notes..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 resize-none"
              />
            </div>

            {mode === 'edit' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Price Change Reason</span>
                  <span className="text-[10px] text-slate-400">(Saved to history)</span>
                </label>
                <input
                  type="text"
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  placeholder="e.g. Manufacturer price revision 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />
              </div>
            )}
          </div>
        </div>

        {/* ─── ACTION BUTTONS ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            {mode === 'edit' && (
              <button
                type="button"
                disabled={deleting || saving || savingNew}
                onClick={handleDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? 'Deleting...' : 'Delete Item'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            <Link
              href={onCancel ? '#' : (mode === 'edit' && itemId ? `/items/${itemId}` : '/items')}
              onClick={onCancel ? (e) => { e.preventDefault(); onCancel(); } : undefined}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-all"
            >
              Cancel
            </Link>

            {/* In Edit Mode: 3 Buttons (Cancel, Save & Create New, Save Changes) */}
            {mode === 'edit' && (
              <button
                type="button"
                disabled={saving || savingNew}
                onClick={(e) => handleSubmit(e, 'saveAsNew')}
                className="px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Create a brand new item in database with above details (preserves original item)"
              >
                <FilePlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>{savingNew ? 'Creating...' : 'Save & Create New'}</span>
              </button>
            )}

            {/* Main Action Button */}
            <button
              type="submit"
              disabled={saving || savingNew}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : (mode === 'edit' ? 'Save Changes' : 'Create Item')}</span>
            </button>
          </div>
        </div>
      </form>

      {/* ─── INLINE MODAL: ADD PARENT CATEGORY ─────────────────────────────────── */}
      {showAddParentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="glass-card w-full max-w-sm rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add Main Category</h3>
              <button
                type="button"
                onClick={() => setShowAddParentModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <form onSubmit={handleCreateParent} className="space-y-3">
              <input
                type="text"
                required
                autoFocus
                value={newParentName}
                onChange={(e) => setNewParentName(e.target.value)}
                placeholder="e.g. C.I. Submersible Parts"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddParentModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingParent}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-xs"
                >
                  {addingParent ? 'Adding...' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── INLINE MODAL: ADD SUBCATEGORY (L2) ────────────────────────────────── */}
      {showAddSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="glass-card w-full max-w-sm rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add Subcategory (L2)</h3>
              <button
                type="button"
                onClick={() => setShowAddSubModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <form onSubmit={handleCreateSub} className="space-y-3">
              <div className="text-xs text-slate-500">
                Under: <strong className="text-slate-800 dark:text-slate-200">{parentCategories.find(p => p.id === parentCategoryId)?.name}</strong>
              </div>
              <input
                type="text"
                required
                autoFocus
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                placeholder="e.g. V-4 Impeller"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingSub}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-xs"
                >
                  {addingSub ? 'Adding...' : 'Add Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── INLINE MODAL: ADD SUB-SUBCATEGORY (L3) ─────────────────────────── */}
      {showAddSubSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="glass-card w-full max-w-sm rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add Sub-Subcategory (L3)</h3>
              <button
                type="button"
                onClick={() => setShowAddSubSubModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubSub} className="space-y-3">
              <div className="text-xs text-slate-500">
                Inside: <strong className="text-slate-800 dark:text-slate-200">{subCategories.find(s => s.id === subCategoryId)?.name}</strong>
              </div>
              <input
                type="text"
                required
                autoFocus
                value={newSubSubName}
                onChange={(e) => setNewSubSubName(e.target.value)}
                placeholder="e.g. Raj & Raj Rubber"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubSubModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingSubSub}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white shadow-xs"
                >
                  {addingSubSub ? 'Adding...' : 'Add Sub-Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── INLINE MODAL: ADD BRAND ─────────────────────────────────────────── */}
      {showAddBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="glass-card w-full max-w-sm rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add Company / Brand</h3>
              <button
                type="button"
                onClick={() => setShowAddBrandModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <form onSubmit={handleCreateBrand} className="space-y-3">
              <input
                type="text"
                required
                autoFocus
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="e.g. CRI, Falcon, Shakti, Lubi, Kirloskar"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBrandModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingBrand}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-xs"
                >
                  {addingBrand ? 'Adding...' : 'Add & Select Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
