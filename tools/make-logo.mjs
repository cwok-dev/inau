// 로고 텍스트를 SVG 패스(아웃라인)로 바꿔 kit/logo.svg 로 저장한다.
// 폰트 파일은 저장소에 넣지 않는다(낙원어린나무체는 재배포 금지) — 로컬 경로로만 받는다.
// 사용: node tools/make-logo.mjs <한글폰트> [영문폰트] [--en-scale 1] [--gap 0.08]   (.ttf/.otf/.woff2, 영문폰트 생략 시 한글폰트로)
// 현재 로고: 학교안심 마법사 (OFL) — https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2402_keris@1.0/TTHakgyoansimMabeopsaR.woff2
//   전체: node tools/make-logo.mjs <폰트> --gap 0.05  /  짧은 것: --ko INA --en U --gap 0.02 --out kit/logo-short.svg
import { readFileSync, writeFileSync } from 'node:fs';
import opentype from 'opentype.js';
import { decompress } from 'wawoff2';

const args = process.argv.slice(2);
const flagAt = args.findIndex((a) => a.startsWith('--'));
const files = flagAt < 0 ? args : args.slice(0, flagAt);
const rest = flagAt < 0 ? [] : args.slice(flagAt);
const koPath = files[0];
const enPath = files[1] || files[0];
if (!koPath) {
  console.error('usage: node tools/make-logo.mjs <ko-font> [en-font] [--en-scale 1] [--gap 0.08]');
  process.exit(1);
}
const opt = (k, d) => {
  const i = rest.indexOf(k);
  return i >= 0 ? +rest[i + 1] : d;
};
const EN_SCALE = opt('--en-scale', 1);
const GAP = opt('--gap', 0.08);
const sopt = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : d; };
const KO = sopt('--ko', '이상한나라의');
const EN = sopt('--en', 'UIUX');
const OUT = sopt('--out', 'kit/logo.svg');
const LABEL = KO + EN;
const SIZE = 100;

async function load(p) {
  let buf = readFileSync(p);
  if (p.endsWith('.woff2')) buf = Buffer.from(await decompress(buf));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

const ko = await load(koPath);
const en = await load(enPath);

// 같은 기준선(y=0)에 두 글자를 이어 붙인다.
const koPath_ = ko.getPath(KO, 0, 0, SIZE);
const kb = koPath_.getBoundingBox();
const enSize = SIZE * EN_SCALE;
const enX = kb.x2 + SIZE * GAP;
const enPath_ = en.getPath(EN, enX, 0, enSize);
const eb = enPath_.getBoundingBox();

const x1 = Math.min(kb.x1, eb.x1);
const y1 = Math.min(kb.y1, eb.y1);
const x2 = Math.max(kb.x2, eb.x2);
const y2 = Math.max(kb.y2, eb.y2);
const pad = 2;
const vb = [x1 - pad, y1 - pad, x2 - x1 + pad * 2, y2 - y1 + pad * 2].map((n) => +n.toFixed(2));

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" role="img" aria-label="${LABEL}">
<path class="logo-ko" fill="currentColor" d="${koPath_.toPathData(2)}"/>
<path class="logo-en" fill="var(--logo-accent, #e5484d)" d="${enPath_.toPathData(2)}"/>
</svg>
`;
writeFileSync(OUT, svg);
console.log(`→ ${OUT}  viewBox=${vb.join(' ')}  (ko height ${(kb.y2 - kb.y1).toFixed(1)}, en height ${(eb.y2 - eb.y1).toFixed(1)})`);
