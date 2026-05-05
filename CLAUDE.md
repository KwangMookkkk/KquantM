# quant-project/frontend — Claude Code 작업 지시서

> 이 파일은 Claude Code가 자동으로 읽는 컨텍스트입니다.
> 위치: ~/quant-project/frontend/CLAUDE.md

---

## 프로젝트 한 줄 정의

개인이 직접 작성한 퀀트 전략을 기반으로, 포트폴리오 관리부터 자동 매매까지 수행할 수 있는 투자 플랫폼.

- **레포**: https://github.com/KwangMookkkk/KquantM.git
- **baco 폴더**: UI/UX 참고용 프로토타입 (코드 구조는 버리고 화면 결과물만 유지)
- **실제 개발 위치**: ~/quant-project/

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 14+ (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| 전역 상태 | Zustand |
| 차트 | Recharts (Treemap 포함) |
| DnD | @hello-pangea/dnd |
| 시세 API | Yahoo Finance (Server Action — 직접 fetch 방식) |
| 데이터 저장 | DataService 추상화 (현재 localStorage, 추후 Supabase) |
| 백엔드 | FastAPI (Python) — http://localhost:8000 |
| 시세 API (국내) | pykrx |
| 시세 API (미국) | yfinance |
| 실거래 (예정) | 한국투자증권 OpenAPI (REST, Mac 지원) |
| 인증 (예정) | Supabase Auth |
| 결제 (예정) | 토스페이먼츠 → Stripe |

---

## 목표 폴더 구조

```
~/quant-project/
├── CLAUDE.md                  ← 자동화/개발 지침 (Claude Code 컨텍스트)
├── docs/                      ← 프로젝트 문서 총괄
│   ├── Product.md             ← 기획 채팅 산출물 (기획 최신 상태)
│   └── Devlog.md              ← 개발 진행 내용 (결정사항, 이슈, 변경 이력)
├── backend/                   ← FastAPI (Python)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   └── services/
│   └── venv/                  ← Python 가상환경
└── frontend/                  ← Next.js 14+
```

```
frontend/
├── app/
│   ├── (dashboard)/
│   │   └── page.tsx          ← 메인 대시보드 (컴포넌트 조립만)
│   ├── actions.ts            ← 서버 액션 (Yahoo Finance 직접 fetch)
│   ├── api/
│   │   ├── prices/route.ts
│   │   └── stock/route.ts
│   ├── layout.tsx
│   └── globals.css
├── features/
│   ├── portfolio/            ← 1단계 작업 대상
│   │   ├── components/
│   │   │   ├── SummaryCards.tsx
│   │   │   ├── StockList.tsx
│   │   │   ├── PortfolioTreemap.tsx
│   │   │   └── AddHoldingModal.tsx
│   │   ├── hooks/
│   │   │   └── usePortfolio.ts
│   │   └── utils/
│   │       └── portfolioCalculator.ts
│   ├── strategy/             ← 2단계 (예정)
│   ├── execution/            ← 3단계 (예정)
│   └── trading/              ← 4단계 (예정)
├── store/
│   ├── portfolioStore.ts
│   ├── strategyStore.ts
│   └── index.ts
├── services/
│   ├── dataService.ts
│   ├── localStorageService.ts
│   └── supabaseService.ts    ← 껍데기만
├── types/
│   └── index.ts
└── lib/
    └── utils.ts
```

---

## 핵심 설계 원칙

1. **DataService 추상화**: localStorage/DB 교체 시 컴포넌트 수정 없이 service 파일만 교체
2. **features/ 단위 모듈화**: 기능별 완전 독립. 다른 기능에 직접 import 금지
3. **전략-실행 분리**: 전략 정의 ≠ 실행. 실행은 별도 엔진에서
4. **단계적 확장**: View → 전략 → 실행 → 자동화 → 외부 서비스
5. **시세 API**: yahoo-finance2 라이브러리 사용 금지. 직접 fetch 방식만 사용
6. **문서 관리**: 기획/개발/자동화 최신 상태는 항상 docs/에 반영 후 git push

### 작업 완료 후 push 방법
모든 작업 완료 확인 후 아래 한 줄 입력
```bash
cd ~/quant-project && git push
```
