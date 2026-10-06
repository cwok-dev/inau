// posts/*/index.md → _site/ (GitHub Pages). 링크는 모두 상대 경로라 /<repo>/ 하위에서도 동작한다.
// SITE_URL 환경변수가 있으면 feed.xml 에 절대 주소를 쓴다.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';

const SITE = '불편한UI';
const DESC = '쓰다가 불편했던 앱 화면을 기록하고, 고쳐 그려봅니다.';
const SITE_URL = (process.env.SITE_URL || '').replace(/\/$/, '');
const OUT = '_site';
const POSTS = process.env.POSTS_DIR || 'posts';

function frontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return [{}, src];
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (!/^["'\[]/.test(v)) v = v.replace(/\s+#.*$/, '');
    if (v.startsWith('[')) v = v.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    else v = v.replace(/^["']|["']$/g, '');
    data[kv[1]] = v;
  }
  return [data, src.slice(m[0].length)];
}

const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const CSS = `
:root{--ink:#1d1d1f;--ink-2:#6e6e73;--line:#e5e5ea;--bg:#fff;--card:#f5f5f7;--bad:#e5484d;--fix:#2f6bff}
@media (prefers-color-scheme:dark){:root{--ink:#f5f5f7;--ink-2:#a1a1a6;--line:#2c2c2e;--bg:#111113;--card:#1c1c1e}}
*{box-sizing:border-box}body{margin:0;word-break:keep-all;background:var(--bg);color:var(--ink);font:17px/1.75 Pretendard,'Noto Sans KR',system-ui,sans-serif;letter-spacing:-.01em;-webkit-font-smoothing:antialiased}
a{color:inherit}.wrap{max-width:760px;margin:0 auto;padding:0 16px}
header.site{padding:40px 0 24px;border-bottom:1px solid var(--line);margin-bottom:32px}
header.site a{text-decoration:none}.logo{font-size:28px;font-weight:800}.logo b{color:var(--bad)}
.tagline{color:var(--ink-2);margin-top:4px;font-size:15px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px;padding-bottom:64px}
.card{display:block;text-decoration:none;background:var(--card);border-radius:16px;overflow:hidden}
.card img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;object-position:top;background:#ddd}
.card .meta{padding:14px 16px 18px}.card .app{font-size:13px;color:var(--ink-2)}.card h2{font-size:17px;line-height:1.45;margin:4px 0 0}
article h1{font-size:30px;line-height:1.35;margin:0 0 8px}.byline{color:var(--ink-2);font-size:14px;margin-bottom:28px}
article h2{font-size:21px;margin:44px 0 12px}article img{max-width:100%;height:auto;border-radius:12px;display:block;margin:20px auto}
article blockquote{margin:16px 0;padding:12px 18px;border-left:4px solid var(--bad);background:var(--card);border-radius:0 12px 12px 0}
article blockquote p{margin:0}.tags{display:flex;gap:8px;flex-wrap:wrap;margin:40px 0 64px}
.tags span{font-size:13px;padding:4px 10px;border-radius:999px;background:var(--card);color:var(--ink-2)}
nav.back{margin:32px 0 8px;font-size:14px}nav.back a{color:var(--ink-2);text-decoration:none}
`;

const layout = (title, body, root, desc = DESC, image = '') => `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<link rel="alternate" type="application/rss+xml" title="${SITE}" href="${root}feed.xml">
<style>${CSS}</style></head><body><div class="wrap">
<header class="site"><a href="${root}"><div class="logo">불편한<b>UI</b></div></a><div class="tagline">${DESC}</div></header>
${body}</div></body></html>`;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'posts'), { recursive: true });

const posts = [];
for (const dir of existsSync(POSTS) ? readdirSync(POSTS) : []) {
  const md = join(POSTS, dir, 'index.md');
  if (!existsSync(md)) continue;
  const [data, body] = frontmatter(readFileSync(md, 'utf8'));
  if (data.status === 'hidden') continue;
  const outDir = join(OUT, 'posts', dir);
  mkdirSync(outDir, { recursive: true });
  for (const f of readdirSync(join(POSTS, dir))) {
    if (/\.(png|jpe?g|gif|webp|svg)$/i.test(f)) copyFileSync(join(POSTS, dir, f), join(outDir, f));
  }
  const post = { dir, ...data, date: data.date || dir.slice(0, 10) };
  const tags = (Array.isArray(data.tags) ? data.tags : []).map((t) => `<span>#${esc(t)}</span>`).join('');
  const html = `<nav class="back"><a href="../../">← 전체 글</a></nav><article>
<h1>${esc(post.title)}</h1><div class="byline">${esc(post.app || '')}${post.screen ? ` · ${esc(post.screen)}` : ''} · ${esc(post.date)}</div>
${marked.parse(body)}<div class="tags">${tags}</div></article>`;
  const img = SITE_URL && data.cover ? `${SITE_URL}/posts/${dir}/${data.cover}` : '';
  writeFileSync(join(outDir, 'index.html'), layout(`${post.title} | ${SITE}`, html, '../../', post.caption || DESC, img));
  posts.push(post);
}
posts.sort((a, b) => (a.date < b.date ? 1 : -1));

const cards = posts.map((p) => `<a class="card" href="posts/${p.dir}/">
<img src="posts/${p.dir}/${esc(p.cover || 'compare.png')}" alt="" loading="lazy">
<div class="meta"><div class="app">${esc(p.app || '')}</div><h2>${esc(p.title)}</h2></div></a>`).join('\n');
writeFileSync(join(OUT, 'index.html'), layout(SITE, `<div class="grid">${cards || '<p>아직 글이 없어요.</p>'}</div>`, './'));

const items = posts.map((p) => {
  const link = `${SITE_URL}/posts/${p.dir}/`;
  return `<item><title>${esc(p.title)}</title><link>${link}</link><guid>${link}</guid><pubDate>${new Date(`${p.date}T09:00:00+09:00`).toUTCString()}</pubDate><description>${esc(p.caption || '')}</description></item>`;
}).join('');
writeFileSync(join(OUT, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${SITE}</title><link>${SITE_URL}/</link><description>${DESC}</description>${items}</channel></rss>`);
writeFileSync(join(OUT, '.nojekyll'), '');
console.log(`built ${posts.length} posts → ${OUT}/`);
