import { PDF_FONT, setupPdfFont } from '@/lib/pdfFonts';
import { ERCM_COMPANY } from '@/lib/ercmCompany';
import type { Product } from '@/hooks/useInventory';
import type { Discharge } from '@/hooks/useDischarges';
import type { Employee } from '@/hooks/useEmployees';

export interface DeliveryNoteInput {
  reference: string;
  dateOut: string | Date;
  project?: string | null;
  destination?: string | null;
  driver?: string | null;
  plate?: string | null;
  recipientName: string;
  recipientPosition?: string | null;
  items: { product_id: string; quantity: number }[];
}

export const deliveryNoteFromDischarge = (
  discharge: Discharge,
  employee?: Employee
): DeliveryNoteInput => ({
  reference: discharge.reference,
  dateOut: discharge.date_out,
  project: discharge.project,
  destination: discharge.delivery_destination,
  driver: discharge.delivery_driver,
  plate: discharge.delivery_vehicle_plate,
  recipientName: employee?.full_name || '—',
  recipientPosition: employee?.position || employee?.department || null,
  items:
    discharge.items && discharge.items.length > 0
      ? discharge.items.map(i => ({ product_id: i.product_id, quantity: Number(i.quantity) }))
      : [{ product_id: discharge.product_id, quantity: Number(discharge.quantity) }],
});

const formatDate = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR');
};

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image could not be loaded'));
    image.src = url;
  });

/** Minimal shape of the jsPDF instance extended by jspdf-autotable. */
interface AutoTableDocument {
  autoTable: (options: Record<string, unknown>) => void;
  lastAutoTable?: { finalY?: number };
}

export const buildDeliveryNote = async (input: DeliveryNoteInput, products: Product[]) => {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  await setupPdfFont(doc);
  const pdf = doc as unknown as AutoTableDocument;

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;

  // ====== OFFICIAL HEADER BOX (FOR-SUP-02) ======
  const headerY = 8;
  const headerH = 22;
  const logoW = 38;
  const rightW = 60;
  const titleX = 10 + logoW;
  const titleW = pageW - 20 - logoW - rightW;

  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.rect(10, headerY, pageW - 20, headerH);
  doc.line(10 + logoW, headerY, 10 + logoW, headerY + headerH);
  doc.line(pageW - 10 - rightW, headerY, pageW - 10 - rightW, headerY + headerH);
  doc.line(10, headerY + headerH - 6, 10 + logoW, headerY + headerH - 6);
  doc.line(titleX, headerY + headerH / 2, titleX + titleW, headerY + headerH / 2);
  doc.line(pageW - 10 - rightW, headerY + headerH / 3, pageW - 10, headerY + headerH / 3);
  doc.line(pageW - 10 - rightW, headerY + (headerH / 3) * 2, pageW - 10, headerY + (headerH / 3) * 2);
  const rightLabelW = 24;
  doc.line(pageW - 10 - rightW + rightLabelW, headerY, pageW - 10 - rightW + rightLabelW, headerY + headerH);

  try {
    const logo = await loadImage('/images/ercm-logo.png');
    doc.addImage(logo, 'PNG', 12, headerY + 1, logoW - 4, headerH - 8);
  } catch {
    // The note stays valid without the logo.
  }

  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(6);
  doc.text('Page 1 sur 1', 12, headerY + headerH - 2);

  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(11);
  doc.text('Formulaire', titleX + titleW / 2, headerY + headerH / 2 - 2, { align: 'center' });
  doc.setFontSize(9.5);
  doc.text("Bon de livraison d'expédition", titleX + titleW / 2, headerY + headerH / 2 + 3, { align: 'center' });
  doc.text('ERCM', titleX + titleW / 2, headerY + headerH / 2 + 7.5, { align: 'center' });

  const rLabelX = pageW - 10 - rightW + 2;
  const rValueX = pageW - 10 - rightW + rightLabelW + 2;
  const rowH = headerH / 3;
  doc.setFontSize(8);
  doc.setFont(PDF_FONT, 'bold');
  doc.text('Référence :', rLabelX, headerY + rowH / 2 + 1);
  doc.text('Date :', rLabelX, headerY + rowH * 1.5 + 1);
  doc.text('Version :', rLabelX, headerY + rowH * 2.5 + 1);
  doc.setFont(PDF_FONT, 'normal');
  doc.text('FOR-SUP-02', rValueX, headerY + rowH / 2 + 1);
  doc.text(formatDate(new Date()), rValueX, headerY + rowH * 1.5 + 1);
  doc.text('00', rValueX, headerY + rowH * 2.5 + 1);

  // ====== DOCUMENT TITLE ======
  let y = headerY + headerH + 9;
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(14);
  doc.text(`BON DE LIVRAISON N° : ${input.reference}`, margin, y);
  doc.setFontSize(10);
  doc.setFont(PDF_FONT, 'normal');
  doc.text(formatDate(input.dateOut), pageW - margin, y, { align: 'right' });

  y += 3;
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);

  // ====== INFORMATION GRID ======
  y += 7;
  const rightCol = pageW / 2 + 6;
  const labelW = 24;
  const infoRow = (label: string, value: string | null | undefined, x: number, rowY: number) => {
    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(8.5);
    doc.text(`${label} :`, x, rowY);
    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(9);
    const text = doc.splitTextToSize(value || '—', pageW / 2 - labelW - 16)[0] || '—';
    doc.text(text, x + labelW, rowY);
  };

  infoRow('Bénéficiaire', input.recipientName, margin, y);
  infoRow('LIEU', input.destination, rightCol, y);
  y += 6;
  infoRow('Fonction', input.recipientPosition, margin, y);
  infoRow('Chauffeur', input.driver, rightCol, y);
  y += 6;
  infoRow('Projet', input.project, margin, y);
  infoRow('Matricule', input.plate, rightCol, y);
  y += 8;

  // ====== ITEMS TABLE ======
  const rows = input.items.map((item, index) => {
    const product = products.find(p => p.id === item.product_id);
    return [
      String(index + 1),
      product?.designation || '—',
      product?.type || '—',
      String(item.quantity),
      product?.unit || '—',
    ];
  });
  const totalQuantity = input.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  pdf.autoTable({
    startY: y,
    head: [['N°', 'Article', 'Catégorie', 'Quantité', 'Unité']],
    body: rows.length > 0 ? rows : [['—', '—', '—', '—', '—']],
    foot: [['', 'TOTAL', '', String(totalQuantity), '']],
    styles: {
      font: PDF_FONT,
      fontSize: 9,
      halign: 'center',
      cellPadding: 2.5,
      lineWidth: 0.25,
      lineColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
    },
    footStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
    },
    columnStyles: { 1: { halign: 'left' }, 2: { halign: 'left' } },
    margin: { left: margin, right: margin },
  });

  let blockY = (pdf.lastAutoTable?.finalY || y) + 10;
  const legalH = 18;
  const sigH = 22;

  if (blockY + legalH + 6 + sigH > pageH - 10) {
    doc.addPage();
    blockY = 20;
  }

  // ====== LEGAL IDENTIFICATION ======
  // doc.setDrawColor(0);
  // doc.setLineWidth(0.3);
  // doc.rect(margin, blockY, pageW - margin * 2, legalH);
  // doc.setFont(PDF_FONT, 'normal');
  // doc.setFontSize(8);
  // doc.text(`N°RC : ${ERCM_COMPANY.rc}`, margin + 3, blockY + 5);
  // doc.text(`N°AI : ${ERCM_COMPANY.ai}    N°IF : ${ERCM_COMPANY.nif}`, margin + 3, blockY + 10.5);
  // doc.text(`N°IS : ${ERCM_COMPANY.nis}`, margin + 3, blockY + 16);

  blockY += legalH + 6;

  // ====== SIGNATURES ======
  const sigLabels = ['Le Magasinier', 'Le Chauffeur', 'Cachet & Signature'];
  const sigW = (pageW - margin * 2 - 4) / 3;
  for (let i = 0; i < sigLabels.length; i += 1) {
    const sx = margin + i * (sigW + 2);
    doc.setLineWidth(0.3);
    doc.rect(sx, blockY, sigW, sigH);
    doc.setFillColor(245, 245, 245);
    doc.rect(sx, blockY, sigW, 5, 'FD');
    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(7.5);
    doc.text(sigLabels[i], sx + sigW / 2, blockY + 3.5, { align: 'center' });
  }

  // ====== FOOTER ======
  doc.setFont(PDF_FONT, 'italic');
  doc.setFontSize(7);
  doc.text(
    "ERCMsa - Étude Réalisation Constructions Métalliques - Salhi Adel Zone Industriel Ouled Moussa Algerie",
    pageW / 2,
    pageH - 16,
    { align: 'center' }
  );
  doc.text(
    "N°RC : 35/00-3674152 A17    N°AI : 35204129121   N°IF : 191163800093114    N°IS : 1 991 1642 00093 36",
    pageW / 2,
    pageH - 12,
    { align: 'center' }
  );
  doc.text(
    "Le présent document est la propriété exclusive de l’ERCM, la reproduction et la diffusion en externe est interdit",
    pageW / 2,
    pageH - 8,
    { align: 'center' }
  );

  return doc;
};

export const downloadDeliveryNote = async (input: DeliveryNoteInput, products: Product[]) => {
  const doc = await buildDeliveryNote(input, products);
  const safeRef = input.reference.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`bon_livraison_${safeRef}.pdf`);
};
