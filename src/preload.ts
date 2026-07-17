import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('pdfscribbler', {
    openPdf: () => ipcRenderer.invoke('open-pdf'),
  
    readPdf: (filePath: string) =>
      ipcRenderer.invoke('read-pdf', filePath)
  });