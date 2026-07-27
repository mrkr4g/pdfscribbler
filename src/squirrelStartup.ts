import { app } from 'electron';
import {
  spawn,
  spawnSync
} from 'node:child_process';
import path from 'node:path';

const classesRegistryRoot =
  'HKCU\\Software\\Classes';

const pdfProgId =
  'PDFScribbler.PDF';

// Run one Windows registry command.
function runRegistryCommand(
  argumentsList: string[],
  reportFailure = true
): void {
  const result =
    spawnSync(
      'reg.exe',
      argumentsList,
      {
        windowsHide: true,
        encoding: 'utf8',
      }
    );

  if (
    result.error &&
    reportFailure
  ) {
    console.error(
      'Could not update the PDFScribbler Windows registration:',
      result.error
    );

    return;
  }

  if (
    result.status !== 0 &&
    reportFailure
  ) {
    console.error(
      'Could not update the PDFScribbler Windows registration:',
      result.stderr
    );
  }
}

// Add either a named registry value or a key's default value.
function addRegistryValue(
  registryKey: string,
  valueName: string | null,
  data: string
): void {
  const argumentsList = [
    'ADD',
    registryKey,
  ];

  if (valueName === null) {
    argumentsList.push(
      '/ve'
    );
  } else {
    argumentsList.push(
      '/v',
      valueName
    );
  }

  argumentsList.push(
    '/t',
    'REG_SZ',
    '/d',
    data,
    '/f'
  );

  runRegistryCommand(
    argumentsList
  );
}

// Register PDFScribbler as an application that can open PDFs.
function registerPdfOpenWith(): void {
  const executableName =
    path.basename(
      process.execPath
    );

  const applicationKey =
    `${classesRegistryRoot}\\Applications\\${executableName}`;

  const progIdKey =
    `${classesRegistryRoot}\\${pdfProgId}`;

  const openCommand =
    `"${process.execPath}" "%1"`;

  const iconCommand =
    `"${process.execPath}",0`;

  // Register the installed executable itself.
  addRegistryValue(
    applicationKey,
    'FriendlyAppName',
    'PDFScribbler'
  );

  addRegistryValue(
    `${applicationKey}\\SupportedTypes`,
    '.pdf',
    ''
  );

  addRegistryValue(
    `${applicationKey}\\DefaultIcon`,
    null,
    iconCommand
  );

  addRegistryValue(
    `${applicationKey}\\shell\\open\\command`,
    null,
    openCommand
  );

  // Register a PDFScribbler-specific PDF handler.
  addRegistryValue(
    progIdKey,
    null,
    'PDF document'
  );

  addRegistryValue(
    `${progIdKey}\\DefaultIcon`,
    null,
    iconCommand
  );

  addRegistryValue(
    `${progIdKey}\\shell\\open\\command`,
    null,
    openCommand
  );

  // Advertise PDFScribbler as an alternate PDF application.
  // This does not replace the user's current default PDF app.
  addRegistryValue(
    `${classesRegistryRoot}\\.pdf\\OpenWithProgids`,
    pdfProgId,
    ''
  );
}

// Remove the registry entries when PDFScribbler is uninstalled.
function unregisterPdfOpenWith(): void {
  const executableName =
    path.basename(
      process.execPath
    );

  const applicationKey =
    `${classesRegistryRoot}\\Applications\\${executableName}`;

  const progIdKey =
    `${classesRegistryRoot}\\${pdfProgId}`;

  runRegistryCommand(
    [
      'DELETE',
      applicationKey,
      '/f',
    ],
    false
  );

  runRegistryCommand(
    [
      'DELETE',
      progIdKey,
      '/f',
    ],
    false
  );

  runRegistryCommand(
    [
      'DELETE',
      `${classesRegistryRoot}\\.pdf\\OpenWithProgids`,
      '/v',
      pdfProgId,
      '/f',
    ],
    false
  );
}

// Ask Squirrel's Update.exe to create or remove shortcuts.
function runSquirrelShortcutCommand(
  argumentsList: string[]
): void {
  const updateExePath =
    path.resolve(
      path.dirname(
        process.execPath
      ),
      '..',
      'Update.exe'
    );

  const childProcess =
    spawn(
      updateExePath,
      argumentsList,
      {
        detached: true,
        stdio: 'ignore',
      }
    );

  childProcess.on(
    'error',
    error => {
      console.error(
        'Could not update PDFScribbler shortcuts:',
        error
      );
    }
  );

  childProcess.unref();
}

// Handle the special launches performed by Squirrel.
export function handleSquirrelStartupEvents():
  boolean {
  if (process.platform !== 'win32') {
    return false;
  }

  const squirrelCommand =
    process.argv[1];

  const executableName =
    path.basename(
      process.execPath
    );

  switch (squirrelCommand) {
    case '--squirrel-install':
    case '--squirrel-updated':
      registerPdfOpenWith();

      runSquirrelShortcutCommand(
        [
          `--createShortcut=${executableName}`
        ]
      );

      return true;

    case '--squirrel-uninstall':
      unregisterPdfOpenWith();

      runSquirrelShortcutCommand(
        [
          `--removeShortcut=${executableName}`
        ]
      );

      return true;

    case '--squirrel-obsolete':
      return true;

    default:
      return false;
  }
}