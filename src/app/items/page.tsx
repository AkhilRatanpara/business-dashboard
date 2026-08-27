'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search, PlusCircle, Edit3, Trash2, RefreshCw, FileText,
  Layers, SlidersHorizontal, LayoutGrid, Table2, ChevronDown, ChevronRight, TrendingUp
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
  unit?: string;
  category: { id: string; name: string };
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  _count?: { items: number };
}

// ─── Shared stacked price cell (price bold above, profit small below) ─────────
// All 3 columns use identical structure → perfect horizontal alignment
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
      <div className={`font-price font-medium text-base leading-snug ${priceClass}`}>{price}</div>
      {profit !== undefined && (
        <div className={`inline-flex items-center mt-1 font-price text-[11px] font-medium px-1.5 py-[2px] rounded-md ${profitBg} ${profitClass} whitespace-nowrap`}>
          +{formatProfit(profit)}
        </div>
      )}
    </div>
  );
}

// ─── Category Table Section (controlled collapse from parent) ─────────────────
function CategoryTableSection({
  catName,
  catItems,
  onEdit,
  onDelete,
  onNavigate,
  isCollapsed,
  onToggle,
}: {
  catName: string;
  catItems: Item[];
  onEdit: (e: React.MouseEvent, item: Item) => void;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
  onNavigate: (id: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Category Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-all"
      >
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-sm text-slate-800 tracking-wide">{catName}</span>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            {catItems.length}
          </span>
        </div>
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {!isCollapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="py-2.5 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Item</th>
                <th className="py-2.5 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest hidden sm:table-cell">Code</th>
                <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-widest" style={{color:'#e11d48'}}>Cost</th>
                <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-widest" style={{color:'#0891b2'}}>Retailer</th>
                <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-widest" style={{color:'#059669'}}>Customer</th>
                <th className="py-2.5 px-4 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {catItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-5">
                    <div className="font-semibold text-[13px] text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight">{item.name}</div>
                    {item.brand && (
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-none">{item.brand}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-3 hidden sm:table-cell">
                    <span className="font-price text-xs text-slate-400">{item.itemCode || '—'}</span>
                  </td>
                  {/* Cost */}
                  <td className="py-3.5 px-4 align-top">
                    <PriceCell
                      price={formatCurrency(item.costPrice)}
                      priceClass="text-rose-600"
                    />
                  </td>
                  {/* Retailer */}
                  <td className="py-3.5 px-4 align-top">
                    <PriceCell
                      price={formatCurrency(item.retailerPrice)}
                      profit={item.retailerProfit}
                      priceClass="text-cyan-600"
                      profitClass="text-cyan-600"
                      profitBg="bg-cyan-50 border border-cyan-100"
                    />
                  </td>
                  {/* Customer */}
                  <td className="py-3.5 px-4 align-top">
                    <PriceCell
                      price={formatCurrency(item.customerPrice)}
                      profit={item.customerProfit}
                      priceClass="text-emerald-600"
                      profitClass="text-emerald-600"
                      profitBg="bg-emerald-50 border border-emerald-100"
                    />
                  </td>
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => onEdit(e, item)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-all"
                        title="Quick Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => onDelete(e, item.id, item.name)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-all"
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
      )}
    </div>
  );
}

// ─── Main Items Content ────────────────────────────────────────────────────────
function ItemsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('categoryId') || '';
  const initialSort = searchParams.get('sort') || 'name_asc';

  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  // 'cards' = mobile cards (default), 'category' = grouped table view
  const [viewMode, setViewMode] = useState<'cards' | 'category'>('cards');
  // Global collapse state for category groups
  const [allCollapsed, setAllCollapsed] = useState(false);
  // Per-category local collapse overrides (key = catName)
  const [catCollapsed, setCatCollapsed] = useState<Record<string, boolean>>({});

  const [selectedItemForEdit, setSelectedItemForEdit] = useState<Item | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Toggle collapse for one specific category
  const toggleCatCollapse = (catName: string) => {
    setCatCollapsed((prev) => ({ ...prev, [catName]: !isCatCollapsed(catName) }));
  };

  // Whether a specific category is currently collapsed
  const isCatCollapsed = (catName: string) => {
    // Local override wins; fall back to global
    return catName in catCollapsed ? catCollapsed[catName] : allCollapsed;
  };

  // Collapse / expand ALL categories at once
  const handleCollapseAll = () => {
    const next = !allCollapsed;
    setAllCollapsed(next);
    setCatCollapsed({});  // clear per-cat overrides so global state takes effect
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

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('q', search);
      if (categoryId) query.set('categoryId', categoryId);
      if (sort) query.set('sort', sort);

      const res = await fetch(`/api/items?${query.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setItems(data.items);
    } catch (err) {
      console.error('Error loading items:', err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, sort]);

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

  // Group items by category for category view and mobile cards
  const groupedItemsMap = new Map<string, Item[]>();
  items.forEach((item) => {
    const catName = item.category.name;
    if (!groupedItemsMap.has(catName)) groupedItemsMap.set(catName, []);
    groupedItemsMap.get(catName)!.push(item);
  });

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Items Price Book</h1>
          <p className="text-xs text-slate-400 font-medium">Gunatit Submersible • 9925531065</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowPdfModal(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm transition-all"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>PDF</span>
          </button>

          <Link
            href="/items/manage"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm transition-all"
          >
            <SlidersHorizontal className="w-4 h-4 text-violet-500" />
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

      {/* ── Horizontal Category Pills ── */}
      <div className="w-full overflow-x-auto no-scrollbar pb-1">
        <div className="flex items-center gap-2 min-w-max">
          <button
            onClick={() => setCategoryId('')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
              categoryId === ''
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-400'
            }`}
          >
            All ({items.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryId(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                categoryId === cat.id
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-400'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters Row ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex flex-col sm:flex-row gap-2.5 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, code, brand…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
          />
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full sm:w-44 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 font-semibold"
        >
          <option value="name_asc">Name (A–Z)</option>
          <option value="name_desc">Name (Z–A)</option>
          <option value="updated_desc">Recently Updated</option>
          <option value="cost_asc">Cost (Low → High)</option>
          <option value="cost_desc">Cost (High → Low)</option>
        </select>

        {/* View Toggle + Collapse All */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Collapse All / Expand All button */}
          <button
            onClick={handleCollapseAll}
            title={allCollapsed ? 'Expand All' : 'Collapse All'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all"
          >
            {allCollapsed ? (
              <><ChevronDown className="w-3.5 h-3.5" /><span className="hidden sm:inline">Expand</span></>
            ) : (
              <><ChevronRight className="w-3.5 h-3.5" /><span className="hidden sm:inline">Collapse</span></>
            )}
          </button>

          {/* Card / Table toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('cards')}
              title="Card View"
              className={`w-8 h-7 rounded-lg flex items-center justify-center transition-all ${
                viewMode === 'cards'
                  ? 'bg-white shadow-sm text-emerald-600'
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
                  ? 'bg-white shadow-sm text-emerald-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
            </button>
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
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-slate-500 text-sm font-semibold">No items matched your search.</p>
        </div>
      ) : viewMode === 'category' ? (
        /* ── CATEGORY TABLE VIEW ── */
        <div className="space-y-4">
          {Array.from(groupedItemsMap.entries()).map(([catName, catItems]) => (
            <CategoryTableSection
              key={catName}
              catName={catName}
              catItems={catItems}
              onEdit={handleQuickEdit}
              onDelete={handleDeleteItem}
              onNavigate={(id) => router.push(`/items/${id}`)}
              isCollapsed={isCatCollapsed(catName)}
              onToggle={() => toggleCatCollapse(catName)}
            />
          ))}
        </div>
      ) : (
        /* ── CARDS VIEW (default) ── */
        <div className="space-y-5">
          {/* Desktop table — clean single-row price alignment */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100">
                  <th className="py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Item & Code</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-widest" style={{color:'#e11d48'}}>Cost Price</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-widest" style={{color:'#0891b2'}}>Retailer Rate</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-widest" style={{color:'#059669'}}>Customer Price</th>
                  <th className="py-3 px-4 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/items/${item.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-5">
                      <div className="font-semibold text-[13px] text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight">
                        {item.name}
                      </div>
                      {item.itemCode && (
                        <div className="font-price text-[11px] text-slate-400 mt-0.5">{item.itemCode}</div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-[13px] text-slate-600 font-medium">{item.category.name}</div>
                      {item.brand && <div className="text-[11px] text-slate-400 mt-0.5">{item.brand}</div>}
                    </td>
                    {/* Cost — rose, align-top */}
                    <td className="py-4 px-4 align-top">
                      <PriceCell
                        price={formatCurrency(item.costPrice)}
                        priceClass="text-rose-600"
                      />
                    </td>
                    {/* Retailer — cyan, align-top */}
                    <td className="py-4 px-4 align-top">
                      <PriceCell
                        price={formatCurrency(item.retailerPrice)}
                        profit={item.retailerProfit}
                        priceClass="text-cyan-600"
                        profitClass="text-cyan-600"
                        profitBg="bg-cyan-50 border border-cyan-100"
                      />
                    </td>
                    {/* Customer — emerald, align-top */}
                    <td className="py-4 px-4 align-top">
                      <PriceCell
                        price={formatCurrency(item.customerPrice)}
                        profit={item.customerProfit}
                        priceClass="text-emerald-600"
                        profitClass="text-emerald-600"
                        profitBg="bg-emerald-50 border border-emerald-100"
                      />
                    </td>
                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleQuickEdit(e, item)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-all"
                          title="Quick Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteItem(e, item.id, item.name)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-all"
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

          {/* Mobile cards — grouped by category */}
          <div className="lg:hidden space-y-5">
            {Array.from(groupedItemsMap.entries()).map(([catName, groupItems]) => (
              <div key={catName} className="space-y-2.5">
                {/* Category label — tappable to collapse */}
                <button
                  type="button"
                  onClick={() => toggleCatCollapse(catName)}
                  className="w-full sticky top-12 z-10 py-2 px-4 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 flex items-center justify-between shadow-sm hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span className="font-black text-sm text-slate-900 uppercase tracking-wide">{catName}</span>
                    <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {groupItems.length}
                    </span>
                  </div>
                  {isCatCollapsed(catName) ? (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {!isCatCollapsed(catName) && <div className="space-y-2.5">
                  {groupItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/items/${item.id}`)}
                      className="bg-white rounded-2xl p-4 space-y-3 border border-slate-200 cursor-pointer hover:border-emerald-400/50 hover:shadow-md transition-all shadow-sm"
                    >
                      {/* Item name + actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-black text-slate-900 text-base leading-snug">{item.name}</h3>
                          {(item.itemCode || item.brand) && (
                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                              {item.itemCode}{item.brand ? ` • ${item.brand}` : ''}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleQuickEdit(e, item)}
                            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteItem(e, item.id, item.name)}
                            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Price Grid — Copied clean, professional home page layout with medium font weights */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs text-center items-center">
                        {/* Cost */}
                        <div className="bg-rose-50 p-1.5 rounded-lg border border-rose-100/80">
                          <span className="text-[9px] text-rose-700 font-semibold block uppercase tracking-wider">Cost</span>
                          <span className="font-price font-medium text-rose-700 text-sm leading-tight block">{formatCurrency(item.costPrice)}</span>
                        </div>
                        {/* Retailer */}
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium uppercase tracking-wider">Retailer</span>
                          <span className="font-price font-medium text-cyan-600 text-sm leading-tight block">{formatCurrency(item.retailerPrice)}</span>
                          <span className="text-[10px] font-medium text-cyan-600 block mt-0.5">+{formatProfit(item.retailerProfit)}</span>
                        </div>
                        {/* Customer */}
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium uppercase tracking-wider">Customer</span>
                          <span className="font-price font-medium text-emerald-600 text-sm leading-tight block">{formatCurrency(item.customerPrice)}</span>
                          <span className="text-[10px] font-medium text-emerald-600 block mt-0.5">+{formatProfit(item.customerProfit)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>}
              </div>
            ))}
          </div>
        </div>
      )}

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
