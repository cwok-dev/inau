// 이슈 본문을 읽어 필드를 나누고, 첨부(이미지·영상)를 내려받아 work/issue-N/ 에 정리한다.
// 영상은 장면 전환 프레임(없으면 균등 간격)을 PNG로 뽑아 Claude가 볼 수 있게 한다.
// 사용: node tools/fetch-media.mjs <이슈번호> [owner/repo]
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ffmpegPath from 'ffmpeg-static';

const num = process.argv[2];
const repo = process.argv[3] || process.env.GITHUB_REPOSITORY;
if (!num || !repo) {
  console.error('usage: node tools/fetch-media.mjs <issue> [owner/repo]');
  process.exit(1);
}
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';

const issue = JSON.parse(execFileSync('gh', ['api', `repos/${repo}/issues/${num}`], { encoding: 'utf8' }));
const out = join('work', `issue-${num}`);
const mediaDir = join(out, 'media');
const framesDir = join(out, 'frames');
mkdirSync(mediaDir, { recursive: true });
mkdirSync(framesDir, { recursive: true });

// 이슈 폼 본문: "### 라벨\n\n값" 반복
const FIELD = {
  '앱 이름': 'app', '화면 / 위치': 'screen', '하려던 일': 'goal', '불편한 이유': 'pain',
  '캡션 (한 줄)': 'caption', '내 개선 아이디어 (선택)': 'idea', '캡처 / 영상': 'media', '기기': 'device',
};
const fields = {};
for (const part of (issue.body || '').split(/^### /m).slice(1)) {
  const [label, ...rest] = part.split('\n');
  const value = rest.join('\n').trim();
  const key = FIELD[label.trim()] || label.trim();
  fields[key] = value === '_No response_' ? '' : value;
}

const URL_RE = /https:\/\/(?:github\.com\/user-attachments\/(?:assets|files)\/[^\s)"'<>\]]+|(?:private-)?user-images\.githubusercontent\.com\/[^\s)"'<>\]]+|github\.com\/[^/\s]+\/[^/\s]+\/assets\/[^\s)"'<>\]]+)/g;
const urls = [...new Set((issue.body || '').match(URL_RE) || [])];

const EXT = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'image/heic': 'heic',
  'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
};

function ffmpeg(args) {
  return spawnSync(ffmpegPath, ['-hide_banner', ...args], { encoding: 'utf8' });
}

function duration(file) {
  const m = ffmpeg(['-i', file]).stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
  return m ? (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]) : 0;
}

function extractFrames(file, base) {
  const frames = [];
  // 1) 장면 전환 프레임 (최대 8장)
  const r = ffmpeg(['-i', file, '-vf', "select='gt(scene,0.2)',showinfo,scale=720:-2", '-vsync', 'vfr',
    '-frames:v', '8', join(framesDir, `${base}-scene-%02d.png`)]);
  const times = [...r.stderr.matchAll(/pts_time:([\d.]+)/g)].map((m) => +m[1]);
  times.forEach((t, i) => frames.push({ file: join(framesDir, `${base}-scene-${String(i + 1).padStart(2, '0')}.png`), t }));
  // 2) 장면 전환이 적으면 균등 간격으로 보충 (6장)
  if (frames.length < 4) {
    const d = duration(file);
    for (let i = 0; i < 6; i++) {
      const t = d ? (d * (i + 0.5)) / 6 : i;
      const f = join(framesDir, `${base}-t${t.toFixed(1)}.png`);
      ffmpeg(['-ss', String(t), '-i', file, '-frames:v', '1', '-vf', 'scale=720:-2', '-y', f]);
      frames.push({ file: f, t: +t.toFixed(1) });
    }
  }
  return frames.sort((a, b) => a.t - b.t);
}

const media = [];
for (const [i, url] of urls.entries()) {
  const headers = token && /github\.com/.test(new URL(url).host) ? { Authorization: `token ${token}` } : {};
  const res = await fetch(url, { headers, redirect: 'follow' });
  if (!res.ok) {
    console.error(`skip ${url}: HTTP ${res.status}`);
    continue;
  }
  const type = (res.headers.get('content-type') || '').split(';')[0];
  const ext = EXT[type] || (type.startsWith('video/') ? 'mp4' : 'png');
  const base = `m${i + 1}`;
  const file = join(mediaDir, `${base}.${ext}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  const item = { url, file, type, kind: type.startsWith('video/') ? 'video' : 'image' };
  if (item.kind === 'video') {
    item.duration = duration(file);
    item.frames = extractFrames(file, base);
  }
  media.push(item);
  console.log(`${item.kind} ${file}${item.frames ? ` (${item.frames.length} frames)` : ''}`);
}

const manifest = {
  number: issue.number, title: issue.title, url: issue.html_url, author: issue.user?.login,
  created_at: issue.created_at, fields, media,
};
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`→ ${join(out, 'manifest.json')} (${media.length} media)`);
