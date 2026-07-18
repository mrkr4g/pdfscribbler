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
const context = canvas.getContext('2d');

button.addEventListener('click', async () => {
  const file = await window.pdfscribbler.openPdf();

  if (!file) {
    selectedFile.textContent = 'No file selected.';
    return;
  }

  selectedFile.textContent = file;

  await loadPdf(file);

  const thumbnails = await createThumbnails();
  console.log("Thumbnail count:", thumbnails.length);
  thumbnailPanel.replaceChildren(...thumbnails);

  await renderPdf(file);
});

async function renderPdf() {

  const page = await getPage(1);

  await renderPage(page, canvas);

}

console.log(
  '👋 This message is being logged by "renderer.ts", included via Vite',
);
