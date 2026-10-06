// INAU 브랜드 파일 생성: 심볼(kit/symbol.svg) + 워드마크(폰트 아웃라인)
//   kit/logo.svg       가로형: 심볼 + 이상한나라의(빨강) UIUX(잉크) — 블로그 머리글·카드 머리
//   kit/logo-short.svg 가로형 짧은 것: 심볼 + INAU
// 사용: node tools/make-brand.mjs <워드마크 폰트 .woff2/.ttf>
//   폰트: 학교안심 마법사 (OFL) https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2402_keris@1.0/TTHakgyoansimMabeopsaR.woff2
import { readFileSync, writeFileSync } from 'node:fs';
import opentype from 'opentype.js';
import { decompress } from 'wawoff2';

const fontPath = process.argv[2];
if (!fontPath) { console.error('usage: node tools/make-brand.mjs <font>'); process.exit(1); }
let buf = readFileSync(fontPath);
if (fontPath.endsWith('.woff2')) buf = Buffer.from(await decompress(buf));
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

const sym = readFileSync('kit/symbol.svg', 'utf8');
const [sx, sy, sw, sh] = sym.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
const symInner = sym.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();

const SIZE = 100;
function lockup(parts, file, label) {
  // 워드마크 조각을 기준선 y=0 에 이어 붙인다
  let x = 0;
  const paths = [];
  let y1 = Infinity, y2 = -Infinity;
  for (const p of parts) {
    const path = font.getPath(p.text, x, 0, SIZE);
    const b = path.getBoundingBox();
    paths.push(`<path fill="${p.fill}" d="${path.toPathData(2)}"/>`);
    x = b.x2 + SIZE * (p.gap ?? 0.04);
    y1 = Math.min(y1, b.y1); y2 = Math.max(y2, b.y2);
  }
  const textW = x;
  // 심볼: 글자 높이의 1.35배, 글자 세로 가운데에 맞춤
  const symH = (y2 - y1) * 1.35;
  const k = symH / sh;
  const symW = sw * k;
  const symY = (y1 + y2) / 2 - symH / 2;
  const gap = SIZE * 0.22;
  const pad = 2;
  const vbX = -pad, vbY = Math.min(symY, y1) - pad;
  const vbW = symW + gap + textW + pad * 2, vbH = Math.max(symY + symH, y2) - vbY + pad;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${[vbX, vbY, vbW, vbH].map((n) => +n.toFixed(2)).join(' ')}" role="img" aria-label="${label}">
<g transform="translate(${(-sx * k).toFixed(2)} ${(symY - sy * k).toFixed(2)}) scale(${k.toFixed(4)})" style="color:var(--logo-accent, #d42a3a)">${symInner}</g>
<g transform="translate(${(symW + gap).toFixed(2)} 0)">${paths.join('')}</g>
</svg>
`;
  writeFileSync(file, svg);
  console.log(`→ ${file}`);
}

lockup([{ text: '이상한나라의', fill: 'var(--logo-accent, #d42a3a)', gap: 0.05 }, { text: 'UIUX', fill: 'currentColor' }], 'kit/logo.svg', '이상한나라의UIUX');
lockup([{ text: 'INAU', fill: 'currentColor' }], 'kit/logo-short.svg', 'INAU');
