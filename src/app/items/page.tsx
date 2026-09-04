'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search, PlusCircle, Edit3, RefreshCw, FileText,
  Layers, LayoutGrid, Table2, ChevronDown, ChevronRight, Plus,
  Building2, CornerDownRight, Folder, ChevronsDown, ChevronsUp, X,
  Eye, EyeOff, Lock
} from 'lucide-react';
import { formatCurrency, formatProfit, formatMaskedPrice, matchSmartSearch } from '@/lib/utils';
import { QuickEditModal } from '@/components/items/QuickEditModal';
import { PdfPriceListModal } from '@/components/items/PdfPriceListModal';
import { notify } from '@/components/ui/Toast';

interface Item {
  id: string;
  name: string;
  srNo?: string | null;
  itemCode?: string | null;
  brand?: string | null;
  modelNumber?: string | null;
  costPrice: number;
  retailerPrice: number;
  customerPrice: number;
  retailerProfit: number;
  customerProfit: number;
  retailerMarkup: number;
  customerMarkup: number;
  unit?: string | null;
  category: {
    id: string;
    name: string;
    parent?: {
      id: string;
      name: string;
      parent?: { id: string; name: string } | null;
    } | null;
  };
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  parent?: Category | null;
  children?: Category[];
  _count?: { items: number };
}

// ─── Center-Aligned Price Cell for Table ──────────────────────────────────────
function PriceCell({
  price,
  profit,
  priceClass,
  profitClass,
  profitBg,
  isPrivacyMode,
  isCost,
}: {
  price: string;
  profit?: number;
  priceClass: string;
  profitClass?: string;
  profitBg?: string;
  isPrivacyMode?: boolean;
  isCost?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-1">
      <div className={`font-price font-bold text-xs sm:text-sm leading-snug ${priceClass}`}>
        {price}
      </div>
      {!isPrivacyMode && !isCost && profit !== undefined && profit > 0 ? (
        <div className={`inline-flex items-center justify-center mt-0.5 font-price text-[10px] font-bold px-1.5 py-[2px] rounded-md ${profitBg} ${profitClass} whitespace-nowrap`}>
          +{formatProfit(profit)}
        </div>
      ) : (
        <div className="h-2" />
      )}
    </div>
  );
}

// ─── Table Item Row (Optimized Mobile Layout & Center-Aligned Prices) ──────────
function ItemRow({
  item,
  isPrivacyMode,
  isNavigating,
  onNavigate,
  onEdit,
}: {
  item: Item;
  isPrivacyMode: boolean;
  isNavigating?: boolean;
  onNavigate: (id: string) => void;
  onEdit: (e: React.MouseEvent, item: Item) => void;
}) {
  return (
    <tr
      id={`item-${item.id}`}
      onClick={() => onNavigate(item.id)}
      className={`hover:bg-slate-50/90 dark:hover:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/60 cursor-pointer transition-all group ${
        isNavigating ? 'bg-emerald-50/90 dark:bg-emerald-950/60 ring-2 ring-emerald-500/50' : ''
      }`}
    >
      {/* Mobile-Friendly Vertical Item Column with slightly increased width */}
      <td className="py-2.5 px-3 sm:px-4 min-w-[135px] sm:min-w-[200px]">
        <div className="flex flex-col items-start gap-1">
          {item.srNo && (
            <span className="inline-flex rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Sr. {item.srNo}
            </span>
          )}
          <div className="font-bold text-xs sm:text-[13px] text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-450 transition-colors leading-snug">
            {item.name}
          </div>
          {item.brand && (
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 leading-tight flex items-center gap-1">
              <Building2 className="w-3 h-3 inline shrink-0" />
              <span>{item.brand}</span>
            </div>
          )}
        </div>
      </td>

      <td className="py-2.5 px-3 hidden sm:table-cell text-center">
        <span className="font-price text-xs text-slate-400 dark:text-slate-500 font-mono">{item.itemCode || '—'}</span>
      </td>

      {/* Cost (Masked in Privacy Mode) */}
      <td className="py-2.5 px-2 sm:px-4 text-center align-middle">
        <PriceCell
          price={formatMaskedPrice(item.costPrice, isPrivacyMode)}
          priceClass="text-rose-600 dark:text-rose-400 font-bold"
          isPrivacyMode={isPrivacyMode}
          isCost={true}
        />
      </td>

      {/* Retailer */}
      <td className="py-2.5 px-2 sm:px-4 text-center align-middle">
        <PriceCell
          price={formatCurrency(item.retailerPrice)}
          profit={item.retailerProfit}
          priceClass="text-cyan-600 dark:text-cyan-400 font-bold"
          profitClass="text-cyan-600 dark:text-cyan-400"
          profitBg="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/40"
          isPrivacyMode={isPrivacyMode}
        />
      </td>

      {/* Customer */}
      <td className="py-2.5 px-2 sm:px-4 text-center align-middle">
        <PriceCell
          price={formatCurrency(item.customerPrice)}
          profit={item.customerProfit}
          priceClass="text-emerald-600 dark:text-emerald-400 font-black"
          profitClass="text-emerald-600 dark:text-emerald-400"
          profitBg="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40"
          isPrivacyMode={isPrivacyMode}
        />
      </td>

      {/* Quick Edit Action Only (Accidental delete button removed) */}
      <td className="py-2.5 px-3 sm:px-4 text-right align-middle" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={(e) => onEdit(e, item)}
            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 transition-all"
            title="Quick Edit Prices"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Modern Product Card Component (Matches Home Page Design with Profit Badges) ──
function ItemCard({
  item,
  isPrivacyMode,
  isNavigating,
  onNavigate,
  onEdit,
}: {
  item: Item;
  isPrivacyMode: boolean;
  isNavigating?: boolean;
  onNavigate: (id: string) => void;
  onEdit: (e: React.MouseEvent, item: Item) => void;
}) {
  return (
    <div
      id={`item-${item.id}`}
      onClick={() => onNavigate(item.id)}
      className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3 cursor-pointer hover:border-emerald-500/40 hover:shadow-md transition-all group select-none flex flex-col justify-between ${
        isNavigating ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {item.srNo && (
              <span className="font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                Sr. {item.srNo}
              </span>
            )}
            {item.itemCode && (
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">
                {item.itemCode}
              </span>
            )}
          </div>
          <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {item.name}
          </h4>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap text-xs">
            {item.brand && (
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {item.brand} •
              </span>
            )}
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {item.category?.name}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(e, item);
          }}
          className="px-3 py-1.5 rounded-full bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-all border border-emerald-200/60 dark:border-emerald-800/40 shadow-2xs shrink-0 cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>
      </div>

      {/* Pricing Row matching screenshot with profit badges */}
      <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-center items-center">
        {/* COST */}
        <div className="bg-rose-50/80 dark:bg-rose-950/30 p-2 sm:p-2.5 rounded-2xl border border-rose-100 dark:border-rose-900/40 flex flex-col items-center justify-center min-h-[58px]">
          <span className="text-[10px] text-rose-700 dark:text-rose-400 font-black block uppercase tracking-wider">
            COST
          </span>
          <span className="font-mono font-black text-rose-700 dark:text-rose-400 text-sm sm:text-base mt-0.5">
            {isPrivacyMode ? '••••' : formatCurrency(item.costPrice)}
          </span>
        </div>

        {/* RETAILER */}
        <div className="p-1.5 flex flex-col items-center justify-center min-h-[58px]">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-bold">
            Retailer
          </span>
          <span className="font-mono font-black text-cyan-600 dark:text-cyan-400 text-sm sm:text-base mt-0.5">
            {formatCurrency(item.retailerPrice)}
          </span>
          {!isPrivacyMode && item.retailerProfit !== undefined && item.retailerProfit > 0 && (
            <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">
              +{formatCurrency(item.retailerProfit)}
            </span>
          )}
        </div>

        {/* CUSTOMER */}
        <div className="p-1.5 flex flex-col items-center justify-center min-h-[58px]">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-bold">
            Customer
          </span>
          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm sm:text-base mt-0.5">
            {formatCurrency(item.customerPrice)}
          </span>
          {!isPrivacyMode && item.customerProfit !== undefined && item.customerProfit > 0 && (
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              +{formatCurrency(item.customerProfit)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface CategoryNode {
  id: string;
  name: string;
  items: Item[];
  children: CategoryNode[];
  totalItemCount: number;
}

// ─── Unified Table Rows Component for Nested Hierarchy with Collapsible Subcategories ───
function CategoryTableRows({
  node,
  depth,
  isPrivacyMode,
  isNodeCollapsed,
  onToggleCollapse,
  navigatingId,
  onNavigate,
  onEdit,
}: {
  node: CategoryNode;
  depth: number;
  isPrivacyMode: boolean;
  isNodeCollapsed: (catId: string) => boolean;
  onToggleCollapse: (catId: string) => void;
  navigatingId?: string | null;
  onNavigate: (id: string) => void;
  onEdit: (e: React.MouseEvent, item: Item) => void;
}) {
  const isCollapsed = depth > 0 ? isNodeCollapsed(node.id) : false;

  return (
    <>
      {/* If subcategory (depth > 0), render a clean full-width collapsible divider row */}
      {depth > 0 && (
        <tr
          onClick={() => onToggleCollapse(node.id)}
          className={`border-y border-slate-200 dark:border-slate-800 select-none cursor-pointer transition-colors ${
            depth === 1
              ? 'bg-slate-100/95 dark:bg-slate-950/95 hover:bg-slate-200/80 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200'
              : 'bg-emerald-50/90 dark:bg-emerald-950/70 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300'
          }`}
        >
          <td colSpan={6} className="py-2.5 px-3 sm:px-4">
            <div
              className={`flex items-center gap-2 font-bold ${
                depth === 1 ? 'text-xs' : 'text-[11px] pl-3'
              }`}
            >
              {/* Chevron Collapse Indicator */}
              <div className="shrink-0 text-slate-400">
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 transition-transform" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 transition-transform" />
                )}
              </div>

              {depth === 1 ? (
                <Folder className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              ) : (
                <CornerDownRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              <span>{node.name}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 leading-none">
                {node.totalItemCount}
              </span>
            </div>
          </td>
        </tr>
      )}

      {/* Direct items under this category when not collapsed */}
      {!isCollapsed &&
        node.items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            isPrivacyMode={isPrivacyMode}
            isNavigating={navigatingId === item.id}
            onNavigate={onNavigate}
            onEdit={onEdit}
          />
        ))}

      {/* Children recursive when not collapsed */}
      {!isCollapsed &&
        node.children.map((child) => (
          <CategoryTableRows
            key={child.id}
            node={child}
            depth={depth + 1}
            isPrivacyMode={isPrivacyMode}
            isNodeCollapsed={isNodeCollapsed}
            onToggleCollapse={onToggleCollapse}
            navigatingId={navigatingId}
            onNavigate={onNavigate}
            onEdit={onEdit}
          />
        ))}
    </>
  );
}

function CategorySection({
  node,
  depth,
  viewMode,
  isPrivacyMode,
  isCollapsed,
  onToggleCollapse,
  isNodeCollapsed,
  navigatingId,
  onNavigate,
  onEdit,
}: {
  node: CategoryNode;
  depth: number;
  viewMode: 'table' | 'cards';
  isPrivacyMode: boolean;
  isCollapsed: boolean;
  onToggleCollapse: (catId: string) => void;
  isNodeCollapsed: (catId: string) => boolean;
  navigatingId?: string | null;
  onNavigate: (id: string) => void;
  onEdit: (e: React.MouseEvent, item: Item) => void;
}) {
  if (node.totalItemCount === 0) return null;

  return (
    <div
      className={`rounded-2xl border transition-all ${
        depth === 0
          ? 'glass-card border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs'
          : depth === 1
          ? 'bg-slate-50 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800/80'
          : 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/40'
      }`}
    >
      {/* Category Accordion Header Button (Only Main Category depth===0 locks on scroll) */}
      <button
        type="button"
        onClick={() => onToggleCollapse(node.id)}
        className={`w-full flex items-center justify-between transition-colors text-left select-none cursor-pointer ${
          isCollapsed
            ? depth === 0
              ? 'h-12 rounded-2xl px-3.5 sm:px-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
              : depth === 1
              ? 'h-10 rounded-xl px-3 sm:px-3.5 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200/70 dark:hover:bg-slate-900'
              : 'h-9 rounded-lg px-3 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40'
            : depth === 0
            ? 'h-12 sticky top-[48px] md:top-[52px] z-30 bg-white dark:bg-slate-900 rounded-t-2xl border-b border-slate-200 dark:border-slate-800 shadow-xs px-3.5 sm:px-4 hover:bg-slate-50 dark:hover:bg-slate-850'
            : depth === 1
            ? 'h-10 rounded-t-xl border-b border-slate-200/90 dark:border-slate-800/90 px-3 sm:px-3.5 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200/70 dark:hover:bg-slate-900'
            : 'h-9 rounded-t-lg border-b border-emerald-200/60 dark:border-emerald-900/40 px-3 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Chevron Indicator */}
          <div className="shrink-0 text-slate-400">
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-500 transition-transform" />
            ) : (
              <ChevronDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400 transition-transform" />
            )}
          </div>

          {/* Category Icon */}
          <div className="shrink-0">
            {depth === 0 ? (
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : depth === 1 ? (
              <Folder className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            ) : (
              <CornerDownRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            )}
          </div>

          {/* Title Text */}
          <span
            className={`truncate leading-none ${
              depth === 0
                ? 'font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 tracking-wide uppercase'
                : depth === 1
                ? 'font-extrabold text-xs text-slate-800 dark:text-slate-200'
                : 'font-bold text-xs text-slate-700 dark:text-slate-300'
            }`}
          >
            {node.name}
          </span>

          {/* Item Count Pill */}
          <span
            className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border leading-none ${
              depth === 0
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : depth === 1
                ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            }`}
          >
            {node.totalItemCount}
          </span>
        </div>
      </button>

      {/* Expanded Content */}
      {!isCollapsed && (
        <div className="p-2.5 sm:p-3.5 space-y-3">
          {/* If Table View: Single Unified Table for the whole Category tree */}
          {viewMode === 'table' ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900 shadow-2xs z-0">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-center">
                    <th className="py-2.5 px-3 sm:px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left min-w-[135px] sm:min-w-[200px]">Item & Company</th>
                    <th className="py-2.5 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell text-center">Code</th>
                    <th className="py-2.5 px-2 sm:px-4 text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 text-center">Cost</th>
                    <th className="py-2.5 px-2 sm:px-4 text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 text-center">Retailer</th>
                    <th className="py-2.5 px-2 sm:px-4 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 text-center">Customer</th>
                    <th className="py-2.5 px-3 sm:px-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  <CategoryTableRows
                    node={node}
                    depth={0}
                    isPrivacyMode={isPrivacyMode}
                    isNodeCollapsed={isNodeCollapsed}
                    onToggleCollapse={onToggleCollapse}
                    navigatingId={navigatingId}
                    onNavigate={onNavigate}
                    onEdit={onEdit}
                  />
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards View: Clean Nested Category Sections & Grid */
            <div className="space-y-3">
              {/* Direct items */}
              {node.items.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
                  {node.items.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      isPrivacyMode={isPrivacyMode}
                      isNavigating={navigatingId === item.id}
                      onNavigate={onNavigate}
                      onEdit={onEdit}
                    />
                  ))}
                </div>
              )}

              {/* Subcategories */}
              {node.children.length > 0 && (
                <div className="space-y-2.5">
                  {node.children.map((child) => (
                    <CategorySection
                      key={child.id}
                      node={child}
                      depth={depth + 1}
                      viewMode={viewMode}
                      isPrivacyMode={isPrivacyMode}
                      isCollapsed={isNodeCollapsed(child.id)}
                      onToggleCollapse={onToggleCollapse}
                      isNodeCollapsed={isNodeCollapsed}
                      navigatingId={navigatingId}
                      onNavigate={onNavigate}
                      onEdit={onEdit}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
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
  const initialSort = searchParams.get('sort') || 'default';

  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Restore cache and privacy mode on client mount (avoids React hydration mismatch)
  useEffect(() => {
    setMounted(true);
    const savedPrivacy = localStorage.getItem('gunatit_privacy_mode');
    if (savedPrivacy === 'true') {
      setIsPrivacyMode(true);
    }

    const cachedItems = sessionStorage.getItem('gunatit_cached_items_v3');
    const cachedCats = sessionStorage.getItem('gunatit_cached_cats_v3');
    const cachedBrands = sessionStorage.getItem('gunatit_cached_brands_v3');

    if (cachedItems) {
      try {
        const parsed = JSON.parse(cachedItems);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          setLoading(false);
        }
      } catch {}
    }
    if (cachedCats) {
      try {
        const parsedCats = JSON.parse(cachedCats);
        if (Array.isArray(parsedCats) && parsedCats.length > 0) {
          setCategories(parsedCats);
        }
      } catch {}
    }
    if (cachedBrands) {
      try {
        const parsedBrands = JSON.parse(cachedBrands);
        if (Array.isArray(parsedBrands) && parsedBrands.length > 0) {
          setBrands(parsedBrands);
        }
      } catch {}
    }
  }, []);

  const togglePrivacyMode = () => {
    const next = !isPrivacyMode;
    setIsPrivacyMode(next);
    localStorage.setItem('gunatit_privacy_mode', next.toString());
    notify(next ? 'Privacy Mode ON (Cost & Profit hidden)' : 'Privacy Mode OFF (All prices shown)', 'info');
  };

  const [search, setSearch] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [subSubCategoryId, setSubSubCategoryId] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [sort, setSort] = useState(initialSort);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  // Default state: ALL CATEGORIES COLLAPSED BY DEFAULT
  const [allCollapsed, setAllCollapsed] = useState(true);
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});

  const [selectedItemForEdit, setSelectedItemForEdit] = useState<Item | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showFloatingSearch, setShowFloatingSearch] = useState(false);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  // Monitor window scroll to show floating top button and floating compact search bar
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setShowScrollTop(y > 300);
      setShowFloatingSearch(y > 280);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore open categories and scroll position after returning from item page
  useEffect(() => {
    // Check if freshly unlocked from lock screen
    const justUnlocked = sessionStorage.getItem('gunatit_just_unlocked');
    if (justUnlocked === 'true') {
      sessionStorage.removeItem('gunatit_just_unlocked');
      setAllCollapsed(true);
      setCollapsedMap({});
      return;
    }

    // Restore previously open categories
    const savedCategories = sessionStorage.getItem('gunatit_open_categories');
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories);
        setCollapsedMap(parsed);
      } catch {}
    }

    // Scroll back to last viewed item or scroll position
    const lastItemId = sessionStorage.getItem('gunatit_last_viewed_item');
    const savedScroll = sessionStorage.getItem('gunatit_items_scroll');

    const timer = setTimeout(() => {
      if (lastItemId) {
        const el = document.getElementById('item-' + lastItemId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-emerald-500');
          setTimeout(() => el.classList.remove('ring-2', 'ring-emerald-500'), 2500);
          return;
        }
      }
      if (savedScroll) {
        window.scrollTo({ top: Number(savedScroll), behavior: 'auto' });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isNodeCollapsed = useCallback((catId: string) => {
    if (search.trim().length > 0) return false;
    return catId in collapsedMap ? collapsedMap[catId] : allCollapsed;
  }, [collapsedMap, allCollapsed, search]);

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedMap((prev) => {
      const nextMap = {
        ...prev,
        [catId]: !isNodeCollapsed(catId)
      };
      try {
        sessionStorage.setItem('gunatit_open_categories', JSON.stringify(nextMap));
      } catch {}
      return nextMap;
    });
  };

  // Strictly collapse all categories
  const handleCollapseAll = () => {
    setAllCollapsed(true);
    setCollapsedMap({});
    try {
      sessionStorage.removeItem('gunatit_open_categories');
    } catch {}
    notify('All categories collapsed', 'info');
  };

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [catsRes, brandsRes] = await Promise.all([
          fetch('/api/categories', { cache: 'no-store' }),
          fetch('/api/brands', { cache: 'no-store' }),
        ]);
        const catsData = await catsRes.json();
        const brandsData = await brandsRes.json();
        if (catsData.success) {
          setCategories(catsData.categories);
          sessionStorage.setItem('gunatit_cached_cats_v3', JSON.stringify(catsData.categories));
        }
        if (brandsData.success) {
          setBrands(brandsData.brands);
          sessionStorage.setItem('gunatit_cached_brands_v3', JSON.stringify(brandsData.brands));
        }
      } catch (err) {
        console.error('Failed to load categories/brands:', err);
      }
    }
    loadMetadata();
  }, []);

  const fetchItems = useCallback(async () => {
    if (items.length === 0) setLoading(true);
    try {
      const activeCat = subSubCategoryId || subCategoryId || parentCategoryId || initialCategory;
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (activeCat) params.append('categoryId', activeCat);
      if (selectedBrand) params.append('brand', selectedBrand);
      if (sort) params.append('sort', sort);

      const res = await fetch(`/api/items?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        sessionStorage.setItem('gunatit_cached_items_v3', JSON.stringify(data.items));
      }
    } catch (err) {
      console.error('Failed to fetch items:', err);
      notify('Error loading items from database', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, parentCategoryId, subCategoryId, subSubCategoryId, initialCategory, selectedBrand, sort, items.length]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchItems();
    }, 150);
    return () => clearTimeout(debounce);
  }, [fetchItems]);

  const handleNavigate = (id: string) => {
    setNavigatingId(id);
    const targetItem = items.find((i) => i.id === id);
    try {
      sessionStorage.setItem('gunatit_items_scroll', window.scrollY.toString());
      sessionStorage.setItem('gunatit_last_viewed_item', id);
      sessionStorage.setItem('gunatit_open_categories', JSON.stringify(collapsedMap));
      if (targetItem) {
        sessionStorage.setItem('gunatit_preview_item_' + id, JSON.stringify(targetItem));
      }
    } catch {}
    router.push(`/items/${id}`);
  };

  const handleEdit = (e: React.MouseEvent, item: Item) => {
    e.stopPropagation();
    setSelectedItemForEdit(item);
  };

  // Client-side smart search filter: supports "283050" -> "28x30x50"
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter(
      (item) =>
        matchSmartSearch(item.name, search) ||
        matchSmartSearch(item.srNo, search) ||
        matchSmartSearch(item.itemCode, search) ||
        matchSmartSearch(item.brand, search) ||
        matchSmartSearch(item.modelNumber, search)
    );
  }, [items, search]);

  // Build recursive category tree structure with matching items
  const categoryTreeNodes: CategoryNode[] = useMemo(() => {
    let roots: Category[] = [];
    const childrenMap = new Map<string, Category[]>();

    categories.forEach((cat) => {
      if (!cat.parentId) {
        roots.push(cat);
      } else {
        if (!childrenMap.has(cat.parentId)) {
          childrenMap.set(cat.parentId, []);
        }
        childrenMap.get(cat.parentId)!.push(cat);
      }
    });

    if (parentCategoryId) {
      roots = roots.filter((r) => r.id === parentCategoryId);
    }
    if (subSubCategoryId) {
      const subSub = categories.find((c) => c.id === subSubCategoryId);
      if (subSub) {
        roots = [subSub];
      }
    } else if (subCategoryId) {
      const sub = categories.find((c) => c.id === subCategoryId);
      if (sub) {
        roots = [sub];
      }
    }

    const buildNode = (cat: Category): CategoryNode => {
      const directItems = filteredItems.filter((item) => item.category.id === cat.id);
      const kids = childrenMap.get(cat.id) || [];
      const childNodes = kids.map(buildNode).filter((cn) => cn.totalItemCount > 0);
      const totalCount = directItems.length + childNodes.reduce((acc, c) => acc + c.totalItemCount, 0);

      return {
        id: cat.id,
        name: cat.name,
        items: directItems,
        children: childNodes,
        totalItemCount: totalCount,
      };
    };

    return roots.map(buildNode).filter((node) => node.totalItemCount > 0);
  }, [categories, filteredItems, parentCategoryId, subCategoryId, subSubCategoryId]);

  const parentCategories = categories.filter((c) => !c.parentId);
  const subCategories = parentCategoryId ? categories.filter((c) => c.parentId === parentCategoryId) : [];
  const subSubCategories = subCategoryId ? categories.filter((c) => c.parentId === subCategoryId) : [];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* ─── Top Control Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Price Book</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800/60 font-mono">
              {filteredItems.length}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
            Submersible products, exact PDF Sr. No. & company brands
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPdfModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs"
            title="Print Price List"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Print Price List</span>
          </button>

          <Link
            href="/items/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Item</span>
          </Link>
        </div>
      </div>

      {/* ─── Search & Filters Bar ────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          {/* Smart Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search e.g. 283050, 385060, LB Bush, CRI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Main Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={parentCategoryId}
              onChange={(e) => {
                setParentCategoryId(e.target.value);
                setSubCategoryId('');
                setSubSubCategoryId('');
              }}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="">All Categories</option>
              {parentCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Privacy Eye Button + View Toggles & Expand/Collapse */}
          <div className="sm:col-span-2 flex items-center justify-end gap-1.5">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 gap-0.5">
              {/* Privacy Mode Eye Toggle */}
              <button
                type="button"
                onClick={togglePrivacyMode}
                className={`p-1.5 rounded-lg transition-all ${
                  isPrivacyMode
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title={isPrivacyMode ? 'Privacy Mode Active (Cost hidden)' : 'Hide Cost for Customer View'}
              >
                {isPrivacyMode ? (
                  <EyeOff className="w-3.5 h-3.5 font-bold" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>

              <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

              {/* Collapse All Categories Only Button */}
              <button
                type="button"
                onClick={handleCollapseAll}
                className="p-1.5 rounded-lg transition-all text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                title="Collapse All Categories"
              >
                <ChevronsUp className="w-3.5 h-3.5" />
              </button>

              <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

              {/* Cards View Toggle */}
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Cards Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>

              {/* Table View Toggle */}
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Table List View"
              >
                <Table2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Subcategory Pills (Level 2 e.g. V-4 C.I., V-3 C.I.) */}
        {parentCategoryId && subCategories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 scrollbar-none">
            <span className="text-[10px] font-bold text-slate-400 shrink-0">Sub:</span>
            <button
              type="button"
              onClick={() => {
                setSubCategoryId('');
                setSubSubCategoryId('');
              }}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                !subCategoryId
                  ? 'bg-emerald-600 text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All
            </button>
            {subCategories.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  setSubCategoryId(sub.id);
                  setSubSubCategoryId('');
                }}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                  subCategoryId === sub.id
                    ? 'bg-emerald-600 text-slate-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* Sub-Subcategory Section Pills (Level 3 e.g. V-4 Suction, V-4 NRV, etc.) */}
        {subCategoryId && subSubCategories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1.5 scrollbar-none animate-fade-in border-t border-slate-200/60 dark:border-slate-800/60">
            <span className="text-[10px] font-bold text-slate-400 shrink-0">Section:</span>
            <button
              type="button"
              onClick={() => setSubSubCategoryId('')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                !subSubCategoryId
                  ? 'bg-emerald-600 text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Sections
            </button>
            {subSubCategories.map((subsub) => (
              <button
                key={subsub.id}
                type="button"
                onClick={() => setSubSubCategoryId(subsub.id)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                  subSubCategoryId === subsub.id
                    ? 'bg-emerald-600 text-slate-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {subsub.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Items Display Section ───────────────────────────────────────────── */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm animate-pulse space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
          <p>Loading items from database...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">No items found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search ? `No products matched "${search}". Try searching numbers like "283050" or clear filters.` : 'No products found.'}
          </p>
          <div className="pt-2">
            <Link
              href="/items/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-slate-950 font-bold text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Item</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Category-Wise Accordion (Supports both Table and Card view modes) */
        <div className="space-y-3">
          {categoryTreeNodes.map((rootNode) => (
            <CategorySection
              key={rootNode.id}
              node={rootNode}
              depth={0}
              viewMode={viewMode}
              isPrivacyMode={isPrivacyMode}
              isCollapsed={isNodeCollapsed(rootNode.id)}
              onToggleCollapse={toggleCategoryCollapse}
              isNodeCollapsed={isNodeCollapsed}
              navigatingId={navigatingId}
              onNavigate={handleNavigate}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* ─── Ultra-Smooth Floating Search Pill (Positioned higher up below header) ─── */}
      <div
        className={`fixed top-[74px] md:top-[78px] left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          showFloatingSearch
            ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto'
            : '-translate-y-2 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-white/92 dark:bg-slate-900/92 backdrop-blur-2xl rounded-2xl shadow-xl shadow-slate-950/10 dark:shadow-black/40 border border-slate-200/90 dark:border-slate-800 p-2 sm:p-2.5 flex items-center gap-2.5 sm:gap-3 ring-1 ring-emerald-500/20 focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500/60 transition-all">
          <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Search className="w-4 sm:w-4.5 h-4 sm:h-4.5" />
          </div>

          <input
            type="text"
            autoFocus={false}
            placeholder="Quick search catalog or dimensions (e.g. 283050, LB Bush)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSearch('');
            }}
            className="flex-1 bg-transparent text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none placeholder:text-slate-400 tracking-tight"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-1.5 shrink-0 pl-1.5 border-l border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              {filteredItems.length}
            </span>
            <span className="hidden sm:inline text-[10px] text-slate-400 font-medium">results</span>
          </div>
        </div>
      </div>

      {/* ─── Quick Edit Modal ────────────────────────────────────────────────── */}
      {selectedItemForEdit && (
        <QuickEditModal
          item={selectedItemForEdit}
          onClose={() => setSelectedItemForEdit(null)}
          onSave={() => {
            fetchItems();
          }}
        />
      )}

      {/* ─── PDF / Print Modal ───────────────────────────────────────────────── */}
      {showPdfModal && (
        <PdfPriceListModal
          items={filteredItems}
          categories={categories}
          onClose={() => setShowPdfModal(false)}
        />
      )}

      {/* ─── Mobile / Desktop Floating Scroll-to-Top Pill ──────────────────────── */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-30 p-2.5 sm:p-3 rounded-2xl bg-emerald-600/95 text-slate-950 shadow-xl shadow-emerald-600/30 hover:bg-emerald-500 backdrop-blur-md transition-all active:scale-95 animate-fade-in flex items-center gap-1.5 border border-emerald-400/40 cursor-pointer"
          title="Scroll back to top"
        >
          <ChevronsUp className="w-4 h-4 font-black" />
          <span className="text-[11px] font-black hidden sm:inline">Top</span>
        </button>
      )}
    </div>
  );
}

export default function ItemsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Price Book...</div>}>
      <ItemsContent />
    </Suspense>
  );
}
