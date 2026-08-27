'use client';

import { useState } from 'react';
import { FileText, X, Printer, Download, Share2, Filter, Calendar, ChevronDown, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Item {
  id: string;
  name: string;
  itemCode?: string;
  brand?: string;
  modelNumber?: string;
  costPrice: number;
  retailerPrice: number;
  customerPrice: number;
  unit?: string;
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
        <td colspan="10" style="background:#f1f5f9;padding:6px 10px;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#334155;border-top:2px solid #cbd5e1;border-bottom:1px solid #cbd5e1;">
          ${catName} <span style="font-weight:500;color:#64748b;">(${catItems.length} items)</span>
        </td>
      </tr>`;

    catItems.forEach((item) => {
      const profitRetailer = item.retailerPrice - item.costPrice;
      const profitCustomer = item.customerPrice - item.costPrice;
      tableRows += `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:7px 10px;color:#64748b;font-size:10px;font-family:monospace;text-align:center;vertical-align:middle;">${globalIdx++}</td>
          <td style="padding:7px 10px;font-weight:700;font-size:11px;color:#0f172a;vertical-align:middle;">${item.name}${item.brand ? `<br><span style="font-weight:400;font-size:9px;color:#94a3b8;">${item.brand}</span>` : ''}</td>
          <td style="padding:7px 10px;font-size:10px;font-family:monospace;color:#475569;vertical-align:middle;">${item.itemCode || '—'}</td>
          ${showCost ? `<td style="padding:7px 10px;font-family:monospace;font-weight:800;font-size:12px;color:#dc2626;text-align:right;vertical-align:middle;">${formatCurrency(item.costPrice)}</td>` : ''}
          ${showRetailer ? `<td style="padding:7px 10px;font-family:monospace;font-weight:700;font-size:12px;color:#0891b2;text-align:right;vertical-align:middle;">${formatCurrency(item.retailerPrice)}</td>` : ''}
          ${showRetailer && showCost ? `<td style="padding:7px 10px;font-family:monospace;font-size:10px;color:#16a34a;text-align:right;vertical-align:middle;">+${formatCurrency(profitRetailer)}</td>` : ''}
          ${showCustomer ? `<td style="padding:7px 10px;font-family:monospace;font-weight:800;font-size:13px;color:#059669;text-align:right;vertical-align:middle;">${formatCurrency(item.customerPrice)}</td>` : ''}
          ${showCustomer && showCost ? `<td style="padding:7px 10px;font-family:monospace;font-size:10px;color:#16a34a;text-align:right;vertical-align:middle;">+${formatCurrency(profitCustomer)}</td>` : ''}
        </tr>`;
    });
  });

  // Build header columns
  let colHeaders = `
    <th style="${thStyle}text-align:center;">#</th>
    <th style="${thStyle}">Item Name</th>
    <th style="${thStyle}">Code</th>
    ${showCost ? `<th style="${thStyle}text-align:right;color:#dc2626;">Cost</th>` : ''}
    ${showRetailer ? `<th style="${thStyle}text-align:right;color:#0891b2;">Retailer Rate</th>` : ''}
    ${showRetailer && showCost ? `<th style="${thStyle}text-align:right;color:#16a34a;">R. Profit</th>` : ''}
    ${showCustomer ? `<th style="${thStyle}text-align:right;color:#059669;">Customer Price</th>` : ''}
    ${showCustomer && showCost ? `<th style="${thStyle}text-align:right;color:#16a34a;">C. Profit</th>` : ''}
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
      font-size: 12px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .page { padding: 14mm 12mm; min-height: 100vh; background: #ffffff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; }
    .business-name { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; text-transform: uppercase; }
    .business-sub { font-size: 11px; color: #475569; margin-top: 3px; font-weight: 500; }
    .catalog-badge { background: #0f172a; color: #ffffff; padding: 4px 12px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
    .catalog-date { font-size: 11px; color: #475569; margin-top: 6px; font-family: monospace; }
    .summary-bar { display: flex; gap: 20px; margin-bottom: 16px; padding: 10px 14px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; }
    .summary-item { display: flex; flex-direction: column; gap: 2px; }
    .summary-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
    .summary-value { font-size: 14px; font-weight: 800; color: #0f172a; font-family: monospace; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; background: #ffffff; }
    thead tr { background: #f1f5f9; }
    th { padding: 8px 10px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #334155; border-bottom: 2px solid #cbd5e1; text-align: left; }
    tbody tr:hover { background: #f8fafc; }
    td { vertical-align: middle; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; font-family: monospace; }
    @media print {
      html, body { background: #ffffff !important; }
      .page { padding: 8mm 8mm; }
      @page { size: A4; margin: 8mm; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="business-name">Gunatit Submersible</div>
      <div class="business-sub">Submersible Pump Repair Parts</div>
      <div class="business-sub" style="margin-top:4px;">📞 9925531065</div>
    </div>
    <div style="text-align:right;">
      <div class="catalog-badge">${catalogLabel}</div>
      <div class="catalog-date">Date: ${displayDate}</div>
      <div class="catalog-date" style="margin-top:2px;">Items: ${items.length}</div>
    </div>
  </div>

  <div class="summary-bar">
    <div class="summary-item">
      <span class="summary-label">Total Items</span>
      <span class="summary-value">${items.length}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Categories</span>
      <span class="summary-value">${grouped.size}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Price Type</span>
      <span class="summary-value" style="font-size:11px;">${catalogLabel}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Generated</span>
      <span class="summary-value" style="font-size:11px;">${dateStr}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>${colHeaders}</tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>

  <div class="footer">
    <span>Gunatit Submersible • Mobile: 9925531065 • Confidential Price Book</span>
    <span>Printed: ${displayDate} • gunatit-submersible.in</span>
  </div>
</div>
<script>
  window.onload = function() {
    window.print();
    setTimeout(function() { window.close(); }, 1200);
  };
</script>
</body>
</html>`;
}

// Placeholder for the th style (used in template literal)
const thStyle = 'padding:8px 10px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#334155;border-bottom:2px solid #cbd5e1;text-align:left;';

export function PdfPriceListModal({ items, categories = [], onClose }: PdfPriceListModalProps) {
  const [catalogType, setCatalogType] = useState<'customer' | 'retailer' | 'complete'>('customer');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [useDateSnapshot, setUseDateSnapshot] = useState(false);
  const [snapshotDate, setSnapshotDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredItems = items.filter((item) => {
    if (selectedCatId !== 'all' && item.category.id !== selectedCatId) return false;
    return true;
  });

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

      // Open a completely fresh white window — no dark mode CSS bleeding in
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
    // Builds the content as plain text for sharing (WhatsApp etc.)
    const lines = [
      '📋 GUNATIT SUBMERSIBLE',
      '📞 9925531065',
      `📅 Date: ${dateStr}`,
      `📦 Price List: ${catalogType === 'customer' ? 'Customer' : catalogType === 'retailer' ? 'Retailer' : 'Complete'}`,
      `🏷️ Category: ${selectedCategoryName}`,
      '─'.repeat(30),
      ...filteredItems.map((item, idx) => {
        const prices =
          catalogType === 'customer'
            ? `Customer: ${formatCurrency(item.customerPrice)}`
            : catalogType === 'retailer'
            ? `Retailer: ${formatCurrency(item.retailerPrice)}`
            : `Cost: ${formatCurrency(item.costPrice)} | Ret: ${formatCurrency(item.retailerPrice)} | Cust: ${formatCurrency(item.customerPrice)}`;
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
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(lines);
      alert('Price list copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 no-print">
      {/* Backdrop close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95">
        {/* Drag Handle (Mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Export Price List</h2>
              <p className="text-[11px] text-slate-400 font-medium">Gunatit Submersible</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 1. Price Type */}
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Price Type</p>
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
                    className={`relative py-3 rounded-2xl border text-center transition-all font-bold text-xs overflow-hidden ${
                      active
                        ? `bg-gradient-to-br ${colors[type]} text-white border-transparent shadow-lg`
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
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
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Category Filter</p>
            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 appearance-none"
              >
                <option value="all">All Categories ({items.length} items)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 3. Date Snapshot Toggle */}
          <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-violet-500" />
              <div>
                <p className="text-xs font-bold text-slate-800">Historical Date Snapshot</p>
                <p className="text-[10px] text-slate-400">Show prices from a past date</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useDateSnapshot}
                onChange={(e) => setUseDateSnapshot(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {useDateSnapshot && (
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Select Date</p>
              <input
                type="date"
                value={snapshotDate}
                onChange={(e) => setSnapshotDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              />
            </div>
          )}

          {/* Preview Summary */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedCategoryName}</p>
              <p className="text-sm font-black text-white mt-0.5">{filteredItems.length} items selected</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-mono">Filename</p>
              <p className="text-[11px] font-black text-emerald-400 font-mono">Gunatit-{dateStr}.pdf</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-5 pb-6 pt-1 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleSharePdf}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all border border-slate-200"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>

          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-70"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Opening...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
