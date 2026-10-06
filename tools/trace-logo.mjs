// GPT 로고 시안(kit/brand-src/gpt-logo-sheet.png, 01 HEART)을 그대로 벡터로 딴다 (potrace).
// 색마다 마스크를 만들어 따로 트레이싱 → 빨강은 var(--logo-accent), 잉크는 currentColor 로 칠한다.
// 사용: node tools/trace-logo.mjs   → kit/logo.svg · logo-inau.svg · logo-inayu.svg · symbol.svg · avatar.svg
import Jimp from 'jimp';
import potrace from 'potrace';
import { writeFileSync } from 'node:fs';

const SRC = 'kit/brand-src/gpt-logo-sheet.png';
const UP = 4; // 키워서 따면 가장자리가 매끄럽다
// [x, y, w, h] — 시안 1번 열 기준 좌표
const REGIONS = {
  logo: [45, 78, 470, 232],
  'logo-inayu': [60, 325, 210, 110],
  'logo-inau': [325, 325, 185, 110],
  symbol: [160, 465, 240, 255],
  avatar: [330, 740, 140, 140],
};

const isRed = (r, g, b) => r - Math.max(g, b) > 55;
const isInk = (r, g, b) => !isRed(r, g, b) && r + g + b < 3 * 115;
const isLight = (r, g, b) => r + g + b > 3 * 205;

const sheet = await Jimp.read(SRC);

function sample(img, test) {
  let n = 0, R = 0, G = 0, B = 0;
  img.scan(0, 0, img.bitmap.width, img.bitmap.height, (x, y, i) => {
    const [r, g, b] = img.bitmap.data.slice(i, i + 3);
    if (test(r, g, b)) { n++; R += r; G += g; B += b; }
  });
  if (!n) return null;
  return '#' + [R, G, B].map((v) => Math.round(v / n).toString(16).padStart(2, '0')).join('');
}

async function mask(img, test, within) {
  const m = img.clone();
  m.scan(0, 0, m.bitmap.width, m.bitmap.height, (x, y, i) => {
    const [r, g, b] = img.bitmap.data.slice(i, i + 3);
    const on = test(r, g, b) && (!within || within(x, y));
    m.bitmap.data[i] = m.bitmap.data[i + 1] = m.bitmap.data[i + 2] = on ? 0 : 255;
    m.bitmap.data[i + 3] = 255;
  });
  return m.getBufferAsync(Jimp.MIME_PNG);
}

const trace = (buf) => new Promise((res, rej) =>
  potrace.trace(buf, { threshold: 128, turdSize: 24, optTolerance: 0.3, alphaMax: 1 }, (e, svg) => (e ? rej(e) : res(svg))));
const pathOf = (svg) => (svg.match(/ d="([^"]+)"/) || [])[1] || '';

const colors = {};
for (const [name, [x, y, w, h]] of Object.entries(REGIONS)) {
  const img = sheet.clone().crop(x, y, w, h).resize(w * UP, h * UP, Jimp.RESIZE_BICUBIC);
  colors.red ??= sample(img, isRed);
  colors.ink ??= sample(img, isInk);
  const layers = [];
  if (name === 'avatar') {
    // 빨간 원 + 원 안의 흰 하트(커서는 빨강으로 비어 있음)
    // 빨간 원의 실제 범위를 재서 그 안쪽만 흰색으로 딴다 (바깥 바탕색이 섞이지 않게)
    let x1 = Infinity, x2 = -Infinity, y1 = Infinity, y2 = -Infinity;
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, (px, py, i) => {
      const [r, g, b] = img.bitmap.data.slice(i, i + 3);
      if (isRed(r, g, b)) { x1 = Math.min(x1, px); x2 = Math.max(x2, px); y1 = Math.min(y1, py); y2 = Math.max(y2, py); }
    });
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, rr = Math.min(x2 - x1, y2 - y1) / 2 - UP * 4;
    const inCircle = (px, py) => (px - cx) ** 2 + (py - cy) ** 2 < rr * rr;
    layers.push({ d: pathOf(await trace(await mask(img, isRed))), fill: 'var(--logo-accent, RED)' });
    layers.push({ d: pathOf(await trace(await mask(img, isLight, inCircle))), fill: '#fff' });
  } else {
    const red = pathOf(await trace(await mask(img, isRed)));
    const ink = pathOf(await trace(await mask(img, isInk)));
    if (red) layers.push({ d: red, fill: 'var(--logo-accent, RED)' });
    if (ink) layers.push({ d: ink, fill: 'currentColor' });
  }
  const label = { logo: '이상한나라의UIUX', 'logo-inau': 'INAU', 'logo-inayu': '이나유', symbol: 'INAU', avatar: 'INAU' }[name];
  const body = layers.map((l) => `<path fill-rule="evenodd" fill="${l.fill.replace('RED', colors.red)}" d="${l.d}"/>`).join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w * UP} ${h * UP}" role="img" aria-label="${label}">\n${body}\n</svg>\n`;
  writeFileSync(`kit/${name}.svg`, svg);
  console.log(`→ kit/${name}.svg (${layers.length} layers, ${(svg.length / 1024).toFixed(0)}KB)`);
}
console.log('colors', colors);
