# 불편한UI

쓰다가 불편했던 앱 화면을 기록하고, 고쳐 그려봅니다.

## 흐름

1. 폰에서 캡처 / 화면 녹화
2. GitHub 앱 → 이 저장소 → Issues → New → **불편한 UI 제보** 템플릿 작성 + 첨부
3. Actions가 자동으로: 첨부 다운로드(영상은 프레임 추출) → Claude가 분석·수정안·와이어프레임 작성 → PR 생성 → 폰 알림
4. PR 검토. 고칠 게 있으면 PR에 `@claude ...` 댓글
5. Merge → GitHub Pages 블로그에 게시
6. (2단계) `cards.json` → Canva 카드뉴스 → Instagram

## 구성

| 경로 | 역할 |
|---|---|
| `.github/ISSUE_TEMPLATE/ux-report.yml` | 제보 양식 |
| `.github/workflows/process-issue.yml` | 이슈 → PR (저장소 주인이 연 `ux` 이슈만) |
| `.github/workflows/revise.yml` | PR의 `@claude` 댓글로 수정 |
| `.github/workflows/pages.yml` | main 머지 → 블로그 배포 |
| `.claude/skills/uncomfortable-ui/` | 분석·와이어프레임·글쓰기 규칙 |
| `kit/wire.css` | 와이어프레임 스타일 키트 |
| `tools/` | fetch-media(첨부·프레임), render(HTML→PNG), build-site |
| `posts/` | 발행된 글 |

## 로컬에서

```bash
npm install
node tools/fetch-media.mjs <이슈번호>      # gh 로그인 필요
node tools/render.mjs posts/<글>/src/*.html  # Chrome 필요
npm run preview
```
