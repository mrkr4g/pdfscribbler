import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('pdfscribbler', {
    openPdf: () => ipcRenderer.invoke('open-pdf'),
  
    readPdf: (filePath: string) =>
      ipcRenderer.invoke('read-pdf', filePath),

    savePdf: (
      pdfBytes: Uint8Array,
      sourceFilePath: string,
      pageNumber: number
    ): Promise<string | null> =>
      ipcRenderer.invoke(
        'save-pdf',
        pdfBytes,
        sourceFilePath,
        pageNumber
      ),

      openLocalFile: (
        filePath: string
      ) =>
        ipcRenderer.invoke(
          'open-local-file',
          filePath
        ),
    
    openStampImage: (): Promise<{
      filePath: string;
      name: string;
    } | null> =>
      ipcRenderer.invoke('open-stamp-image'),
  
    readStampImage: (filePath: string) =>
      ipcRenderer.invoke('read-stamp-image', filePath),

    deleteStampImage: (filePath: string): Promise<void> =>
      ipcRenderer.invoke('delete-stamp-image', filePath),
  });