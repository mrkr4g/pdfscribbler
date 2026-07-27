import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Locate PDF.js decoder files relative to the renderer page.
//
// During development, window.location.href points to the Vite
// development server.
//
// In an installed build, it points to the packaged index.html file.
// Resolving the folder this way works in both environments.
const wasmUrl =
  new URL(
    'pdfjs/wasm/',
    window.location.href
  ).toString();

let currentPdf: pdfjsLib.PDFDocumentProxy | null = null;

export function hasDocument(): boolean {
  return currentPdf !== null;
}

export async function loadPdf(filePath: string) {
    const data = await window.pdfscribbler.readPdf(filePath);
    currentPdf = await pdfjsLib.getDocument({
      data,
      useWasm: true,
      wasmUrl,
      useWorkerFetch: false,
      useImageDecoder: true,
    }).promise;
  
    return currentPdf;
  }

export function getCurrentPdf() {
    return currentPdf;
  }

export function getPageCount(): number {
    if (!currentPdf) {
      return 0;
    }
  
    return currentPdf.numPages;
  }

export async function getPage(pageNumber: number) {
    if (!currentPdf) {
      throw new Error('No PDF loaded.');
    }
  
    return currentPdf.getPage(pageNumber);
  }