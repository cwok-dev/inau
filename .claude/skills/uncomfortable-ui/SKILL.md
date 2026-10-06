---
name: uncomfortable-ui
description: 불편한UI — 휴대폰 앱에서 겪은 불편한 UI/UX 제보(GitHub 이슈의 캡처·영상·불편한 이유)를 받아 문제 분석, 수정 방안, AI 와이어프레임(Before/After)을 만들고 posts/ 아래에 블로그 글로 정리한다. "불편한UI", "UX 제보 처리", "이슈 N번 글로 만들어줘", "와이어프레임 다시 그려줘" 같은 요청에 사용.
---

# 불편한UI

제보 1건 = 글 1편. 입력은 GitHub 이슈(템플릿 `ux-report.yml`), 출력은 `posts/<날짜>-<slug>/` 폴더다.
이 글은 서비스기획자 포트폴리오에도 쓰인다. 그럴듯함보다 **근거 있는 문장**이 중요하다.

## 0. 입력 확보

- 인자: 이슈 번호 `N` (없으면 물어보거나, 로컬 이미지 경로를 받는다).
- `work/issue-N/manifest.json`이 없으면 `node tools/fetch-media.mjs N` 실행.
- manifest의 `fields`(app, screen, goal, pain, caption, idea, device)와 `media`를 읽는다.
- **모든 이미지와 영상 프레임을 Read로 직접 본다.** 영상은 `frames`를 시간순으로 보고 어떤 흐름에서 막혔는지 파악한다.

## 1. 분석 규칙

- 제보자의 "불편한 이유"는 **원문 그대로 인용**하고, 다듬지 않는다. AI가 덧붙인 분석은 따로 구분한다.
- 화면에 실제로 보이는 것만 근거로 쓴다. 회사 내부 사정, 전환율 같은 수치, "사용자 대부분이 ~한다" 같은 일반화를 지어내지 않는다.
- 원인은 1~3개로 좁힌다. 해당될 때만 근거 원칙을 하나씩 단다(닐슨 휴리스틱, 피츠의 법칙, 힉의 법칙, 게슈탈트 근접성, WCAG 대비·터치 영역 44pt/48dp, 플랫폼 HIG/Material 관례 등). 끼워 맞추지 않는다.
- 비난조를 쓰지 않는다. 그 화면이 왜 그렇게 설계됐을지(사업·운영상 이유)를 한 줄로 추정해 균형을 잡되, 추정이라고 밝힌다.

## 2. 수정안

- 주안 1개 + (필요하면) 대안 1개. `idea` 필드가 있으면 그걸 출발점으로 삼는다.
- 바뀌는 부분마다 번호(①②③)를 붙인다. 이 번호가 와이어프레임 배지·본문 목록과 1:1로 맞아야 한다.
- 트레이드오프(잃는 것, 다른 화면에 미치는 영향)를 반드시 적는다.
- 기존 앱의 **정보 구조와 흐름**(어떤 화면에 어떤 기능이 있는지)은 크게 벗어나지 않는 현실적인 수준으로 제안한다. 단, 모양은 원본이 아니라 우리 디자인 시스템으로 그린다(3번).

## 3. 이미지 만들기

폴더: `posts/<YYYY-MM-DD>-<slug>/` (날짜는 이슈 `created_at`을 KST로, slug는 영문 소문자-하이픈 예: `baemin-coupon-list`).
HTML 원본은 `src/`에, 렌더링 결과 PNG는 폴더 바로 아래에 둔다. 모든 HTML은 `<link rel="stylesheet" href="../../../kit/wire.css">`를 쓴다.

### 디자인 시스템 (먼저 읽기)

**시작 전에 `kit/DESIGN.md`를 읽고 `kit/components.png`를 Read로 본다.** 와이어프레임은 원본을 따라 그리지 않고 이 시스템의 컴포넌트를 조립해서 그린다.

- 원본에서는 **요소 목록(정보·행동)만** 가져온다. 모양·색·크기·폰트·아이콘은 가져오지 않는다.
- 요소마다 컴포넌트를 대응시킨다 → 이 대응표를 PR 본문에 적는다.
- 색은 토큰만(Primary `#0A5CFF`, 그레이, 의미색). Primary 버튼은 화면당 1개.
- 타이포는 `.t-*` 클래스만(Pretendard). 너비는 4컬럼 그리드 `.grid` + `.span-1~4`. 간격은 4의 배수.
- `style=""`로 색·폰트·크기를 넣지 않는다. 시스템에 없는 컴포넌트가 꼭 필요하면 PR 본문 "시스템에 없던 것"에 적고, 기존 토큰으로만 만든다.
- 바뀐 부분 표시는 보라(`.fix` + `.n`), 문제 표시는 빨강(`.mark`). 파랑은 UI(Primary) 전용이라 주석에 쓰지 않는다.
- 번호 배지는 오른쪽 위 모서리에 붙는다. 그 자리에 글자·버튼이 있으면 `.n.l`(왼쪽 위)로 옮기고, 안쪽 여백이 없는 행(`.row`, 제목 줄)에 표시할 땐 `.fix.pad`를 쓴다. 렌더링 후 배지가 글자를 가리거나 화면 밖으로 잘리지 않았는지 꼭 본다.

after.html 뼈대:

```html
<div class="capture" data-capture>
  <div class="phone">
    <div class="statusbar">9:41</div>
    <div class="appbar"><span class="ic ic-back"></span><div class="appbar-title">제목</div></div>
    <div class="screen">
      <div class="grid pt-6"> … <div class="span-4 …">…</div> … </div>
    </div>
    <div class="cta"><div class="btn-group fix"><i class="n">1</i><button class="btn btn-l btn-outline">…</button><button class="btn btn-l btn-primary">…</button></div></div>
    <div class="homebar"></div>
  </div>
</div>
```

| 파일 | 내용 | 만드는 법 |
|---|---|---|
| `src/before.html` → `before.png` | 원본 캡처(개인정보 가림) | `.capture` > `.shot` 안에 `<img src="../../../work/issue-N/media/m1.png">` + `.redact` |
| `src/annotated.html` → `annotated.png` | 문제 지점 표시 | `.capture` > `.shot` + `.mark`(% 좌표, 넓은 영역은 `.mark.fill`) + 빨간 번호 |
| `src/after.html` → `after.png` | 수정안 와이어프레임 | 디자인 시스템 컴포넌트로 조립 + 바뀐 부분 `.fix` + 보라 번호 |
| `src/compare.html` → `compare.png` | Before/After 비교 보드(대표 이미지) | `.board` > `.compare` > `<img src="../annotated.png">`, `<img src="../after.png">`, `.notes` |

- **원본 미디어 파일을 posts/에 그대로 복사하지 않는다.** 반드시 before.html을 거쳐 가림 처리된 PNG만 남긴다.
- 개인정보 가림: 이름, 닉네임, 전화번호, 주소, 주문·계좌번호, 프로필 사진, 다른 사람의 채팅·리뷰 내용은 `<div class="redact" style="left:..%;top:..%;width:..%;height:..%"></div>`로 덮는다.
- `.mark` 좌표는 이미지 크기 대비 %로 잡는다. 렌더링 후 PNG를 Read로 열어 표시가 실제 문제 위치에 정확히 있는지 확인하고, 어긋나면 고친다.
- 실제 문구는 핵심 라벨·제목·버튼에만 쓰고, 중요하지 않은 본문은 `.skel`, 이미지는 `.ph`·`.thumb`·`.app-icon`으로 처리한다. 원본 앱 로고도 `.app-icon` 자리표시로 둔다.
- compare 보드의 태그는 `.pane-tag.before` / `.pane-tag.after`, 메모는 `.notes` > `.note`(문제는 `.n.bad-n`, 수정은 `.n`).
- 영상 제보라 단계가 여러 개면 after를 여러 화면(`after-1`, `after-2`)으로 나누고 `.compare`에 화살표로 흐름을 보여도 된다.
- 렌더링 순서: ① `node tools/render.mjs <폴더>/src/before.html <폴더>/src/annotated.html <폴더>/src/after*.html` → `mv <폴더>/src/*.png <폴더>/` ② compare는 위 PNG를 불러오므로 그다음에 `node tools/render.mjs <폴더>/src/compare.html` → 다시 `mv`.
- 렌더링한 PNG를 전부 Read로 열어 확인한다: 글자 잘림, 겹침, 번호 불일치, 가림 누락. 문제가 있으면 고쳐서 다시 렌더링한다.

## 4. 글 쓰기 — `index.md`

```markdown
---
title: "<캡션 또는 제안한 제목>"
caption: "<한 줄 캡션>"
app: "<앱 이름>"
screen: "<화면 / 위치>"
device: "<기기>"
date: YYYY-MM-DD
issue: N
tags: [<문제 유형 2~3개: 정보구조, 피드백, 터치영역, 가독성, 흐름, 일관성 ...>]
cover: compare.png
status: published   # hidden 으로 바꾸면 사이트에서 숨김
---

![Before / After](compare.png)

## 하려던 일
## 무엇이 불편했나
> 제보 원문 인용

![문제 지점](annotated.png)

## 왜 불편할까
① ... (근거 원칙)

## 이렇게 바꿔보면
![수정안](after.png)
① ... ② ...

## 고려한 점
트레이드오프, 예상되는 반론, 설계 의도 추정(추정이라고 표시)

## 한 줄 정리
```

- 문체: 해요체. 짧은 문장. 전문용어는 처음 나올 때 한 번 풀어 쓴다.
- 분량: 본문 800~1500자.

## 5. 카드뉴스 원고 — `cards.json`

2단계(Canva → Instagram)에서 쓴다. 1080×1350 기준 6장 내외.

```json
{ "slides": [
  { "type": "cover",   "title": "<캡션>", "sub": "<앱> · <화면>", "image": "before.png" },
  { "type": "problem", "title": "무엇이 불편했나", "body": "<2줄 이내>", "image": "annotated.png" },
  { "type": "why",     "title": "왜 불편할까", "points": ["①...", "②..."] },
  { "type": "fix",     "title": "이렇게 바꿔보면", "points": ["①...", "②..."], "image": "after.png" },
  { "type": "compare", "title": "Before / After", "image": "compare.png" },
  { "type": "outro",   "title": "<한 줄 정리>", "sub": "#불편한UI #UX #서비스기획" }
], "hashtags": ["불편한UI", "UX", "UI", "서비스기획", "<앱이름>"] }
```

## 6. 마무리 — PR 설명 `work/issue-N/pr-body.md`

- 무엇을 만들었는지(파일 목록), 주안 요약 3줄
- **확인이 필요한 문장**: AI가 새로 쓴 사실 주장·원칙 인용·설계 의도 추정을 목록으로 적는다(제보자가 검토할 수 있게). 모두 **체크하지 않은** `- [ ]`로 적는다. 체크는 제보자가 확인하면서 한다.
- **컴포넌트 대응표**: 원본 요소 → 쓴 컴포넌트 (예: 회원가입 버튼 → `.btn-l.btn-primary` / span-2). 시스템에 없어서 새로 만든 게 있으면 "시스템에 없던 것"으로 따로 적는다.
- 개인정보 가림 처리한 위치
- 마지막 줄: `Closes #N`

## 수정 요청(PR 코멘트)으로 다시 돌 때

- 요청한 부분만 고친다. 사용자가 직접 고친 문장은 건드리지 않는다.
- 이미지를 고쳤으면 다시 렌더링하고 번호·본문·cards.json이 서로 맞는지 다시 확인한다.

## 참고 예시

`examples/2026-10-06-sample-coupon-list/` — 가상 앱으로 만든 완성본(src HTML, PNG, index.md, cards.json). 마크업 패턴과 글 톤은 이걸 따른다.
