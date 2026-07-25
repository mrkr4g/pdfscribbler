export {};

declare global {
  interface Window {
    pdfscribbler: {
      openPdf: () =>
        Promise<string | null>;

      readPdf: (
        filePath: string
      ) => Promise<Uint8Array>;

      openStampImage: () =>
        Promise<{
          filePath: string;
          name: string;
        } | null>;

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

      deleteStampImage: (
        filePath: string
      ) => Promise<void>;

      openLocalFile: (
        filePath: string
      ) => Promise<void>;
    };
  }
}