import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('pdfscribbler', {
  openPdf: () => ipcRenderer.invoke('open-pdf')
});