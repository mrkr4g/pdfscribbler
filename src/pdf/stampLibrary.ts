import type {StampImage} from './pdfTypes';

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
    return;
  }

  stampImages.push(stampImage);
  selectedStampImageId = stampImage.id;

}


export function removeStampImage(
  id: string
): StampImage | null {
  const stampIndex =
    stampImages.findIndex(
      stampImage =>
        stampImage.id === id
    );

  if (stampIndex === -1) {
    return null;
  }

  const [removedStamp] =
    stampImages.splice(
      stampIndex,
      1
    );

  if (
    selectedStampImageId === id
  ) {
    const nextStamp =
      stampImages[stampIndex] ??
      stampImages[stampIndex - 1] ??
      null;

    selectedStampImageId =
      nextStamp?.id ?? null;
  }

  return removedStamp;
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
}

export function hasSelectedStampImage(): boolean {
  return getSelectedStampImage() !== null;
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