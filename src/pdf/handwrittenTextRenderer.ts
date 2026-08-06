const handwrittenFontFamily =
  'PDFScribbler Handwriting';

const handwrittenFontSize = 72;
const glyphVariantCount = 6;
const glyphHorizontalPadding = 14;
const glyphCanvasHeight = 104;
const textHorizontalPadding = 12;

interface HandwrittenGlyphVariant {
  canvas: HTMLCanvasElement;
  advanceWidth: number;
}

interface GlyphDistortionSettings {
  minimumAmplitude: number;
  maximumAmplitude: number;
  minimumWavelength: number;
  maximumWavelength: number;
}

let fontLoadPromise:
  Promise<void> | null =
    null;

const glyphVariantLibrary =
  new Map<
    string,
    HandwrittenGlyphVariant[]
  >();

export async function
renderHandwrittenText(
  text: string
): Promise<HTMLCanvasElement> {
  await ensureHandwritingFontLoaded();

  const characters =
    Array.from(text);

  const lastVariantIndexes =
    new Map<string, number>();

  const selectedVariants =
    characters.map(
      character => {
        const variants =
          getGlyphVariants(
            character
          );

        const previousIndex =
          lastVariantIndexes.get(
            character
          );

        const variantIndex =
          chooseVariantIndex(
            variants.length,
            previousIndex
          );

        lastVariantIndexes.set(
          character,
          variantIndex
        );

        return variants[
          variantIndex
        ];
      }
    );

  const textWidth =
    selectedVariants.reduce(
      (
        totalWidth,
        variant
      ) =>
        totalWidth +
        variant.advanceWidth,
      0
    );

  const outputCanvas =
    document.createElement(
      'canvas'
    );

  outputCanvas.width =
    Math.ceil(
      textWidth +
      textHorizontalPadding * 2 +
      glyphHorizontalPadding * 2
    );

  outputCanvas.height =
    glyphCanvasHeight;

  const outputContext =
    outputCanvas.getContext(
      '2d'
    );

  if (!outputContext) {
    throw new Error(
      'Could not create the handwritten text canvas.'
    );
  }

  let currentX =
    textHorizontalPadding +
    glyphHorizontalPadding;

  for (
    const variant of
    selectedVariants
  ) {
    outputContext.drawImage(
      variant.canvas,
      currentX -
        glyphHorizontalPadding,
      0
    );

    currentX +=
      variant.advanceWidth;
  }

  return outputCanvas;
}

async function
ensureHandwritingFontLoaded():
  Promise<void> {
  if (!fontLoadPromise) {
    fontLoadPromise =
      loadHandwritingFont()
        .catch(
          error => {
            fontLoadPromise =
              null;

            throw error;
          }
        );
  }

  await fontLoadPromise;
}

async function
loadHandwritingFont():
  Promise<void> {
  const fontUrl =
    new URL(
      'fonts/Caveat-Regular.ttf',
      window.location.href
    ).toString();

  const fontFace =
    new FontFace(
      handwrittenFontFamily,
      `url("${fontUrl}")`
    );

  const loadedFont =
    await fontFace.load();

  document.fonts.add(
    loadedFont
  );
}

function getGlyphVariants(
  character: string
): HandwrittenGlyphVariant[] {
  const existingVariants =
    glyphVariantLibrary.get(
      character
    );

  if (existingVariants) {
    return existingVariants;
  }

  const newVariants =
    createGlyphVariants(
      character
    );

  glyphVariantLibrary.set(
    character,
    newVariants
  );

  return newVariants;
}

function createGlyphVariants(
  character: string
): HandwrittenGlyphVariant[] {
  const measurementCanvas =
    document.createElement(
      'canvas'
    );

  const measurementContext =
    measurementCanvas.getContext(
      '2d'
    );

  if (!measurementContext) {
    throw new Error(
      'Could not create the handwritten character measurement canvas.'
    );
  }

  measurementContext.font =
    `${handwrittenFontSize}px ` +
    `"${handwrittenFontFamily}"`;

  const measuredWidth =
    Math.max(
      measurementContext
        .measureText(character)
        .width,
      handwrittenFontSize * 0.18
    );

  return Array.from(
    {
      length:
        glyphVariantCount,
    },
    () =>
      createGlyphVariant(
        character,
        measuredWidth
      )
  );
}


function getGlyphDistortionSettings(
  character: string
): GlyphDistortionSettings {
  if (
    character === '0' ||
    character === 'O' ||
    character === '7'
  ) {
    return {
      minimumAmplitude: 0.1,
      maximumAmplitude: 0.45,
      minimumWavelength: 40,
      maximumWavelength: 65,
    };
  }

  if (
    character === '/' ||
    character === ':'
  ) {
    return {
      minimumAmplitude: 0,
      maximumAmplitude: 0,
      minimumWavelength: 50,
      maximumWavelength: 50,
    };
  }

  return {
    minimumAmplitude: 0.25,
    maximumAmplitude: 0.9,
    minimumWavelength: 28,
    maximumWavelength: 50,
  };
}

function createGlyphVariant(
  character: string,
  measuredWidth: number
): HandwrittenGlyphVariant {
  const horizontalScale =
    randomBetween(
      0.94,
      1.12
    );

  const verticalScale =
    randomBetween(
      0.96,
      1.04
    );

  const rotation =
    degreesToRadians(
      randomBetween(
        -2,
        3.5
      )
    );

  const baselineOffset =
    randomBetween(
      -2,
      2
    );

  const trackingOffset =
    randomBetween(
      -1,
      1.5
    );

  const baseCanvas =
    document.createElement(
      'canvas'
    );

  baseCanvas.width =
    Math.ceil(
      measuredWidth +
      glyphHorizontalPadding * 2
    );

  baseCanvas.height =
    glyphCanvasHeight;

  const baseContext =
    baseCanvas.getContext(
      '2d'
    );

  if (!baseContext) {
    throw new Error(
      'Could not create a handwritten character canvas.'
    );
  }

  if (character !== ' ') {
    baseContext.save();

    baseContext.translate(
      baseCanvas.width / 2,
      baseCanvas.height / 2
    );

    baseContext.rotate(
      rotation
    );

    baseContext.scale(
      horizontalScale,
      verticalScale
    );

    baseContext.font =
      `${handwrittenFontSize}px ` +
      `"${handwrittenFontFamily}"`;

    baseContext.fillStyle =
      `rgba(0, 0, 0, ` +
      `${randomBetween(
        0.93,
        1
      )})`;

    baseContext.textAlign =
      'center';

    baseContext.textBaseline =
      'middle';

    baseContext.fillText(
      character,
      0,
      baselineOffset
    );

    baseContext.restore();
  }

  const distortionSettings =
  getGlyphDistortionSettings(
    character
  );

  const distortedCanvas =
  applyHorizontalWaveDistortion(
    baseCanvas,
    randomBetween(
      distortionSettings
        .minimumAmplitude,
      distortionSettings
        .maximumAmplitude
    ),
    randomBetween(
      0,
      Math.PI * 2
    ),
    randomBetween(
      distortionSettings
        .minimumWavelength,
      distortionSettings
        .maximumWavelength
    )
  );

  return {
    canvas:
      distortedCanvas,

    advanceWidth:
      Math.max(
        measuredWidth *
          horizontalScale +
          trackingOffset,
        2
      ),
  };
}

function
applyHorizontalWaveDistortion(
  sourceCanvas:
    HTMLCanvasElement,
  amplitude: number,
  phase: number,
  wavelength: number
): HTMLCanvasElement {
  const distortedCanvas =
    document.createElement(
      'canvas'
    );

  distortedCanvas.width =
    sourceCanvas.width;

  distortedCanvas.height =
    sourceCanvas.height;

  const context =
    distortedCanvas.getContext(
      '2d'
    );

  if (!context) {
    throw new Error(
      'Could not create the distorted character canvas.'
    );
  }

  const stripHeight = 2;

  for (
    let sourceY = 0;
    sourceY <
      sourceCanvas.height;
    sourceY += stripHeight
  ) {
    const currentStripHeight =
      Math.min(
        stripHeight,
        sourceCanvas.height -
          sourceY
      );

    const horizontalShift =
      Math.sin(
        (
          sourceY /
          wavelength
        ) *
          Math.PI *
          2 +
          phase
      ) *
      amplitude;

    context.drawImage(
      sourceCanvas,
      0,
      sourceY,
      sourceCanvas.width,
      currentStripHeight,
      horizontalShift,
      sourceY,
      sourceCanvas.width,
      currentStripHeight
    );
  }

  return distortedCanvas;
}

function chooseVariantIndex(
  variantCount: number,
  previousIndex:
    number | undefined
): number {
  let selectedIndex =
    Math.floor(
      Math.random() *
      variantCount
    );

  if (
    previousIndex !== undefined &&
    selectedIndex ===
      previousIndex &&
    variantCount > 1
  ) {
    const differentOffset =
      1 +
      Math.floor(
        Math.random() *
        (
          variantCount -
          1
        )
      );

    selectedIndex =
      (
        selectedIndex +
        differentOffset
      ) %
      variantCount;
  }

  return selectedIndex;
}

function randomBetween(
  minimum: number,
  maximum: number
): number {
  return (
    minimum +
    Math.random() *
    (
      maximum -
      minimum
    )
  );
}

function degreesToRadians(
  degrees: number
): number {
  return (
    degrees *
    Math.PI /
    180
  );
}