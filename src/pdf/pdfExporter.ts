import { PDFDocument } from 'pdf-lib';
import type { PDFImage } from 'pdf-lib';

import type {
  PlacedStamp,
  StampImage,
} from './pdfTypes';

export async function exportActivePage(
  sourcePdfBytes: Uint8Array,
  pageNumber: number,
  placedStamps: PlacedStamp[],
  stampImages: StampImage[],
  canvasWidth: number,
  canvasHeight: number
): Promise<Uint8Array> {
  if (
    canvasWidth <= 0 ||
    canvasHeight <= 0
  ) {
    throw new Error(
      'The active PDF page has not been rendered.'
    );
  }

  const sourcePdf =
    await PDFDocument.load(
      sourcePdfBytes
    );

  const pageIndex =
    pageNumber - 1;

  if (
    pageIndex < 0 ||
    pageIndex >= sourcePdf.getPageCount()
  ) {
    throw new Error(
      `PDF page ${pageNumber} does not exist.`
    );
  }

  const outputPdf =
    await PDFDocument.create();

  const [outputPage] =
    await outputPdf.copyPages(
      sourcePdf,
      [pageIndex]
    );

  outputPdf.addPage(outputPage);

  const pageWidth =
    outputPage.getWidth();

  const pageHeight =
    outputPage.getHeight();

  const horizontalScale =
    pageWidth / canvasWidth;

  const verticalScale =
    pageHeight / canvasHeight;

  const stampImagesById =
    new Map<string, StampImage>();

  for (const stampImage of stampImages) {
    stampImagesById.set(
      stampImage.id,
      stampImage
    );
  }

  const embeddedImages =
    new Map<string, PDFImage>();

  for (const stamp of placedStamps) {
    if (
      stamp.pageNumber !== pageNumber
    ) {
      continue;
    }

    const stampImage =
      stampImagesById.get(
        stamp.stampImageId
      );

    if (!stampImage) {
      continue;
    }

    let embeddedImage =
      embeddedImages.get(
        stampImage.id
      );

    if (!embeddedImage) {
      const pngBytes =
        await convertImageToPng(
          stampImage.image
        );

      embeddedImage =
        await outputPdf.embedPng(
          pngBytes
        );

      embeddedImages.set(
        stampImage.id,
        embeddedImage
      );
    }

    const pdfX =
      stamp.x * horizontalScale;

    const pdfWidth =
      stamp.width * horizontalScale;

    const pdfHeight =
      stamp.height * verticalScale;

    const pdfY =
      pageHeight -
      (
        stamp.y +
        stamp.height
      ) *
      verticalScale;

    outputPage.drawImage(
      embeddedImage,
      {
        x: pdfX,
        y: pdfY,
        width: pdfWidth,
        height: pdfHeight,
      }
    );
  }

  return outputPdf.save();
}

async function convertImageToPng(
  image: HTMLImageElement
): Promise<Uint8Array> {
  if (
    image.naturalWidth <= 0 ||
    image.naturalHeight <= 0
  ) {
    throw new Error(
      'A stamp image has not finished loading.'
    );
  }

  const imageCanvas =
    document.createElement('canvas');

  imageCanvas.width =
    image.naturalWidth;

  imageCanvas.height =
    image.naturalHeight;

  const context =
    imageCanvas.getContext('2d');

  if (!context) {
    throw new Error(
      'Could not create the stamp export canvas.'
    );
  }

  context.drawImage(
    image,
    0,
    0
  );

  const blob =
    await new Promise<Blob>(
      (resolve, reject) => {
        imageCanvas.toBlob(
          result => {
            if (result) {
              resolve(result);
            } else {
              reject(
                new Error(
                  'Could not convert the stamp to PNG.'
                )
              );
            }
          },
          'image/png'
        );
      }
    );

  return new Uint8Array(
    await blob.arrayBuffer()
  );
}