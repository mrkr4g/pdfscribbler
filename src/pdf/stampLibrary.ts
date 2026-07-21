import type {
  SavedStampImage,
  StampImage,
} from './pdfTypes';

const STAMP_LIBRARY_KEY = 'pdfscribbler.stampLibrary';
const SELECTED_STAMP_KEY = 'pdfscribbler.selectedStampId';

let stampImages: StampImage[] = [];
let selectedStampImageId: string | null = null;

export function getStampImages(): StampImage[] {
  return [...stampImages];
}

export function addStampImage(stampImage: StampImage): void {
  const existingStamp = stampImages.find(
    stamp => stamp.filePath === stampImage.filePath
  );

  if (existingStamp) {
    selectedStampImageId = existingStamp.id;
    saveStampLibrary();
    return;
  }

  stampImages.push(stampImage);
  selectedStampImageId = stampImage.id;

  saveStampLibrary();
}

export function getSelectedStampImage(): StampImage | null {
  if (!selectedStampImageId) {
    return null;
  }

  return (
    stampImages.find(
      stampImage => stampImage.id === selectedStampImageId
    ) ?? null
  );
}

export function selectStampImage(id: string): void {
  const stampExists = stampImages.some(
    stampImage => stampImage.id === id
  );

  if (!stampExists) {
    return;
  }

  selectedStampImageId = id;
  localStorage.setItem(SELECTED_STAMP_KEY, id);
}

export function hasSelectedStampImage(): boolean {
  return getSelectedStampImage() !== null;
}

export function getSavedStampImages(): SavedStampImage[] {
  const savedLibrary = localStorage.getItem(STAMP_LIBRARY_KEY);

  if (!savedLibrary) {
    return [];
  }

  try {
    return JSON.parse(savedLibrary) as SavedStampImage[];
  } catch {
    return [];
  }
}

export function restoreStampImages(
  restoredStampImages: StampImage[]
): void {
  stampImages = restoredStampImages;

  const savedSelectedId =
    localStorage.getItem(SELECTED_STAMP_KEY);

  const selectedStampStillExists = stampImages.some(
    stamp => stamp.id === savedSelectedId
  );

  if (selectedStampStillExists) {
    selectedStampImageId = savedSelectedId;
  } else {
    selectedStampImageId = stampImages[0]?.id ?? null;
  }

  saveStampLibrary();
}

function saveStampLibrary(): void {
  const savedStampImages: SavedStampImage[] =
    stampImages.map(stamp => ({
      id: stamp.id,
      name: stamp.name,
      filePath: stamp.filePath,
    }));

  localStorage.setItem(
    STAMP_LIBRARY_KEY,
    JSON.stringify(savedStampImages)
  );

  if (selectedStampImageId) {
    localStorage.setItem(
      SELECTED_STAMP_KEY,
      selectedStampImageId
    );
  } else {
    localStorage.removeItem(SELECTED_STAMP_KEY);
  }
}

//remember last used stamp through a restart
export function getSelectedStampImageId(): string | null {
  return selectedStampImageId;
}

export function restoreSelectedStampImageId(
  id: string | null
): void {
  if (!id) {
    selectedStampImageId = stampImages[0]?.id ?? null;
    return;
  }

  const exists = stampImages.some(
    stamp => stamp.id === id
  );

  selectedStampImageId = exists
    ? id
    : stampImages[0]?.id ?? null;
}

export function replaceStampImages(
  restoredStampImages: StampImage[]
): void {
  stampImages = restoredStampImages;

  const selectedStampStillExists = stampImages.some(
    stamp => stamp.id === selectedStampImageId
  );

  if (!selectedStampStillExists) {
    selectedStampImageId = stampImages[0]?.id ?? null;
  }
}