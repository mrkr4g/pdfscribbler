import {
  renderHandwrittenText
} from './handwrittenTextRenderer';

import type {
  StampImage
} from './pdfTypes';

export type DynamicTextGeneratorId =
  | 'date'
  | 'time'
  | 'datetime'
  | 'freeText';

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
  preferredWidthRatio: number,
  freeText?: string
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

      case 'freeText': {
        const normalizedText =
          freeText?.trim();
  
        if (!normalizedText) {
          throw new Error(
            'Free text is required.'
          );
        }
  
        text =
          normalizedText;
  
        name =
          `Free text ${normalizedText}`;
        break;
      }
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
  const textCanvas =
  await renderHandwrittenText(
    text
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