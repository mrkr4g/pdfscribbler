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
import { hasDocument } from './pdf/pdfDocument';
import { loadStampImage } from './pdf/stampImageLoader';
import {
  addStampImage,
  getSelectedStampImage,
  getSelectedStampImageId,
  getStampImages,
  replaceStampImages,
  restoreSelectedStampImageId,
  selectStampImage,
} from './pdf/stampLibrary';
import {
  loadSelectedStampId,
  loadStampLibrary,
  saveSelectedStampId,
  saveStampLibrary,
} from './pdf/stampStorage';
import type { StampImage } from './pdf/pdfTypes';

const button = document.getElementById('openPdfButton') as HTMLButtonElement;
const selectedFile = document.getElementById('selectedFile') as HTMLParagraphElement;
const canvas = document.getElementById('pdfCanvas') as HTMLCanvasElement;
const thumbnailPanel = document.getElementById('thumbnailPanel') as HTMLDivElement;
const fitWidthButton = document.getElementById('fitWidthButton') as HTMLButtonElement;
const fitHeightButton = document.getElementById('fitHeightButton') as HTMLButtonElement;
const mainViewer = document.getElementById('mainViewer') as HTMLDivElement;
const addStampButton = document.getElementById('addStampButton') as HTMLButtonElement;
const stampThumbnailRow = document.getElementById('stampThumbnailRow') as HTMLDivElement;
const restoredStamps: StampImage[] = [];

let currentPageNumber = 1;
let selectedThumbnail: HTMLCanvasElement | null = null;
type FitMode = 'width' | 'height';
let fitMode: FitMode = 'width';

button.addEventListener('click', async () => {
  const file = await window.pdfscribbler.openPdf();

  if (!file) {
    selectedFile.textContent = 'No file selected.';
    return;
  }
  selectedFile.textContent = file;
  await loadPdf(file);
  fitWidthButton.disabled = false;
  fitHeightButton.disabled = false;
  currentPageNumber = 1;
  fitMode = 'width';
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
    await renderPdf();
  });
});
  await renderPdf();
});

fitWidthButton.addEventListener('click', async () => {
  fitMode = 'width';
  await renderPdf();
});

fitHeightButton.addEventListener('click', async () => {
  fitMode = 'height';
  await renderPdf();
});

async function renderPdf() {
  if (!hasDocument()) {
    return;
  }
  const page = await getPage(currentPageNumber);
  const unscaledViewport = page.getViewport({ scale: 1 });
  const horizontalPadding = 20;
  const verticalPadding = 20;
  const availableWidth =
    mainViewer.clientWidth - horizontalPadding;
  const availableHeight =
    mainViewer.clientHeight - verticalPadding;
  let scale: number;
  if (fitMode === 'height') {
    scale = availableHeight / unscaledViewport.height;
  } else {
    scale = availableWidth / unscaledViewport.width;
  }
  // Prevent invalid or extremely tiny scales if the viewer has not
  // finished laying out yet.
  scale = Math.max(scale, 0.1);
  await renderPage(page, canvas, scale);
}

//handler for button to add a new stamp
addStampButton.addEventListener(
  'click',
  async () => {
    try {
      const importedFile =
        await window.pdfscribbler.openStampImage();

      if (!importedFile) {
        return;
      }

      const stampImage =
    await loadStampImage(
    importedFile.filePath,
    importedFile.name
  ); 

      addStampImage(stampImage);
      saveCurrentStampState();
      renderStampThumbnails();
      } catch (error) {
      console.error(
        'Could not add the stamp image:',
        error
      );
    }
  }
);

//render thumbnails of the stamps
function renderStampThumbnails(): void {
  stampThumbnailRow.replaceChildren();

  const stampImages = getStampImages();
  const selectedStamp = getSelectedStampImage();

  for (const stampImage of stampImages) {
    const thumbnail =
      document.createElement('button');

    thumbnail.type = 'button';
    thumbnail.classList.add('stamp-thumbnail');
    thumbnail.title = stampImage.name;

    if (stampImage.id === selectedStamp?.id) {
      thumbnail.classList.add('selected');
    }

    const image =
      document.createElement('img');

    image.src = stampImage.image.src;
    image.alt = stampImage.name;

    thumbnail.appendChild(image);

    thumbnail.addEventListener(
      'click',
      () => {
        selectStampImage(stampImage.id);
        saveCurrentStampState();
        renderStampThumbnails();
        }
    );

    stampThumbnailRow.appendChild(thumbnail);
  }
}

//Add a helper that converts loaded stamps to saved data
function saveCurrentStampState(): void {
  const savedStamps = getStampImages().map(
    stamp => ({
      id: stamp.id,
      name: stamp.name,
      filePath: stamp.filePath,
    })
  );

  saveStampLibrary(savedStamps);
  saveSelectedStampId(
    getSelectedStampImageId()
  );
}

//resize large view if window is resized
let resizeTimer: ReturnType<typeof setTimeout> | undefined;
window.addEventListener('resize', () => {
  window.clearTimeout(resizeTimer);

  resizeTimer = window.setTimeout(() => {
    void renderPdf();
  }, 150);
});

//Restore the saved library at startup
async function restoreStampLibrary(): Promise<void> {
  const savedStamps = loadStampLibrary();
  const restoredStamps = [];

  for (const savedStamp of savedStamps) {
    try {
      const loadedStamp =
        await loadStampImage(savedStamp.filePath);

      restoredStamps.push({
        ...loadedStamp,
        id: savedStamp.id,
        name: savedStamp.name,
      });
    } catch (error) {
      console.error(
        `Could not restore stamp: ${savedStamp.filePath}`,
        error
      );
    }
  }

  replaceStampImages(restoredStamps);

  restoreSelectedStampImageId(
    loadSelectedStampId()
  );

  saveCurrentStampState();
  renderStampThumbnails();
}

void restoreStampLibrary();

console.log(
  '👋 This message is being logged by "renderer.ts", included via Vite',
);
