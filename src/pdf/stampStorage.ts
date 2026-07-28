import type { SavedStampImage } from './pdfTypes';

const STAMP_LIBRARY_KEY = 'pdfscribbler.stampLibrary';
const SELECTED_STAMP_KEY = 'pdfscribbler.selectedStampId';
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