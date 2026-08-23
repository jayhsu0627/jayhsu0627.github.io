// Poster export for the r/place timelapse: lossless PNG and a hand-built PDF.
// No external libraries — the PDF is assembled byte-wise with a FlateDecode RGB image.

const PAGES = {                       // points (1/72")
  a4: [595.276, 841.890],
  a3: [841.890, 1190.551],
  a2: [1190.551, 1683.780],
  letter: [612, 792]
};
export const MAX_DIM = 8192;          // stay well inside browser canvas limits

/** Largest integer scale whose output still fits MAX_DIM. */
export function maxScale(rw, rh){
  const s = Math.floor(MAX_DIM / Math.max(rw, rh));
  return Math.max(1, Math.min(16, s));
}

/**
 * Render a canvas region to a bitmap at `scale`, nearest-neighbour so pixel art stays sharp.
 * palRGB is a 256*3 byte table; index 255 (unpainted) should already be white.
 */
export function makeBitmap({ idx, palRGB, W, x0, y0, rw, rh, scale, caption }){
  const cw = rw * scale, ch = rh * scale;
  const capH = caption ? Math.max(30, Math.round(ch * 0.04)) : 0;

  const src = document.createElement('canvas');
  src.width = rw; src.height = rh;
  const sctx = src.getContext('2d');
  const img = sctx.createImageData(rw, rh);
  const d = img.data;
  for (let y = 0; y < rh; y++){
    const row = (y0 + y) * W + x0;
    for (let x = 0; x < rw; x++){
      const p = idx[row + x] * 3, o = (y * rw + x) * 4;
      d[o] = palRGB[p]; d[o+1] = palRGB[p+1]; d[o+2] = palRGB[p+2]; d[o+3] = 255;
    }
  }
  sctx.putImageData(img, 0, 0);

  const out = document.createElement('canvas');
  out.width = cw; out.height = ch + capH;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingEnabled = false;                 // keep hard pixel edges
  ctx.drawImage(src, 0, 0, rw, rh, 0, 0, cw, ch);

  if (caption){
    const fs = Math.round(capH * 0.42);
    ctx.fillStyle = '#111114';
    ctx.font = `${fs}px ui-monospace, Menlo, monospace`;
    ctx.textBaseline = 'middle';
    ctx.fillText(caption, Math.round(fs * 0.6), ch + capH / 2);
    ctx.fillStyle = '#8a8a99';
    const right = 'r/place 2022';
    ctx.fillText(right, cw - ctx.measureText(right).width - Math.round(fs * 0.6), ch + capH / 2);
  }
  return out;
}

export function downloadBlob(blob, name){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function toPNG(cnv){
  return new Promise(res => cnv.toBlob(res, 'image/png'));
}

// ---------------------------------------------------------------- PDF
const s2b = str => { const a = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) a[i] = str.charCodeAt(i) & 0xFF; return a; };

async function deflate(bytes){
  if (typeof CompressionStream === 'undefined') return null;
  const st = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(st).arrayBuffer());
}

/**
 * Wrap a bitmap in a PDF. The image is embedded at native resolution with
 * /Interpolate false, so viewers show crisp pixels however large the page is.
 */
export async function toPDF(cnv, { page = 'exact', dpi = 300, title = '' } = {}){
  const w = cnv.width, h = cnv.height;
  const px = cnv.getContext('2d').getImageData(0, 0, w, h).data;
  const rgb = new Uint8Array(w * h * 3);
  for (let i = 0, o = 0; i < px.length; i += 4){
    rgb[o++] = px[i]; rgb[o++] = px[i+1]; rgb[o++] = px[i+2];
  }
  const packed = await deflate(rgb);
  const data = packed || rgb;
  const filter = packed ? '/Filter/FlateDecode' : '';

  // page box
  let pw, ph;
  if (page === 'exact'){ pw = w * 72 / dpi; ph = h * 72 / dpi; }
  else {
    const [a, b] = PAGES[page] || PAGES.a3;
    [pw, ph] = (w >= h) ? [b, a] : [a, b];           // orient to match the artwork
  }
  const margin = page === 'exact' ? 0 : 24;
  const sc = Math.min((pw - 2*margin) / w, (ph - 2*margin) / h);
  const dw = w * sc, dh = h * sc;
  const dx = (pw - dw) / 2, dy = (ph - dh) / 2;

  const content = `q\n${dw.toFixed(3)} 0 0 ${dh.toFixed(3)} ${dx.toFixed(3)} ${dy.toFixed(3)} cm\n/Im0 Do\nQ\n`;
  const chunks = []; let len = 0; const off = {};
  const put = x => { const b = typeof x === 'string' ? s2b(x) : x; chunks.push(b); len += b.length; };
  const obj = (n, body) => { off[n] = len; put(`${n} 0 obj\n${body}\nendobj\n`); };

  put('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  obj(1, '<</Type/Catalog/Pages 2 0 R>>');
  obj(2, '<</Type/Pages/Kids[3 0 R]/Count 1>>');
  obj(3, `<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${pw.toFixed(3)} ${ph.toFixed(3)}]`
       + `/Resources<</XObject<</Im0 4 0 R>>>>/Contents 5 0 R>>`);
  off[4] = len;
  put(`4 0 obj\n<</Type/XObject/Subtype/Image/Width ${w}/Height ${h}`
    + `/ColorSpace/DeviceRGB/BitsPerComponent 8/Interpolate false`
    + `${filter}/Length ${data.length}>>\nstream\n`);
  put(data);
  put('\nendstream\nendobj\n');
  obj(5, `<</Length ${content.length}>>\nstream\n${content}endstream`);
  obj(6, `<</Type/Info/Title(${title.replace(/[()\\]/g, '')})/Creator(r/place timelapse)>>`);

  const xref = len;
  let x = `xref\n0 7\n0000000000 65535 f \n`;
  for (let i = 1; i <= 6; i++) x += String(off[i]).padStart(10, '0') + ' 00000 n \n';
  put(x);
  put(`trailer\n<</Size 7/Root 1 0 R/Info 6 0 R>>\nstartxref\n${xref}\n%%EOF\n`);

  return new Blob(chunks, { type: 'application/pdf' });
}
