/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import { loadPdf, getPage } from './pdf/pdfDocument';
import { renderPage } from './pdf/pdfRenderer';
import { createThumbnails } from './pdf/pdfThumbnails';

const button = document.getElementById('openPdfButton') as HTMLButtonElement;
const selectedFile = document.getElementById('selectedFile') as HTMLParagraphElement;
const canvas = document.getElementById('pdfCanvas') as HTMLCanvasElement;
const thumbnailPanel = document.getElementById('thumbnailPanel') as HTMLDivElement;
let currentPageNumber = 1;
let selectedThumbnail: HTMLCanvasElement | null = null;

button.addEventListener('click', async () => {
  const file = await window.pdfscribbler.openPdf();

  if (!file) {
    selectedFile.textContent = 'No file selected.';
    return;
  }
  selectedFile.textContent = file;
  await loadPdf(file);
  const thumbnails = await createThumbnails();
  thumbnailPanel.replaceChildren(...thumbnails);

  thumbnails[0].classList.add('selected');
  selectedThumbnail = thumbnails[0];

thumbnails.forEach((thumbnail) => {
  thumbnail.addEventListener('click', async () => {
    const pageNumber = Number(thumbnail.dataset.pageNumber);  
    currentPageNumber = pageNumber;  
    if (selectedThumbnail) {
      selectedThumbnail.classList.remove('selected');
    }  
    thumbnail.classList.add('selected');  
    selectedThumbnail = thumbnail;  
    const page = await getPage(currentPageNumber);  
    await renderPage(page, canvas);  
  });
});
  await renderPdf();
});

async function renderPdf() {
  const page = await getPage(currentPageNumber);
  await renderPage(page, canvas);
}

console.log(
  '👋 This message is being logged by "renderer.ts", included via Vite',
);
