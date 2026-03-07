# ✦ Signature Atelier

一个优雅的 README / 网页签名生成器：可通过 Web 界面交互生成英文手写签名，也可通过 API 直接返回 SVG 动画签名。

> Language: [English](README.en-US.md)

<div align="center">

<img src="https://readme-signature-generate-1qezc8u6a-mcoylabs-projects.vercel.app/api?signature=Corgiking&font=refined&color=navy&speed=0.5&bg=transparent" alt="Signature preview" />

</div>

---

## 项目简介

`Signature Atelier` 是一个零依赖的 SVG 签名生成工具，适用于：

- GitHub README 个人签名展示
- 博客 / 官网嵌入签名图片
- 通过 URL 参数动态生成签名
- 快速部署到 Vercel，作为轻量 API 服务使用

项目特性：

- 8 种英文手写字体
- 6 种墨水颜色
- 自定义背景色与透明背景
- 可调书写动画速度
- 输出动画 SVG 或静态 SVG
- API 自动嵌入字体，适合直接在 `<img>` / Markdown 中使用
- 纯 Node.js 标准库实现，无需安装 npm 依赖

## 在线可用 API

作者已经部署好一套可直接使用的线上 API，你可以直接访问：

- API 根地址：<https://readme-signature-generate-1qezc8u6a-mcoylabs-projects.vercel.app/api?>
- 示例：<https://readme-signature-generate-1qezc8u6a-mcoylabs-projects.vercel.app/api?signature=John+Smith>

适合直接用于：

- GitHub README 图片签名
- Markdown 文档嵌入
- HTML `<img>` 引用
- 服务器端动态拼接 URL 生成签名

Markdown 示例：

```markdown
![signature](https://readme-signature-generate-1qezc8u6a-mcoylabs-projects.vercel.app/api?signature=John+Smith&font=elegant&color=navy&bg=transparent)
```

HTML 示例：

```html
<img src="https://readme-signature-generate-1qezc8u6a-mcoylabs-projects.vercel.app/api?signature=John+Smith&font=classic&color=gold" alt="signature" />
```

## 快速开始

### 1. 打开前端页面

部署后访问站点根路径即可打开可视化界面：

```text
https://your-app.vercel.app/
```

你可以在页面中：

1. 输入签名文本
2. 选择字体
3. 选择墨水颜色
4. 调整背景色
5. 调整动画速度
6. 下载 SVG 或复制 API URL

### 2. API 基础调用

```text
GET /api?signature=John+Smith
```

返回内容为 SVG 图片。

## API 参数

| 参数 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `signature` | 是 | — | 要渲染的签名文本，最长 50 个字符 |
| `font` | 否 | `elegant` | 字体风格 |
| `color` | 否 | `navy` | 墨水颜色 |
| `speed` | 否 | `1` | 动画速度，范围 `0.25 ~ 5` |
| `bg` | 否 | `#faf8f3` | 背景色，支持十六进制或 `transparent` |
| `format` | 否 | `svg` | `svg` 为动画版，`static` 为静态版 |

### 调用示例

```text
https://your-app.vercel.app/api?signature=John+Smith
https://your-app.vercel.app/api?signature=Jane+Doe&font=classic&color=gold
https://your-app.vercel.app/api?signature=Alice&font=modern&bg=1a1a2e&color=gold&speed=2
https://your-app.vercel.app/api?signature=Bob&bg=transparent&color=crimson
https://your-app.vercel.app/api?signature=Test&format=static
```

## 字体列表

| 参数值 | 字体名称 | 风格说明 |
| --- | --- | --- |
| `elegant` | Dancing Script | Elegant Cursive |
| `classic` | Great Vibes | Classic Flourish |
| `modern` | Parisienne | French Elegance |
| `bold` | Sacramento | Smooth Flow |
| `refined` | Allura | Formal Script |
| `light` | Alex Brush | Brush Stroke |
| `serif` | Mrs Saint Delafield | Victorian |
| `baskerville` | Zeyada | Handwritten |

## 颜色列表

| 参数值 | 名称 | Hex |
| --- | --- | --- |
| `navy` | Navy Ink | `#1a1a4e` |
| `black` | Midnight | `#111111` |
| `blue` | Royal Blue | `#1e3a8a` |
| `gold` | Gold | `#8B6914` |
| `crimson` | Crimson | `#8B0000` |
| `forest` | Forest | `#1a4a2e` |

## 一键部署到 Vercel

### Deploy 按钮

点击下方按钮即可跳转到 Vercel 导入部署：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Corgiking0127/readme-signature-generate)

### 方式一：通过 GitHub 导入

1. Fork 或复制本仓库到你的 GitHub 账号
2. 打开 <https://vercel.com/new>
3. 选择该仓库
4. 保持默认配置，直接点击 **Deploy**
5. 部署完成后即可通过 Vercel 分配的域名访问

### 方式二：通过 Vercel CLI

```bash
npm i -g vercel
cd readme-signature-generate
vercel
```

首次执行时按提示登录并选择项目即可。

### 方式三：直接拖拽部署

1. 打开 <https://vercel.com/new>
2. 将项目文件夹拖入页面
3. 点击 **Deploy**

## 本地运行

这个项目无需安装依赖，适合快速本地调试。

### 本地启动 API

`api/index.js` 是 Vercel Serverless Function 格式，如需本地测试，可使用简单包装：

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

### 本地打开前端

可直接用浏览器打开 `public/index.html`，或使用静态服务器：

```bash
npx serve public -l 8080
```

## 项目结构

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

## 常见问题

### 为什么 API 生成的 SVG 更适合嵌入？

因为 API 会自动将字体嵌入 SVG 中，更适合在 Markdown、README、`<img>` 等环境中直接显示。

### 动画不播放怎么办？

项目使用 SVG SMIL 动画。现代浏览器普遍支持；如果你只需要静态图，可使用 `format=static`。

### 能否自定义字体和颜色？

可以，修改 `api/index.js` 中的 `FONTS` 与 `COLORS`，并同步更新 `public/index.html` 中对应配置即可。

---

## License

MIT
