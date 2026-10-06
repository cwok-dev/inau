# 불편한UI 디자인 시스템

와이어프레임(After)은 **원본 화면을 따라 그리지 않고, 이 시스템의 컴포넌트를 조립해서** 그린다.
원본에서 가져오는 것은 "화면에 무엇이 있어야 하는가(정보·기능)"뿐이고, "어떻게 생겼는가(모양·색·크기)"는 여기서 가져온다.

- 진입 CSS: `kit/wire.css` (tokens → components → annotate)
- 눈으로 보는 카탈로그: `kit/components.png` (원본 `kit/components.html`)
- 로고: `kit/logo.svg` (학교안심 점심시간 아웃라인, "UI"는 `--logo-accent`)

## 1. 색

| 역할 | 토큰 | 값 | 쓰임 |
|---|---|---|---|
| **Primary** | `--primary` (`--blue-500`) | `#0A5CFF` | 화면의 핵심 행동 1개, 선택 상태, 링크 |
| Primary pressed | `--primary-pressed` (`--blue-600`) | `#004AE0` | 눌림 |
| Primary weak | `--primary-weak` (`--blue-50`) | `#EEF4FF` | secondary 버튼 배경, info 안내 |
| 글자 | `--text-strong` / `--text` / `--text-sub` / `--text-hint` | gray-900 / 800 / 600 / 400 | 제목 / 본문 / 보조 / 힌트·비활성 |
| 면 | `--bg` / `--bg-sub` / `--fill` | gray-0 / 50 / 100 | 화면 / 구역 / 입력·칩 |
| 선 | `--border` / `--border-strong` | gray-200 / 300 | 구분선 / 입력·outline 버튼 |
| 의미 | `--danger` `--warning` `--success` | `#F0353F` `#FF9500` `#12B76A` | 오류·삭제 / 주의 / 완료 |
| 주석: 문제 | `--anno-bad` | `#F0353F` | Before 위 빨간 표시 |
| 주석: 바뀐 부분 | `--anno-fix` | `#7C3AED` | After 위 보라 표시 (UI의 파랑과 구분) |

블루 스케일 50–900, 그레이 0–900 전체는 `tokens.css`.
**규칙**: 원본 앱의 브랜드 색을 가져오지 않는다. 와이어프레임의 색은 위 토큰만 쓴다.

## 2. 타이포그래피 — Pretendard

| 클래스 | 크기/행간 | 굵기 | 쓰임 |
|---|---|---|---|
| `.t-display` | 28/38 | Bold | 화면 대표 숫자·인사말 |
| `.t-title1` | 24/32 | Bold | 화면 제목 (large appbar) |
| `.t-title2` | 20/28 | Bold | 섹션·시트·다이얼로그 제목 |
| `.t-title3` | 17/24 | SemiBold | 카드 제목, 강조 행 |
| `.t-body1` | 16/24 | Regular | 기본 본문 |
| `.t-body2` | 15/22 | Regular | 보조 본문 |
| `.t-label` | 14/20 | SemiBold | 라벨, 작은 버튼 |
| `.t-caption1` | 13/18 | Regular | 설명, 조건 |
| `.t-caption2` | 11/14 | Medium | 날짜, 메타 |

색 보조: `.c-primary .c-sub .c-hint .c-danger .c-strong`

## 3. 그리드 — 4컬럼

- 화면 너비 390 기준, **좌우 여백 20 · 컬럼 4개 · 거터 12**
- 요소 너비는 `.grid` 안에서 `.span-1` ~ `.span-4`로만 정한다. 임의 px 너비 금지.
- 세로 간격은 4의 배수: `--s-1`(4) `--s-2`(8) `--s-3`(12) `--s-4`(16) `--s-6`(24) `--s-8`(32) … / 유틸 `.gap-*` `.pt-*` `.pb-*`
- 리스트·탭·앱바처럼 화면 끝까지 닿는 컴포넌트는 그리드 밖에 두되, 안쪽 여백이 이미 20으로 맞춰져 있다.
- 비교 보드에서 정렬을 보여주고 싶으면 `.phone` 맨 끝에 `<div class="grid-overlay"><i></i><i></i><i></i><i></i></div>`.

## 4. 버튼

| 변형 | 클래스 | 쓰임 |
|---|---|---|
| Primary | `.btn.btn-primary` | **화면당 1개**, 가장 중요한 다음 행동 |
| Secondary | `.btn.btn-secondary` | Primary 옆의 보조 행동, 같은 무게로 보여야 할 대안 |
| Outline | `.btn.btn-outline` | 중립적인 대안 (취소, 로그인/회원가입 중 한쪽) |
| Text | `.btn.btn-text` | 건너뛰기, 더보기 같은 약한 행동 |
| Danger | `.btn.btn-danger` | 삭제·탈퇴 확정 |
| Disabled | `.btn.disabled` | 조건 미충족 |

크기: `.btn-l` 56(하단 CTA) · 기본 48 · `.btn-s` 36(카드 안) · `.btn-xs` 28(리스트 행 안).
배치: `.btn-group`(같은 너비) · `.btn-group.ratio-1-2`(취소 1 : 확인 2) · `.btn-group.stack`(세로) · `.btn-block` · 그리드 `span-*`.
하단 고정 영역은 `.cta`(`.bordered` 선택).

## 5. 컴포넌트 목록

| 분류 | 클래스 |
|---|---|
| 화면 틀 | `.phone` `.statusbar` `.screen` `.homebar` |
| 앱바 | `.appbar`(`.center` `.large` `.bordered`) `.appbar-title` `.ic-btn` |
| 아이콘 자리 | `.ic` + `.ic-back` `.ic-close` `.ic-more` `.ic-chevron` `.ic-search` `.ic-bell` `.ic-menu` `.ic-home` |
| 입력 | `.field` `.field-label` `.input`(`.focus` `.error` `.filled` `.box`) `.field-help` `.search` `.otp` |
| 선택 | `.checkbox` `.radio` `.switch`(`.on`) `.segmented` `.chips` `.chip`(`.on`) |
| 표시 | `.badge`(`.dot`) `.tag`(`.primary` `.danger` `.success`) `.progress` `.steps` |
| 리스트 | `.list` `.list-item`(`.divided`) `.li-body` `.li-title` `.li-sub` `.li-value` `.section-title` `.section-gap` `.divider` |
| 카드·안내 | `.card`(`.raised` `.filled` `.selected`) `.notice`(`.info` `.warning` `.danger`) `.banner` |
| 자리표시 | `.ph`(`.r-16-9` `.r-1-1` `.r-4-3`) `.thumb` `.avatar` `.app-icon` `.skel` |
| 내비 | `.tabs`(`.scroll`) `.navbar`(`--tabs:N`) |
| 오버레이 | `.scrim` `.sheet` `.sheet-title` `.dialog` `.toast` `.fab` |
| 주석 | `.fix` `.bad` (`.pad`) `.n` (`.l` `.bad-n` `.good-n`) · 참고 사례 `.mark.good` `.pane-tag.ref` / `.shot` `.mark`(`.fill`) `.redact` / `.capture` `.board` `.compare` `.pane` `.pane-tag` `.notes` `.note` |

## 6. 그리는 순서

1. 원본에서 **요소 목록**만 뽑는다: 이 화면에 있어야 하는 정보·행동 (예: 앱 로고, 환영 문구, 로그인, 회원가입).
2. 각 요소를 **컴포넌트에 대응**시킨다 (환영 문구 → `.t-title1` + `.t-body2`, 로그인 → `.btn-outline` …). 대응표를 PR 본문에 적는다.
3. 4컬럼 그리드에 배치하고 Primary가 1개인지 확인한다.
4. 바뀐 부분에만 `.fix` + 번호.
5. `kit/components.png`와 나란히 놓고 봤을 때 같은 시스템으로 보이는지 확인한다.

**금지**: 원본 스크린샷을 배경에 깔고 덧그리기, 원본 브랜드 색·폰트·아이콘 재현, `style=""`로 색·폰트·크기 지정(위치·너비 예외는 그리드로 해결이 안 될 때만).
