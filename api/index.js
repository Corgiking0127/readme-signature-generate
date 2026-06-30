const https = require("https");
const fs = require("fs");
const os = require("os");
const path = require("path");
let Resvg;try{Resvg=require("@resvg/resvg-js").Resvg}catch(e){}
let opentype;try{opentype=require("opentype.js")}catch(e){}

// ─── Font & Color Data ───────────────────────────────────────────
const FONTS = {
  elegant:     { name:"Elegant Cursive",  family:"Dancing Script",      weight:"700",    style:"normal", size:62, skewX:0, ls:1, sw:0, yo:0, url:"https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" },
  classic:     { name:"Classic Flourish",  family:"Great Vibes",         weight:"normal", style:"normal", size:62, skewX:0, ls:2, sw:0, yo:0, url:"https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" },
  modern:      { name:"French Elegance",   family:"Parisienne",          weight:"normal", style:"normal", size:62, skewX:0, ls:2, sw:0, yo:0, url:"https://fonts.googleapis.com/css2?family=Parisienne&display=swap" },
  bold:        { name:"Smooth Flow",       family:"Sacramento",          weight:"normal", style:"normal", size:68, skewX:0, ls:1, sw:0, yo:0, url:"https://fonts.googleapis.com/css2?family=Sacramento&display=swap" },
  refined:     { name:"Formal Script",     family:"Allura",              weight:"normal", style:"normal", size:64, skewX:0, ls:2, sw:0, yo:0, url:"https://fonts.googleapis.com/css2?family=Allura&display=swap" },
  light:       { name:"Brush Stroke",      family:"Alex Brush",          weight:"normal", style:"normal", size:64, skewX:0, ls:1, sw:0, yo:0, url:"https://fonts.googleapis.com/css2?family=Alex+Brush&display=swap" },
  serif:       { name:"Victorian",         family:"Mrs Saint Delafield", weight:"normal", style:"normal", size:64, skewX:0, ls:2, sw:0, yo:0, url:"https://fonts.googleapis.com/css2?family=Mrs+Saint+Delafield&display=swap" },
  baskerville: { name:"Handwritten",       family:"Zeyada",              weight:"normal", style:"normal", size:64, skewX:0, ls:1, sw:0, yo:0, url:"https://fonts.googleapis.com/css2?family=Zeyada&display=swap" },
};
const COLORS = { navy:"#1a1a4e", black:"#111111", blue:"#1e3a8a", gold:"#8B6914", crimson:"#8B0000", forest:"#1a4a2e" };

// ─── Font Cache (survives across warm invocations) ───────────────
const cache = {};

// Resolve bundled fonts directory (fonts/ at project root)
const FONTS_DIR=(()=>{const dirs=[path.join(__dirname,"..","fonts"),path.join(process.cwd(),"fonts")];for(const d of dirs)if(fs.existsSync(d))return d;return null})();

const CHROME_UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
function get(u,ua){return new Promise((ok,no)=>{const go=h=>{https.get(h,{headers:{"User-Agent":ua||CHROME_UA}},r=>{if(r.statusCode>=300&&r.statusCode<400&&r.headers.location){go(r.headers.location);return}const c=[];r.on("data",d=>c.push(d));r.on("end",()=>ok({ok:r.statusCode===200,buf:Buffer.concat(c)}))}).on("error",no)};go(u)})}

function _fontFaceCSS(f,buf,fmt){
  const mime=fmt==="woff2"?"font/woff2":"font/truetype";
  const format=fmt==="woff2"?"woff2":"truetype";
  return `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};src:url(data:${mime};base64,${buf.toString("base64")}) format('${format}');}`
}

async function loadFont(k){
  const f=FONTS[k]; if(!f||(cache[k]&&cache[k].m==="ok")) return;
  if(!cache[k]) cache[k]={css:`@import url('${f.url.replace(/&/g,"&amp;")}');`,m:"fb"};
  // ── Try bundled local font files first (most reliable) ──
  if(FONTS_DIR){
    const w2=path.join(FONTS_DIR,k+".woff2"),tt=path.join(FONTS_DIR,k+".ttf");
    const hasW2=fs.existsSync(w2),hasTTF=fs.existsSync(tt);
    if(hasW2||hasTTF){
      const embBuf=hasW2?fs.readFileSync(w2):fs.readFileSync(tt);
      const embFmt=hasW2?"woff2":"ttf";
      cache[k]={css:_fontFaceCSS(f,embBuf,embFmt),m:"ok",fontBuf:embBuf};
      if(hasTTF) cache[k].ttfBuf=fs.readFileSync(tt);
      return;
    }
  }
  // ── Fallback: fetch from Google Fonts at runtime ──
  try{
    const css=await get(f.url); if(!css.ok) throw 0;
    const all=[...css.buf.toString().matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^\)]+\.woff2)\)/g)];
    if(!all.length) throw 0;
    const w=await get(all[all.length-1][1]); if(!w.ok) throw 0;
    cache[k]={css:_fontFaceCSS(f,w.buf,"woff2"),m:"ok",fontBuf:w.buf};
    // Also fetch TTF for Resvg rendering (fontdb doesn't support woff2)
    try{
      const ttfCss=await get(f.url,"Mozilla/4.0"); if(!ttfCss.ok) throw 0;
      const ttfAll=[...ttfCss.buf.toString().matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^\)]+\.ttf)\)/g)];
      if(ttfAll.length){const t=await get(ttfAll[ttfAll.length-1][1]); if(t.ok) cache[k].ttfBuf=t.buf}
    }catch(e){/* TTF fetch failed, Resvg will use system fallback */}
  }catch(e){/* keep fallback */}
}

function fc(k){return(cache[k]&&cache[k].css)||`@import url('${(FONTS[k]||FONTS.elegant).url.replace(/&/g,"&amp;")}');`}

// ─── SVG Helpers ─────────────────────────────────────────────────
function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function bi(c){const bg=c||"#faf8f3",t=bg==="transparent",r=t?250:(parseInt(bg.slice(1,3),16)||250),g=t?248:(parseInt(bg.slice(3,5),16)||248),b=t?243:(parseInt(bg.slice(5,7),16)||243),l=(r*299+g*587+b*114)/1000;return{bg,t,l,gr:l>128?"rgba(0,0,0,.035)":"rgba(255,255,255,.06)",pn:l>128?"#3a3a3a":"#aaa"}}
function dots(W,H,f){let d="";for(let i=0;i<50;i++)d+=`<circle cx="${(i*137+29)%W}" cy="${(i*89+17)%H}" r=".7" fill="${f}"/>`;return d}
function fl(f,t,W,H){const e=f.size*.48*t.length,s=W/2-e/2,y=H/2+f.size*.38;let d=`M ${s} ${y}`;for(let x=0;x<=e;x+=4){const p=x/e;d+=` L ${(s+x).toFixed(1)} ${(y+Math.sin(p*Math.PI*2.5)*6*(1-p*.7)).toFixed(1)}`}return{d,l:(e*1.05).toFixed(0)}}

// ─── Handwriting (per-glyph stroke) helpers ──────────────────────
const _otCache={};
// Parse the bundled TTF once per font (opentype.js cannot read woff2)
function getOTFont(fk){
  if(_otCache[fk]!==undefined) return _otCache[fk];
  let font=null;
  try{
    const b=cache[fk]&&cache[fk].ttfBuf;
    if(opentype&&b){const ab=b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);font=opentype.parse(ab)}
  }catch(e){font=null}
  _otCache[fk]=font;return font;
}
// Flatten an opentype command list into a polyline with cumulative length.
function flattenCmds(cmds){
  const pts=[];let cx=0,cy=0,sx=0,sy=0,len=0;
  const push=(x,y)=>{if(pts.length)len+=Math.hypot(x-cx,y-cy);pts.push({x,y,l:len});cx=x;cy=y};
  for(const c of cmds){
    if(c.type==="M"){if(pts.length)len+=Math.hypot(c.x-cx,c.y-cy);pts.push({x:c.x,y:c.y,l:len});cx=c.x;cy=c.y;sx=c.x;sy=c.y}
    else if(c.type==="L"){push(c.x,c.y)}
    else if(c.type==="Q"){const x0=cx,y0=cy,n=8;for(let i=1;i<=n;i++){const t=i/n,m=1-t;push(m*m*x0+2*m*t*c.x1+t*t*c.x,m*m*y0+2*m*t*c.y1+t*t*c.y)}}
    else if(c.type==="C"){const x0=cx,y0=cy,n=10;for(let i=1;i<=n;i++){const t=i/n,m=1-t;push(m*m*m*x0+3*m*m*t*c.x1+3*m*t*t*c.x2+t*t*t*c.x,m*m*m*y0+3*m*m*t*c.y1+3*m*t*t*c.y2+t*t*t*c.y)}}
    else if(c.type==="Z"){push(sx,sy)}
  }
  return{len:len||1,pts};
}
function ptAtLen(pts,target){
  if(target<=0)return pts[0];
  for(let i=1;i<pts.length;i++){if(pts[i].l>=target){const a=pts[i-1],b=pts[i],t=(target-a.l)/((b.l-a.l)||1);return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}}}
  return pts[pts.length-1];
}
// Lay out glyphs per-character via charToGlyph (avoids opentype's GSUB shaping,
// which throws on some fonts) and return per-glyph outline paths centred in 600x200.
function _layout(ot,text,fs){
  const scale=fs/ot.unitsPerEm;let x=0,prev=null;const out=[];
  for(const ch of text){
    const g=ot.charToGlyph(ch);
    if(prev){try{x+=ot.getKerningValue(prev,g)*scale}catch(e){}}
    out.push({g,x});
    x+=(g.advanceWidth||0)*scale;prev=g;
  }
  return{glyphs:out,width:x};
}
function glyphData(text,font,fk){
  const ot=getOTFont(fk);if(!ot)return null;
  try{
    const W=600,H=200,maxW=W-60;
    let fs=font.size;
    const w0=_layout(ot,text,fs).width;
    if(w0>maxW)fs=fs*maxW/w0;
    const laid=_layout(ot,text,fs).glyphs;
    let x1=Infinity,y1=Infinity,x2=-Infinity,y2=-Infinity;const glyphs=[];
    for(const{g,x}of laid){
      const p=g.getPath(x,0,fs);
      if(!p.commands.length)continue;
      const bb=p.getBoundingBox();
      if(!isFinite(bb.x1))continue;
      x1=Math.min(x1,bb.x1);y1=Math.min(y1,bb.y1);x2=Math.max(x2,bb.x2);y2=Math.max(y2,bb.y2);
      const f=flattenCmds(p.commands);
      glyphs.push({d:p.toPathData(2),len:f.len,pts:f.pts});
    }
    if(!glyphs.length||!isFinite(x1))return null;
    return{glyphs,dx:W/2-(x1+x2)/2,dy:H/2-(y1+y2)/2,W,H,fs};
  }catch(e){return null}
}
// Shared timeline: per-letter draw slot + trailing hold.
function hwTiming(n,speed){
  const per=.35,hold=.8,draw=n*per,total=draw+hold;
  return{totalDur:total/speed,drawFrac:draw/total,slot:(draw/total)/n};
}
const _STROKE="1.6";
function buildHandwriteSVG(text,font,fk,color,speed,bgC){
  const gd=glyphData(text,font,fk);
  if(!gd)return buildSVG(text,font,fk,color,speed,bgC,true);
  const{glyphs,dx,dy,W,H}=gd,n=glyphs.length,b=bi(bgC),dt=b.t?"":dots(W,H,b.gr);
  const{totalDur,drawFrac,slot}=hwTiming(n,speed),dur=totalDur.toFixed(2);
  let totLen=0;for(const g of glyphs)totLen+=g.len;
  let paths="",combined="",cum=0;const penKT=["0"],penKP=["0"];
  for(let i=0;i<n;i++){
    const g=glyphs[i],start=i*slot,end=(i+1)*slot,fillStart=Math.max(start,end-slot*.4),len=g.len.toFixed(1);
    paths+=`<path d="${g.d}" fill="${color}" fill-opacity="0" stroke="${color}" stroke-width="${_STROKE}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${len}" stroke-dashoffset="${len}"><animate attributeName="stroke-dashoffset" values="${len};${len};0;0" keyTimes="0;${start.toFixed(4)};${end.toFixed(4)};1" dur="${dur}s" calcMode="spline" keySplines="0 0 1 1;0.4 0 0.2 1;0 0 1 1" fill="freeze" repeatCount="indefinite"/><animate attributeName="fill-opacity" values="0;0;1;1" keyTimes="0;${fillStart.toFixed(4)};${end.toFixed(4)};1" dur="${dur}s" fill="freeze" repeatCount="indefinite"/></path>`;
    combined+=g.d;cum+=g.len;penKT.push(end.toFixed(4));penKP.push((cum/totLen).toFixed(4));
  }
  penKT.push("1");penKP.push("1");
  const pen=`<g opacity="1"><g transform="rotate(22)"><rect x="-1.5" y="-28" width="3" height="26" rx="1" fill="${b.pn}"/><polygon points="0,1 -1.8,-5 1.8,-5" fill="${color}"/></g><animateMotion dur="${dur}s" repeatCount="indefinite" fill="freeze" calcMode="linear" keyTimes="${penKT.join(";")}" keyPoints="${penKP.join(";")}"><mpath xlink:href="#hwpath"/></animateMotion><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;${Math.max(0,drawFrac-.01).toFixed(4)};${Math.min(1,drawFrac+.03).toFixed(4)};1" dur="${dur}s" fill="freeze" repeatCount="indefinite"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
${b.t?"":`<rect width="${W}" height="${H}" rx="4" fill="${b.bg}"/>`}${dt}
<defs><path id="hwpath" d="${combined}"/></defs>
<g transform="translate(${dx.toFixed(2)},${dy.toFixed(2)})">
${paths}
${pen}
</g>
</svg>`;
}
// Single static frame of the handwriting animation at progress p (for APNG / static export).
function buildHandwriteFrame(gd,color,bgC,p,speed){
  const{glyphs,dx,dy,W,H}=gd,n=glyphs.length,b=bi(bgC),dt=b.t?"":dots(W,H,b.gr);
  const{drawFrac,slot}=hwTiming(n,speed);
  let paths="",penX=null,penY=null;
  for(let i=0;i<n;i++){
    const g=glyphs[i],start=i*slot,end=(i+1)*slot,fillStart=Math.max(start,end-slot*.4),len=g.len;
    let off=len,fillOp=0;
    if(p>=end)off=0;else if(p>start)off=len*(1-_easeFl((p-start)/(end-start)));
    if(p>=end)fillOp=1;else if(p>fillStart)fillOp=(p-fillStart)/((end-fillStart)||1);
    paths+=`<path d="${g.d}" fill="${color}" fill-opacity="${fillOp.toFixed(2)}" stroke="${color}" stroke-width="${_STROKE}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${len.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>`;
    if(p<drawFrac&&p>=start&&p<end){const pt=ptAtLen(g.pts,((p-start)/(end-start))*len);penX=pt.x;penY=pt.y}
  }
  const pen=(p<drawFrac&&penX!==null)?`<g transform="translate(${penX.toFixed(1)},${penY.toFixed(1)})"><g transform="rotate(22)"><rect x="-1.5" y="-28" width="3" height="26" rx="1" fill="${b.pn}"/><polygon points="0,1 -1.8,-5 1.8,-5" fill="${color}"/></g></g>`:"";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
${b.t?"":`<rect width="${W}" height="${H}" rx="4" fill="${b.bg}"/>`}${dt}
<g transform="translate(${dx.toFixed(2)},${dy.toFixed(2)})">${paths}${pen}</g>
</svg>`;
}

function buildSVG(text,font,fk,color,speed,bgC,animated){
  const W=600,H=200,b=bi(bgC),dur=(2.4/speed).toFixed(2);
  const sk=font.skewX?`skewX(${font.skewX})`:"",f=fl(font,text,W,H),dt=b.t?"":dots(W,H,b.gr);
  const txtEl=`<text x="${W/2}" y="${H/2+font.size*.08+font.yo}" font-family="'${font.family}',cursive,serif" font-size="${font.size}" font-weight="${font.weight}" font-style="${font.style}" fill="${color}" text-anchor="middle" dominant-baseline="middle" letter-spacing="${font.ls}" transform="translate(0,0) ${sk}" transform-origin="${W/2} ${H/2}" ${font.sw?`stroke="${color}" stroke-width="${font.sw}"`:""}>${esc(text)}</text>`;
  if(!animated) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<style>${fc(fk)}</style>
${b.t?"":`<rect width="${W}" height="${H}" rx="4" fill="${b.bg}"/>`}${dt}
${txtEl}
<path d="${f.d}" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round" opacity=".45"/>
</svg>`;
  const strokeLen=Math.round(text.length*font.size*3.5),textW=font.size*.48*text.length,txS=(W/2-textW/2).toFixed(1),txE=(W/2+textW/2).toFixed(1);
  const animTxt=`<text x="${W/2}" y="${H/2+font.size*.08+font.yo}" font-family="'${font.family}',cursive,serif" font-size="${font.size}" font-weight="${font.weight}" font-style="${font.style}" fill="${color}" fill-opacity="0" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${strokeLen}" stroke-dashoffset="${strokeLen}" text-anchor="middle" dominant-baseline="middle" letter-spacing="${font.ls}" transform="translate(0,0) ${sk}" transform-origin="${W/2} ${H/2}">${esc(text)}<animate attributeName="stroke-dashoffset" values="${strokeLen};0;0" keyTimes="0;0.8;1" dur="${dur}s" calcMode="spline" keySplines="0.4 0 0.2 1;0 0 1 1" fill="freeze" repeatCount="indefinite"/><animate attributeName="fill-opacity" values="0;0;1;1" keyTimes="0;0.65;0.85;1" dur="${dur}s" fill="freeze" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values="1;1;0;0" keyTimes="0;0.75;0.95;1" dur="${dur}s" fill="freeze" repeatCount="indefinite"/></text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<style>${fc(fk)}</style>
<defs><clipPath id="r"><rect x="0" y="0" width="${txS}" height="${H}"><animate attributeName="width" values="${txS};${txE};${W}" keyTimes="0;0.8;1" dur="${dur}s" calcMode="spline" keySplines="0.4 0 0.2 1;0 0 1 1" fill="freeze" repeatCount="indefinite"/></rect></clipPath></defs>
${b.t?"":`<rect width="${W}" height="${H}" rx="4" fill="${b.bg}"/>`}${dt}
<g clip-path="url(#r)">${animTxt}</g>
<g opacity="1"><animateTransform attributeName="transform" type="translate" values="${txS} 0;${txE} 0;${txE} 0" keyTimes="0;0.8;1" dur="${dur}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1;0 0 1 1" repeatCount="indefinite"/><g transform="translate(0,${H/2-8}) rotate(22)"><rect x="-1.5" y="-28" width="3" height="26" rx="1" fill="${b.pn}"/><polygon points="0,1 -1.8,-5 1.8,-5" fill="${color}"/></g><animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1" dur="${dur}s" fill="freeze" repeatCount="indefinite"/></g>
<path d="${f.d}" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round" opacity=".45" stroke-dasharray="${f.l}" stroke-dashoffset="${f.l}"><animate attributeName="stroke-dashoffset" values="${f.l};${f.l};0;0" keyTimes="0;0.72;0.95;1" dur="${dur}s" calcMode="spline" keySplines="0 0 1 1;0.4 0 0.2 1;0 0 1 1" fill="freeze" repeatCount="indefinite"/></path>
</svg>`;
}

// ─── APNG Support ────────────────────────────────────────────────
const _crcT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c}return t})();
function _crc32(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=_crcT[(c^b[i])&0xFF]^(c>>>8);return(c^0xFFFFFFFF)>>>0}

function _bez(x1,y1,x2,y2){return t=>{if(t<=0)return 0;if(t>=1)return 1;let b=t;for(let i=0;i<8;i++){const x=3*(1-b)*(1-b)*b*x1+3*(1-b)*b*b*x2+b*b*b;const d=3*(1-b)*(1-b)*x1+6*(1-b)*b*(x2-x1)+3*b*b*(1-x2);if(Math.abs(x-t)<1e-6)break;if(Math.abs(d)>1e-6)b-=(x-t)/d}return 3*(1-b)*(1-b)*b*y1+3*(1-b)*b*b*y2+b*b*b}}
const _easeStd=_bez(0.25,0.1,0.25,1);
const _easeFl=_bez(0.4,0,0.2,1);

function buildStaticFrame(text,font,fk,color,bgC,progress){
  const W=600,H=200,b=bi(bgC);
  const sk=font.skewX?`skewX(${font.skewX})`:"";
  const f=fl(font,text,W,H);
  const dt=b.t?"":dots(W,H,b.gr);
  const strokeLen=Math.round(text.length*font.size*3.5);
  const textW=font.size*.48*text.length,txS=W/2-textW/2,txE=W/2+textW/2;
  let sDashOff=strokeLen;
  if(progress<=0.8){sDashOff=strokeLen*(1-_easeFl(progress/0.8))}else{sDashOff=0}
  let fillOp=0;
  if(progress>0.65&&progress<=0.85)fillOp=(progress-0.65)/0.2;
  else if(progress>0.85)fillOp=1;
  let sOp=1;
  if(progress>0.75&&progress<=0.95)sOp=1-(progress-0.75)/0.2;
  else if(progress>0.95)sOp=0;
  const penX=progress<=0.8?txS+(txE-txS)*_easeFl(progress/0.8):txE;
  const penOp=progress<=0.85?1:Math.max(0,1-(progress-0.85)/0.15);
  let dashOff=parseFloat(f.l);
  if(progress>0.72&&progress<=0.95){const sp=(progress-0.72)/(0.95-0.72);dashOff=parseFloat(f.l)*(1-_easeFl(sp))}
  else if(progress>0.95)dashOff=0;
  let clipW;
  if(progress<=0.8){clipW=txS+(txE-txS)*_easeFl(progress/0.8)}else{clipW=txE+(W-txE)*((progress-0.8)/0.2)}
  const txtEl=`<text x="${W/2}" y="${H/2+font.size*.08+font.yo}" font-family="'${font.family}',cursive,serif" font-size="${font.size}" font-weight="${font.weight}" font-style="${font.style}" fill="${color}" fill-opacity="${fillOp.toFixed(2)}" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="${sOp.toFixed(2)}" stroke-dasharray="${strokeLen}" stroke-dashoffset="${sDashOff.toFixed(0)}" text-anchor="middle" dominant-baseline="middle" letter-spacing="${font.ls}" transform="translate(0,0) ${sk}" transform-origin="${W/2} ${H/2}">${esc(text)}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<style>${fc(fk)}</style>
<defs><clipPath id="r"><rect x="0" y="0" width="${clipW.toFixed(1)}" height="${H}"/></clipPath></defs>
${b.t?"":`<rect width="${W}" height="${H}" rx="4" fill="${b.bg}"/>`}${dt}
<g clip-path="url(#r)">${txtEl}</g>
<g opacity="${penOp.toFixed(2)}" transform="translate(${penX.toFixed(1)},0)"><g transform="translate(0,${H/2-8}) rotate(22)"><rect x="-1.5" y="-28" width="3" height="26" rx="1" fill="${b.pn}"/><polygon points="0,1 -1.8,-5 1.8,-5" fill="${color}"/></g></g>
<path d="${f.d}" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round" opacity=".45" stroke-dasharray="${f.l}" stroke-dashoffset="${dashOff.toFixed(1)}"/>
</svg>`;
}

function _parsePNG(buf){const chunks=[];let pos=8;while(pos<buf.length){const len=buf.readUInt32BE(pos);const type=buf.slice(pos+4,pos+8).toString("ascii");const data=buf.slice(pos+8,pos+8+len);chunks.push({type,data,raw:buf.slice(pos,pos+12+len)});pos+=12+len;if(type==="IEND")break}return chunks}
function _mkChunk(type,data){const t=Buffer.from(type,"ascii");const l=Buffer.alloc(4);l.writeUInt32BE(data.length,0);const ci=Buffer.concat([t,data]);const c=Buffer.alloc(4);c.writeUInt32BE(_crc32(ci),0);return Buffer.concat([l,t,data,c])}

function encodeAPNG(pngBuffers,delays){
  const parts=[Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A])];
  const fc0=_parsePNG(pngBuffers[0]);
  const ihdr=fc0.find(c=>c.type==="IHDR");
  parts.push(ihdr.raw);
  const actl=Buffer.alloc(8);actl.writeUInt32BE(pngBuffers.length,0);actl.writeUInt32BE(0,4);
  parts.push(_mkChunk("acTL",actl));
  let seq=0;
  for(let i=0;i<pngBuffers.length;i++){
    const chunks=i===0?fc0:_parsePNG(pngBuffers[i]);
    const fctl=Buffer.alloc(26);
    fctl.writeUInt32BE(seq++,0);
    fctl.writeUInt32BE(ihdr.data.readUInt32BE(0),4);
    fctl.writeUInt32BE(ihdr.data.readUInt32BE(4),8);
    fctl.writeUInt32BE(0,12);fctl.writeUInt32BE(0,16);
    fctl.writeUInt16BE(delays[i],20);fctl.writeUInt16BE(1000,22);
    fctl.writeUInt8(0,24);fctl.writeUInt8(0,25);
    parts.push(_mkChunk("fcTL",fctl));
    const idats=chunks.filter(c=>c.type==="IDAT");
    if(i===0){for(const d of idats)parts.push(d.raw)}
    else{for(const d of idats){const fd=Buffer.alloc(4+d.data.length);fd.writeUInt32BE(seq++,0);d.data.copy(fd,4);parts.push(_mkChunk("fdAT",fd))}}
  }
  parts.push(_mkChunk("IEND",Buffer.alloc(0)));
  return Buffer.concat(parts);
}

async function generateAPNG(text,font,fk,color,speed,bgC,anim){
  if(!Resvg)throw new Error("APNG requires @resvg/resvg-js");
  // Handwrite mode renders self-contained vector paths (no font needed by resvg)
  const gd=anim==="write"?glyphData(text,font,fk):null;
  const dur=gd?hwTiming(gd.glyphs.length,speed).totalDur:2.4/speed;
  const fps=30,frameCount=Math.min(120,Math.max(12,Math.ceil(dur*fps)));
  const delay=Math.round(dur*1000/frameCount);
  // Hold final frame for 1s (5×200ms) before looping
  const holdFrames=5,holdDelay=200;
  const fontOpts={loadSystemFonts:true,defaultFontFamily:font.family};
  if(cache[fk]){
    // Prefer TTF (fontdb supports it natively); fall back to woff2
    const fontData=cache[fk].ttfBuf||cache[fk].fontBuf;
    if(fontData){
      const ext=cache[fk].ttfBuf?".ttf":".woff2";
      const tmp=path.join(os.tmpdir(),"sig_"+fk+ext);
      fs.writeFileSync(tmp,fontData);
      fontOpts.fontFiles=[tmp];
    }
  }
  const pngs=[],dly=[];
  for(let i=0;i<frameCount+holdFrames;i++){
    const progress=i<frameCount?i/(frameCount-1):1;
    const svg=gd?buildHandwriteFrame(gd,color,bgC,progress,speed):buildStaticFrame(text,font,fk,color,bgC,progress);
    const r=new Resvg(svg,{fitTo:{mode:"width",value:600},font:fontOpts});
    pngs.push(r.render().asPng());
    dly.push(i<frameCount?delay:holdDelay);
  }
  return encodeAPNG(pngs,dly);
}
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const q = req.query || {};
  if (!q.signature) { res.redirect("/"); return; }

  const text = String(q.signature).slice(0,50);
  const fk   = (q.font||"elegant").toLowerCase();
  const ck   = (q.color||"navy").toLowerCase();
  const spd  = Math.max(.25,Math.min(5,parseFloat(q.speed)||1));
  const fmt  = (q.format||"svg").toLowerCase();
  // anim: "print" (legacy left-to-right reveal, default) | "write" (stroke-by-stroke handwriting)
  const anim = (q.anim||"print").toLowerCase()==="write"?"write":"print";
  const bgR  = q.bg||"";
  const bgC  = bgR==="transparent"?"transparent":/^#?[0-9a-fA-F]{3,6}$/.test(bgR)?(bgR[0]==="#"?bgR:"#"+bgR):"#faf8f3";

  const font = FONTS[fk]||FONTS.elegant;
  const color= COLORS[ck]||COLORS.navy;
  if(!cache[fk]||cache[fk].m==="fb") await loadFont(fk);

  if(fmt==="apng"){
    try{
      const apng=await generateAPNG(text,font,fk,color,spd,bgC,anim);
      res.setHeader("Content-Type","image/png");
      res.setHeader("Cache-Control","public,s-maxage=3600,stale-while-revalidate=86400");
      res.status(200).send(apng);
    }catch(e){res.status(500).json({error:"APNG generation failed",detail:e.message})}
    return;
  }

  let svg;
  if(anim==="write"){
    const gd=fmt==="static"?glyphData(text,font,fk):null;
    svg=fmt==="static"?(gd?buildHandwriteFrame(gd,color,bgC,1,spd):buildSVG(text,font,fk,color,spd,bgC,false))
                      :buildHandwriteSVG(text,font,fk,color,spd,bgC);
  }else{
    svg=buildSVG(text,font,fk,color,spd,bgC,fmt!=="static");
  }
  res.setHeader("Content-Type","image/svg+xml;charset=utf-8");
  res.setHeader("Cache-Control","public,s-maxage=3600,stale-while-revalidate=86400");
  res.status(200).send(svg);
};
