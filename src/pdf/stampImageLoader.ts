import type { StampImage } from './pdfTypes';

export async function loadStampImage(
  filePath: string,
  displayName?: string
): Promise<StampImage> {
  const result =
    await window.pdfscribbler.readStampImage(filePath);

  const image = await createHtmlImage(
    result.data,
    result.mimeType
  );

  return {
    id: crypto.randomUUID(),
    name: displayName ?? result.name,
    filePath,
    image,
  };
}

function createHtmlImage(
  data: Uint8Array,
  mimeType: string
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob(
      [new Uint8Array(data)],
      { type: mimeType }
    );

    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error('The stamp image could not be loaded.')
      );
    };

    image.src = objectUrl;
  });
}