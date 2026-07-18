import type { PDFPageProxy } from 'pdfjs-dist';

export async function renderPage(
    page: PDFPageProxy,
    canvas: HTMLCanvasElement,
    scale = 1.5
  ) {
    const viewport = page.getViewport({ scale });
  
    const context = canvas.getContext('2d');
  
    if (!context) {
      throw new Error('Could not get canvas context.');
    }
  
    canvas.width = viewport.width;
    canvas.height = viewport.height;
  
    await page.render({
      canvasContext: context,
      viewport,
    }).promise;
  }