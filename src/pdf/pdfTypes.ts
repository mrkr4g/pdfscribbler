export interface Thumbnail {
    pageNumber: number;
    canvas: HTMLCanvasElement;
  }
  
  export interface StampImage {
    id: string;
    name: string;
    filePath: string;
    image: HTMLImageElement;
    preferredWidthRatio?: number;
  }

  export interface SavedStampImage {
    id: string;
    name: string;
    filePath: string;
    preferredWidthRatio?: number;
  }
  
  export interface PlacedStamp {
    id: string;
    stampImageId: string;
    pageNumber: number;
  
    x: number;
    y: number;
  
    width: number;
    height: number;
  }