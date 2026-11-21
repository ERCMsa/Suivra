import companyLogo from '@/assets/logo.png';
import { PDF_FONT, setupPdfFont } from '@/lib/pdfFonts';
import type { InventorySnapshot, InventorySnapshotItem } from '@/hooks/useInventorySnapshots';
import { formatDateTime, formatQuantity, snapshotTypeLabel } from '@/lib/inventory';

export interface InventoryReportOptions {
  snapshot: InventorySnapshot;
  items: InventorySnapshotItem[];
  lang: 'ar' | 'fr';
}

/** Minimal shape of the jsPDF instance extended by jspdf-autotable. */
interface AutoTableDocument {
  autoTable: (options: Record<string, unknown>) => void;
  lastAutoTable?: { finalY?: number };
  internal: { getNumberOfPages: () => number };
}

const reportLabels = (lang: 'ar' | 'fr') =>
  lang === 'fr'
    ? {
        company: 'Gestion du matériel',
        subtitle: 'État du stock à la date du snapshot',
        date: "Date de l'inventaire",
        type: 'Type de snapshot',
        materials: 'Nombre de matériaux',
        totalQty: 'Quantité totale',
        index: 'N°',
        reference: 'Référence',
        designation: 'Désignation',
        unit: 'Unité',
        quantity: 'Quantité',
        note: 'Note',
        generatedOn: 'Rapport généré le',
        page: 'Page',
      }
    : {
        company: 'إدارة المواد',
        subtitle: 'حالة المخزون في تاريخ الجرد',
        date: 'تاريخ الجرد',
        type: 'نوع الجرد',
        materials: 'عدد المواد',
        totalQty: 'إجمالي الكميات',
        index: 'رقم',
        reference: 'المرجع',
        designation: 'التسمية',
        unit: 'الوحدة',
        quantity: 'الكمية',
        note: 'ملاحظة',
        generatedOn: 'تم إنشاء التقرير في',
        page: 'صفحة',
      };

const loadImageAsDataUrl = (url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Canvas unavailable'));
        return;
      }
      context.drawImage(image, 0, 0);
      try {
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error('Logo could not be loaded'));
    image.src = url;
  });

const buildInventoryReport = async ({ snapshot, items, lang }: InventoryReportOptions) => {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const labels = reportLabels(lang);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  await setupPdfFont(doc);
  const pdf = doc as unknown as AutoTableDocument;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const generatedAt = new Date();

  // -------------------------------------------------------------------------
  // Letterhead
  // -------------------------------------------------------------------------
  try {
    const logo = await loadImageAsDataUrl(companyLogo);
    doc.addImage(logo, 'PNG', margin, 10, 28, 28);
  } catch {
    // The report stays valid without the logo.
  }

  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text('ERCM SA', pageWidth - margin, 19, { align: 'right' });

  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(labels.company, pageWidth - margin, 25, { align: 'right' });

  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(18);
  doc.setTextColor(13, 148, 136);
  doc.text('INVENTORY REPORT', pageWidth / 2, 51, { align: 'center' });

  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(labels.subtitle, pageWidth / 2, 57, { align: 'center' });

  doc.setDrawColor(13, 148, 136);
  doc.setLineWidth(0.5);
  doc.line(margin, 62, pageWidth - margin, 62);

  // -------------------------------------------------------------------------
  // Snapshot metadata
  // -------------------------------------------------------------------------
  const metaTop = 71;
  const rightColumn = pageWidth / 2 + 6;

  const metaRow = (label: string, value: string, x: number, y: number) => {
    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x, y);
    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(value, x, y + 5);
  };

  metaRow(labels.date, formatDateTime(snapshot.captured_at), margin, metaTop);
  metaRow(labels.type, snapshotTypeLabel(snapshot.snapshot_type, lang), rightColumn, metaTop);
  metaRow(labels.materials, String(snapshot.material_count), margin, metaTop + 13);
  metaRow(labels.totalQty, formatQuantity(snapshot.total_quantity), rightColumn, metaTop + 13);

  let tableTop = metaTop + 30;
  if (snapshot.note) {
    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`${labels.note}: ${snapshot.note}`, margin, tableTop - 6, {
      maxWidth: pageWidth - margin * 2,
    });
    tableTop += 3;
  }

  // -------------------------------------------------------------------------
  // Materials table (multi-page, repeated header)
  // -------------------------------------------------------------------------
  const rows = items.map((item, index) => [
    String(index + 1),
    item.reference,
    item.designation,
    item.unit || '—',
    formatQuantity(item.quantity),
  ]);

  pdf.autoTable({
    head: [[labels.index, labels.reference, labels.designation, labels.unit, labels.quantity]],
    body: rows.length > 0 ? rows : [['—', '—', '—', '—', '—']],
    startY: tableTop,
    margin: { left: margin, right: margin, top: 20, bottom: 24 },
    styles: {
      font: PDF_FONT,
      fontSize: 9,
      cellPadding: 2.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      textColor: [30, 41, 59],
    },
    headStyles: {
      font: PDF_FONT,
      fontStyle: 'bold',
      fillColor: [13, 148, 136],
      textColor: [255, 255, 255],
      halign: 'center',
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 30 },
      2: { halign: 'left' },
      3: { cellWidth: 28, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
    },
    didDrawPage: (data: { pageNumber: number }) => {
      if (data.pageNumber > 1) {
        doc.setFont(PDF_FONT, 'bold');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`ERCMsa — INVENTORY REPORT`, margin, 12);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(margin, 14, pageWidth - margin, 14);
      }
    },
  });

  // -------------------------------------------------------------------------
  // Totals + generation date, then page numbers on every page
  // -------------------------------------------------------------------------
  let footerTop = (pdf.lastAutoTable?.finalY ?? tableTop) + 10;
  if (footerTop > pageHeight - 30) {
    doc.addPage();
    footerTop = 22;
  }

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, footerTop - 4, pageWidth - margin, footerTop - 4);

  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${labels.materials}: ${snapshot.material_count}`, margin, footerTop + 3);
  doc.text(`${labels.totalQty}: ${formatQuantity(snapshot.total_quantity)}`, pageWidth - margin, footerTop + 3, {
    align: 'right',
  });

  const totalPages = pdf.internal.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`${labels.generatedOn}: ${formatDateTime(generatedAt)}`, margin, pageHeight - 10);
    doc.text(`${labels.page} ${page} / ${totalPages}`, pageWidth - margin, pageHeight - 10, {
      align: 'right',
    });
  }

  return doc;
};

const reportFileName = (snapshot: InventorySnapshot) => {
  const date = new Date(snapshot.captured_at);
  const stamp = Number.isNaN(date.getTime())
    ? new Date().toISOString().slice(0, 10)
    : date.toISOString().slice(0, 10);
  return `inventaire_${snapshot.snapshot_type}_${stamp}.pdf`;
};

export const downloadInventoryReport = async (options: InventoryReportOptions) => {
  const doc = await buildInventoryReport(options);
  doc.save(reportFileName(options.snapshot));
};

export const printInventoryReport = async (options: InventoryReportOptions) => {
  // Open the window synchronously so popup blockers keep it, then navigate to
  // the generated PDF once it is ready.
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('The print window was blocked by the browser');
  }

  try {
    const doc = await buildInventoryReport(options);
    doc.autoPrint();
    printWindow.location.href = doc.output('bloburl').toString();
  } catch (error) {
    printWindow.close();
    throw error;
  }
};
