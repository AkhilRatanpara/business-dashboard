'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search, PlusCircle, Edit3, Trash2, RefreshCw, FileText,
  Layers, SlidersHorizontal, LayoutGrid, Table2, ChevronDown, ChevronRight, Plus
} from 'lucide-react';
import { formatCurrency, formatProfit } from '@/lib/utils';
import { QuickEditModal } from '@/components/items/QuickEditModal';
import { PdfPriceListModal } from '@/components/items/PdfPriceListModal';
import { notify } from '@/components/ui/Toast';

interface Item {
  id: string;
  name: string;
  itemCode?: string;
  brand?: string;
  modelNumber?: string;
  costPrice: number;
  retailerPrice: number;
  customerPrice: number;
  retailerProfit: number;
  customerProfit: number;
  retailerMarkup: number;
  customerMarkup: number;
  catalogGroup?: string | null;
  catalogSrNo?: number | null;
  variantSrNo?: number | null;
  sourcePage?: number | null;
  unit?: string;
  category: { id: string; name: string; parent?: { id: string; name: string } | null };
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  _count?: { items: number };
}

interface HierarchicalGroup {
  id: string;
  name: string;
  directItems: Item[];
  subcategories: {
    id: string;
    name: string;
    items: Item[];
  }[];
}

// ─── Price Stacked Cell ───────────────────────────────────────────────────────
function PriceCell({
  price,
  profit,
  priceClass,
  profitClass,
  profitBg,
}: {
  price: string;
  profit?: number;
  priceClass: string;
  profitClass?: string;
  profitBg?: string;
}) {
  return (
    <div>
      <div className={`font-price font-medium text-sm sm:text-base leading-snug ${priceClass}`}>{price}</div>
      {profit !== undefined && (
        <div className={`inline-flex items-center mt-1 font-price text-[10px] sm:text-[11px] font-bold px-1.5 py-[2px] rounded-md ${profitBg} ${profitClass} whitespace-nowrap`}>
          +{formatProfit(profit)}
        </div>
      )}
    </div>
  );
}

// ─── Table Item Row ───────────────────────────────────────────────────────────
function ItemRow({
  item,
  onNavigate,
  onEdit,
  onDelete,
}: {
  item: Item;
  onNavigate: (id: string) => void;
  onEdit: (e: React.MouseEvent, item: Item) => void;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
}) {
  return (
    <tr
      onClick={() => onNavigate(item.id)}
      className="hover:bg-slate-50/85 dark:hover:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/60 cursor-pointer transition-colors group"
    >
      <td className="py-3 px-4">
        {item.catalogSrNo && (
          <span className="mr-2 inline-flex rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
            Sr. {item.catalogSrNo}{item.variantSrNo ? `.${item.variantSrNo}` : ''}
          </span>
        )}
        <div className="font-bold text-[13px] text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-450 transition-colors leading-tight">
          {item.name}
        </div>
        {item.brand && (
          <div className="text-[11px] text-slate-400 dark:text-slate-550 mt-0.5 leading-none">{item.brand}</div>
        )}
      </td>
      <td className="py-3 px-3 hidden sm:table-cell">
        <span className="font-price text-xs text-slate-400 dark:text-slate-500 font-mono">{item.itemCode || '—'}</span>
      </td>
      {/* Cost */}
      <td className="py-3 px-4 align-top">
        <PriceCell
          price={formatCurrency(item.costPrice)}
          priceClass="text-rose-600 dark:text-rose-400"
        />
      </td>
      {/* Retailer */}
      <td className="py-3 px-4 align-top">
        <PriceCell
          price={formatCurrency(item.retailerPrice)}
          profit={item.retailerProfit}
          priceClass="text-cyan-600 dark:text-cyan-400"
          profitClass="text-cyan-600 dark:text-cyan-400"
          profitBg="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/40"
        />
      </td>
      {/* Customer */}
      <td className="py-3 px-4 align-top">
        <PriceCell
          price={formatCurrency(item.customerPrice)}
          profit={item.customerProfit}
          priceClass="text-emerald-600 dark:text-emerald-400"
          profitClass="text-emerald-600 dark:text-emerald-400"
          profitBg="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40"
        />
      </td>
      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={(e) => onEdit(e, item)}
            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all"
            title="Quick Edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => onDelete(e, item.id, item.name)}
            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-500 flex items-center justify-center transition-all"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Mobile Card View Item ────────────────────────────────────────────────────
function MobileItemCard({
  item,
  onNavigate,
  onEdit,
  onDelete,
}: {
  item: Item;
  onNavigate: (id: string) => void;
  onEdit: (e: React.MouseEvent, item: Item) => void;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
}) {
  return (
    <div
      onClick={() => onNavigate(item.id)}
      className="bg-white dark:bg-slate-900/80 rounded-2xl p-4 space-y-3 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-400/50 hover:shadow-md transition-all shadow-xs"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-snug">{item.name}</h3>
          {item.catalogSrNo && (
            <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Sr. {item.catalogSrNo}{item.variantSrNo ? `.${item.variantSrNo}` : ''}{item.sourcePage ? ` · Page ${item.sourcePage}` : ''}
            </p>
          )}
          {(item.itemCode || item.brand) && (
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
              {item.itemCode}{item.brand ? ` • ${item.brand}` : ''}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => onEdit(e, item)}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => onDelete(e, item.id, item.name)}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 flex items-center justify-center transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-center items-center">
        <div className="bg-rose-50 dark:bg-rose-950/30 p-1.5 rounded-lg border border-rose-100/80 dark:border-rose-900/40">
          <span className="text-[9px] text-rose-700 dark:text-rose-455 font-bold block uppercase tracking-wider">Cost</span>
          <span className="font-price font-bold text-rose-700 dark:text-rose-400 text-xs leading-tight block">{formatCurrency(item.costPrice)}</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-bold uppercase tracking-wider">Retailer</span>
          <span className="font-price font-bold text-cyan-600 dark:text-cyan-400 text-xs leading-tight block">{formatCurrency(item.retailerPrice)}</span>
          <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 block mt-0.5">+{formatProfit(item.retailerProfit)}</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-bold uppercase tracking-wider">Customer</span>
          <span className="font-price font-bold text-emerald-600 dark:text-emerald-400 text-xs leading-tight block">{formatCurrency(item.customerPrice)}</span>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">+{formatProfit(item.customerProfit)}</span>
        </div>
      </div>
    </div>
  );
}

function MobileVariantGroup({
  title, items, collapsed, onToggle, onNavigate, onEdit, onDelete,
}: {
  title: string; items: Item[]; collapsed: boolean; onToggle: () => void;
  onNavigate: (id: string) => void; onEdit: (e: React.MouseEvent, item: Item) => void;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
}) {
  return (
    <section className="space-y-2">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2.5 text-left"
      >
        <span className="flex min-w-0 items-center gap-2 text-xs font-black text-emerald-900 dark:text-emerald-400">
          <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${collapsed ? '' : 'rotate-90'}`} />
          {title}
        </span>
        <span className="rounded-full bg-white dark:bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-800">
          {items.length} options
        </span>
      </button>
      {!collapsed && (
        <div className="space-y-2 pl-2">
          {items.map((item) => (
            <MobileItemCard
              key={item.id}
              item={item}
              onNavigate={onNavigate}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Collapsible Hierarchy Table Section ─────────────────────────────────────
function CategoryTableSection({
  parentGroup,
  onEdit,
  onDelete,
  onNavigate,
  isCollapsed,
  onToggle,
  catCollapsed,
  toggleCatCollapse,
  isCatCollapsed,
}: {
  parentGroup: HierarchicalGroup;
  onEdit: (e: React.MouseEvent, item: Item) => void;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
  onNavigate: (id: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  catCollapsed: Record<string, boolean>;
  toggleCatCollapse: (id: string) => void;
  isCatCollapsed: (id: string) => boolean;
}) {
  const totalItemsCount = parentGroup.directItems.length + parentGroup.subcategories.reduce((acc, sub) => acc + sub.items.length, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Parent Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-805 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
      >
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-450" />
          <span className="font-black text-sm text-slate-850 dark:text-slate-150 tracking-wide uppercase">{parentGroup.name}</span>
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 px-2.5 py-0.5 rounded-full">
            {totalItemsCount}
          </span>
        </div>
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {!isCollapsed && (
        <div className="p-4 space-y-4 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
          {/* Direct Parent Items */}
          {parentGroup.directItems.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/60 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/80">
                    <th className="py-2.5 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Root Item</th>
                    <th className="py-2.5 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">Code</th>
                    <th className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#e11d48' }}>Cost</th>
                    <th className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#0891b2' }}>Retailer</th>
                    <th className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#059669' }}>Customer</th>
                    <th className="py-2.5 px-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {parentGroup.directItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onNavigate={onNavigate}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Subcategories inside Parent */}
          {parentGroup.subcategories.map((sub) => {
            const subCollapsed = isCatCollapsed(sub.id);
            return (
              <div key={sub.id} className="pt-4 first:pt-0 space-y-2.5">
                {/* Subcategory Collapsible Trigger */}
                <button
                  type="button"
                  onClick={() => toggleCatCollapse(sub.id)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight className={`w-3.5 h-3.5 text-slate-450 dark:text-slate-600 transition-transform ${!subCollapsed ? 'rotate-90' : ''}`} />
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-300">{sub.name}</span>
                    <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/60">
                      {sub.items.length} items
                    </span>
                  </div>
                </button>

                {!subCollapsed && (
                  <div className="pl-3 overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/60 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/80">
                          <th className="py-2.5 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Subcategory Item</th>
                          <th className="py-2.5 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">Code</th>
                          <th className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#e11d48' }}>Cost</th>
                          <th className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#0891b2' }}>Retailer</th>
                          <th className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#059669' }}>Customer</th>
                          <th className="py-2.5 px-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                        {sub.items.map((item) => (
                          <ItemRow
                            key={item.id}
                            item={item}
                            onNavigate={onNavigate}
                            onEdit={onEdit}
                            onDelete={onDelete}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Items Content Page Component ────────────────────────────────────────
function ItemsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('categoryId') || '';
  const initialSort = searchParams.get('sort') || 'catalog';

  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [sort, setSort] = useState(initialSort);
  const [viewMode, setViewMode] = useState<'cards' | 'category'>('cards');
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [catCollapsed, setCatCollapsed] = useState<Record<string, boolean>>({});

  const [selectedItemForEdit, setSelectedItemForEdit] = useState<Item | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const toggleCatCollapse = (catId: string) => {
    setCatCollapsed((prev) => ({ ...prev, [catId]: !isCatCollapsed(catId) }));
  };

  const isCatCollapsed = (catId: string) => {
    return catId in catCollapsed ? catCollapsed[catId] : allCollapsed;
  };

  const handleCollapseAll = () => {
    const next = !allCollapsed;
    setAllCollapsed(next);
    setCatCollapsed({});
  };

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories', { cache: 'no-store' });
        const data = await res.json();
        if (data.success) setCategories(data.categories);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    if (initialCategory && categories.length > 0) {
      const found = categories.find((c) => c.id === initialCategory);
      if (found) {
        if (found.parentId) {
          setParentCategoryId(found.parentId);
          setSubCategoryId(found.id);
        } else {
          setParentCategoryId(found.id);
          setSubCategoryId('');
        }
      }
    }
  }, [initialCategory, categories]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('q', search);

      const selectedId = subCategoryId || parentCategoryId;
      if (selectedId) query.set('categoryId', selectedId);

      if (sort) query.set('sort', sort);

      const res = await fetch(`/api/items?${query.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setItems(data.items);
    } catch (err) {
      console.error('Error loading items:', err);
    } finally {
      setLoading(false);
    }
  }, [search, parentCategoryId, subCategoryId, sort]);

  useEffect(() => {
    const timer = setTimeout(() => fetchItems(), 200);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  const handleDeleteItem = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        notify(`Deleted "${name}"`, 'info');
        fetchItems();
      } else {
        notify(data.message || 'Failed to delete', 'error');
      }
    } catch {
      notify('Error deleting item', 'error');
    }
  };

  const handleQuickEdit = (e: React.MouseEvent, item: Item) => {
    e.stopPropagation();
    setSelectedItemForEdit(item);
  };

  // Group items hierarchically into Category -> Subcategory trees
  const buildHierarchy = (itemsList: Item[]): HierarchicalGroup[] => {
    const parentMap = new Map<string, HierarchicalGroup>();

    itemsList.forEach((item) => {
      let parentId: string;
      let parentName: string;
      let isSub = false;
      let subId = '';
      let subName = '';

      if (item.category.parent) {
        parentId = item.category.parent.id;
        parentName = item.category.parent.name;
        isSub = true;
        subId = item.category.id;
        subName = item.category.name;
      } else {
        parentId = item.category.id;
        parentName = item.category.name;
      }

      if (!parentMap.has(parentId)) {
        parentMap.set(parentId, {
          id: parentId,
          name: parentName,
          directItems: [],
          subcategories: [],
        });
      }

      const parentGroup = parentMap.get(parentId)!;

      if (isSub) {
        let subGroup = parentGroup.subcategories.find((s) => s.id === subId);
        if (!subGroup) {
          subGroup = { id: subId, name: subName, items: [] };
          parentGroup.subcategories.push(subGroup);
        }
        subGroup.items.push(item);
      } else {
        parentGroup.directItems.push(item);
      }
    });

    // Sort categories using their catalog sort order
    return Array.from(parentMap.values()).sort((a, b) => {
      const catA = categories.find((c) => c.id === a.id);
      const catB = categories.find((c) => c.id === b.id);
      return (catA?.id || '').localeCompare(catB?.id || '');
    });
  };

  const hierarchicalGroups = buildHierarchy(items);

  return (
    <div className="space-y-4 sm:space-y-5 pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Items Price Book</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Gunatit Submersible • 9925531065</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowPdfModal(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm transition-all"
          >
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-450" />
            <span>PDF</span>
          </button>

          <Link
            href="/items/manage"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm transition-all"
          >
            <SlidersHorizontal className="w-4 h-4 text-violet-505 dark:text-violet-400" />
            <span>Manage</span>
          </Link>

          <Link
            href="/items/new"
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Item</span>
          </Link>
        </div>
      </div>

      {/* ── Filters Row ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-805 shadow-sm p-3 flex flex-col lg:flex-row gap-2.5 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, code, brand…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 font-bold"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
          {/* Main Category Filter */}
          <select
            value={parentCategoryId}
            onChange={(e) => {
              setParentCategoryId(e.target.value);
              setSubCategoryId('');
            }}
            className="flex-1 sm:flex-none sm:w-44 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 font-bold"
          >
            <option value="">All Main Categories</option>
            {categories
              .filter((c) => !c.parentId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>

          {/* Subcategory Filter */}
          <select
            value={subCategoryId}
            onChange={(e) => setSubCategoryId(e.target.value)}
            disabled={!parentCategoryId}
            className="flex-1 sm:flex-none sm:w-44 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 font-bold disabled:opacity-50"
          >
            <option value="">All Subcategories</option>
            {categories
              .filter((c) => c.parentId === parentCategoryId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="flex-1 sm:flex-none sm:w-44 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 font-bold"
          >
            <option value="catalog">PDF catalogue order</option>
            <option value="name_asc">Name (A–Z)</option>
            <option value="name_desc">Name (Z–A)</option>
            <option value="updated_desc">Recently Updated</option>
            <option value="cost_asc">Cost (Low → High)</option>
            <option value="cost_desc">Cost (High → Low)</option>
          </select>

          {/* View Toggle + Collapse All */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCollapseAll}
              title={allCollapsed ? 'Expand All' : 'Collapse All'}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200/50 dark:border-slate-700"
            >
              {allCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Expand</span>
                </>
              ) : (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Collapse</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 rounded-xl p-1 border border-slate-200/60 dark:border-slate-800/80">
              <button
                onClick={() => setViewMode('cards')}
                title="Card View"
                className={`w-8 h-7 rounded-lg flex items-center justify-center transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-800 shadow-xs text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('category')}
                title="Category Table View"
                className={`w-8 h-7 rounded-lg flex items-center justify-center transition-all ${
                  viewMode === 'category'
                    ? 'bg-white dark:bg-slate-800 shadow-xs text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      {loading ? (
        <div className="py-14 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
          Loading items…
        </div>
      ) : !items.length ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">No items matched your search.</p>
        </div>
      ) : viewMode === 'category' ? (
        /* ── CATEGORY TABLE VIEW ── */
        <div className="space-y-4">
          {hierarchicalGroups.map((group) => (
            <CategoryTableSection
              key={group.id}
              parentGroup={group}
              onEdit={handleQuickEdit}
              onDelete={handleDeleteItem}
              onNavigate={(id) => router.push(`/items/${id}`)}
              isCollapsed={isCatCollapsed(group.id)}
              onToggle={() => toggleCatCollapse(group.id)}
              catCollapsed={catCollapsed}
              toggleCatCollapse={toggleCatCollapse}
              isCatCollapsed={isCatCollapsed}
            />
          ))}
        </div>
      ) : (
        /* ── CARDS VIEW (default) ── */
        <div className="space-y-5">
          {/* Desktop table — clean single-row price alignment */}
          <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/80">
                  <th className="py-3 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Item & Code</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#e11d48' }}>Cost Price</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#0891b2' }}>Retailer Rate</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#059669' }}>Customer Price</th>
                  <th className="py-3 px-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/items/${item.id}`)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-950/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-5">
                      {item.catalogSrNo && (
                        <span className="mr-2 inline-flex rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          Sr. {item.catalogSrNo}{item.variantSrNo ? `.${item.variantSrNo}` : ''}
                        </span>
                      )}
                      <div className="font-bold text-[13px] text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-450 transition-colors leading-tight inline-block">
                        {item.name}
                      </div>
                      {item.itemCode && (
                        <div className="font-price text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{item.itemCode}</div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-[13px] text-slate-600 dark:text-slate-300 font-medium">
                        {item.category.parent ? `${item.category.parent.name} → ${item.category.name}` : item.category.name}
                      </div>
                      {item.brand && <div className="text-[11px] text-slate-400 dark:text-slate-550 mt-0.5">{item.brand}</div>}
                    </td>
                    {/* Cost */}
                    <td className="py-4 px-4 align-top">
                      <PriceCell
                        price={formatCurrency(item.costPrice)}
                        priceClass="text-rose-600 dark:text-rose-455"
                      />
                    </td>
                    {/* Retailer */}
                    <td className="py-4 px-4 align-top">
                      <PriceCell
                        price={formatCurrency(item.retailerPrice)}
                        profit={item.retailerProfit}
                        priceClass="text-cyan-600 dark:text-cyan-400"
                        profitClass="text-cyan-600 dark:text-cyan-400"
                        profitBg="bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/40"
                      />
                    </td>
                    {/* Customer */}
                    <td className="py-4 px-4 align-top">
                      <PriceCell
                        price={formatCurrency(item.customerPrice)}
                        profit={item.customerProfit}
                        priceClass="text-emerald-600 dark:text-emerald-400"
                        profitClass="text-emerald-600 dark:text-emerald-400"
                        profitBg="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40"
                      />
                    </td>
                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleQuickEdit(e, item)}
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all"
                          title="Quick Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteItem(e, item.id, item.name)}
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-500 dark:text-rose-455 flex items-center justify-center transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards — grouped hierarchically by category trees */}
          <div className="lg:hidden space-y-5">
            {hierarchicalGroups.map((group) => {
              const parentCollapsed = isCatCollapsed(group.id);
              const totalItemsCount = group.directItems.length + group.subcategories.reduce((acc, sub) => acc + sub.items.length, 0);

              return (
                <div key={group.id} className="space-y-2.5">
                  {/* Parent Category label — tappable to collapse */}
                  <button
                    type="button"
                    onClick={() => toggleCatCollapse(group.id)}
                    className="w-full sticky top-12 z-10 py-2.5 px-4 bg-white/95 dark:bg-slate-905/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-900 dark:text-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-450" />
                      <span className="font-black text-sm uppercase tracking-wide">{group.name}</span>
                      <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 px-2 py-0.5 rounded-full">
                        {totalItemsCount}
                      </span>
                    </div>
                    {parentCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {!parentCollapsed && (
                    <div className="space-y-3.5 pl-1.5 border-l border-slate-150 dark:border-slate-800 ml-1">
                      {/* Catalogue rows that do not have variants */}
                      {group.directItems.filter((item) => !item.catalogGroup).map((item) => (
                        <MobileItemCard
                          key={item.id}
                          item={item}
                          onNavigate={(id) => router.push(`/items/${id}`)}
                          onEdit={handleQuickEdit}
                          onDelete={handleDeleteItem}
                        />
                      ))}

                      {/* Each family (for example V-4 SUCTION or a bearing plate) opens independently. */}
                      {Array.from(new Map(group.directItems.filter((item) => item.catalogGroup).map((item) => [item.catalogGroup!, group.directItems.filter((candidate) => candidate.catalogGroup === item.catalogGroup)])).entries()).map(([groupName, groupItems]) => {
                        const groupKey = `${group.id}:${groupName}`;
                        return (
                          <MobileVariantGroup
                            key={groupKey}
                            title={groupName}
                            items={groupItems}
                            collapsed={isCatCollapsed(groupKey)}
                            onToggle={() => toggleCatCollapse(groupKey)}
                            onNavigate={(id) => router.push(`/items/${id}`)}
                            onEdit={handleQuickEdit}
                            onDelete={handleDeleteItem}
                          />
                        );
                      })}

                      {/* Subcategories items (e.g., V4 inside CI PART) */}
                      {group.subcategories.map((sub) => {
                        const subCollapsed = isCatCollapsed(sub.id);
                        return (
                          <div key={sub.id} className="space-y-2">
                            <button
                              type="button"
                              onClick={() => toggleCatCollapse(sub.id)}
                              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-extrabold border border-slate-200 dark:border-slate-800 transition-all"
                            >
                              <div className="flex items-center gap-1.5">
                                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${!subCollapsed ? 'rotate-90' : ''}`} />
                                <span>{sub.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-550 dark:text-slate-400 font-bold bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-300/40 dark:border-slate-700">
                                {sub.items.length} items
                              </span>
                            </button>

                            {!subCollapsed && (
                              <div className="space-y-2.5 pl-3">
                                {sub.items.map((item) => (
                                  <MobileItemCard
                                    key={item.id}
                                    item={item}
                                    onNavigate={(id) => router.push(`/items/${id}`)}
                                    onEdit={handleQuickEdit}
                                    onDelete={handleDeleteItem}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Floating Action Button (FAB) for adding new items */}
      <Link
        href="/items/new"
        title="Add New Item"
        className="sm:hidden fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-lg text-slate-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </Link>

      {/* Quick Edit Modal */}
      {selectedItemForEdit && (
        <QuickEditModal
          item={selectedItemForEdit}
          onClose={() => setSelectedItemForEdit(null)}
          onSave={() => {
            notify(`Prices updated for "${selectedItemForEdit.name}"`, 'success');
            fetchItems();
          }}
        />
      )}

      {/* PDF Modal */}
      {showPdfModal && (
        <PdfPriceListModal items={items} categories={categories} onClose={() => setShowPdfModal(false)} />
      )}
    </div>
  );
}

export default function ItemsPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-slate-400 text-xs">Loading price book…</div>}>
      <ItemsContent />
    </Suspense>
  );
}
