import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('pdfscribbler', {
    openPdf: () => ipcRenderer.invoke('open-pdf'),
  
    readPdf: (filePath: string) =>
      ipcRenderer.invoke('read-pdf', filePath),
    
    openStampImage: (): Promise<{
      filePath: string;
      name: string;
    } | null> =>
      ipcRenderer.invoke('open-stamp-image'),
  
    readStampImage: (filePath: string) =>
      ipcRenderer.invoke('read-stamp-image', filePath)
  });