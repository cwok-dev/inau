// posts/<글>/cards.json → posts/<글>/cards/card-01.png … (1080×1350) + caption.txt (인스타 캡션)
// 사용: node tools/render-cards.mjs posts/<글> [posts/<글2> ...]
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const dirs = process.argv.slice(2);
if (!dirs.length) {
  console.error('usage: node tools/render-cards.mjs posts/<post> [...]');
  process.exit(1);
}

const KIT = resolve('kit');
const LOGO = readFileSync(join(KIT, 'logo.svg'), 'utf8');
const BLOG = (process.env.SITE_URL || 'https://cwok-dev.github.io/uncomfortable-ui').replace(/\/$/, '');
const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CIRCLED = '①②③④⑤⑥⑦⑧⑨';

// "① 제목 — 설명" → { n: 1, main: '제목', sub: '설명' }
function point(p, i) {
  let s = String(p).trim();
  let n = i + 1;
  const k = CIRCLED.indexOf(s[0]);
  if (k >= 0) { n = k + 1; s = s.slice(1).trim(); }
  const [main, ...rest] = s.split(/\s+[—–-]\s+/);
  return { n, main, sub: rest.join(' — ') };
}

function frontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const d = {};
  if (m) for (const l of m[1].split(/\r?\n/)) { const kv = l.match(/^(\w+):\s*"?(.*?)"?\s*$/); if (kv) d[kv[1]] = kv[2]; }
  return d;
}

function slideHtml(s, i, total, post, abs) {
  const img = (f, cls) => (f && existsSync(join(abs, f)) ? `<div class="cp-figure ${cls}"><img src="${pathToFileURL(join(abs, f)).href}"></div>` : '');
  const head = `<div class="cp-head"><div class="cp-logo">${LOGO}</div><div class="cp-page">${i + 1} / ${total}</div></div>`;
  const pts = (arr, bad) => `<div class="cp-points">${(arr || []).map(point).map((p) =>
    `<div class="cp-point"><i class="n${bad ? ' bad-n' : ''}">${p.n}</i><div>${esc(p.main)}${p.sub ? `<span class="sub">${esc(p.sub)}</span>` : ''}</div></div>`).join('')}</div>`;
  let body = '';
  let theme = '';
  switch (s.type) {
    case 'cover':
      body = `<div class="cp-kicker">불편한UI${post.issue ? ` #${esc(post.issue)}` : ''} · ${esc(post.app || '')}</div>
        <div class="cp-title l">${esc(s.title)}</div>${s.sub ? `<div class="cp-sub">${esc(s.sub)}</div>` : ''}
        ${img(s.image, 'fit')}`;
      break;
    case 'problem':
      body = `<div class="cp-kicker">${esc(s.title)}</div><div class="cp-body cp-quote">${esc(s.body)}</div>${img(s.image, 'fit')}`;
      break;
    case 'why':
      if (!s.image && existsSync(join(abs, 'annotated.png'))) s = { ...s, image: 'annotated.png' };
      body = `<div class="cp-kicker">${esc(s.title)}</div>${s.image ? `<div class="cp-split">${pts(s.points, true)}${img(s.image, '')}</div>` : pts(s.points, true)}`;
      break;
    case 'fix':
      body = `<div class="cp-kicker">${esc(s.title)}</div>${s.image ? `<div class="cp-split">${pts(s.points)}${img(s.image, '')}</div>` : pts(s.points)}`;
      break;
    case 'compare': {
      // 보드를 줄이면 글씨가 안 보이므로, 휴대폰 두 대를 크게 나란히
      const has = (f) => existsSync(join(abs, f));
      const pane = (f, tag) => `<div class="cp-pane"><span class="pane-tag ${tag}">${tag.toUpperCase()}</span><img src="${pathToFileURL(join(abs, f)).href}"></div>`;
      body = has('annotated.png') && has('after.png')
        ? `<div class="cp-kicker">${esc(s.title)}</div><div class="cp-duo">${pane('annotated.png', 'before')}${pane('after.png', 'after')}</div>`
        : `<div class="cp-kicker">${esc(s.title)}</div>${img(s.image, 'fit')}`;
      break;
    }
      break;
    case 'outro':
      theme = 'dark';
      body = `<div class="cp-center"><div class="cp-kicker">한 줄 정리</div><div class="cp-title">${esc(s.title)}</div>
        ${s.sub ? `<div class="cp-tags">${esc(s.sub)}</div>` : ''}</div>
        <div class="cp-foot"><span>전체 글은 프로필 링크에서</span><span>${esc(post.app || '')}</span></div>`;
      break;
    default:
      body = `<div class="cp-kicker">${esc(s.title || '')}</div>${s.body ? `<div class="cp-body">${esc(s.body)}</div>` : ''}${s.points ? pts(s.points) : ''}${img(s.image, 'fit')}`;
  }
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><link rel="stylesheet" href="${pathToFileURL(join(KIT, 'cards.css')).href}"></head>
<body><div class="card-page ${theme}" data-capture>${head}${body}</div></body></html>`;
}

function caption(cards, post, dir) {
  const by = (t) => cards.slides.find((s) => s.type === t) || {};
  const lines = [by('cover').title || post.title, ''];
  if (by('problem').body) lines.push(by('problem').body.replace(/\n/g, ' '), '');
  for (const s of cards.slides.filter((x) => ['why', 'fix'].includes(x.type))) {
    if (!s.points) continue;
    lines.push(`▪️ ${s.title}`);
    s.points.map(point).forEach((p) => lines.push(`${CIRCLED[p.n - 1] || p.n} ${p.main}${p.sub ? ` — ${p.sub}` : ''}`));
    lines.push('');
  }
  if (by('outro').title) lines.push(by('outro').title, '');
  lines.push(`전체 글 👉 프로필 링크 (${BLOG}/posts/${dir}/)`, '');
  const tags = [...new Set((cards.hashtags || []).map((t) => t.replace(/^#/, '').replace(/\s+/g, '')))].slice(0, 30);
  lines.push(tags.map((t) => `#${t}`).join(' '));
  return lines.join('\n').slice(0, 2200);
}

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });

for (const d of dirs) {
  const abs = resolve(d);
  const name = abs.split(/[\\/]/).pop();
  const cards = JSON.parse(readFileSync(join(abs, 'cards.json'), 'utf8'));
  const post = frontmatter(readFileSync(join(abs, 'index.md'), 'utf8'));
  const out = join(abs, 'cards');
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const total = cards.slides.length;
  for (const [i, s] of cards.slides.entries()) {
    const html = join(out, `.card-${i + 1}.html`);
    writeFileSync(html, slideHtml(s, i, total, post, abs));
    await page.goto(pathToFileURL(html).href);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState('networkidle');
    await (await page.$('[data-capture]')).screenshot({ path: join(out, `card-${String(i + 1).padStart(2, '0')}.png`) });
    rmSync(html);
  }
  writeFileSync(join(out, 'caption.txt'), caption(cards, post, name));
  console.log(`→ ${out} (${total} cards + caption.txt)`);
}
await browser.close();
