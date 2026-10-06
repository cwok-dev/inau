// 블로그(GitHub Pages)에 올라간 카드뉴스를 Instagram 캐러셀로 게시한다 (Instagram API with Instagram Login).
// 사용: node tools/publish-instagram.mjs <글 폴더 이름> [--dry]
//   --dry : 이미지 URL·캡션만 확인하고 게시하지 않는다 (토큰 없어도 됨)
// 환경변수: IG_ACCESS_TOKEN, IG_USER_ID(없으면 me), SITE_URL, IG_API_VERSION(기본 v23.0)
// Instagram은 공개 URL의 이미지만 받는다 → 반드시 Pages 배포가 끝난 뒤 실행.
import { appendFileSync } from 'node:fs';

const [dir, flag] = process.argv.slice(2);
const DRY = flag === '--dry';
if (!dir) {
  console.error('usage: node tools/publish-instagram.mjs <post-dir-name> [--dry]');
  process.exit(1);
}
const SITE = (process.env.SITE_URL || 'https://cwok-dev.github.io/inau').replace(/\/$/, '');
const API = `https://graph.instagram.com/${process.env.IG_API_VERSION || 'v23.0'}`;
const TOKEN = process.env.IG_ACCESS_TOKEN;
const USER = process.env.IG_USER_ID || 'me';
const base = `${SITE}/posts/${dir}/cards`;

// 1. 공개된 카드 찾기 (card-01.png 부터 404가 날 때까지, 최대 10장)
const images = [];
for (let i = 1; i <= 10; i++) {
  const url = `${base}/card-${String(i).padStart(2, '0')}.png`;
  const r = await fetch(url, { method: 'HEAD' });
  if (!r.ok) break;
  images.push(url);
}
if (images.length < 2) throw new Error(`카드가 ${images.length}장뿐이에요 (${base}). Pages 배포가 끝났는지 확인하세요.`);
const capRes = await fetch(`${base}/caption.txt`);
if (!capRes.ok) throw new Error(`caption.txt 를 못 찾았어요: ${base}/caption.txt`);
const caption = (await capRes.text()).trim();

console.log(`카드 ${images.length}장\n${images.join('\n')}\n\n--- 캡션 (${caption.length}자) ---\n${caption}\n`);
if (!TOKEN) {
  if (DRY) process.exit(0);
  throw new Error('IG_ACCESS_TOKEN 이 없어요.');
}

async function call(method, path, params = {}) {
  const url = new URL(`${API}/${path}`);
  const body = new URLSearchParams({ ...params, access_token: TOKEN });
  const res = method === 'GET'
    ? await fetch(`${url}?${body}`)
    : await fetch(url, { method, body });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(`${method} ${path}: ${JSON.stringify(json.error || json)}`);
  return json;
}
// 토큰 확인 (드라이런에서도): 어느 계정으로 올라가는지 보여준다
const me = await call('GET', USER, { fields: 'user_id,username,account_type' });
console.log(`계정: @${me.username} (${me.account_type || '?'}, id ${me.user_id || me.id})`);
if (DRY) process.exit(0);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitReady(id) {
  for (let i = 0; i < 30; i++) {
    const { status_code } = await call('GET', id, { fields: 'status_code' });
    if (status_code === 'FINISHED') return;
    if (status_code === 'ERROR' || status_code === 'EXPIRED') throw new Error(`컨테이너 ${id}: ${status_code}`);
    await sleep(3000);
  }
  throw new Error(`컨테이너 ${id}: 시간 초과`);
}

// 2. 카드마다 캐러셀 아이템 컨테이너
const children = [];
for (const image_url of images) {
  const { id } = await call('POST', `${USER}/media`, { image_url, is_carousel_item: 'true' });
  children.push(id);
}
for (const id of children) await waitReady(id);

// 3. 캐러셀 컨테이너 → 게시
const { id: carousel } = await call('POST', `${USER}/media`, { media_type: 'CAROUSEL', children: children.join(','), caption });
await waitReady(carousel);
const { id: mediaId } = await call('POST', `${USER}/media_publish`, { creation_id: carousel });
const { permalink } = await call('GET', mediaId, { fields: 'permalink' });

console.log(`게시 완료: ${permalink}`);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `permalink=${permalink}\nmedia_id=${mediaId}\n`);
