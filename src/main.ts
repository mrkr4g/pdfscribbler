import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import path from 'node:path';
import {
  handleSquirrelStartupEvents
} from './squirrelStartup';
import fs from 'node:fs/promises';
import {
  deleteStampFile,
  getStampDirectory,
  importStampFile,
} from './pdf/stampFileManager';

//add default stamps and package them with the installer
interface DefaultStampDefinition {
  fileName: string;
  displayName: string;
}

const DEFAULT_STAMP_DEFINITIONS: DefaultStampDefinition[] = [
  {
    fileName: 'approved.jpg',
    displayName: 'Approved',
  },
  {
    fileName: 'received.png',
    displayName: 'Received',
  },
];

// Locate the bundled images in both development and packaged builds.
function getBundledDefaultStampDirectory(): string {
  if (app.isPackaged) {
    return path.join(
      process.resourcesPath,
      'default-stamps'
    );
  }

  return path.join(
    app.getAppPath(),
    'assets',
    'default-stamps'
  );
}

//getimagemimetype helper
function getImageMimeType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case '.png':
      return 'image/png';

    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';

    case '.webp':
      return 'image/webp';

    default:
      return 'application/octet-stream';
  }
}

// Handle Windows installation, update, and uninstall events.
if (handleSquirrelStartupEvents()) {
  app.quit();
}

// Keep a reference to the PDFScribbler window so that
// Windows can send PDF files to it.
let mainWindow: BrowserWindow | null = null;

// Store a PDF path temporarily if the application window
// has not finished loading yet.
let pendingPdfFilePath: string | null =
  getPdfFilePath(process.argv);

// Find the first .pdf file path in a command-line argument list.
function getPdfFilePath(
  commandLine: string[]
): string | null {
  const pdfArgument =
    commandLine.find(
      argument =>
        path.extname(
          argument
        ).toLowerCase() === '.pdf'
    );

  if (!pdfArgument) {
    return null;
  }

  return path.resolve(
    pdfArgument
  );
}

// Bring the existing PDFScribbler window to the front.
function focusMainWindow(): void {
  if (!mainWindow) {
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.show();
  mainWindow.focus();
}

// Send a PDF path to renderer.ts after the window is ready.
function sendPdfToRenderer(
  filePath: string
): void {
  if (
    !mainWindow ||
    mainWindow.webContents.isLoading()
  ) {
    pendingPdfFilePath =
      filePath;

    return;
  }

  mainWindow.webContents.send(
    'open-pdf-from-windows',
    filePath
  );

  focusMainWindow();
}

// Keep PDFScribbler as a single running application.
// A second launch sends its PDF path to the first instance.
const gotSingleInstanceLock =
  app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on(
    'second-instance',
    (
      _event,
      commandLine
    ) => {
      const pdfFilePath =
        getPdfFilePath(
          commandLine
        );

      if (pdfFilePath) {
        sendPdfToRenderer(
          pdfFilePath
        );
      } else {
        focusMainWindow();
      }
    }
  );
}

const createWindow = () => {
  // Create the browser window.
  const window =
    new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(
          __dirname,
          'preload.js'
        ),
      },
    });

  // Save the window reference for file-opening events.
  mainWindow = window;

  // Send a startup PDF path after the renderer has loaded.
  window.webContents.on(
    'did-finish-load',
    () => {
      if (!pendingPdfFilePath) {
        return;
      }

      const filePath =
        pendingPdfFilePath;

      pendingPdfFilePath =
        null;

      window.webContents.send(
        'open-pdf-from-windows',
        filePath
      );
    }
  );

  // Clear the saved reference when the window closes.
  window.on(
    'closed',
    () => {
      if (mainWindow === window) {
        mainWindow = null;
      }
    }
  );

  // Load the app through Vite during development
  // or from the packaged renderer files.
  if (
    MAIN_WINDOW_VITE_DEV_SERVER_URL
  ) {
    window.loadURL(
      MAIN_WINDOW_VITE_DEV_SERVER_URL
    );
  } else {
    window.loadFile(
      path.join(
        __dirname,
        `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`
      )
    );
  }

// Open DevTools only while running through the
// Vite development server with npm start.
if (
  MAIN_WINDOW_VITE_DEV_SERVER_URL
) {
  window.webContents.openDevTools();
}

};

// Prevent more than one Open PDF dialog from being displayed at once.
let isOpenPdfDialogVisible = false;

//open-pdf handler
ipcMain.handle(
  'open-pdf',
  async () => {
    if (
      !mainWindow ||
      isOpenPdfDialogVisible
    ) {
      return null;
    }

    isOpenPdfDialogVisible = true;

    try {
      const result =
        await dialog.showOpenDialog(
          mainWindow,
          {
            properties: [
              'openFile'
            ],
            filters: [
              {
                name: 'PDF Files',
                extensions: [
                  'pdf'
                ],
              },
            ],
          }
        );

      if (
        result.canceled ||
        result.filePaths.length === 0
      ) {
        return null;
      }

      return result.filePaths[0];
    } finally {
      isOpenPdfDialogVisible = false;
    }
  }
);

//save-pdf handler
ipcMain.handle(
  'save-pdf',
  async (
    _event,
    pdfBytes: Uint8Array,
    sourceFilePath: string,
    pageNumber: number
  ) => {
    const sourcePath =
      path.parse(sourceFilePath);

    const defaultFilePath =
      path.join(
        sourcePath.dir,
        `${sourcePath.name}-page-${pageNumber}-stamped.pdf`
      );

    const result =
      await dialog.showSaveDialog({
        title: 'Save stamped PDF page',
        defaultPath: defaultFilePath,
        filters: [
          {
            name: 'PDF Files',
            extensions: ['pdf'],
          },
        ],
      });

    if (
      result.canceled ||
      !result.filePath
    ) {
      return null;
    }

    await fs.writeFile(
      result.filePath,
      Buffer.from(pdfBytes)
    );

    return result.filePath;
  }
);

//save-pdf-direct handler
ipcMain.handle(
  'save-pdf-direct',
  async (
    _event,
    pdfBytes: Uint8Array,
    sourceFilePath: string,
    pageNumber: number
  ) => {
    const sourcePath =
      path.parse(sourceFilePath);

    const outputFilePath =
      path.join(
        sourcePath.dir,
        `${sourcePath.name}-page-${pageNumber}-stamped.pdf`
      );

    await fs.writeFile(
      outputFilePath,
      Buffer.from(pdfBytes)
    );

    return outputFilePath;
  }
);

//close app handler
ipcMain.on(
  'close-app',
  () => {
    app.quit();
  }
);

//read-pdf handler
ipcMain.handle('read-pdf', async (_event, filePath: string) => {
  const data = await fs.readFile(filePath);
  return data;
});

// Copy the packaged default stamps into the managed stamp directory.
ipcMain.handle(
  'install-default-stamps',
  async () => {
    const bundledStampDirectory =
      getBundledDefaultStampDirectory();

    const managedStampDirectory =
      getStampDirectory();

    await fs.mkdir(
      managedStampDirectory,
      {
        recursive: true,
      }
    );

    const installedDefaultStamps: {
      filePath: string;
      name: string;
    }[] = [];

    for (
      const definition of
        DEFAULT_STAMP_DEFINITIONS
    ) {
      const bundledFilePath =
        path.join(
          bundledStampDirectory,
          definition.fileName
        );

      const managedFilePath =
        path.join(
          managedStampDirectory,
          `default-${definition.fileName}`
        );

      await fs.copyFile(
        bundledFilePath,
        managedFilePath
      );

      installedDefaultStamps.push({
        filePath: managedFilePath,
        name: definition.displayName,
      });
    }

    return installedDefaultStamps;
  }
);

//add new stamp image handler 
ipcMain.handle('open-stamp-image', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      {
        name: 'Images',
        extensions: ['png', 'jpg', 'jpeg', 'webp'],
      },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const sourceFilePath = result.filePaths[0];

  return await importStampFile(sourceFilePath);
});

ipcMain.handle(
  'read-stamp-image',
  async (_event, filePath: string) => {
    const data = await fs.readFile(filePath);

    return {
      data,
      name: path.basename(filePath),
      mimeType: getImageMimeType(filePath),
    };
  }
);
ipcMain.handle(
  'delete-stamp-image',
  async (
    _event,
    filePath: string
  ) => {
    await deleteStampFile(
      filePath
    );
  }
);

// Open a saved file using its default application.
ipcMain.handle(
  'open-local-file',
  async (
    _event,
    filePath: string
  ) => {
    const errorMessage =
      await shell.openPath(
        filePath
      );

    if (errorMessage) {
      throw new Error(
        errorMessage
      );
    }
  }
);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
