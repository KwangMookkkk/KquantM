# quant-project — Claude Code 작업 지시서

> 이 파일은 Claude Code가 자동으로 읽는 컨텍스트입니다.
> 위치: ~/quant-project/CLAUDE.md

---

## 프로젝트 한 줄 정의

개인이 직접 작성한 퀀트 전략을 기반으로, 포트폴리오 관리부터 자동 매매까지 수행할 수 있는 투자 플랫폼.

- **레포**: https://github.com/KwangMookkkk/KquantM.git
- **실제 개발 위치**: ~/quant-project/

---

## 현재 작업 상태

| 단계 | 기능 | 상태 |
|------|------|------|
| 1 | Portfolio View | ✅ 완료 |
| 2 | Strategy Management | ✅ 완료 |
| 3 | Execution Engine | ✅ 완료 (API 키 연동 제외) |
| 4 | Auto Trading | ⬜ 예정 |
| 5 | 외부 서비스 전환 (Auth + DB + 결제) | ⬜ 예정 |
| 6 | 글로벌 확장 (i18n, Stripe) | ⬜ 예정 |

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
| 데이터 저장 | DataService 추상화 (현재 localStorage, 추후 Supabase) |
| 백엔드 | FastAPI (Python) — http://localhost:8000 |
| 시세 API (프론트) | Server Action → FastAPI 경유 |
| 시세 API (백엔드 국내) | pykrx |
| 시세 API (백엔드 미국) | yfinance |
| 실거래 (예정) | 한국투자증권 OpenAPI (REST, Mac 지원) |
| 인증 (예정) | Supabase Auth |
| 결제 (예정) | 토스페이먼츠 → Stripe |

---

## 폴더 구조 (실제 완성 상태)

```
~/quant-project/
├── CLAUDE.md
├── docs/
│   ├── Product.md
│   └── Devlog.md
├── backend/
│   └── app/
│       ├── main.py
│       ├── api/
│       ├── models/
│       └── services/
└── frontend/
```

```
frontend/
├── app/
│   ├── actions.ts               ← Server Action (lookupTicker, getStockPrices, convertStrategyText)
│   ├── page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   ├── strategy/page.tsx
│   └── execution/page.tsx
├── features/
│   ├── navigation/
│   │   └── Nav.tsx
│   ├── portfolio/               ✅ 완료
│   │   ├── components/
│   │   │   ├── PortfolioView.tsx
│   │   │   ├── SummaryCards.tsx
│   │   │   ├── StockList.tsx
│   │   │   ├── TreemapView.tsx
│   │   │   └── PositionModal.tsx
│   │   ├── hooks/usePortfolioData.ts
│   │   └── utils/calc.ts
│   ├── strategy/                ✅ 완료
│   │   ├── components/
│   │   │   ├── StrategyView.tsx
│   │   │   ├── StrategyList.tsx
│   │   │   ├── StrategyFormModal.tsx
│   │   │   ├── StrategyCodeModal.tsx
│   │   │   └── CompositionPanel.tsx
│   │   └── hooks/useStrategyData.ts
│   ├── execution/               ✅ 완료
│   │   ├── components/
│   │   │   ├── ExecutionView.tsx
│   │   │   ├── EngineControl.tsx
│   │   │   ├── SignalFeed.tsx
│   │   │   └── WatchlistPanel.tsx
│   │   └── hooks/useExecutionData.ts
│   └── trading/                 ⬜ 4단계 예정
├── store/
│   ├── portfolioStore.ts
│   ├── strategyStore.ts
│   └── executionStore.ts
├── services/
│   ├── dataService.ts
│   ├── localStorageService.ts
│   └── supabaseService.ts       ← 껍데기만
└── types/index.ts
```

---

## 타입 정의 (types/index.ts 기준)

```typescript
// 시세 API
interface StockQuote { price: number; dailyChangeRate: number }
interface TickerInfo { name: string; sector: string; price: number; dailyChangeRate: number }

// 포트폴리오
interface Position {
  id?: string; symbol: string; name: string; sector: string
  quantity: number; avg_cost: number; currency: 'USD' | 'KRW'
  current_price?: number; daily_change_rate?: number; weight?: number
}
interface Portfolio {
  id: string; name: string; base_currency: 'USD' | 'KRW'; cash: number
  positions: Record<string, Position>; trades: Trade[]; snapshots: PortfolioSnapshot[]
}

// 규칙 (개별 조건 코드 단위)
interface Strategy {
  id: string; name: string; description: string
  status: 'draft' | 'testing' | 'active' | 'stopped'
  market: 'US' | 'KR' | 'ALL'; code: string
  params: Record<string, unknown>; trigger: StrategyTrigger
  last_signal?: Signal; created_at: string; updated_at: string
}
interface StrategyTrigger {
  type: 'schedule' | 'event' | 'manual'
  config?: { cron?: string; condition?: string }
}

// 전략 (규칙 묶음 — 필수/옵션 구분)
interface StrategyRule { rule_id: string; required: boolean }
interface StrategyComposition {
  id: string; name: string; rules: StrategyRule[]; is_active: boolean
}

// 신호
interface Signal {
  symbol: string; market: string; action: 'BUY' | 'SELL' | 'HOLD'
  quantity: number | null; price: number | null
  order_type: 'MARKET' | 'LIMIT'; strategy_id: string
  generated_at: string; reason: string
}

// 실행 엔진
interface SignalRecord { id: string; strategy_id: string; strategy_name: string
  symbol: string; market: string; action: 'BUY' | 'SELL' | 'HOLD'
  quantity: number | null; price: number | null; current_price: number
  order_type: 'MARKET' | 'LIMIT'; reason: string; generated_at: string; notified: boolean
}
interface StrategyJob {
  strategy_id: string; strategy_name: string; market: string; code: string
  params: Record<string, unknown>; trigger_type: string; cron: string | null
  last_run: string | null; last_error: string | null; run_count: number
}
interface WatchlistItem { symbol: string; name: string; market: 'US' | 'KR'; added_at: string }
```

---

## 핵심 설계 원칙

1. **DataService 추상화**: localStorage/DB 교체 시 컴포넌트 수정 없이 service 파일만 교체
2. **features/ 단위 모듈화**: 기능별 완전 독립. 다른 기능에 직접 import 금지
3. **전략-실행 분리**: 전략 정의 ≠ 실행. 실행은 별도 엔진에서
4. **단계적 확장**: View → 전략 → 실행 → 자동화 → 외부 서비스
5. **시세 API**: 프론트에서 직접 Yahoo Finance 호출 금지. 반드시 FastAPI 백엔드 경유

---

## 작업 규칙

- 타입 오류는 `any` 처리 금지 — 올바른 타입으로 해결
- `// @ts-nocheck` 사용 금지
- 컴포넌트에서 DataService 직접 호출 금지 — 반드시 Zustand store 경유
- 에러 발생 시 수정 후 재시도, 포기하지 말 것

---

## 에이전트 하네스 규칙

### 구현 전 반론 검토 절차 (모든 기능 추가/수정 시 필수)
1. 수정 범위와 접근 방식을 먼저 텍스트로 작성
2. 예상 부작용 및 타입/상태 영향 범위 명시
3. 대안 접근법이 있다면 비교 후 선택 이유 기록
4. 스스로 반론 역할로 한 번 검토 — "이 접근법의 문제점은 무엇인가?"
→ 검토 완료 후 구현 단계 진행

### 검증 절차 (파일 완성할 때마다 수행)
1. `npx tsc --noEmit` 타입 체크
2. `npm run lint` ESLint 검사
3. `npm run build` 빌드 확인
4. 모두 통과해야만 `git commit` 허용
5. 실패 시 스스로 수정 후 재시도, 3회 실패 시 작업 중단

### 자동화 hooks (.claude/hooks/)
- **guard.sh** (PreToolUse): 위험 명령 차단 (rm -rf, git add -A, force push 등)
- **quality-gate.sh** (Stop): tsc 타입 체크 + ESLint 자동 실행

### 자율 판단 규칙
- 애매한 부분이 생겨도 절대 질문하지 말 것
- 스스로 판단해서 구현하고, 판단 근거를 commit 메시지에 기록

---

## 로컬 실행 방법

### 백엔드
```bash
cd ~/quant-project/backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### 프론트엔드
```bash
cd ~/quant-project/frontend
npm run dev
```

### 작업 완료 후 push
```bash
cd ~/quant-project && git add . && git commit -m "커밋 메시지" && git push
```
