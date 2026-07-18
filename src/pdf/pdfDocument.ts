import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

let currentPdf: pdfjsLib.PDFDocumentProxy | null = null;

export async function loadPdf(filePath: string) {
    const data = await window.pdfscribbler.readPdf(filePath);
    currentPdf = await pdfjsLib.getDocument({
      data,
      useWasm: true,
      wasmUrl: '/pdfjs/wasm/',
      useWorkerFetch: true,
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