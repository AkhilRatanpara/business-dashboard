import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import { prisma } from '../src/lib/db';

async function main() {
  const items = await prisma.item.findMany({
    include: {
      category: {
        include: {
          parent: true,
        },
      },
    },
    take: 150,
  });

  const categories = await prisma.category.findMany({
    include: {
      parent: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const catalogLabel = 'CUSTOMER PRICE LIST';
  const displayDate = '31-08-2026';

  const rootCategories = categories.filter((c) => !c.parentId);

  const rootMap = new Map<string, any>();
  const subMap = new Map<string, any[]>();

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

  const naturalSort = (a: any, b: any) => {
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

  const formatPdfPrice = (price: number): string => {
    if (!price || price <= 0) return '—';
    return `Rs. ${price.toLocaleString('en-IN', { minimumFractionDigits: price % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
  };

  const tableColumns = [
    { header: 'SR.', dataKey: 'srNo' },
    { header: 'ITEM NAME & SPECIFICATION', dataKey: 'name' },
    { header: 'COMPANY', dataKey: 'brand' },
    { header: 'CODE', dataKey: 'itemCode' },
    { header: 'CUSTOMER RATE', dataKey: 'customer' },
  ];

  const tableBody: any[] = [];

  rootCategories.forEach((root) => {
    const directItems = items.filter((i) => i.category.id === root.id).sort(naturalSort);
    const subCats = subMap.get(root.id) || [];

    const subCatItemCounts = subCats.map((sub) => ({
      sub,
      items: items.filter((i) => i.category.id === sub.id).sort(naturalSort),
    }));

    const totalItemsUnderRoot = directItems.length + subCatItemCounts.reduce((acc, s) => acc + s.items.length, 0);
    if (totalItemsUnderRoot === 0) return;

    tableBody.push([
      {
        content: `${root.name.toUpperCase()}  [ Total: ${totalItemsUnderRoot} items ]`,
        colSpan: tableColumns.length,
        styles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9.5,
          cellPadding: { top: 6, bottom: 6, left: 10, right: 10 },
          halign: 'left',
        },
      },
    ]);

    directItems.forEach((item) => {
      tableBody.push({
        srNo: item.srNo || '—',
        name: item.name,
        brand: item.brand || '—',
        itemCode: item.itemCode || '—',
        customer: formatPdfPrice(Number(item.customerPrice)),
      });
    });

    subCatItemCounts.forEach(({ sub, items: subItems }) => {
      if (subItems.length === 0) return;

      tableBody.push([
        {
          content: `>>  ${sub.name.toUpperCase()}  (${subItems.length} items)`,
          colSpan: tableColumns.length,
          styles: {
            fillColor: [241, 245, 249],
            textColor: [30, 41, 59],
            fontStyle: 'bold',
            fontSize: 8.5,
            cellPadding: { top: 5, bottom: 5, left: 14, right: 10 },
            halign: 'left',
          },
        },
      ]);

      subItems.forEach((item) => {
        tableBody.push({
          srNo: item.srNo || '—',
          name: item.name,
          brand: item.brand || '—',
          itemCode: item.itemCode || '—',
          customer: formatPdfPrice(Number(item.customerPrice)),
        });
      });
    });
  });

  autoTable(doc, {
    columns: tableColumns,
    body: tableBody,
    startY: 86,
    margin: { top: 86, bottom: 36, left: 24, right: 24 },
    theme: 'grid',
    styles: {
      fontSize: 8,
      font: 'helvetica',
      cellPadding: { top: 4.5, bottom: 4.5, left: 5, right: 5 },
      valign: 'middle',
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: { top: 6, bottom: 6, left: 4, right: 4 },
    },
    columnStyles: {
      srNo: { halign: 'center', cellWidth: 32, fontStyle: 'bold' },
      name: { halign: 'left', fontStyle: 'bold' },
      brand: { halign: 'center', cellWidth: 65, textColor: [71, 85, 105] },
      itemCode: { halign: 'center', cellWidth: 50, textColor: [100, 116, 139] },
      customer: { halign: 'right', cellWidth: 85, fontStyle: 'bold', textColor: [5, 150, 105] },
    },
    didDrawPage: () => {
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(15, 23, 42);
      doc.rect(24, 16, pageWidth - 48, 56, 'F');

      doc.setFillColor(16, 185, 129);
      doc.rect(24, 16, pageWidth - 48, 3, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('GUNATIT SUBMERSIBLE', 36, 38);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('PUMP SPARES & INDUSTRIAL REPAIR PRICE DIRECTORY   |   MOB: +91 9925531065', 36, 52);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 211, 153);
      doc.text(catalogLabel, pageWidth - 36, 38, { align: 'right' });

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text(`REF DATE: ${displayDate}   |   ITEMS: ${items.length}`, pageWidth - 36, 52, { align: 'right' });
    },
  });

  const totalPages = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(24, pageHeight - 24, pageWidth - 24, pageHeight - 24);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      'GUNATIT SUBMERSIBLE  •  MOB: +91 9925531065  •  CONFIDENTIAL PRICE BOOK',
      24,
      pageHeight - 12
    );

    const pageNumText = `PAGE ${i} OF ${totalPages}`;
    doc.text(pageNumText, pageWidth - 24, pageHeight - 12, {
      align: 'right',
    });
  }

  const pdfOutput = doc.output('arraybuffer');
  fs.writeFileSync('d:/Project/Gunatit/Gunatit-Sample-Price-Book.pdf', Buffer.from(pdfOutput));
  console.log(`Generated Gunatit-Sample-Price-Book.pdf with ${totalPages} pages successfully!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
