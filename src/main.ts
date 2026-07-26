import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import fs from 'node:fs/promises';
import { deleteStampFile, importStampFile } from './pdf/stampFileManager';

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

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};
//open-pdf handler
ipcMain.handle('open-pdf', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      {
        name: 'PDF Files',
        extensions: ['pdf']
      }
    ]
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

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

//stamp image handler provided by chatgpt
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
