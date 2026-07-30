import type {
  DynamicTextGeneratorId
} from './dynamicTextStamp';

import type {
  SavedStampImage
} from './pdfTypes';

const STAMP_LIBRARY_KEY = 'pdfscribbler.stampLibrary';
const SELECTED_STAMP_KEY = 'pdfscribbler.selectedStampId';
const DYNAMIC_TEXT_WIDTH_RATIOS_KEY =
  'pdfscribbler.dynamicTextPreferredWidthRatios';

export type DynamicTextPreferredWidthRatios =
  Record<
    DynamicTextGeneratorId,
    number
  >;

const defaultDynamicTextWidthRatios:
  DynamicTextPreferredWidthRatios = {
    date: 0.15,
    time: 0.12,
    datetime: 0.26,
    freeText: 0.20,
  };
const DEFAULT_STAMPS_SEEDED_KEY =
  'pdfscribbler.defaultStampsSeeded';

export function saveStampLibrary(
  stamps: SavedStampImage[]
): void {
  localStorage.setItem(
    STAMP_LIBRARY_KEY,
    JSON.stringify(stamps)
  );
}

export function loadStampLibrary(): SavedStampImage[] {
  const savedValue =
    localStorage.getItem(STAMP_LIBRARY_KEY);

  if (!savedValue) {
    return [];
  }

  try {
    return JSON.parse(savedValue) as SavedStampImage[];
  } catch {
    console.error(
      'Saved stamp library could not be read.'
    );

    return [];
  }
}

export function saveSelectedStampId(
  stampId: string | null
): void {
  if (stampId) {
    localStorage.setItem(
      SELECTED_STAMP_KEY,
      stampId
    );
  } else {
    localStorage.removeItem(
      SELECTED_STAMP_KEY
    );
  }
}

export function loadSelectedStampId(): string | null {
  return localStorage.getItem(
    SELECTED_STAMP_KEY
  );
}

export function
loadDynamicTextPreferredWidthRatios():
  DynamicTextPreferredWidthRatios {
  const savedValue =
    localStorage.getItem(
      DYNAMIC_TEXT_WIDTH_RATIOS_KEY
    );

  if (!savedValue) {
    return {
      ...defaultDynamicTextWidthRatios,
    };
  }

  try {
    const savedRatios =
      JSON.parse(
        savedValue
      ) as Partial<
        Record<
          DynamicTextGeneratorId,
          unknown
        >
      >;

    return {
      date:
        readPreferredWidthRatio(
          savedRatios.date,
          defaultDynamicTextWidthRatios
            .date
        ),

      time:
        readPreferredWidthRatio(
          savedRatios.time,
          defaultDynamicTextWidthRatios
            .time
        ),

      datetime:
        readPreferredWidthRatio(
          savedRatios.datetime,
          defaultDynamicTextWidthRatios
            .datetime
        ),

        freeText:
        readPreferredWidthRatio(
          savedRatios.freeText,
          defaultDynamicTextWidthRatios
            .freeText
        ),
    };
  } catch {
    console.error(
      'Saved dynamic text sizes could not be read.'
    );

    return {
      ...defaultDynamicTextWidthRatios,
    };
  }
}

export function
saveDynamicTextPreferredWidthRatios(
  preferredWidthRatios:
    DynamicTextPreferredWidthRatios
): void {
  localStorage.setItem(
    DYNAMIC_TEXT_WIDTH_RATIOS_KEY,
    JSON.stringify(
      preferredWidthRatios
    )
  );
}

function readPreferredWidthRatio(
  value: unknown,
  fallback: number
): number {
  if (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0 &&
    value <= 1
  ) {
    return value;
  }

  return fallback;
}

export function haveDefaultStampsBeenSeeded(): boolean {
  return (
    localStorage.getItem(
      DEFAULT_STAMPS_SEEDED_KEY
    ) === 'true'
  );
}

export function markDefaultStampsSeeded(): void {
  localStorage.setItem(
    DEFAULT_STAMPS_SEEDED_KEY,
    'true'
  );
}