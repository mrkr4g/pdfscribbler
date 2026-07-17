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
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const button = document.getElementById('openPdfButton') as HTMLButtonElement;
const selectedFile = document.getElementById('selectedFile') as HTMLParagraphElement;
const canvas = document.getElementById('pdfCanvas') as HTMLCanvasElement;

const context = canvas.getContext('2d');

button.addEventListener('click', async () => {
  const file = await window.pdfscribbler.openPdf();

  if (!file) {
    selectedFile.textContent = 'No file selected.';
    return;
  }

  selectedFile.textContent = file;

  await renderPdf(file);
});

async function renderPdf(filePath: string) {

  const data = await window.pdfscribbler.readPdf(filePath);

  const pdf = await pdfjsLib.getDocument({
    data,
    useWasm: true,
    wasmUrl: '/pdfjs/wasm/',
    useWorkerFetch: true,
    useImageDecoder: true
  }).promise;

  const page = await pdf.getPage(1);

  const viewport = page.getViewport({
    scale: 1.5
  });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  if (context) {
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
  }
}

console.log(
  '👋 This message is being logged by "renderer.ts", included via Vite',
);
