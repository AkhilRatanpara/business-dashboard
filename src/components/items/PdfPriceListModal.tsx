'use client';

import { useEffect, useState } from 'react';
import { FileText, X, Printer, Download, Share2, Filter, Calendar, ChevronDown, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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
  unit?: string | null;
  category: { id: string; name: string };
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
}

interface PdfPriceListModalProps {
  items: Item[];
  categories?: Category[];
  onClose: () => void;
}

function getFormattedDate(date?: string) {
  const d = date ? new Date(date) : new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function buildPrintHtml(
  items: Item[],
  catalogType: 'customer' | 'retailer' | 'complete',
  dateStr: string,
  snapshotDate?: string
): string {
  // Group items by category
  const grouped = new Map<string, Item[]>();
  items.forEach((item) => {
    const cat = item.category.name;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  });

  const showCost = catalogType === 'complete';
  const showRetailer = catalogType === 'retailer' || catalogType === 'complete';
  const showCustomer = catalogType === 'customer' || catalogType === 'complete';

  const catalogLabel =
    catalogType === 'customer'
      ? 'Customer Price List'
      : catalogType === 'retailer'
      ? 'Retailer Price List'
      : 'Complete Price Catalog';

  const displayDate = snapshotDate
    ? getFormattedDate(snapshotDate)
    : dateStr;

  // Build table rows per category
  let tableRows = '';
  let globalIdx = 1;
  grouped.forEach((catItems, catName) => {
    // Category header row
    tableRows += `
      <tr>
        <td colspan="10" style="background:#f1f5f9;padding:7px 10px;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#334155;border-top:2px solid #cbd5e1;border-bottom:1px solid #cbd5e1;">
          ${catName} <span style="font-weight:550;color:#64748b;font-size:10px;text-transform:none;">(${catItems.length} items)</span>
        </td>
      </tr>`;

    catItems.forEach((item) => {
      const profitRetailer = item.retailerPrice - item.costPrice;
      const profitCustomer = item.customerPrice - item.costPrice;

      const costText = item.costPrice > 0 ? formatCurrency(item.costPrice) : '—';
      const retailerText = item.retailerPrice > 0 ? formatCurrency(item.retailerPrice) : '—';
      const customerText = item.customerPrice > 0 ? formatCurrency(item.customerPrice) : '—';
      
      const retailerProfitText = item.retailerPrice > 0 && profitRetailer > 0 ? `+${formatCurrency(profitRetailer)}` : '—';
      const customerProfitText = item.customerPrice > 0 && profitCustomer > 0 ? `+${formatCurrency(profitCustomer)}` : '—';

      tableRows += `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:8px 10px;color:#64748b;font-size:10px;font-family:monospace;font-weight:700;text-align:center;vertical-align:middle;">${item.srNo || globalIdx++}</td>
          <td style="padding:8px 10px;font-weight:700;font-size:11px;color:#0f172a;vertical-align:middle;">
            ${item.name}${item.brand ? `<br><span style="font-weight:400;font-size:9px;color:#94a3b8;">${item.brand}</span>` : ''}
          </td>
          <td style="padding:8px 10px;font-size:10px;font-family:monospace;color:#475569;vertical-align:middle;">${item.itemCode || '—'}</td>
          ${showCost ? `<td style="padding:8px 10px;font-family:monospace;font-weight:800;font-size:12px;color:#dc2626;text-align:right;vertical-align:middle;">${costText}</td>` : ''}
          ${showRetailer ? `<td style="padding:8px 10px;font-family:monospace;font-weight:700;font-size:12px;color:#0891b2;text-align:right;vertical-align:middle;">${retailerText}</td>` : ''}
          ${showRetailer && showCost ? `<td style="padding:8px 10px;font-family:monospace;font-size:10px;color:#16a34a;text-align:right;vertical-align:middle;">${retailerProfitText}</td>` : ''}
          ${showCustomer ? `<td style="padding:8px 10px;font-family:monospace;font-weight:800;font-size:13px;color:#059669;text-align:right;vertical-align:middle;">${customerText}</td>` : ''}
          ${showCustomer && showCost ? `<td style="padding:8px 10px;font-family:monospace;font-size:10px;color:#16a34a;text-align:right;vertical-align:middle;">${customerProfitText}</td>` : ''}
        </tr>`;
    });
  });

  // Build header columns
  let colHeaders = `
    <th style="${thStyle}text-align:center;width:40px;">#</th>
    <th style="${thStyle}">Item Name</th>
    <th style="${thStyle};width:100px;">Code</th>
    ${showCost ? `<th style="${thStyle}text-align:right;color:#dc2626;width:90px;">Cost</th>` : ''}
    ${showRetailer ? `<th style="${thStyle}text-align:right;color:#0891b2;width:100px;">Retailer Rate</th>` : ''}
    ${showRetailer && showCost ? `<th style="${thStyle}text-align:right;color:#16a34a;width:80px;">R. Profit</th>` : ''}
    ${showCustomer ? `<th style="${thStyle}text-align:right;color:#059669;width:110px;">Customer Price</th>` : ''}
    ${showCustomer && showCost ? `<th style="${thStyle}text-align:right;color:#16a34a;width:80px;">C. Profit</th>` : ''}
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gunatit-PriceList-${dateStr}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .page { padding: 12mm; min-height: 100vh; background: #ffffff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #0f172a; padding-bottom: 12px; margin-bottom: 15px; }
    .business-name { font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; text-transform: uppercase; }
    .business-sub { font-size: 10px; color: #475569; margin-top: 3px; font-weight: 600; }
    .catalog-badge { background: #0f172a; color: #ffffff; padding: 4px 10px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
    .catalog-date { font-size: 10px; color: #475569; margin-top: 5px; font-family: monospace; font-weight: bold; }
    .summary-bar { display: flex; gap: 20px; margin-bottom: 15px; padding: 8px 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; }
    .summary-item { display: flex; flex-direction: column; gap: 1px; }
    .summary-label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
    .summary-value { font-size: 13px; font-weight: 800; color: #0f172a; font-family: monospace; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; background: #ffffff; margin-bottom: 15px; }
    thead tr { background: #f1f5f9; }
    th { padding: 6px 8px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #334155; border-bottom: 2px solid #cbd5e1; text-align: left; }
    tbody tr:hover { background: #f8fafc; }
    td { vertical-align: middle; }
    .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 8px; color: #94a3b8; font-family: monospace; }
    @media print {
      html, body { background: #ffffff !important; }
      .page { padding: 6mm; }
      @page { size: A4; margin: 6mm; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="business-name">Gunatit Submersible</div>
      <div class="business-sub">Pump Spares & Repair Price Directory</div>
      <div class="business-sub" style="margin-top:2px;">📞 9925531065</div>
    </div>
    <div style="text-align:right;">
      <div class="catalog-badge">${catalogLabel}</div>
      <div class="catalog-date">Ref Date: ${displayDate}</div>
      <div class="catalog-date" style="margin-top:1px;">Items count: ${items.length}</div>
    </div>
  </div>

  <div class="summary-bar">
    <div class="summary-item">
      <span class="summary-label">Total Items</span>
      <span class="summary-value">${items.length}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Category divisions</span>
      <span class="summary-value">${grouped.size}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Price Mode</span>
      <span class="summary-value" style="font-size:10px;">${catalogLabel}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Printed Stamp</span>
      <span class="summary-value" style="font-size:10px;">${dateStr}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>${colHeaders}</tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>

  <div class="footer">
    <span>Gunatit Submersible • 9925531065 • Confidential business prices</span>
    <span>Generated: ${displayDate} • gunatit-submersible.in</span>
  </div>
</div>
<script>
  window.onload = function() {
    window.print();
    setTimeout(function() { window.close(); }, 1000);
  };
</script>
</body>
</html>`;
}

const thStyle = 'padding:6px 8px;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#334155;border-bottom:2px solid #cbd5e1;text-align:left;';

export function PdfPriceListModal({ items, categories = [], onClose }: PdfPriceListModalProps) {
  const [catalogType, setCatalogType] = useState<'customer' | 'retailer' | 'complete'>('customer');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [useDateSnapshot, setUseDateSnapshot] = useState(false);
  const [snapshotDate, setSnapshotDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [snapshotItems, setSnapshotItems] = useState<Item[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showItemPicker, setShowItemPicker] = useState(false);

  // Clear selections when date or snapshot changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [useDateSnapshot, snapshotDate, selectedCatId]);

  // Load Snapshot Data
  useEffect(() => {
    if (!useDateSnapshot) { setSnapshotItems(null); return; }
    let active = true;
    fetch(`/api/price-snapshot?date=${snapshotDate}`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => { if (active && data.success) setSnapshotItems(data.items); })
      .catch(() => { if (active) setSnapshotItems(null); });
    return () => { active = false; };
  }, [snapshotDate, useDateSnapshot]);

  const sourceItems = snapshotItems ?? items;

  const categoryItems = sourceItems.filter((item) => {
    if (selectedCatId !== 'all' && item.category.id !== selectedCatId) return false;
    return true;
  });
  
  const filteredItems = selectedIds.size ? categoryItems.filter((item) => selectedIds.has(item.id)) : categoryItems;
  const allSelected = categoryItems.length > 0 && categoryItems.every((item) => selectedIds.has(item.id));

  const dateStr = getFormattedDate();
  const selectedCategoryName =
    selectedCatId === 'all'
      ? 'All Categories'
      : categories.find((c) => c.id === selectedCatId)?.name || 'Selected';

  const handleGeneratePdf = () => {
    setIsGenerating(true);
    try {
      const html = buildPrintHtml(
        filteredItems,
        catalogType,
        dateStr,
        useDateSnapshot ? snapshotDate : undefined
      );

      const printWindow = window.open('', `Gunatit-PriceList-${dateStr}`, 'width=900,height=700');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }
    } finally {
      setTimeout(() => setIsGenerating(false), 1500);
    }
  };

  const handleSharePdf = async () => {
    const lines = [
      '📋 GUNATIT SUBMERSIBLE',
      '📞 9925531065',
      `📅 Date: ${dateStr}`,
      `📦 Price List: ${catalogType === 'customer' ? 'Customer' : catalogType === 'retailer' ? 'Retailer' : 'Complete'}`,
      `🏷️ Category: ${selectedCategoryName}`,
      '─'.repeat(30),
      ...filteredItems.map((item, idx) => {
        const cost = item.costPrice > 0 ? formatCurrency(item.costPrice) : '—';
        const retailer = item.retailerPrice > 0 ? formatCurrency(item.retailerPrice) : '—';
        const customer = item.customerPrice > 0 ? formatCurrency(item.customerPrice) : '—';
        
        const prices =
          catalogType === 'customer'
            ? `Customer: ${customer}`
            : catalogType === 'retailer'
            ? `Retailer: ${retailer}`
            : `Cost: ${cost} | Ret: ${retailer} | Cust: ${customer}`;
        return `${idx + 1}. ${item.name} — ${prices}`;
      }),
      '─'.repeat(30),
      'Gunatit Submersible • 9925531065',
    ].join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: `Gunatit Price List ${dateStr}`, text: lines });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(lines);
      alert('Price list copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 no-print">
      {/* Backdrop close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95">
        {/* Drag Handle (Mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-slate-350 dark:bg-slate-800 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Export Price List</h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">Gunatit Submersible</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-105 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 1. Price Type */}
          <div>
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-2">Price Type</p>
            <div className="grid grid-cols-3 gap-2">
              {(['customer', 'retailer', 'complete'] as const).map((type) => {
                const labels = { customer: 'Customer', retailer: 'Retailer', complete: 'All Prices' };
                const colors = {
                  customer: 'from-emerald-500 to-emerald-600',
                  retailer: 'from-cyan-500 to-cyan-600',
                  complete: 'from-violet-500 to-violet-600',
                };
                const active = catalogType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCatalogType(type)}
                    className={`relative py-3 rounded-2xl border text-center transition-all font-black text-xs overflow-hidden ${
                      active
                        ? `bg-gradient-to-br ${colors[type]} text-white border-transparent shadow-md shadow-emerald-550/10`
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {active && (
                      <div className="absolute top-1.5 right-1.5">
                        <Check className="w-3 h-3 text-white/80" />
                      </div>
                    )}
                    {labels[type]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Category Filter */}
          <div>
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-2">Category Division</p>
            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-slate-450 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-550/30 focus:border-emerald-450 appearance-none"
              >
                <option value="all">All Catalog Divisions ({items.length} items)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-450 dark:text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 3. Date Snapshot Toggle */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 rounded-2xl px-4 py-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-violet-500 dark:text-violet-400" />
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200">Historical Snapshot Date</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Select yesterday or past dates</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useDateSnapshot}
                onChange={(e) => setUseDateSnapshot(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {useDateSnapshot && (
            <div>
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-2">Select Snap Date</p>
              <input
                type="date"
                value={snapshotDate}
                onChange={(e) => setSnapshotDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-black text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              />
            </div>
          )}

          {/* 4. Selection Selector */}
          <div>
            <button
              type="button"
              onClick={() => setShowItemPicker(!showItemPicker)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-black text-slate-700 dark:text-slate-300"
            >
              <span>Select individual items (Optional)</span>
              <span className="text-emerald-700 dark:text-emerald-450 font-black">
                {selectedIds.size ? `${selectedIds.size} items` : 'All items'}
              </span>
            </button>
            {showItemPicker && (
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-inner">
                <label className="flex cursor-pointer items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 px-2 py-2 text-xs font-black text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => setSelectedIds(allSelected ? new Set() : new Set(categoryItems.map((item) => item.id)))}
                    className="rounded border-slate-350 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Select all items ({categoryItems.length})</span>
                </label>
                {categoryItems.map((item) => (
                  <label key={item.id} className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950/60 rounded">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => setSelectedIds((prev) => {
                        const next = new Set(prev);
                        next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                        return next;
                      })}
                      className="rounded border-slate-350 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="truncate">{item.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Preview Summary */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-black dark:to-slate-950 rounded-2xl px-4 py-3 flex items-center justify-between border border-slate-800">
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">{selectedCategoryName}</p>
              <p className="text-sm font-black text-white mt-0.5">{filteredItems.length} items chosen</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-450 font-mono">Output Name</p>
              <p className="text-[11px] font-black text-emerald-450 font-mono">Gunatit-{dateStr}.pdf</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-5 pb-6 pt-1 grid grid-cols-2 gap-2.5 border-t border-slate-100 dark:border-slate-800/60">
          <button
            type="button"
            onClick={handleSharePdf}
            className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-sm transition-all border border-slate-200 dark:border-slate-700"
          >
            <Share2 className="w-4 h-4 text-slate-500" />
            <span>Copy Text</span>
          </button>

          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={isGenerating || filteredItems.length === 0}
            className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-sm shadow-md shadow-emerald-500/25 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Printing...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Print PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
