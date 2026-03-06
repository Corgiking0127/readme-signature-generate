// ═══════════════════════════════════════════════════════════════════
//  Signature API Server — Embedded Font SVG
//  Run:  node signature-api-server.js
//  Open: http://127.0.0.1:4000
// ═══════════════════════════════════════════════════════════════════

const http  = require("http");
const https = require("https");
const url   = require("url");

const PORT = 4000;

// ─── Font Definitions ────────────────────────────────────────────
const FONTS = {
  elegant:     { name:"Elegant Cursive",  family:"Dancing Script",      weight:"700",    style:"normal", size:62, skewX:0, letterSpacing:1, strokeWidth:0, yOffset:0, importUrl:"https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" },
  classic:     { name:"Classic Flourish",  family:"Great Vibes",         weight:"normal", style:"normal", size:62, skewX:0, letterSpacing:2, strokeWidth:0, yOffset:0, importUrl:"https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" },
  modern:      { name:"French Elegance",   family:"Parisienne",          weight:"normal", style:"normal", size:62, skewX:0, letterSpacing:2, strokeWidth:0, yOffset:0, importUrl:"https://fonts.googleapis.com/css2?family=Parisienne&display=swap" },
  bold:        { name:"Smooth Flow",       family:"Sacramento",          weight:"normal", style:"normal", size:68, skewX:0, letterSpacing:1, strokeWidth:0, yOffset:0, importUrl:"https://fonts.googleapis.com/css2?family=Sacramento&display=swap" },
  refined:     { name:"Formal Script",     family:"Allura",              weight:"normal", style:"normal", size:64, skewX:0, letterSpacing:2, strokeWidth:0, yOffset:0, importUrl:"https://fonts.googleapis.com/css2?family=Allura&display=swap" },
  light:       { name:"Brush Stroke",      family:"Alex Brush",          weight:"normal", style:"normal", size:64, skewX:0, letterSpacing:1, strokeWidth:0, yOffset:0, importUrl:"https://fonts.googleapis.com/css2?family=Alex+Brush&display=swap" },
  serif:       { name:"Victorian",         family:"Mrs Saint Delafield", weight:"normal", style:"normal", size:64, skewX:0, letterSpacing:2, strokeWidth:0, yOffset:0, importUrl:"https://fonts.googleapis.com/css2?family=Mrs+Saint+Delafield&display=swap" },
  baskerville: { name:"Handwritten",       family:"Zeyada",              weight:"normal", style:"normal", size:64, skewX:0, letterSpacing:1, strokeWidth:0, yOffset:0, importUrl:"https://fonts.googleapis.com/css2?family=Zeyada&display=swap" },
};

const COLORS = {
  navy:"#1a1a4e", black:"#111111", blue:"#1e3a8a",
  gold:"#8B6914", crimson:"#8B0000", forest:"#1a4a2e",
};

// ─── Font Cache ──────────────────────────────────────────────────
// Downloads Google Fonts woff2 → base64 → embeds @font-face in SVG
// so fonts render in <img> tags and everywhere else.
const fontCache = {};

function httpsGet(u) {
  return new Promise((resolve, reject) => {
    const go = (href) => {
      https.get(href, { headers:{"User-Agent":"Mozilla/5.0 (X11; Linux x86_64)"} }, (r) => {
        if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) { go(r.headers.location); return; }
        const c = []; r.on("data", d => c.push(d)); r.on("end", () => resolve({ ok: r.statusCode===200, buf: Buffer.concat(c) }));
      }).on("error", reject);
    };
    go(u);
  });
}

// Escape & in URLs for SVG/XML context
function xmlUrl(u) { return u.replace(/&/g, "&amp;"); }

async function loadFont(key) {
  const f = FONTS[key];
  if (!f) return;
  if (fontCache[key]) return;
  fontCache[key] = { css: `@import url('${xmlUrl(f.importUrl)}');`, mode: "fallback" };
  try {
    const css = await httpsGet(f.importUrl);
    if (!css.ok) throw new Error("css " + css.buf.length);
    const txt = css.buf.toString();
    const m = txt.match(/url\((https:\/\/fonts\.gstatic\.com\/[^\)]+\.woff2)\)/);
    if (!m) throw new Error("no woff2 url");
    const woff = await httpsGet(m[1]);
    if (!woff.ok) throw new Error("woff2 fetch fail");
    const b64 = woff.buf.toString("base64");
    const ur = txt.match(/unicode-range:\s*([^;}\n]+)/);
    fontCache[key] = {
      css: `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};src:url(data:font/woff2;base64,${b64}) format('woff2');${ur ? "unicode-range:"+ur[1].trim()+";" : ""}}`,
      mode: "embedded",
    };
    console.log(`  ✓ ${f.family} (${(woff.buf.length/1024).toFixed(0)}KB)`);
  } catch (e) {
    console.log(`  ⚠ ${f.family}: ${e.message} → @import fallback`);
  }
}

async function preloadFonts() {
  console.log("\n  Loading fonts...");
  await Promise.allSettled(Object.keys(FONTS).map(k => loadFont(k)));
  const ok = Object.values(fontCache).filter(v=>v.mode==="embedded").length;
  console.log(`  ${ok}/${Object.keys(FONTS).length} fonts embedded\n`);
}

function fontCSS(key) {
  return (fontCache[key] && fontCache[key].css) || `@import url('${xmlUrl((FONTS[key]||FONTS.elegant).importUrl)}');`;
}

// ─── Helpers ─────────────────────────────────────────────────────
function esc(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
}

function bgInfo(c) {
  const bg = c||"#faf8f3", isT = bg==="transparent";
  const r = isT?250:(parseInt(bg.slice(1,3),16)||250);
  const g = isT?248:(parseInt(bg.slice(3,5),16)||248);
  const b = isT?243:(parseInt(bg.slice(5,7),16)||243);
  const lum = (r*299+g*587+b*114)/1000;
  return { bg, isT, lum, grain:lum>128?"rgba(0,0,0,.035)":"rgba(255,255,255,.06)", pen:lum>128?"#3a3a3a":"#aaa" };
}

function dots(W,H,fill) {
  let d=""; for(let i=0;i<50;i++) d+=`<circle cx="${(i*137+29)%W}" cy="${(i*89+17)%H}" r=".7" fill="${fill}"/>`; return d;
}

function flourish(font,text,W,H) {
  const ew=font.size*0.48*text.length, sx=W/2-ew/2, by=H/2+font.size*0.38;
  let d=`M ${sx} ${by}`;
  for(let x=0;x<=ew;x+=4){const t=x/ew; d+=` L ${(sx+x).toFixed(1)} ${(by+Math.sin(t*Math.PI*2.5)*6*(1-t*0.7)).toFixed(1)}`;}
  return { d, len:(ew*1.05).toFixed(0) };
}

// ─── SVG Builders ────────────────────────────────────────────────
function buildAnimatedSVG(text, font, fkey, color, speed, bgC) {
  const W=600, H=200, bi=bgInfo(bgC);
  const dur=(2.4/speed).toFixed(2), fDel=(dur*0.78).toFixed(2), fDur=(dur*0.28).toFixed(2);
  const sk=font.skewX?`skewX(${font.skewX})`:"";
  const fl=flourish(font,text,W,H), dt=bi.isT?"":dots(W,H,bi.grain);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<style>${fontCSS(fkey)}</style>
<defs><clipPath id="r"><rect x="0" y="0" width="0" height="${H}">
  <animate attributeName="width" from="0" to="${W}" dur="${dur}s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1" keyTimes="0;1" repeatCount="indefinite"/>
</rect></clipPath></defs>
${bi.isT?"":`<rect width="${W}" height="${H}" rx="4" fill="${bi.bg}"/>`}
${dt}
<g clip-path="url(#r)">
  <text x="${W/2}" y="${H/2+font.size*0.08+font.yOffset}" font-family="'${font.family}',cursive,serif" font-size="${font.size}" font-weight="${font.weight}" font-style="${font.style}" fill="${color}" text-anchor="middle" dominant-baseline="middle" letter-spacing="${font.letterSpacing}" transform="translate(0,0) ${sk}" transform-origin="${W/2} ${H/2}" ${font.strokeWidth?`stroke="${color}" stroke-width="${font.strokeWidth}"`:""}>${esc(text)}</text>
</g>
<g opacity="1">
  <animateTransform attributeName="transform" type="translate" from="0 0" to="${W} 0" dur="${dur}s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1" keyTimes="0;1" repeatCount="indefinite"/>
  <g transform="translate(0,${H/2-8}) rotate(22)"><rect x="-1.5" y="-28" width="3" height="26" rx="1" fill="${bi.pen}"/><polygon points="0,1 -1.8,-5 1.8,-5" fill="${color}"/></g>
  <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.92;1" dur="${dur}s" fill="freeze" repeatCount="indefinite"/>
</g>
<path d="${fl.d}" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round" opacity="0.45" stroke-dasharray="${fl.len}" stroke-dashoffset="${fl.len}">
  <animate attributeName="stroke-dashoffset" from="${fl.len}" to="0" begin="${fDel}s" dur="${fDur}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" repeatCount="indefinite"/>
</path>
</svg>`;
}

function buildStaticSVG(text, font, fkey, color, bgC) {
  const W=600, H=200, bi=bgInfo(bgC);
  const sk=font.skewX?`skewX(${font.skewX})`:"";
  const fl=flourish(font,text,W,H), dt=bi.isT?"":dots(W,H,bi.grain);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<style>${fontCSS(fkey)}</style>
${bi.isT?"":`<rect width="${W}" height="${H}" rx="4" fill="${bi.bg}"/>`}
${dt}
<text x="${W/2}" y="${H/2+font.size*0.08+font.yOffset}" font-family="'${font.family}',cursive,serif" font-size="${font.size}" font-weight="${font.weight}" font-style="${font.style}" fill="${color}" text-anchor="middle" dominant-baseline="middle" letter-spacing="${font.letterSpacing}" transform="translate(0,0) ${sk}" transform-origin="${W/2} ${H/2}" ${font.strokeWidth?`stroke="${color}" stroke-width="${font.strokeWidth}"`:""}>${esc(text)}</text>
<path d="${fl.d}" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round" opacity="0.45"/>
</svg>`;
}

// ─── Help Page ───────────────────────────────────────────────────
function helpHTML() {
  const fr=Object.entries(FONTS).map(([k,v])=>`<code>${k}</code> — ${v.name} (${v.family})`).join("<br>");
  const cr=Object.entries(COLORS).map(([k,v])=>`<code>${k}</code> <span style="display:inline-block;width:14px;height:14px;background:${v};border-radius:3px;vertical-align:middle;border:1px solid #ccc"></span> ${v}`).join("<br>");
  const fs=Object.entries(fontCache).map(([k,v])=>`<code>${k}</code>: ${v.mode==="embedded"?"✅ embedded":"⚠️ @import fallback"}`).join(", ");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Signature API</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;background:#1a1a2e;color:#e8e4df;min-height:100vh}.w{max-width:780px;margin:0 auto;padding:40px 24px}h1{font-size:36px;font-weight:300;text-align:center;margin-bottom:8px;background:linear-gradient(135deg,#f0e6d3,#c8a24e,#f0e6d3);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.sub{text-align:center;color:#8a8578;font-style:italic;margin-bottom:40px}.c{background:rgba(255,255,255,.04);border:1px solid rgba(200,162,78,.2);border-radius:12px;padding:28px;margin-bottom:24px}.lb{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c8a24e;margin-bottom:12px}code{background:rgba(200,162,78,.12);color:#f0e6d3;padding:2px 7px;border-radius:4px;font-size:14px}pre{background:rgba(0,0,0,.3);border:1px solid rgba(200,162,78,.15);border-radius:8px;padding:16px;overflow-x:auto;color:#d4c9b0;font-size:13px;line-height:1.6;margin:12px 0}table{width:100%;border-collapse:collapse;margin:12px 0}th,td{text-align:left;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.06)}th{color:#c8a24e;font-size:11px;letter-spacing:2px;text-transform:uppercase}.try{display:flex;gap:10px;flex-wrap:wrap;align-items:end;margin:16px 0}.try label{font-size:12px;color:#c8a24e;display:block;margin-bottom:4px}.try input,.try select{padding:8px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(200,162,78,.3);border-radius:6px;color:#f0e6d3;font-family:Georgia,serif;font-size:14px}.try button{padding:10px 24px;background:linear-gradient(135deg,#c8a24e,#a07830);border:none;border-radius:6px;color:#1a1a2e;font-weight:700;font-size:12px;letter-spacing:2px;text-transform:uppercase;cursor:pointer}</style></head><body><div class="w">
<div style="text-align:center;font-size:11px;letter-spacing:6px;color:#c8a24e;margin-bottom:12px">✦ SIGNATURE ATELIER ✦</div>
<h1>Signature API</h1><p class="sub">Generate elegant signature animations via URL</p>
<div class="c"><div class="lb">Quick Start</div><pre>GET /?signature=John+Smith&amp;font=elegant&amp;color=navy&amp;speed=1</pre><p style="margin-top:8px;color:#a09888;font-size:14px">Returns an animated SVG with <strong>embedded fonts</strong>. Works everywhere — <code>&lt;img&gt;</code> tags, browsers, Markdown.</p></div>
<div class="c"><div class="lb">Try It Live</div><div class="try"><div><label>Name</label><input id="n" value="John Smith" style="width:160px"/></div><div><label>Font</label><select id="f">${Object.entries(FONTS).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join("")}</select></div><div><label>Color</label><select id="c">${Object.keys(COLORS).map(k=>`<option value="${k}">${k}</option>`).join("")}</select></div><div><label>Speed</label><select id="s"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option><option value="3">3×</option></select></div><div><label>Bg</label><input id="b" value="#faf8f3" style="width:90px"/></div><div><button onclick="gen()">Generate</button></div></div><div id="out"></div></div>
<div class="c"><div class="lb">Parameters</div><table><tr><th>Param</th><th>Required</th><th>Description</th></tr><tr><td><code>signature</code></td><td>Yes</td><td>Name to render</td></tr><tr><td><code>font</code></td><td>No</td><td>Font style (default: <code>elegant</code>)</td></tr><tr><td><code>color</code></td><td>No</td><td>Ink color (default: <code>navy</code>)</td></tr><tr><td><code>speed</code></td><td>No</td><td>0.25–5 (default: <code>1</code>)</td></tr><tr><td><code>bg</code></td><td>No</td><td>Background hex or <code>transparent</code> (default: <code>#faf8f3</code>)</td></tr><tr><td><code>format</code></td><td>No</td><td><code>svg</code> (animated) / <code>static</code></td></tr></table></div>
<div class="c"><div class="lb">Fonts</div><p style="line-height:2">${fr}</p></div>
<div class="c"><div class="lb">Colors</div><p style="line-height:2.2">${cr}</p></div>
<div class="c"><div class="lb">Font Cache</div><p style="line-height:2">${fs||"Loading..."}</p></div>
<div class="c"><div class="lb">Examples</div><pre>&lt;img src="http://localhost:${PORT}/?signature=Jane+Doe&amp;font=classic&amp;color=gold" /&gt;
&lt;img src="http://localhost:${PORT}/?signature=Jane+Doe&amp;font=modern&amp;bg=1a1a2e&amp;color=gold" /&gt;
&lt;img src="http://localhost:${PORT}/?signature=Jane+Doe&amp;bg=transparent&amp;color=crimson" /&gt;</pre></div>
<div style="text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,.05)"><p style="color:#4a4540;font-size:11px;letter-spacing:2px">CRAFTED WITH PRECISION</p></div></div>
<script>function gen(){const n=document.getElementById('n').value,f=document.getElementById('f').value,c=document.getElementById('c').value,s=document.getElementById('s').value,b=document.getElementById('b').value;const u='/?signature='+encodeURIComponent(n)+'&font='+f+'&color='+c+'&speed='+s+'&bg='+encodeURIComponent(b);document.getElementById('out').innerHTML='<div style="background:'+b+';border-radius:8px;padding:8px;margin:12px 0;display:inline-block;box-shadow:0 4px 16px rgba(0,0,0,.2)"><img src="'+u+'" style="max-width:100%;display:block;border-radius:4px"/></div><pre style="font-size:12px">'+location.origin+u+'</pre>';}</script></body></html>`;
}

// ─── HTTP Server ─────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
  try {
    const q = url.parse(req.url, true).query;
    if (!q.signature) { res.writeHead(200,{"Content-Type":"text/html;charset=utf-8"}); res.end(helpHTML()); return; }

    const text = String(q.signature).slice(0,50);
    const fkey = (q.font||"elegant").toLowerCase();
    const ckey = (q.color||"navy").toLowerCase();
    const spd  = Math.max(0.25, Math.min(5, parseFloat(q.speed)||1));
    const fmt  = (q.format||"svg").toLowerCase();
    const bgR  = q.bg||"";
    const bgC  = bgR==="transparent"?"transparent": /^#?[0-9a-fA-F]{3,6}$/.test(bgR)?(bgR.startsWith("#")?bgR:"#"+bgR) : "#faf8f3";

    const font = FONTS[fkey]||FONTS.elegant;
    const color= COLORS[ckey]||COLORS.navy;
    if (!fontCache[fkey]) await loadFont(fkey);

    const svg = fmt==="static" ? buildStaticSVG(text,font,fkey,color,bgC) : buildAnimatedSVG(text,font,fkey,color,spd,bgC);
    const buf = Buffer.from(svg,"utf-8");
    res.writeHead(200,{"Content-Type":"image/svg+xml;charset=utf-8","Content-Length":buf.length,"Cache-Control":"public,max-age=3600"});
    res.end(buf);
  } catch(e) {
    console.error("Error:",e);
    res.writeHead(500,{"Content-Type":"application/json"});
    res.end(JSON.stringify({error:e.message}));
  }
});

// ─── Start ───────────────────────────────────────────────────────
(async () => {
  await preloadFonts();
  server.listen(PORT, () => {
    console.log(`  ╔═══════════════════════════════════════════════╗
  ║     ✦  Signature API · Port ${PORT}  ✦         ║
  ╠═══════════════════════════════════════════════╣
  ║  http://127.0.0.1:${PORT}                      ║
  ║  Fonts embedded as base64 in SVGs            ║
  ║  → works in <img>, browsers, everywhere      ║
  ╚═══════════════════════════════════════════════╝\n`);
  });
})();