import type { StampImage } from './pdfTypes';

export type DynamicTextGeneratorId =
  | 'date'
  | 'time'
  | 'datetime';

const textFontSize = 64;
const horizontalPadding = 12;
const verticalPadding = 8;

export function formatCurrentDate(
  date: Date = new Date()
): string {
  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  const year =
    date.getFullYear();

  return `${month}/${day}/${year}`;
}

export function formatCurrentTime(
  date: Date = new Date()
): string {
  const hours =
    date.getHours();

  const displayHour =
    hours % 12 || 12;

  const minutes = String(
    date.getMinutes()
  ).padStart(2, '0');

  const meridiem =
    hours >= 12
      ? 'PM'
      : 'AM';

  return (
    `${displayHour}:` +
    `${minutes} ${meridiem}`
  );
}

export function formatCurrentDateTime(
  date: Date = new Date()
): string {
  return (
    `${formatCurrentDate(date)} at ` +
    `${formatCurrentTime(date)}`
  );
}

export async function
createDynamicTextGeneratorStampImage(
  generatorId: DynamicTextGeneratorId,
  preferredWidthRatio: number
): Promise<StampImage> {
  const currentDateTime =
    new Date();

  let text: string;
  let name: string;

  switch (generatorId) {
    case 'date':
      text =
        formatCurrentDate(
          currentDateTime
        );

      name =
        `Date ${text}`;
      break;

    case 'time':
      text =
        formatCurrentTime(
          currentDateTime
        );

      name =
        `Time ${text}`;
      break;

    case 'datetime':
      text =
        formatCurrentDateTime(
          currentDateTime
        );

      name =
        `Date and time ${text}`;
      break;
  }

  return createDynamicTextStampImage(
    text,
    name,
    preferredWidthRatio
  );
}

export async function
createDynamicTextStampImage(
  text: string,
  name: string,
  preferredWidthRatio: number
): Promise<StampImage> {
  const measurementCanvas =
    document.createElement('canvas');

  const measurementContext =
    measurementCanvas.getContext('2d');

  if (!measurementContext) {
    throw new Error(
      'Could not create the text measurement canvas.'
    );
  }

  const font =
    `${textFontSize}px sans-serif`;

  measurementContext.font =
    font;

  const measuredWidth =
    Math.ceil(
      measurementContext
        .measureText(text)
        .width
    );

  const textCanvas =
    document.createElement('canvas');

  textCanvas.width =
    measuredWidth +
    horizontalPadding * 2;

  textCanvas.height =
    textFontSize +
    verticalPadding * 2;

  const context =
    textCanvas.getContext('2d');

  if (!context) {
    throw new Error(
      'Could not create the dynamic text canvas.'
    );
  }

  context.font =
    font;

  context.fillStyle =
    'black';

  context.textAlign =
    'left';

  context.textBaseline =
    'middle';

  context.fillText(
    text,
    horizontalPadding,
    textCanvas.height / 2
  );

  const image =
    await loadGeneratedImage(
      textCanvas.toDataURL(
        'image/png'
      )
    );

  return {
    id: crypto.randomUUID(),
    name,
    filePath: '',
    image,
    preferredWidthRatio,
  };
}

function loadGeneratedImage(
  source: string
): Promise<HTMLImageElement> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const image =
        new Image();

      image.addEventListener(
        'load',
        () => {
          resolve(image);
        },
        {
          once: true,
        }
      );

      image.addEventListener(
        'error',
        () => {
          reject(
            new Error(
              'Could not load the generated text image.'
            )
          );
        },
        {
          once: true,
        }
      );

      image.src =
        source;
    }
  );
}