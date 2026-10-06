// HTML(와이어프레임·주석 캡처·비교·카드뉴스)을 PNG로 렌더링한다.
// 사용: node tools/render.mjs a.html [b.html ...]   → 같은 위치에 a.png
// - 페이지 안 [data-capture] 요소가 있으면 그 요소만, 없으면 전체 페이지를 찍는다.
// - <meta name="render-width" content="1200"> 로 뷰포트 너비 지정 (기본 1200)
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node tools/render.mjs <file.html> [...]');
  process.exit(1);
}

const launch = process.env.CHROME_PATH
  ? { executablePath: process.env.CHROME_PATH }
  : { channel: 'chrome' };
const browser = await chromium.launch(launch);
const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1200, height: 800 } });

for (const f of files) {
  const abs = resolve(f);
  await page.goto(pathToFileURL(abs).href);
  const width = await page.evaluate(() => +document.querySelector('meta[name=render-width]')?.content || 0);
  if (width) await page.setViewportSize({ width, height: 800 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {}); // CDN이 느려도 멈추지 않게 (폰트는 위에서 fonts.ready 로 기다림)
  const target = await page.$('[data-capture]');
  const png = abs.replace(/\.html?$/i, '.png');
  if (target) await target.screenshot({ path: png });
  else await page.screenshot({ path: png, fullPage: true });
  console.log(`→ ${png}`);
}
await browser.close();
