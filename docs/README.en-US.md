# ✦ Signature Atelier

An elegant signature generator for README and web use. Design a handwritten signature in the browser or generate animated SVG signatures directly through the API.

> Language: [中文](README.zh-CN.md)

<div align="center">

<img src="signature_Corgiking.svg" alt="Signature preview" />

</div>

---

## Overview

`Signature Atelier` is a zero-dependency SVG signature generator for README files, websites, and lightweight API usage.

It supports:

- 8 handwritten Google Fonts
- 6 ink colors
- Custom or transparent backgrounds
- Adjustable animation speed
- Animated SVG and static SVG output
- Font embedding on the API side for reliable `<img>` and Markdown rendering
- Simple Vercel deployment

## Hosted API Available

The author has already deployed this project, so you can use the API directly:

- API base: <https://readme-signature-generate-1qezc8u6a-mcoylabs-projects.vercel.app/api?>
- Example: <https://readme-signature-generate-1qezc8u6a-mcoylabs-projects.vercel.app/api?signature=John+Smith>

Useful for:

- GitHub README signatures
- Markdown embeds
- HTML image usage
- Dynamic signature URLs in apps or services

Markdown example:

```markdown
![signature](https://readme-signature-generate-1qezc8u6a-mcoylabs-projects.vercel.app/api?signature=John+Smith&font=elegant&color=navy&bg=transparent)
```

HTML example:

```html
<img src="https://readme-signature-generate-1qezc8u6a-mcoylabs-projects.vercel.app/api?signature=John+Smith&font=classic&color=gold" alt="signature" />
```

## Quick Start

### Open the web UI

After deployment, open the site root:

```text
https://your-app.vercel.app/
```

In the UI, you can:

1. Enter a name
2. Pick a font
3. Choose an ink color
4. Set a background color
5. Adjust animation speed
6. Download SVG or copy API URLs

### Basic API Call

```text
GET /api?signature=John+Smith
```

The response is an SVG image.

## API Parameters

| Parameter | Required | Default | Description |
| --- | --- | --- | --- |
| `signature` | Yes | — | Signature text, up to 50 characters |
| `font` | No | `elegant` | Font style |
| `color` | No | `navy` | Ink color |
| `speed` | No | `1` | Animation speed, range `0.25 ~ 5` |
| `bg` | No | `#faf8f3` | Background color or `transparent` |
| `format` | No | `svg` | `svg` for animated, `static` for still, `apng` for animated PNG |
| `anim` | No | `print` | `print` reveals left-to-right; `write` draws stroke-by-stroke, letter by letter |

### Example URLs

```text
https://your-app.vercel.app/api?signature=John+Smith
https://your-app.vercel.app/api?signature=Jane+Doe&font=classic&color=gold
https://your-app.vercel.app/api?signature=Alice&font=modern&bg=1a1a2e&color=gold&speed=2
https://your-app.vercel.app/api?signature=Bob&bg=transparent&color=crimson
https://your-app.vercel.app/api?signature=Test&format=static
https://your-app.vercel.app/api?signature=Ada+Lovelace&anim=write
```

## Fonts

| API Value | Font | Style |
| --- | --- | --- |
| `elegant` | Dancing Script | Elegant Cursive |
| `classic` | Great Vibes | Classic Flourish |
| `modern` | Parisienne | French Elegance |
| `bold` | Sacramento | Smooth Flow |
| `refined` | Allura | Formal Script |
| `light` | Alex Brush | Brush Stroke |
| `serif` | Mrs Saint Delafield | Victorian |
| `baskerville` | Zeyada | Handwritten |

## Colors

| API Value | Name | Hex |
| --- | --- | --- |
| `navy` | Navy Ink | `#1a1a4e` |
| `black` | Midnight | `#111111` |
| `blue` | Royal Blue | `#1e3a8a` |
| `gold` | Gold | `#8B6914` |
| `crimson` | Crimson | `#8B0000` |
| `forest` | Forest | `#1a4a2e` |

## Deploy to Vercel

### Deploy Button

Use the button below to clone and deploy on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Corgiking0127/readme-signature-generate)

### Option 1: Import from GitHub

1. Fork or copy this repository to your GitHub account
2. Open <https://vercel.com/new>
3. Select the repository
4. Keep the default settings
5. Click **Deploy**

### Option 2: Use Vercel CLI

```bash
npm i -g vercel
cd readme-signature-generate
vercel
```

### Option 3: Drag and Drop

1. Open <https://vercel.com/new>
2. Drag the project folder into the page
3. Click **Deploy**

## Local Development

No npm dependencies are required.

### Run the API locally

```bash
node -e "
const http = require('http');
const handler = require('./api/index.js');
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost:3000');
  req.query = Object.fromEntries(url.searchParams);
  res.status = (code) => { res.statusCode = code; return { send: (body) => res.end(body), end: () => res.end() }; };
  res.redirect = (u) => { res.writeHead(302, { Location: u }); res.end(); };
  handler(req, res);
}).listen(3000, () => console.log('http://localhost:3000'));
"
```

### Open the frontend locally

Open `public/index.html` directly, or use a static file server:

```bash
npx serve public -l 8080
```

## Project Structure

```text
readme-signature-generate/
├── vercel.json
├── api/
│   └── index.js
├── public/
│   └── index.html
├── signature-api-server.js
├── docs/
│   ├── README.zh-CN.md
│   └── README.en-US.md
└── README.md
```

## FAQ

### Why is the API SVG better for embeds?

Because the API embeds fonts directly into the SVG, making it more reliable in Markdown, README files, and `<img>` tags.

### What if animation does not play?

This project uses SVG SMIL animation. Most modern browsers support it. If you only need a still image, use `format=static`.

### Can I customize fonts or colors?

Yes. Update `FONTS` and `COLORS` in `api/index.js`, and keep `public/index.html` in sync.

---

## License

MIT
