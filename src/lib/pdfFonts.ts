import notoSansArabicUrl from '@/assets/fonts/NotoSansArabic.ttf?url';

export const PDF_FONT = 'NotoSansArabic';

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
    const response = await fetch(notoSansArabicUrl);
    const buffer = await response.arrayBuffer();
    cachedFontBase64 = arrayBufferToBase64(buffer);
  }

  if (!doc.existsFileInVFS?.('NotoSansArabic.ttf')) {
    doc.addFileToVFS('NotoSansArabic.ttf', cachedFontBase64);
  }

  doc.addFont('NotoSansArabic.ttf', PDF_FONT, 'normal');
  doc.addFont('NotoSansArabic.ttf', PDF_FONT, 'bold');
  doc.addFont('NotoSansArabic.ttf', PDF_FONT, 'italic');
  doc.setFont(PDF_FONT, 'normal');
};