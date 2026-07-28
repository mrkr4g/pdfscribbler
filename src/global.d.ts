export {};

declare global {
  interface Window {
    pdfscribbler: {
      openPdf: () =>
        Promise<string | null>;

      onOpenPdfFromWindows: (
        callback: (
          filePath: string
        ) => void
      ) => void;

      readPdf: (
        filePath: string
      ) => Promise<Uint8Array>;

      openStampImage: () =>
        Promise<{
          filePath: string;
          name: string;
        } | null>;

      installDefaultStamps: () =>
        Promise<
          Array<{
            filePath: string;
            name: string;
          }>
        >;

      readStampImage: (
        filePath: string
      ) => Promise<{
        data: Uint8Array;
        name: string;
        mimeType: string;
      }>;

      savePdf: (
        outputPdfBytes: Uint8Array,
        originalFilePath: string,
        pageNumber: number
      ) => Promise<string | null>;
      
      savePdfDirect: (
        outputPdfBytes: Uint8Array,
        originalFilePath: string,
        pageNumber: number
      ) => Promise<string>;
      
      closeApp: () => void;

      deleteStampImage: (
        filePath: string
      ) => Promise<void>;

      openLocalFile: (
        filePath: string
      ) => Promise<void>;
    };
  }
}