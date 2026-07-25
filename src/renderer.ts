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
import { exportActivePage } from './pdf/pdfExporter';
import {
  addStampImage,
  getSelectedStampImage,
  getSelectedStampImageId,
  getStampImages,
  removeStampImage,
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
import type { 
  PlacedStamp,
  StampImage
} from './pdf/pdfTypes';

const button = document.getElementById('openPdfButton') as HTMLButtonElement;
const selectedFile = document.getElementById('selectedFile') as HTMLParagraphElement;
const canvas = document.getElementById('pdfCanvas') as HTMLCanvasElement;
const stampCanvas = document.getElementById('stampCanvas') as HTMLCanvasElement;
const thumbnailPanel = document.getElementById('thumbnailPanel') as HTMLDivElement;
const fitWidthButton = document.getElementById('fitWidthButton') as HTMLButtonElement;
const fitHeightButton = document.getElementById('fitHeightButton') as HTMLButtonElement;
const mainViewer = document.getElementById('mainViewer') as HTMLDivElement;
const addStampButton = document.getElementById('addStampButton') as HTMLButtonElement;
const removeStampButton = document.getElementById('removeStampButton') as HTMLButtonElement;
const stampThumbnailRow = document.getElementById('stampThumbnailRow') as HTMLDivElement;
const restoredStamps: StampImage[] = [];
const savePageButton = document.getElementById('savePageButton') as HTMLButtonElement;
const saveStatus = document.getElementById('saveStatus') as HTMLAnchorElement;

let currentPageNumber = 1;
let currentPdfFilePath: string | null = null;
let savedPdfFilePath: string | null = null;
let placedStamp: PlacedStamp | null = null;
const placedStamps: PlacedStamp[] = [];
const detachedStampImages = new Map<string, StampImage>();
let selectedThumbnail: HTMLCanvasElement | null = null;
let fitMode: FitMode = 'width';
let isDraggingStamp = false;
let isPlacedStampSelected = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
//add a visible selection border and one working resize handle in the lower-right corner
let isResizingStamp = false;
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartWidth = 0;
let resizeStartHeight = 0;
//We only need to store the starting pointer position and starting stamp dimensions.

//listener for making selected file a clickable link
saveStatus.addEventListener(
  'click',
  async event => {
    event.preventDefault();

    if (!savedPdfFilePath) {
      return;
    }

    try {
      await window.pdfscribbler.openLocalFile(
        savedPdfFilePath
      );
    } catch (error) {
      console.error(
        'Could not open the saved PDF:',
        error
      );
    }
  }
);

const resizeHandleSize = 12;
const minimumStampWidthRatio = 0.01;

type FitMode = 'width' | 'height';

//button click event listener for opening pdf button
button.addEventListener('click', async () => {
  const file = await window.pdfscribbler.openPdf();

  if (!file) {
    selectedFile.textContent = 'No file selected.';
    return;
  }
  selectedFile.textContent = file;
  await loadPdf(file);
  currentPdfFilePath = file;

savePageButton.disabled = false;
savedPdfFilePath = null;
saveStatus.textContent = '';
saveStatus.removeAttribute('title');


  // open pdf handler, Clear stamps belonging to the previous document.
  placedStamps.length = 0;
  detachedStampImages.clear();
  placedStamp = null;

  isPlacedStampSelected = false;
  isDraggingStamp = false;
  isResizingStamp = false;

  stampCanvas.style.cursor = 'crosshair';

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

//buttons to fit page to width and height of viewport
fitWidthButton.addEventListener('click', async () => {
  fitMode = 'width';
  await renderPdf();
});

fitHeightButton.addEventListener('click', async () => {
  fitMode = 'height';
  await renderPdf();
});

//save pdf button
savePageButton.addEventListener(
  'click',
  async () => {
    if (
      !currentPdfFilePath ||
      !hasDocument()
    ) {
      return;
    }

    const originalButtonText =
      savePageButton.textContent ??
      'Save Active Page';

    savePageButton.disabled = true;
    savePageButton.textContent =
      'Preparing PDF...';

    saveStatus.textContent = '';

    try {
      const sourcePdfData =
        await window.pdfscribbler.readPdf(
          currentPdfFilePath
        );

      const sourcePdfBytes =
        new Uint8Array(
          sourcePdfData
        );

      const outputPdfBytes =
        await exportActivePage(
          sourcePdfBytes,
          currentPageNumber,
          placedStamps,
          getRenderableStampImages(),
          stampCanvas.width,
          stampCanvas.height
        );

      savePageButton.textContent =
        'Choose Save Location...';

      const savedFilePath =
        await window.pdfscribbler.savePdf(
          outputPdfBytes,
          currentPdfFilePath,
          currentPageNumber
        );

        if (savedFilePath) {
          savedPdfFilePath =
            savedFilePath;
        
          saveStatus.textContent =
            `Saved: ${savedFilePath}`;
        
          saveStatus.title =
            'Open the saved PDF';
        } else {
          savedPdfFilePath = null;
        
          saveStatus.textContent =
            'Save canceled.';
        
          saveStatus.removeAttribute(
            'title'
          );
        }
    } catch (error) {
      console.error(
        'Could not save the active PDF page:',
        error
      );
      savedPdfFilePath = null;
      saveStatus.removeAttribute('title');
      saveStatus.textContent =
        'The PDF could not be saved.';
    } finally {
      savePageButton.disabled = false;
      savePageButton.textContent =
        originalButtonText;
    }
  }
);

//render the selected pdf page
async function renderPdf() {
  if (!hasDocument()) {
    return;
  }
  const previousCanvasWidth = stampCanvas.width;
  const previousCanvasHeight = stampCanvas.height;
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
  stampCanvas.width = canvas.width;
  stampCanvas.height = canvas.height;

//stamp viewport scaling section
if (
  previousCanvasWidth > 0 &&
  previousCanvasHeight > 0
) {
  const horizontalScale =
    stampCanvas.width /
    previousCanvasWidth;

  const verticalScale =
    stampCanvas.height /
    previousCanvasHeight;

  const stampsOnCurrentPage =
    placedStamps.filter(
      stamp =>
        stamp.pageNumber ===
        currentPageNumber
    );

  for (const stamp of stampsOnCurrentPage) {
    stamp.x *= horizontalScale;
    stamp.y *= verticalScale;

    stamp.width *= horizontalScale;
    stamp.height *= verticalScale;
  }
}

//add any stamps that are placed to the page rendering
renderPlacedStamp();

}

//helper for renderable images, this keeps used stamps on a page if they are deleted from the stamp library
function getRenderableStampImages():
  StampImage[] {
  return [
    ...getStampImages(),
    ...detachedStampImages.values(),
  ];
}

//This clears the transparent overlay and redraws the placed stamp.
function renderPlacedStamp(): void {
  const context = stampCanvas.getContext('2d');

  if (!context) {
    throw new Error(
      'Could not get stamp canvas context.'
    );
  }

  context.clearRect(
    0,
    0,
    stampCanvas.width,
    stampCanvas.height
  );

const stampsOnCurrentPage =
  placedStamps.filter(
    stamp =>
      stamp.pageNumber ===
      currentPageNumber
  );

  const renderableStampImages =
  getRenderableStampImages();

for (
  const stamp of stampsOnCurrentPage
) {
  const stampImage =
    renderableStampImages.find(
      image =>
        image.id ===
        stamp.stampImageId
    );

  if (!stampImage) {
    continue;
  }

  context.drawImage(
    stampImage.image,
    stamp.x,
    stamp.y,
    stamp.width,
    stamp.height
  );
}

if (
  !placedStamp ||
  placedStamp.pageNumber !==
    currentPageNumber
) {
  return;
}

  if (!isPlacedStampSelected) {
    return;
  }

  context.save();

context.strokeStyle = 'blue';
context.lineWidth = 2;
context.setLineDash([6, 4]);

context.strokeRect(
  placedStamp.x,
  placedStamp.y,
  placedStamp.width,
  placedStamp.height
);

context.setLineDash([]);

context.fillStyle = 'white';
context.strokeStyle = 'blue';
context.lineWidth = 2;

const handleX =
  placedStamp.x +
  placedStamp.width -
  resizeHandleSize / 2;

const handleY =
  placedStamp.y +
  placedStamp.height -
  resizeHandleSize / 2;

context.fillRect(
  handleX,
  handleY,
  resizeHandleSize,
  resizeHandleSize
);

context.strokeRect(
  handleX,
  handleY,
  resizeHandleSize,
  resizeHandleSize
);

context.restore();
}

//pointer down event listener
stampCanvas.addEventListener(
  'pointerdown',
  event => {
    if (!hasDocument()) {
      return;
    }

    const point =
      getStampCanvasPoint(event);
    
      if (
        placedStamp &&
        isPointInsideResizeHandle(
          point.x,
          point.y
        )
      ) {
        isResizingStamp = true;
      
        resizeStartX = point.x;
        resizeStartY = point.y;
      
        resizeStartWidth =
          placedStamp.width;
      
        resizeStartHeight =
          placedStamp.height;
      
        stampCanvas.setPointerCapture(
          event.pointerId
        );
      
        stampCanvas.style.cursor =
          'nwse-resize';
      
        return;
      }
//is the pointer inside an already placed stamp?
const clickedStamp =
findPlacedStampAtPoint(
  point.x,
  point.y
);

if (clickedStamp) {
if (
  placedStamp !== clickedStamp ||
  !isPlacedStampSelected
) {
  placedStamp = clickedStamp;
  isPlacedStampSelected = true;

  renderPlacedStamp();

  stampCanvas.style.cursor =
    'grab';

  return;
}

isDraggingStamp = true;

dragOffsetX =
  point.x - placedStamp.x;

dragOffsetY =
  point.y - placedStamp.y;

stampCanvas.setPointerCapture(
  event.pointerId
);

stampCanvas.style.cursor =
  'grabbing';

return;
}

//Deselect when clicking empty page space
if (
  placedStamp &&
  isPlacedStampSelected
) {
  isPlacedStampSelected = false;

  isDraggingStamp = false;
  isResizingStamp = false;

  renderPlacedStamp();

  stampCanvas.style.cursor =
    'crosshair';

  return;
}

//obtain the currently selected stamp
    const selectedStamp =
      getSelectedStampImage();

    if (!selectedStamp) {
      return;
    }

    const defaultWidth =
      stampCanvas.width * 0.15;

    const aspectRatio =
      selectedStamp.image.naturalHeight /
      selectedStamp.image.naturalWidth;

    const defaultHeight =
      defaultWidth * aspectRatio;

    placedStamp = {
      id: crypto.randomUUID(),
      stampImageId: selectedStamp.id,
      pageNumber: currentPageNumber,

      x: point.x - defaultWidth / 2,
      y: point.y - defaultHeight / 2,

      width: defaultWidth,
      height: defaultHeight,
    };
    placedStamps.push(placedStamp);

    isPlacedStampSelected = true;

    renderPlacedStamp();
  }
);

//pointer move event listener
stampCanvas.addEventListener(
  'pointermove',
  event => {
    const point =
      getStampCanvasPoint(event);

      if (
        isResizingStamp &&
        placedStamp
      ) {
        const horizontalChange =
          point.x - resizeStartX;
      
        const proposedWidth =
          resizeStartWidth +
          horizontalChange;
      
        const aspectRatio =
          resizeStartHeight /
          resizeStartWidth;
      
        const maximumWidth =
          stampCanvas.width -
          placedStamp.x;

        const minimumStampWidth =
        Math.max(
          stampCanvas.width *
            minimumStampWidthRatio,
          resizeHandleSize
        );
      
        placedStamp.width = Math.min(
          Math.max(
            proposedWidth,
            minimumStampWidth
          ),
          maximumWidth
        );
      
        placedStamp.height =
          placedStamp.width *
          aspectRatio;
      
        const maximumHeight =
          stampCanvas.height -
          placedStamp.y;
      
        if (
          placedStamp.height >
          maximumHeight
        ) {
          placedStamp.height =
            maximumHeight;
      
          placedStamp.width =
            placedStamp.height /
            aspectRatio;
        }
      
        renderPlacedStamp();
        return;
      }

    if (
      !isDraggingStamp ||
      !placedStamp
    ) {
      if (
        isPointInsideResizeHandle(
          point.x,
          point.y
        )
      ) {
        stampCanvas.style.cursor =
          'nwse-resize';
      } else if (
        findPlacedStampAtPoint(
          point.x,
          point.y
        )
      ) {
        stampCanvas.style.cursor =
  isPlacedStampSelected
    ? 'grab'
    : 'pointer';
      } else {
        stampCanvas.style.cursor =
          'crosshair';
      }

      return;
    }

    const proposedX =
  point.x - dragOffsetX;

const proposedY =
  point.y - dragOffsetY;

const maximumX =
  stampCanvas.width -
  placedStamp.width;

const maximumY =
  stampCanvas.height -
  placedStamp.height;

placedStamp.x = Math.min(
  Math.max(proposedX, 0),
  maximumX
);

placedStamp.y = Math.min(
  Math.max(proposedY, 0),
  maximumY
);

    renderPlacedStamp();
  }
);

//pointer up event listener
stampCanvas.addEventListener(
  'pointerup',
  event => {
    if (
      !isDraggingStamp &&
      !isResizingStamp
    ) {
      return;
    }

    isDraggingStamp = false;
    isResizingStamp = false;

    if (
      stampCanvas.hasPointerCapture(
        event.pointerId
      )
    ) {
      stampCanvas.releasePointerCapture(
        event.pointerId
      );
    }

    const point =
      getStampCanvasPoint(event);

    if (
      isPointInsideResizeHandle(
        point.x,
        point.y
      )
    ) {
      stampCanvas.style.cursor =
        'nwse-resize';
    } else if (
      findPlacedStampAtPoint(
        point.x,
        point.y
      )
    ) {
      stampCanvas.style.cursor =
        isPlacedStampSelected
        ? 'grab'
        : 'pointer';
    } else {
      stampCanvas.style.cursor =
        'crosshair';
    }
  }
);
//Using hasPointerCapture() avoids an error if capture was already lost or released.

//Delete selected stamp
window.addEventListener(
  'keydown',
  event => {
    if (
      event.key !== 'Delete' ||
      !placedStamp ||
      !isPlacedStampSelected
    ) {
      return;
    }

    const stampIndex =
      placedStamps.indexOf(
        placedStamp
      );

    if (stampIndex === -1) {
      return;
    }

    placedStamps.splice(
      stampIndex,
      1
    );

    placedStamp = null;
    isPlacedStampSelected = false;
    isDraggingStamp = false;
    isResizingStamp = false;

    stampCanvas.style.cursor =
      'crosshair';

    renderPlacedStamp();
  }
);

//coordinate helper for dragging stamp image
function getStampCanvasPoint(
  event: PointerEvent
): {
  x: number;
  y: number;
} {
  const bounds =
    stampCanvas.getBoundingClientRect();

  const canvasScaleX =
    stampCanvas.width / bounds.width;

  const canvasScaleY =
    stampCanvas.height / bounds.height;

  return {
    x:
      (event.clientX - bounds.left) *
      canvasScaleX,

    y:
      (event.clientY - bounds.top) *
      canvasScaleY,
  };
}

//This checks whether a point lies inside the stamp’s rectangular boundary.
function findPlacedStampAtPoint(
  x: number,
  y: number
): PlacedStamp | null {
  for (
    let index =
      placedStamps.length - 1;
    index >= 0;
    index -= 1
  ) {
    const stamp =
      placedStamps[index];

    if (
      stamp.pageNumber ===
        currentPageNumber &&
      x >= stamp.x &&
      x <= stamp.x + stamp.width &&
      y >= stamp.y &&
      y <= stamp.y + stamp.height
    ) {
      return stamp;
    }
  }

  return null;
}

//this is a resize-handle hit test
function isPointInsideResizeHandle(
  x: number,
  y: number
): boolean {
  if (
    !placedStamp ||
    placedStamp.pageNumber !== currentPageNumber
  ) {
    return false;
  }

  const handleCenterX =
    placedStamp.x + placedStamp.width;

  const handleCenterY =
    placedStamp.y + placedStamp.height;

  const halfHandle =
    resizeHandleSize / 2;

  return (
    x >= handleCenterX - halfHandle &&
    x <= handleCenterX + halfHandle &&
    y >= handleCenterY - halfHandle &&
    y <= handleCenterY + halfHandle
  );
}
//This check must eventually happen before the general stamp hit test because the handle partly overlaps the stamp itself.

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

//handler for remove stamp button
removeStampButton.addEventListener(
  'click',
  async () => {
    const selectedStamp =
      getSelectedStampImage();

    if (!selectedStamp) {
      return;
    }

    const confirmed =
      window.confirm(
        `Remove "${selectedStamp.name}" from the stamp library?`
      );

    if (!confirmed) {
      return;
    }

    const stampIsPlaced =
      placedStamps.some(
        stamp =>
          stamp.stampImageId ===
          selectedStamp.id
      );

    const removedStamp =
      removeStampImage(
        selectedStamp.id
      );

    if (!removedStamp) {
      return;
    }

    if (stampIsPlaced) {
      detachedStampImages.set(
        removedStamp.id,
        removedStamp
      );
    }

    saveCurrentStampState();
    renderStampThumbnails();
    renderPlacedStamp();

    try {
      await window.pdfscribbler
        .deleteStampImage(
          removedStamp.filePath
        );
    } catch (error) {
      console.error(
        'Could not delete the managed stamp file:',
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
  removeStampButton.disabled = selectedStamp === null;

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
