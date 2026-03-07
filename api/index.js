const https = require("https");
const fs = require("fs");
const os = require("os");
const path = require("path");
let Resvg;try{Resvg=require("@resvg/resvg-js").Resvg}catch(e){}

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

function get(u){return new Promise((ok,no)=>{const go=h=>{https.get(h,{headers:{"User-Agent":"Mozilla/5.0"}},r=>{if(r.statusCode>=300&&r.statusCode<400&&r.headers.location){go(r.headers.location);return}const c=[];r.on("data",d=>c.push(d));r.on("end",()=>ok({ok:r.statusCode===200,buf:Buffer.concat(c)}))}).on("error",no)};go(u)})}

async function loadFont(k){
  const f=FONTS[k]; if(!f||(cache[k]&&cache[k].m==="ok")) return;
  if(!cache[k]) cache[k]={css:`@import url('${f.url.replace(/&/g,"&amp;")}');`,m:"fb"};
  try{
    const css=await get(f.url); if(!css.ok) throw 0;
    // Use the last woff2 URL (Google Fonts lists Latin last, which covers most signatures)
    const all=[...css.buf.toString().matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^\)]+\.woff2)\)/g)];
    if(!all.length) throw 0;
    const w=await get(all[all.length-1][1]); if(!w.ok) throw 0;
    // Omit unicode-range so the embedded font applies to all characters
    cache[k]={css:`@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};src:url(data:font/woff2;base64,${w.buf.toString("base64")}) format('woff2');}`,m:"ok",fontBuf:w.buf};
  }catch(e){/* keep fallback */}
}

function fc(k){return(cache[k]&&cache[k].css)||`@import url('${(FONTS[k]||FONTS.elegant).url.replace(/&/g,"&amp;")}');`}

// ─── SVG Helpers ─────────────────────────────────────────────────
function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function bi(c){const bg=c||"#faf8f3",t=bg==="transparent",r=t?250:(parseInt(bg.slice(1,3),16)||250),g=t?248:(parseInt(bg.slice(3,5),16)||248),b=t?243:(parseInt(bg.slice(5,7),16)||243),l=(r*299+g*587+b*114)/1000;return{bg,t,l,gr:l>128?"rgba(0,0,0,.035)":"rgba(255,255,255,.06)",pn:l>128?"#3a3a3a":"#aaa"}}
function dots(W,H,f){let d="";for(let i=0;i<50;i++)d+=`<circle cx="${(i*137+29)%W}" cy="${(i*89+17)%H}" r=".7" fill="${f}"/>`;return d}
function fl(f,t,W,H){const e=f.size*.48*t.length,s=W/2-e/2,y=H/2+f.size*.38;let d=`M ${s} ${y}`;for(let x=0;x<=e;x+=4){const p=x/e;d+=` L ${(s+x).toFixed(1)} ${(y+Math.sin(p*Math.PI*2.5)*6*(1-p*.7)).toFixed(1)}`}return{d,l:(e*1.05).toFixed(0)}}

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
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<style>${fc(fk)}</style>
<defs><clipPath id="r"><rect x="0" y="0" width="0" height="${H}"><animate attributeName="width" from="0" to="${W}" dur="${dur}s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1" keyTimes="0;1" repeatCount="indefinite"/></rect></clipPath></defs>
${b.t?"":`<rect width="${W}" height="${H}" rx="4" fill="${b.bg}"/>`}${dt}
<g clip-path="url(#r)">${txtEl}</g>
<g opacity="1"><animateTransform attributeName="transform" type="translate" from="0 0" to="${W} 0" dur="${dur}s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1" keyTimes="0;1" repeatCount="indefinite"/><g transform="translate(0,${H/2-8}) rotate(22)"><rect x="-1.5" y="-28" width="3" height="26" rx="1" fill="${b.pn}"/><polygon points="0,1 -1.8,-5 1.8,-5" fill="${color}"/></g><animate attributeName="opacity" values="1;1;0" keyTimes="0;0.92;1" dur="${dur}s" fill="freeze" repeatCount="indefinite"/></g>
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
  const clipW=W*_easeStd(progress);
  const penX=W*_easeStd(progress);
  const penOp=progress<=0.92?1:Math.max(0,1-(progress-0.92)/0.08);
  let dashOff=parseFloat(f.l);
  if(progress>0.72&&progress<=0.95){const sp=(progress-0.72)/(0.95-0.72);dashOff=parseFloat(f.l)*(1-_easeFl(sp))}
  else if(progress>0.95)dashOff=0;
  const txtEl=`<text x="${W/2}" y="${H/2+font.size*.08+font.yo}" font-family="'${font.family}',cursive,serif" font-size="${font.size}" font-weight="${font.weight}" font-style="${font.style}" fill="${color}" text-anchor="middle" dominant-baseline="middle" letter-spacing="${font.ls}" transform="translate(0,0) ${sk}" transform-origin="${W/2} ${H/2}" ${font.sw?`stroke="${color}" stroke-width="${font.sw}"`:""}>${esc(text)}</text>`;
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

async function generateAPNG(text,font,fk,color,speed,bgC){
  if(!Resvg)throw new Error("APNG requires @resvg/resvg-js");
  const dur=2.4/speed;
  const fps=20,frameCount=Math.min(60,Math.max(12,Math.ceil(dur*fps)));
  const delay=Math.round(dur*1000/frameCount);
  const holdFrames=5,holdDelay=200;
  const fontOpts={loadSystemFonts:false,defaultFontFamily:"serif"};
  if(cache[fk]&&cache[fk].fontBuf){
    const tmp=path.join(os.tmpdir(),"sig_"+fk+".woff2");
    fs.writeFileSync(tmp,cache[fk].fontBuf);
    fontOpts.fontFiles=[tmp];
  }
  const pngs=[],dly=[];
  for(let i=0;i<frameCount+holdFrames;i++){
    const progress=i<frameCount?i/(frameCount-1):1;
    const svg=buildStaticFrame(text,font,fk,color,bgC,progress);
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
  const bgR  = q.bg||"";
  const bgC  = bgR==="transparent"?"transparent":/^#?[0-9a-fA-F]{3,6}$/.test(bgR)?(bgR[0]==="#"?bgR:"#"+bgR):"#faf8f3";

  const font = FONTS[fk]||FONTS.elegant;
  const color= COLORS[ck]||COLORS.navy;
  if(!cache[fk]||cache[fk].m==="fb") await loadFont(fk);

  if(fmt==="apng"){
    try{
      const apng=await generateAPNG(text,font,fk,color,spd,bgC);
      res.setHeader("Content-Type","image/apng");
      res.setHeader("Cache-Control","public,s-maxage=3600,stale-while-revalidate=86400");
      res.status(200).send(apng);
    }catch(e){res.status(500).json({error:"APNG generation failed",detail:e.message})}
    return;
  }

  const svg = buildSVG(text,font,fk,color,spd,bgC,fmt!=="static");
  res.setHeader("Content-Type","image/svg+xml;charset=utf-8");
  res.setHeader("Cache-Control","public,s-maxage=3600,stale-while-revalidate=86400");
  res.status(200).send(svg);
};
