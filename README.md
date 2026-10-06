# 불편한UI

이 UI, 이렇게 고쳐보면 어떨까?

## 흐름

1. 폰에서 캡처 / 화면 녹화
2. GitHub 앱 → 이 저장소 → Issues → New → **불편한 UI 제보** 템플릿 작성 + 첨부
3. Actions가 자동으로: 첨부 다운로드(영상은 프레임 추출) → Claude가 분석·수정안·와이어프레임 작성 → PR 생성 → 폰 알림
4. PR 검토. 고칠 게 있으면 PR에 `@claude ...` 댓글
5. Merge → GitHub Pages 블로그에 게시
6. 블로그 배포 → 카드뉴스 6장 생성 → "인스타 게시 대기" 이슈 + 알림 → 댓글 `/게시` → Instagram 캐러셀

## 구성

| 경로 | 역할 |
|---|---|
| `.github/ISSUE_TEMPLATE/ux-report.yml` | 제보 양식 |
| `.github/workflows/process-issue.yml` | 이슈 → PR (저장소 주인이 연 `ux` 이슈만) |
| `.github/workflows/revise.yml` | PR의 `@claude` 댓글로 수정 |
| `.github/workflows/pages.yml` | main 머지 → 블로그 배포 |
| `.claude/skills/uncomfortable-ui/` | 분석·와이어프레임·글쓰기 규칙 |
| `kit/` | 디자인 시스템: `DESIGN.md`(규칙) · `components.png`(카탈로그) · `tokens.css` `components.css` `annotate.css` → `wire.css` · `logo.svg` |
| `tools/` | fetch-media(첨부·프레임) · render(HTML→PNG) · render-cards(카드뉴스) · build-site · publish-instagram · make-logo |
| `.github/workflows/instagram.yml` | 승인 이슈에 `/게시` 댓글 → Instagram 캐러셀 게시 |
| `posts/` | 발행된 글 |

## 로컬에서

```bash
npm install
node tools/fetch-media.mjs <이슈번호>      # gh 로그인 필요
node tools/render.mjs posts/<글>/src/*.html  # Chrome 필요
npm run preview
```
