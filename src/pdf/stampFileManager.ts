import { app } from 'electron';
import { copyFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

export interface ImportedStampFile {
  filePath: string;
  name: string;
}

/**
 * Returns the directory where PDF Scribbler keeps its own
 * managed copies of stamp images.
 */
export function getStampDirectory(): string {
  return path.join(
    app.getPath('userData'),
    'pdfscribbler-data',
    'stamps'
  );
}

/**
 * Copies a selected stamp image into PDF Scribbler's managed
 * stamp directory and returns information about the copied file.
 */
export async function importStampFile(
  sourceFilePath: string
): Promise<ImportedStampFile> {
  const stampDirectory = getStampDirectory();

  await mkdir(stampDirectory, {
    recursive: true,
  });

  const originalName = path.basename(sourceFilePath);
  const extension = path.extname(sourceFilePath).toLowerCase();

  if (!extension) {
    throw new Error(
      `The selected stamp image has no file extension: ${sourceFilePath}`
    );
  }

  const managedFileName = `${randomUUID()}${extension}`;

  const managedFilePath = path.join(
    stampDirectory,
    managedFileName
  );

  await copyFile(
    sourceFilePath,
    managedFilePath
  );

  return {
    filePath: managedFilePath,
    name: originalName,
  };
}