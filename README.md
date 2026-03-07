# ✦ Signature Atelier

一个优雅的 README / 网页签名生成器，支持通过 Web UI 或 API 生成 SVG 动画签名。

An elegant signature generator for README and web use, with both a browser UI and an API for animated SVG signatures.

<div align="center">

[![Vercel](https://img.shields.io/badge/Vercel-Ready-black?logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/Corgiking0127/readme-signature-generate)
![Node.js](https://img.shields.io/badge/Node.js-Zero%20Dependency-339933?logo=node.js&logoColor=white)
![SVG](https://img.shields.io/badge/SVG-Animated-orange?logo=svg&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

[中文文档](docs/README.zh-CN.md) · [English Docs](docs/README.en-US.md)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Corgiking0127/readme-signature-generate)

</div>

<div align="center">

<img src="https://readme-signature-generate-1qezc8u6a-mcoylabs-projects.vercel.app/api?signature=Corgiking&font=refined&color=navy&speed=0.5&bg=transparent" alt="Signature preview" />

</div>

---

## 文档 / Documentation

- 中文说明： [docs/README.zh-CN.md](docs/README.zh-CN.md)
- English documentation: [docs/README.en-US.md](docs/README.en-US.md)

## 在线 API / Hosted API

- API: <https://readme-signature-generate-1qezc8u6a-mcoylabs-projects.vercel.app/api?>
- Example: <https://readme-signature-generate-1qezc8u6a-mcoylabs-projects.vercel.app/api?signature=John+Smith>

## 项目特性 / Features

- 8 handwritten fonts
- 6 ink colors
- Transparent or custom background
- Animated / static SVG output
- Zero dependency Node.js API
- One-click deploy to Vercel

## 项目结构 / Structure

```text
readme-signature-generate/
├── api/
│   └── index.js
├── public/
│   └── index.html
├── docs/
│   ├── README.zh-CN.md
│   └── README.en-US.md
├── signature-api-server.js
├── vercel.json
└── README.md
```

## License

MIT