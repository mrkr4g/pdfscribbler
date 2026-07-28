# PDFScribbler generated icon sprites

Each PNG is a normalized **4-column × 2-row** sprite sheet. Every cell is
256 × 256 pixels, making CSS positioning predictable.

## actions-sprite.png

| Cell | Row | Column | Artwork |
|---|---:|---:|---|
| 1 | 1 | 1 | Open PDF |
| 2 | 1 | 2 | Save |
| 3 | 1 | 3 | Save and close |
| 4 | 1 | 4 | Page thumbnails |
| 5 | 2 | 1 | Open folder |
| 6 | 2 | 2 | Export |
| 7 | 2 | 3 | Stamp |
| 8 | 2 | 4 | Document |

## view-sprite.png

Fit width, fit height, zoom in, zoom out, actual size, pan, rotate clockwise,
rotate counterclockwise.

## navigation-sprite.png

Left, right, up, down, back, forward, previous page, next page.

## utility-sprite.png

Add, remove, confirm, clear, lock, unlock, trash, refresh.

## window-sprite.png

Minimize, maximize, restore, close, menu, settings, more, information.

## general-sprite.png

Show, hide, search, home, grid, list, copy, edit.

## Position formula

When a displayed sprite cell is 40px square:

```css
background-size: 160px 80px;
background-position: calc(column * -40px) calc(row * -40px);
```

The supplied `src/index.css` already maps the seven buttons currently present
in PDFScribbler. It requires no `index.html` or TypeScript changes.
