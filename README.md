# PDFScribbler

PDFScribbler is a simple, general-purpose desktop utility for opening a PDF, selecting one page, placing reusable image stamps on that page, and saving the stamped page as a new PDF.

The project is being built incrementally as a learning application using Electron, TypeScript, and Cursor.

## Project Status

PDFScribbler is under active development.

The main PDF viewing, page selection, stamp placement, stamp-library, and single-page export workflows are functional. Some display-scaling behavior is still being refined.

## Intended Workflow

1. Open a local PDF file.
2. Select a page from the thumbnail panel.
3. Select an existing stamp or import a new stamp image.
4. Click the page to place the stamp.
5. Move or resize the placed stamp as needed.
6. Save the active page as a new PDF.
7. Click the displayed saved-file path to open the new PDF.

## Current Features

### PDF Viewing

- Open local PDF files.
- Display thumbnails for every page.
- Select one active page from the thumbnail panel.
- View the active page in the main viewer.
- Fit the page to the viewer width.
- Fit the page to the viewer height.
- Re-render the active page when the application window is resized.

### Stamp Library

- Import image files for use as stamps.
- Display reusable stamp images in a thumbnail strip.
- Remember imported stamps between application sessions.
- Remember the currently selected stamp.
- Store managed copies of imported stamp files in the application's data directory.
- Remove stamps from the reusable library.
- Keep an already placed stamp visible in the current document even if its source stamp is removed from the library.

### Stamp Placement and Editing

- Place multiple stamps on the active page.
- Select newly placed or previously placed stamps.
- Drag stamps to reposition them.
- Resize stamps from a lower-right resize handle.
- Preserve the stamp image's aspect ratio while resizing.
- Keep stamps within the page boundaries while dragging or resizing.
- Deselect a stamp by clicking empty page space.
- Delete the selected placed stamp with the `Delete` key.
- Maintain separate placed stamps for each PDF page during the current editing session.

### Saving

- Export only the currently selected page.
- Embed the placed stamp images into the exported PDF page.
- Choose a save location through the native file dialog.
- Display the saved file path after export.
- Open the saved PDF by clicking its displayed path.

## Important Scope Decision

PDFScribbler is a **single-page-output application**.

A PDF may contain many pages, but the user selects one active page, places stamps on that page, and saves only that page as a new PDF. The application is not intended to stamp or export multiple pages at once.

## Current Development Tasks

- Add a spinning progress indicator while a selected PDF is loading.
- Continue refining stamp coordinate storage so stamp positions and sizes remain consistent when switching between fit-to-width and fit-to-height views.

## Known Issue

Switching between fit-to-width and fit-to-height can currently cause some placed stamps to appear at an incorrect position or scale. In some cases, older stamps disappear in one fit mode and reappear when returning to the previous mode.

This behavior is being investigated before additional editing features are added.

## Planned Features

### Preferred Initial Stamp Sizes

Store a preferred initial placement size separately for each reusable stamp. For example, a signature can begin small while an approval stamp can begin much larger.

### Print-to-PDFScribbler Workflow

Use an existing Print to PDF printer and monitor a designated PDFScribbler folder. When a new PDF is saved into that folder, PDFScribbler should detect it and open it automatically for stamping.

This is preferred over implementing a custom virtual printer.

### Variable GIF Stamps

Allow an animated GIF to be imported as a stamp source. Each placement would use a randomly selected frame so repeated marks look similar without being identical.

A possible use case is a teacher repeatedly placing grades such as A or B on student work.

### Distribution and Updates

Later development may include:

- Publishing packaged application binaries through GitHub Releases.
- Checking for application updates automatically.

## Technology Stack

- [Electron](https://www.electronjs.org/)
- [Electron Forge](https://www.electronforge.io/)
- [Vite](https://vite.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [PDF.js](https://mozilla.github.io/pdf.js/) through `pdfjs-dist`
- [pdf-lib](https://pdf-lib.js.org/)

React is not currently used. The application is being built with standard HTML, CSS, and TypeScript while the core behavior is developed.

## Development Environment

The project is currently developed primarily on Windows using Cursor.

The application is intended to remain cross-platform, although platform-specific packaging and testing will be completed later.

## Install and Run

Install dependencies:

```bash
npm install
```

Start the Electron development application:

```bash
npm start
```

Run the linter:

```bash
npm run lint
```

Create distributable packages:

```bash
npm run make
```

## Main Project Structure

```text
src/
├── main.ts
├── preload.ts
├── renderer.ts
├── index.css
└── pdf/
    ├── pdfDocument.ts
    ├── pdfRenderer.ts
    ├── pdfThumbnails.ts
    ├── pdfExporter.ts
    ├── pdfTypes.ts
    ├── stampFileManager.ts
    ├── stampImageLoader.ts
    ├── stampLibrary.ts
    └── stampStorage.ts
```

### Main Process

`src/main.ts` handles Electron window creation, native file dialogs, filesystem access, saving exported PDFs, managed stamp files, and opening saved files.

### Preload Bridge

`src/preload.ts` exposes a limited `window.pdfscribbler` API to the renderer through Electron's context bridge.

### Renderer

`src/renderer.ts` connects the user interface to PDF loading, thumbnails, page rendering, stamp placement, stamp editing, the persistent stamp library, and PDF export.

### PDF Modules

The modules under `src/pdf/` separate PDF loading, rendering, thumbnail creation, export, stamp loading, stamp-library state, and saved application state.

## Design Goals

- Keep the application simple and general-purpose.
- Make common stamps immediately accessible.
- Avoid unnecessary workflow steps.
- Keep implementation changes small and understandable while the project is being learned.
- Maintain compilable, testable progress after each development step.

## License

MIT
