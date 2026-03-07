# Fonts

This directory contains bundled font files used by the signature generator API.
The fonts are embedded as base64 data URIs in the generated SVGs, ensuring they
render correctly everywhere — including GitHub README `<img>` tags, which block
external font loading.

## File naming

Each font style has two files:

| File              | Format | Used for                                          |
|-------------------|--------|---------------------------------------------------|
| `<key>.woff2`     | WOFF2  | SVG `@font-face` base64 embedding (smaller size)  |
| `<key>.ttf`       | TTF    | Resvg server-side APNG rendering (fontdb needs TTF)|

Where `<key>` matches the font style API key:

| Key           | Font Family          |
|---------------|----------------------|
| `elegant`     | Dancing Script 700   |
| `classic`     | Great Vibes          |
| `modern`      | Parisienne           |
| `refined`     | Allura               |
| `bold`        | Sacramento           |
| `light`       | Alex Brush           |
| `serif`       | Mrs Saint Delafield  |
| `baskerville` | Zeyada               |

## How to download

Run the download script from the project root:

```bash
node scripts/download-fonts.js
```

Or manually download TTF/WOFF2 files from [Google Fonts](https://fonts.google.com/)
and place them here with the correct naming.
