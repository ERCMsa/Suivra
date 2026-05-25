import pdfFontUrl from '@/assets/fonts/DejaVuSans.ttf?url';

export const PDF_FONT = 'DejaVuSans';

let cachedFontBase64: string | null = null;

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

export const setupPdfFont = async (doc: any) => {
  if (!cachedFontBase64) {
    const response = await fetch(pdfFontUrl);
    const buffer = await response.arrayBuffer();
    cachedFontBase64 = arrayBufferToBase64(buffer);
  }

  if (!doc.existsFileInVFS?.('DejaVuSans.ttf')) {
    doc.addFileToVFS('DejaVuSans.ttf', cachedFontBase64);
  }

  doc.addFont('DejaVuSans.ttf', PDF_FONT, 'normal');
  doc.addFont('DejaVuSans.ttf', PDF_FONT, 'bold');
  doc.addFont('DejaVuSans.ttf', PDF_FONT, 'italic');
  doc.setFont(PDF_FONT, 'normal');
};