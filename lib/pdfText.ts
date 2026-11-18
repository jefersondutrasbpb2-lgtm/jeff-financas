import type { PdfPage } from './statementParser';

// Lê o texto (com posição) de um PDF dentro do navegador, usando pdf.js.
// O arquivo não sai do aparelho; só a biblioteca é baixada do cdnjs.
const PDFJS_VERSION = '3.11.174';
const BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loading: Promise<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadPdfJs(): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (w.pdfjsLib) return Promise.resolve(w.pdfjsLib);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${BASE}/pdf.min.js`;
      script.onload = () => {
        w.pdfjsLib.GlobalWorkerOptions.workerSrc = `${BASE}/pdf.worker.min.js`;
        resolve(w.pdfjsLib);
      };
      script.onerror = () => {
        loading = null;
        reject(new Error('Não foi possível carregar o leitor de PDF. Verifique sua internet.'));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}

export async function readPdfPages(file: File): Promise<PdfPage[]> {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: PdfPage[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    pages.push({
      width: viewport.width,
      height: viewport.height,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: content.items.map((it: any) => ({
        str: it.str as string,
        x: it.transform[4] as number,
        y: viewport.height - (it.transform[5] as number),
      })),
    });
  }
  return pages;
}
