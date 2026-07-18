import { getPageCount, getPage } from './pdfDocument';
import { renderPage } from './pdfRenderer';

export async function createThumbnails(): Promise<HTMLCanvasElement[]> {
    const thumbnails: HTMLCanvasElement[] = [];
    const pageCount = getPageCount();
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
        const page = await getPage(pageNumber);
        const canvas = document.createElement('canvas');
        await renderPage(page, canvas, 0.20);
        canvas.dataset.pageNumber = pageNumber.toString();
        thumbnails.push(canvas);
    }
return thumbnails;
}