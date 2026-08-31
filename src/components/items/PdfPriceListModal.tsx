'use client';

import { useState } from 'react';
import { FileText, X, Download, Share2, Filter, Calendar, Check, Sparkles } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/lib/utils';
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
  unit?: string | null;
  category: { id: string; name: string; parentId?: string | null };
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
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

export function PdfPriceListModal({ items, categories = [], onClose }: PdfPriceListModalProps) {
  const [catalogType, setCatalogType] = useState<'customer' | 'retailer' | 'complete'>('customer');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [useDateSnapshot, setUseDateSnapshot] = useState(false);
  const [snapshotDate, setSnapshotDate] = useState<string>(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const dateStr = getFormattedDate();

  // Root categories
  const rootCategories = categories.filter((c) => !c.parentId);

  // Filter items by category
  const filteredItems = items.filter((item) => {
    if (selectedCatId === 'all') return true;
    if (item.category.id === selectedCatId || item.category.parentId === selectedCatId) return true;
    // Check if item belongs to a descendant of selectedCatId
    const cat = categories.find((c) => c.id === item.category.id);
    return cat?.parentId === selectedCatId;
  });

  const selectedCategoryName =
    selectedCatId === 'all'
      ? 'All Categories Catalog'
      : categories.find((c) => c.id === selectedCatId)?.name || 'Custom Category';

  // Build high quality jsPDF document
  const generatePdfDoc = (): jsPDF => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const catalogLabel =
      catalogType === 'customer'
        ? 'Customer Price List'
        : catalogType === 'retailer'
        ? 'Retailer Price List'
        : 'Complete Price Catalog (Confidential)';

    const displayDate = useDateSnapshot ? getFormattedDate(snapshotDate) : dateStr;

    // Build hierarchy: Root Categories -> Subcategories -> Items
    const rootMap = new Map<string, Category>();
    const subMap = new Map<string, Category[]>();

    categories.forEach((cat) => {
      if (!cat.parentId) {
        rootMap.set(cat.id, cat);
      } else {
        if (!subMap.has(cat.parentId)) {
          subMap.set(cat.parentId, []);
        }
        subMap.get(cat.parentId)!.push(cat);
      }
    });

    // Determine roots to print
    let rootsToPrint: Category[] = [];
    if (selectedCatId === 'all') {
      rootsToPrint = rootCategories;
    } else {
      const selected = categories.find((c) => c.id === selectedCatId);
      if (selected) {
        if (!selected.parentId) {
          rootsToPrint = [selected];
        } else {
          rootsToPrint = [selected];
        }
      }
    }

    // Sort items naturally
    const naturalSort = (a: Item, b: Item) => {
      if (a.srNo && b.srNo) {
        const numA = parseFloat(a.srNo);
        const numB = parseFloat(b.srNo);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.srNo.localeCompare(b.srNo, undefined, { numeric: true });
      }
      if (a.srNo) return -1;
      if (b.srNo) return 1;
      return a.name.localeCompare(b.name);
    };

    // Columns config
    const showCost = catalogType === 'complete';
    const showRetailer = catalogType === 'retailer' || catalogType === 'complete';
    const showCustomer = catalogType === 'customer' || catalogType === 'complete';

    const tableColumns = [
      { header: 'Sr.', dataKey: 'srNo' },
      { header: 'Item Name & Specification', dataKey: 'name' },
      { header: 'Company', dataKey: 'brand' },
      { header: 'Code', dataKey: 'itemCode' },
      ...(showCost ? [{ header: 'Cost (₹)', dataKey: 'cost' }] : []),
      ...(showRetailer ? [{ header: 'Retailer (₹)', dataKey: 'retailer' }] : []),
      ...(showCustomer ? [{ header: 'Customer (₹)', dataKey: 'customer' }] : []),
    ];

    // Build row data with category section headers
    const tableBody: any[] = [];

    rootsToPrint.forEach((root) => {
      const directItems = filteredItems.filter((i) => i.category.id === root.id).sort(naturalSort);
      const subCats = subMap.get(root.id) || [];

      // Check if root or any subcategory has matching items
      const subCatItemCounts = subCats.map((sub) => ({
        sub,
        items: filteredItems.filter((i) => i.category.id === sub.id).sort(naturalSort),
      }));

      const totalItemsUnderRoot = directItems.length + subCatItemCounts.reduce((acc, s) => acc + s.items.length, 0);
      if (totalItemsUnderRoot === 0) return;

      // 1. Root Category Banner Row
      tableBody.push([
        {
          content: `${root.name.toUpperCase()} (${totalItemsUnderRoot} items)`,
          colSpan: tableColumns.length,
          styles: {
            fillColor: [15, 23, 42], // Slate 900
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10,
            halign: 'left',
          },
        },
      ]);

      // Direct items under root
      directItems.forEach((item) => {
        const row: any = {
          srNo: item.srNo || '—',
          name: item.name,
          brand: item.brand || '—',
          itemCode: item.itemCode || '—',
        };
        if (showCost) row.cost = item.costPrice > 0 ? `₹${item.costPrice.toLocaleString('en-IN')}` : '—';
        if (showRetailer) row.retailer = item.retailerPrice > 0 ? `₹${item.retailerPrice.toLocaleString('en-IN')}` : '—';
        if (showCustomer) row.customer = item.customerPrice > 0 ? `₹${item.customerPrice.toLocaleString('en-IN')}` : '—';
        tableBody.push(row);
      });

      // 2. Subcategory Sections
      subCatItemCounts.forEach(({ sub, items: subItems }) => {
        if (subItems.length === 0) return;

        // Subcategory Section Divider Row
        tableBody.push([
          {
            content: `   📁  ${sub.name} (${subItems.length} items)`,
            colSpan: tableColumns.length,
            styles: {
              fillColor: [241, 245, 249], // Slate 100
              textColor: [30, 41, 59], // Slate 800
              fontStyle: 'bold',
              fontSize: 9,
              halign: 'left',
            },
          },
        ]);

        subItems.forEach((item) => {
          const row: any = {
            srNo: item.srNo || '—',
            name: item.name,
            brand: item.brand || '—',
            itemCode: item.itemCode || '—',
          };
          if (showCost) row.cost = item.costPrice > 0 ? `₹${item.costPrice.toLocaleString('en-IN')}` : '—';
          if (showRetailer) row.retailer = item.retailerPrice > 0 ? `₹${item.retailerPrice.toLocaleString('en-IN')}` : '—';
          if (showCustomer) row.customer = item.customerPrice > 0 ? `₹${item.customerPrice.toLocaleString('en-IN')}` : '—';
          tableBody.push(row);
        });
      });
    });

    // If no categorized items matched, list raw filtered items
    if (tableBody.length === 0) {
      filteredItems.sort(naturalSort).forEach((item) => {
        const row: any = {
          srNo: item.srNo || '—',
          name: item.name,
          brand: item.brand || '—',
          itemCode: item.itemCode || '—',
        };
        if (showCost) row.cost = item.costPrice > 0 ? `₹${item.costPrice.toLocaleString('en-IN')}` : '—';
        if (showRetailer) row.retailer = item.retailerPrice > 0 ? `₹${item.retailerPrice.toLocaleString('en-IN')}` : '—';
        if (showCustomer) row.customer = item.customerPrice > 0 ? `₹${item.customerPrice.toLocaleString('en-IN')}` : '—';
        tableBody.push(row);
      });
    }

    // Render Table using autoTable
    autoTable(doc, {
      columns: tableColumns,
      body: tableBody,
      startY: 85,
      margin: { top: 85, bottom: 40, left: 30, right: 30 },
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        cellPadding: 4,
        valign: 'middle',
        lineColor: [226, 232, 240],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [16, 185, 129], // Emerald 500
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        srNo: { halign: 'center', cellWidth: 35, fontStyle: 'bold' },
        name: { halign: 'left', fontStyle: 'bold' },
        brand: { halign: 'center', cellWidth: 70 },
        itemCode: { halign: 'center', cellWidth: 55 },
        cost: { halign: 'right', cellWidth: 65, fontStyle: 'bold', textColor: [220, 38, 38] },
        retailer: { halign: 'right', cellWidth: 70, fontStyle: 'bold', textColor: [8, 145, 178] },
        customer: { halign: 'right', cellWidth: 75, fontStyle: 'bold', textColor: [5, 150, 105] },
      },
      didDrawPage: (data) => {
        // Top Header Banner
        doc.setFillColor(15, 23, 42); // Slate 900
        doc.rect(30, 20, doc.internal.pageSize.getWidth() - 60, 52, 'F');

        // Shop Name
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('GUNATIT SUBMERSIBLE', 42, 40);

        // Subtitle & Contact
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text('Pump Spares & Repair Price Directory • 📞 9925531065', 42, 54);

        // Catalog Type Badge & Date
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 211, 153); // Emerald 400
        doc.text(catalogLabel, doc.internal.pageSize.getWidth() - 42, 40, { align: 'right' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(203, 213, 225); // Slate 300
        doc.text(`Date: ${displayDate} • Items: ${filteredItems.length}`, doc.internal.pageSize.getWidth() - 42, 54, { align: 'right' });

        // Bottom Footer
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(
          'Gunatit Submersible • 9925531065 • Confidential Price Book',
          30,
          pageHeight - 20
        );

        const pageNumText = `Page ${data.pageNumber} of ${doc.getNumberOfPages()}`;
        doc.text(pageNumText, doc.internal.pageSize.getWidth() - 30, pageHeight - 20, {
          align: 'right',
        });
      },
    });

    return doc;
  };

  // Direct PDF Download Handler
  const handleDownloadPdf = () => {
    if (filteredItems.length === 0) {
      notify('No items selected to download', 'error');
      return;
    }
    setIsGenerating(true);
    try {
      const doc = generatePdfDoc();
      const filename = `Gunatit-Price-Book-${selectedCategoryName.replace(/[^a-zA-Z0-9]/g, '_')}-${dateStr}.pdf`;
      doc.save(filename);
      notify(`Downloaded "${filename}"`, 'success');
      onClose();
    } catch (err) {
      console.error('Error generating PDF:', err);
      notify('Failed to generate PDF. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Direct PDF Share Handler (Web Share API)
  const handleSharePdf = async () => {
    if (filteredItems.length === 0) {
      notify('No items selected to share', 'error');
      return;
    }
    setIsSharing(true);
    try {
      const doc = generatePdfDoc();
      const filename = `Gunatit-Price-Book-${dateStr}.pdf`;
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: 'Gunatit Submersible Price List',
          text: `Gunatit Submersible Price Catalog (${filteredItems.length} items) - Date: ${dateStr}`,
        });
        notify('Shared PDF successfully!', 'success');
        onClose();
      } else {
        // Fallback for browsers that don't support file sharing: download directly
        doc.save(filename);
        notify('Direct file sharing not supported on this browser. PDF downloaded instead.', 'info');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing PDF:', err);
        notify('Could not share PDF. Downloaded instead.', 'info');
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Export Price Catalog</h3>
              <p className="text-[10px] text-slate-500">Direct PDF download & WhatsApp forwarding</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* 1. Price Mode Selector */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Price Type</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCatalogType('customer')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  catalogType === 'customer'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Customer</span>
                <span className="text-[9px] font-normal opacity-80">Selling rates</span>
              </button>

              <button
                type="button"
                onClick={() => setCatalogType('retailer')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  catalogType === 'retailer'
                    ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-500 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Retailer</span>
                <span className="text-[9px] font-normal opacity-80">Dealer rates</span>
              </button>

              <button
                type="button"
                onClick={() => setCatalogType('complete')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  catalogType === 'complete'
                    ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-500 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Complete</span>
                <span className="text-[9px] font-normal opacity-80">All prices</span>
              </button>
            </div>
          </div>

          {/* 2. Category Filter */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Category Selection</p>
            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">All Categories ({items.length} items)</option>
                {rootCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Date Snapshot Toggle */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 rounded-2xl px-4 py-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Historical Date Reference</p>
                <p className="text-[10px] text-slate-400">Include custom date on PDF</p>
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
              <input
                type="date"
                value={snapshotDate}
                onChange={(e) => setSnapshotDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          )}

          {/* Summary Preview Box */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between border border-slate-800 text-white shadow-xs">
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{selectedCategoryName}</p>
              <p className="text-sm font-black mt-0.5">{filteredItems.length} items in PDF</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-mono">Format</p>
              <p className="text-[11px] font-black text-emerald-400 font-mono">Direct A4 PDF</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-5 pb-6 pt-2 grid grid-cols-2 gap-2.5 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={handleSharePdf}
            disabled={isSharing || isGenerating || filteredItems.length === 0}
            className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50"
            title="Directly forward PDF file via WhatsApp / Share"
          >
            {isSharing ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
            ) : (
              <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>Share PDF</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGenerating || isSharing || filteredItems.length === 0}
            className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isGenerating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
