# ✦ Signature Atelier

一个优雅的英文签名设计生成器。通过 Web 界面交互设计签名，或通过 API 直接获取签名 SVG 图像。支持 8 种手写字体、6 种墨水颜色、自定义背景色和书写动画速度，生成矢量 SVG 签名动画。

零依赖，一键部署到 Vercel。

---

## 目录

- [功能特性](#功能特性)
- [在线演示](#在线演示)
- [项目结构](#项目结构)
- [快速部署到 Vercel](#快速部署到-vercel)
- [本地运行](#本地运行)
- [API 文档](#api-文档)
- [前端使用说明](#前端使用说明)
- [字体列表](#字体列表)
- [颜色列表](#颜色列表)
- [技术原理](#技术原理)
- [常见问题](#常见问题)

---

## 功能特性

- **8 种 Google 手写字体**：Dancing Script、Great Vibes、Parisienne、Sacramento、Allura、Alex Brush、Mrs Saint Delafield、Zeyada
- **6 种墨水颜色**：Navy、Midnight、Royal Blue、Gold、Crimson、Forest
- **自定义背景色**：16 进制颜色选择器 + 11 个预设色板 + 透明背景
- **动画速度调节**：0.5× ~ 3× 五档速度
- **SVG 矢量输出**：分辨率无关，任意缩放不失真，文件仅 ~3KB（对比 GIF ~120KB）
- **SMIL 书写动画**：文字左到右揭示、钢笔笔尖跟随、花体下划线绘制
- **字体自动嵌入**：API 端自动下载 Google Fonts woff2 并以 base64 嵌入 SVG，确保 `<img>` 标签内也能正确渲染字体
- **零依赖**：纯 Node.js 标准库，无需安装任何 npm 包
- **一键部署**：直接推送到 Vercel 即可使用

---

## 项目结构

```
signature-vercel/
├── vercel.json          # Vercel 路由 & 缓存配置
├── api/
│   └── index.js         # Serverless Function — SVG 签名生成 API
└── public/
    └── index.html       # 完整前端界面（纯 HTML/CSS/JS，无需构建）
```

仅 3 个文件，总共约 33KB。

---

## 快速部署到 Vercel

### 方式一：通过 GitHub

1. 将项目代码推送到 GitHub 仓库
2. 访问 [vercel.com/new](https://vercel.com/new)，导入该仓库
3. 无需任何配置，直接点击 **Deploy**
4. 部署完成后即可通过分配的域名访问

### 方式二：通过 Vercel CLI

```bash
# 安装 Vercel CLI（如尚未安装）
npm i -g vercel

# 进入项目目录
cd signature-vercel

# 部署
vercel
```

按提示操作，部署完成后终端会输出访问链接。

### 方式三：直接拖拽部署

1. 访问 [vercel.com/new](https://vercel.com/new)
2. 将项目文件夹直接拖入页面
3. 点击 Deploy

---

## 本地运行

项目也可以脱离 Vercel 在本地运行，只需 Node.js：

```bash
cd signature-vercel

# 直接启动（无需 npm install）
node api/index.js
```

> **注意**：本地运行时 `api/index.js` 是一个 Vercel Serverless Function 格式，不包含 HTTP Server。如需本地测试 API，可使用以下简单包装：

```bash
# 创建本地测试服务器
node -e "
const http = require('http');
const handler = require('./api/index.js');
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost:3000');
  req.query = Object.fromEntries(url.searchParams);
  res.status = (code) => { res.statusCode = code; return { send: (body) => res.end(body), end: () => res.end() }; };
  res.redirect = (u) => { res.writeHead(302, {Location: u}); res.end(); };
  handler(req, res);
}).listen(3000, () => console.log('http://localhost:3000'));
"
```

前端页面直接用浏览器打开 `public/index.html` 即可，或使用任意静态文件服务器：

```bash
npx serve public -l 8080
```

---

## API 文档

### 基础用法

```
GET /api?signature=John+Smith
```

返回一个带书写动画的 SVG 图像。

### 参数列表

| 参数 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `signature` | ✅ | — | 要渲染的签名文字（最长 50 字符） |
| `font` | ❌ | `elegant` | 字体风格，见[字体列表](#字体列表) |
| `color` | ❌ | `navy` | 墨水颜色，见[颜色列表](#颜色列表) |
| `speed` | ❌ | `1` | 动画速度，范围 0.25 ~ 5 |
| `bg` | ❌ | `#faf8f3` | 背景颜色，6 位十六进制或 `transparent` |
| `format` | ❌ | `svg` | `svg`（带动画）或 `static`（无动画） |

### 示例

```bash
# 基本签名
https://your-app.vercel.app/api?signature=John+Smith

# 指定字体和颜色
https://your-app.vercel.app/api?signature=Jane+Doe&font=classic&color=gold

# 深色背景 + 快速动画
https://your-app.vercel.app/api?signature=Alice&font=modern&bg=1a1a2e&color=gold&speed=2

# 透明背景
https://your-app.vercel.app/api?signature=Bob&bg=transparent&color=crimson

# 静态（无动画）
https://your-app.vercel.app/api?signature=Test&format=static
```

### 嵌入方式

**HTML：**

```html
<img src="https://your-app.vercel.app/api?signature=John+Smith&font=elegant&color=navy" alt="Signature" />
```

**Markdown：**

```markdown
![signature](https://your-app.vercel.app/api?signature=John+Smith&font=elegant&color=navy)
```

**GitHub README：**

```markdown
![My Signature](https://your-app.vercel.app/api?signature=Your+Name&font=classic&color=gold&bg=transparent)
```

---

## 前端使用说明

部署后访问根路径即可打开前端界面：

```
https://your-app.vercel.app/
```

### 界面功能

1. **输入名字**：在顶部输入框中键入英文名字
2. **选择字体**：点击 8 种字体卡片，实时预览字体效果
3. **选择墨水颜色**：点击 6 种墨水颜色按钮
4. **调整背景色**：
   - 点击色块打开系统取色器
   - 在 `#` 后直接输入 6 位 hex 值
   - 点击预设色板快速切换（含透明背景选项）
5. **调整动画速度**：选择 0.5× ~ 3× 五档速度
6. **实时预览**：SVG 动画在预览区实时渲染，可点击「↻ Replay」重播

### 输出选项

切换底部的 Tab 使用不同输出方式：

- **Download SVG**：下载动画 SVG 文件到本地，同时可复制 SVG 源代码
- **API & URLs**：显示对应参数的 API URL，一键复制，包含 HTML/Markdown 嵌入代码和服务端预览

---

## 字体列表

| API 参数值 | 字体名称 | Google Fonts |
|-----------|----------|--------------|
| `elegant` | Dancing Script | Elegant Cursive |
| `classic` | Great Vibes | Classic Flourish |
| `modern` | Parisienne | French Elegance |
| `bold` | Sacramento | Smooth Flow |
| `refined` | Allura | Formal Script |
| `light` | Alex Brush | Brush Stroke |
| `serif` | Mrs Saint Delafield | Victorian |
| `baskerville` | Zeyada | Handwritten |

---

## 颜色列表

| API 参数值 | 颜色名称 | Hex |
|-----------|----------|-----|
| `navy` | Navy Ink | `#1a1a4e` |
| `black` | Midnight | `#111111` |
| `blue` | Royal Blue | `#1e3a8a` |
| `gold` | Gold | `#8B6914` |
| `crimson` | Crimson | `#8B0000` |
| `forest` | Forest | `#1a4a2e` |

---

## 技术原理

### SVG 动画（SMIL）

签名书写效果通过 SVG 的 SMIL 动画实现，无需 JavaScript：

- **文字揭示**：`<clipPath>` 内的 `<rect>` 通过 `<animate>` 从 `width: 0` 过渡到 `width: 600`，配合 `cubic-bezier` 缓动曲线模拟自然书写节奏
- **钢笔笔尖**：`<animateTransform type="translate">` 驱动笔尖沿 X 轴跟随揭示进度移动，书写完成后通过透明度动画淡出
- **花体下划线**：`stroke-dashoffset` 动画实现路径绘制效果，在文字书写 78% 时开始绘入
- **速度控制**：所有动画的 `dur` 属性由 `speed` 参数计算，`2.4 / speed` 秒为基准时长

### 字体嵌入

直接在 SVG `<style>` 中使用 `@import url(...)` 引用外部字体时，浏览器会因安全策略阻止加载（尤其在 `<img>` 标签中）。解决方案：

1. API 首次请求某字体时，通过 HTTPS 从 Google Fonts 下载 CSS
2. 从 CSS 中提取 `.woff2` 字体文件 URL
3. 下载 woff2 二进制文件，转为 base64
4. 在 SVG 中嵌入 `@font-face { src: url(data:font/woff2;base64,...) }`
5. 缓存结果，后续请求直接使用（Vercel 热实例内存中持久化）

如果网络不可用，自动回退为 `@import` 方式（直接打开 SVG 文件时仍可用）。

### 自适应背景

SVG 根据背景亮度自动调整细节：

- 浅色背景 → 深色纸纹噪点 (`rgba(0,0,0,.035)`) + 深色笔杆
- 深色背景 → 浅色纸纹噪点 (`rgba(255,255,255,.06)`) + 浅色笔杆
- 透明背景 → 无背景矩形、无噪点（文件更小）

---

## 常见问题

### 字体在 `<img>` 标签中不显示？

确保你使用的是 API 端生成的 SVG（而非前端下载的 SVG）。API 端会自动将字体以 base64 嵌入 SVG，可在任何环境渲染。前端下载的 SVG 使用 `@import` 方式，在 `<img>` 中可能无法加载外部字体。

### 动画不播放？

SMIL 动画在现代浏览器（Chrome、Firefox、Safari、Edge）中均受支持。如果作为 `<img>` 嵌入，部分旧版浏览器可能不支持 SVG SMIL 动画。可使用 `format=static` 获取静态版本。

### 如何自定义字体或颜色？

修改 `api/index.js` 中的 `FONTS` 和 `COLORS` 对象即可。添加新字体时需提供 Google Fonts URL，格式参考现有条目。同时更新 `public/index.html` 中的对应数据数组以保持前端同步。

### Vercel 免费额度够用吗？

绰绰有余。SVG 生成是纯计算操作（无数据库、无文件系统），每次请求仅需 ~50ms。Vercel Hobby 计划提供每月 100GB 带宽和 100 小时函数执行时间。单个 SVG 仅 ~3-50KB（取决于是否嵌入字体），日均百万次请求也不会超限。

### 能否用于生产环境？

可以。项目零依赖、无状态、有缓存头（`s-maxage=3600`），天然适合 CDN 边缘缓存。如需更高性能，可在 Vercel 项目设置中启用 Edge Functions。

---

## License

MIT