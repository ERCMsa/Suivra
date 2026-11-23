import logoUrl from '@/assets/logo-single-md.png';
import stampUrl from '@/assets/signaturemag.png';
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

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image could not be loaded'));
    image.src = url;
  });

/** Trims the transparent padding around a PNG so it can be placed edge to edge. */
const cropToContent = (image: HTMLImageElement, sample = 500): HTMLCanvasElement | null => {
  const ratio = Math.min(1, sample / Math.max(image.width, image.height));
  const w = Math.max(1, Math.round(image.width * ratio));
  const h = Math.max(1, Math.round(image.height * ratio));
  const probe = document.createElement('canvas');
  probe.width = w;
  probe.height = h;
  const probeCtx = probe.getContext('2d');
  if (!probeCtx) return null;
  probeCtx.drawImage(image, 0, 0, w, h);

  const pixels = probeCtx.getImageData(0, 0, w, h).data;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (pixels[(y * w + x) * 4 + 3] > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;

  const sourceX = minX / ratio;
  const sourceY = minY / ratio;
  const sourceW = (maxX - minX + 1) / ratio;
  const sourceH = (maxY - minY + 1) / ratio;

  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(sourceW));
  out.height = Math.max(1, Math.round(sourceH));
  const outCtx = out.getContext('2d');
  if (!outCtx) return null;
  outCtx.drawImage(image, sourceX, sourceY, sourceW, sourceH, 0, 0, out.width, out.height);
  return out;
};

/** Minimal shape of the jsPDF instance extended by jspdf-autotable. */
interface AutoTableDocument {
  autoTable: (options: Record<string, unknown>) => void;
  lastAutoTable?: { finalY?: number };
}

interface CellHookData {
  cell: { raw: unknown; styles: { font?: string } };
}

type GStateConstructor = new (parameters: { opacity: number }) => unknown;

// ---- Page geometry, measured from the reference form (mm) -------------------
const PAGE_W = 210;
const PAGE_H = 297;
const BODY_FONT = 'helvetica';

const HEADER_X = 10.72;
const HEADER_Y = 10.72;
const HEADER_W = 188.48;
const HEADER_H = 25.84;
const HEADER_COL1 = 44.58;
const HEADER_COL2 = 142.4;
const HEADER_LEFT_SPLIT = 29.5;
const HEADER_CENTER_SPLIT = 20.11;
const HEADER_ROW1 = 19.36;
const HEADER_ROW2 = 27.96;

const TITLE_CENTER = 82.55;
const TITLE_BASELINE = 48.18;
const DATE_RIGHT = 153.9;
const CLIENT_BASELINE = 56.71;
const CLIENT_STEP = 6;

const PROJECT_X = 12.7;
const PROJECT_Y = 72.82;
const RIGHT_BLOCK_X = 128.42;
const LEFT_BLOCK_X = 20.72;
const RIGHT_BLOCK_Y = 72.83;
const RIGHT_BLOCK_STEP = 5.29;

const TABLE_X = 10.36;
const TABLE_W = 189.19;
const TABLE_Y = 93.4;

const SIG_Y = 186.98;
const SIG_W = 70.2;
const SIG_H = 34.93;
const SIG_X1 = 31.05;
const SIG_X2 = 108.66;

const FOOTER_RULE_Y = 270.2;
const FOOTER_ADDRESS_Y = 283.03;
const FOOTER_LEGAL_Y = 287.53;
const FOOTER_COPY_Y = 292.38;

export const buildDeliveryNote = async (input: DeliveryNoteInput, products: Product[]) => {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdf = doc as unknown as AutoTableDocument;

  // ====== ITEMS ======
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

  // Arabic glyphs are not available in Helvetica: embed DejaVuSans only when needed.
  const printable = [
    input.reference,
    input.project,
    input.destination,
    input.driver,
    input.plate,
    input.recipientName,
    input.recipientPosition,
    ...rows.flat(),
  ];
  const arabicReady = printable.some(value => typeof value === 'string' && ARABIC_RE.test(value));
  if (arabicReady) await setupPdfFont(doc);

  /** Applies the font that can actually render this string, keeping Helvetica everywhere else. */
  const applyFont = (text: string, style: 'normal' | 'bold' | 'italic' = 'normal') => {
    doc.setFont(arabicReady && ARABIC_RE.test(text) ? PDF_FONT : BODY_FONT, style);
  };

  const [logo, stamp] = await Promise.all([
    loadImage(logoUrl).catch(() => null),
    loadImage(stampUrl).catch(() => null),
  ]);
  const stampCropped = stamp ? cropToContent(stamp) : null;

  // ====== WATERMARK (faint, on top of the content, every page) ======
  const drawWatermark = () => {
    if (!logo) return;
    const width = 200;
    const height = width * (logo.height / logo.width);
    const GState = (doc as unknown as { GState?: GStateConstructor }).GState;
    if (GState) doc.setGState(new GState({ opacity: 0.06 }));
    doc.addImage(
      logo,
      'PNG',
      (PAGE_W - width) / 2,
      (PAGE_H - height) / 2,
      width,
      height,
      undefined,
      'FAST'
    );
    if (GState) doc.setGState(new GState({ opacity: 1 }));
  };

  // ====== HEADER BOX ======
  doc.setDrawColor(0);
  doc.setTextColor(0);
  doc.setLineWidth(0.4);
  doc.rect(HEADER_X, HEADER_Y, HEADER_W, HEADER_H);
  doc.line(HEADER_COL1, HEADER_Y, HEADER_COL1, HEADER_Y + HEADER_H);
  doc.line(HEADER_COL2, HEADER_Y, HEADER_COL2, HEADER_Y + HEADER_H);
  doc.line(HEADER_X, HEADER_LEFT_SPLIT, HEADER_COL1, HEADER_LEFT_SPLIT);
  doc.line(HEADER_COL1, HEADER_CENTER_SPLIT, HEADER_COL2, HEADER_CENTER_SPLIT);
  doc.line(HEADER_COL2, HEADER_ROW1, HEADER_X + HEADER_W, HEADER_ROW1);
  doc.line(HEADER_COL2, HEADER_ROW2, HEADER_X + HEADER_W, HEADER_ROW2);

  if (logo) {
    doc.addImage(logo, 'PNG', 15.34, 12.39, 24.7, 15.62, undefined, 'FAST');
  }
  applyFont('Page 1 sur 1', 'bold');
  doc.setFontSize(10);
  doc.text('Page 1 sur 1', 17.35, 33.74);

  const headerCenter = (HEADER_COL1 + HEADER_COL2) / 2;
  applyFont('Formulaire', 'bold');
  doc.setFontSize(16);
  doc.text('Formulaire', headerCenter, 16.68, { align: 'center' });
  applyFont("Bon de livraison d'expédition ERCM", 'bold');
  doc.setFontSize(14);
  doc.text("Bon de livraison d'expédition ERCM", headerCenter, 29.32, { align: 'center' });

  const headerRows: [string, string][] = [
    ['Référence :', 'FOR-SUP-02'],
    ['Date :', formatDate(input.dateOut)],
    ['Version :', '00'],
  ];
  headerRows.forEach(([label, value], index) => {
    const baseline = [15.7, 24.32, 32.94][index];
    applyFont(label, 'bold');
    doc.setFontSize(9);
    doc.text(label, 145.45, baseline);
    applyFont(value);
    doc.text(value, 145.45 + doc.getTextWidth(label) + 1.6, baseline);
  });

  // ====== DOCUMENT TITLE ======
  const title = `BON DE LIVRAISON N° : ${input.reference}`;
  applyFont(title, 'bold');
  doc.setFontSize(16);
  doc.text(title, TITLE_CENTER, TITLE_BASELINE, { align: 'center' });

  const dateText = formatDate(input.dateOut);
  applyFont(dateText);
  doc.setFontSize(12);
  doc.text(dateText, DATE_RIGHT, TITLE_BASELINE + 1.45);

  // ====== CLIENT LINES ======

  // ====== INFORMATION BLOCKS ======

  const leftRows: [string, string | null | undefined][] = [
    ['Projet', input.project],
    ['Bénéficiaire', input.recipientName],
    ['Siège', input.recipientPosition],
  ];
  leftRows.forEach(([label, value], index) => {
    const text = `${label}: ${value || '—'}`;
    applyFont(text);
    doc.setFontSize(12);
    doc.text(
      doc.splitTextToSize(text, PAGE_W - LEFT_BLOCK_X - 2)[0] || text,
      LEFT_BLOCK_X,
      RIGHT_BLOCK_Y + index * RIGHT_BLOCK_STEP
    );
  });

  const rightRows: [string, string | null | undefined][] = [
    ['LIEU', input.destination],
    ['Chauffeur', input.driver],
    ['Matricule', input.plate],
  ];
  rightRows.forEach(([label, value], index) => {
    const text = `${label}: ${value || '—'}`;
    applyFont(text);
    doc.setFontSize(12);
    doc.text(
      doc.splitTextToSize(text, PAGE_W - RIGHT_BLOCK_X - 2)[0] || text,
      RIGHT_BLOCK_X,
      RIGHT_BLOCK_Y + index * RIGHT_BLOCK_STEP
    );
  });

  // ====== ITEMS TABLE ======
  pdf.autoTable({
    startY: TABLE_Y,
    theme: 'grid',
    head: [['N°', 'Article', 'Catégorie', 'Quantité', 'Unité']],
    body: rows.length > 0 ? rows : [['—', '—', '—', '—', '—']],
    foot: [['', 'TOTAL', '', String(totalQuantity), '']],
    styles: {
      font: BODY_FONT,
      fontSize: 12,
      halign: 'center',
      valign: 'middle',
      cellPadding: 1.4,
      minCellHeight: 7.67,
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      minCellHeight: 13.32,
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
    },
    footStyles: {
      fillColor: [230, 230, 230],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 17.11 },
      1: { cellWidth: 76 },
      2: { cellWidth: 45 },
      3: { cellWidth: 26.08 },
      4: { cellWidth: 25 },
    },
    margin: { left: TABLE_X, right: PAGE_W - TABLE_X - TABLE_W, top: 20, bottom: 75 },
    didParseCell: (data: CellHookData) => {
      if (arabicReady && typeof data.cell.raw === 'string' && ARABIC_RE.test(data.cell.raw)) {
        data.cell.styles.font = PDF_FONT;
      }
    },
  });

  // ====== SIGNATURES ======
  const tableEnd = pdf.lastAutoTable?.finalY || TABLE_Y;
  let sigY = Math.max(SIG_Y, tableEnd + 8.8);
  if (sigY + SIG_H > 272) {
    doc.addPage();
    sigY = SIG_Y;
  }

  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.roundedRect(SIG_X1, sigY, SIG_W, SIG_H, 4, 4);
  doc.roundedRect(SIG_X2, sigY, SIG_W, SIG_H, 4, 4);

  applyFont('VISA DE MAGASIN');
  doc.setFontSize(12);
  doc.text('VISA DE MAGASIN', SIG_X1 + SIG_W / 2, sigY + 10.5, { align: 'center' });
  applyFont('VISA DE CLIENT');
  doc.text('VISA DE CLIENT', SIG_X2 + SIG_W / 2, sigY + 10.5, { align: 'center' });

  if (stampCropped) {
    const width = 46;
    const height = width * (stampCropped.height / stampCropped.width);
    doc.addImage(
      stampCropped,
      'PNG',
      SIG_X1 + (SIG_W - width) / 2,
      sigY + 15.5 + (SIG_H - 18 - height) / 2,
      width,
      height,
      undefined,
      'FAST'
    );
  }

  // ====== FOOTER + WATERMARK (every page) ======
  const address =
    'ERCMsa - Étude Réalisation Constructions Métalliques - Salhi Adel Zone Industriel Ouled Moussa Algerie';
  const legal = `N°RC : ${ERCM_COMPANY.rc}    N°AI : ${ERCM_COMPANY.ai}    N°IF : ${ERCM_COMPANY.nif}    N°IS : ${ERCM_COMPANY.nis}`;
  const copyright =
    'Le présent document est la propriété exclusive de l’ERCM, la reproduction et la diffusion en externe est interdit';

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);

    doc.setDrawColor(120);
    doc.setLineWidth(0.5);
    doc.line(61.6, FOOTER_RULE_Y, 145.6, FOOTER_RULE_Y);

    applyFont(address);
    doc.setFontSize(9.3);
    doc.setTextColor(0);
    doc.text(address, PAGE_W / 2, FOOTER_ADDRESS_Y, { align: 'center' });
    doc.setFontSize(9.7);
    doc.text(legal, PAGE_W / 2, FOOTER_LEGAL_Y, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(220, 0, 0);
    doc.text(copyright, PAGE_W / 2, FOOTER_COPY_Y, { align: 'center' });
    doc.setTextColor(0);

    drawWatermark();
  }

  return doc;
};

export const downloadDeliveryNote = async (input: DeliveryNoteInput, products: Product[]) => {
  const doc = await buildDeliveryNote(input, products);
  const safeRef = input.reference.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`bon_livraison_${safeRef}.pdf`);
};
