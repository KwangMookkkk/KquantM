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
| 데이터 저장 | DataService 추상화 (현재 localStorage, 추후 Supabase) |
| 백엔드 | FastAPI (Python) — http://localhost:8000 |
| 시세 API (현재) | yfinance (국내/미국 — FastAPI 경유) |
| 시세 API (3단계~) | 한국투자증권 OpenAPI + pykis 라이브러리 (국내+미국 통합) |
| 알림 (3단계~) | 카카오 나에게 보내기 |
| 인증 (예정) | Supabase Auth |
| 결제 (예정) | 토스페이먼츠 → Stripe |

---

## 목표 폴더 구조

```
~/quant-project/
├── CLAUDE.md                  ← 자동화/개발 지침 (Claude Code 컨텍스트)
├── .claude/                   ← Claude Code 하네스 설정
│   ├── settings.json          ← hooks 설정
│   └── hooks/
│       ├── guard.sh           ← 위험 명령 차단 (PreToolUse)
│       └── quality-gate.sh    ← tsc/lint 자동 검사 (Stop)
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
4. **Rule → Strategy 계층**: 개별 조건(Rule)을 만들고 전략(Strategy)으로 묶음. 필수/옵션 규칙 구분
5. **단계적 확장**: View → 전략 → 실행 → 자동화 → 외부 서비스
6. **시세 API**: 현재는 FastAPI + yfinance 경유. 3단계부터 한국투자증권 OpenAPI + pykis로 전환
7. **문서 관리**: 기획/개발/자동화 최신 상태는 항상 docs/에 반영 후 git push
   - CLAUDE.md → Claude Code에서 "자동화 지침 최신화해서 CLAUDE.md 뽑아줘"
   - Product.md → 기획 채팅에서 "최신 기획 내용 정리본 Product.md로 뽑아줘"
   - Devlog.md → Claude Code에서 "개발 진행 내용 최신본 Devlog.md로 뽑아줘"

---

## 타입 정의 (types/index.ts 기준)

```typescript
export interface Position {
  id?: string
  symbol: string
  name: string
  sector: string
  quantity: number
  avg_cost: number
  currency: 'USD' | 'KRW'
  current_price?: number
  daily_change_rate?: number
  weight?: number
  total_cost?: number
  valueUsd?: number
}

export interface Trade {
  id: string
  symbol: string
  market: 'US' | 'KR'
  side: 'BUY' | 'SELL'
  quantity: number
  price: number
  currency: 'USD' | 'KRW'
  datetime: string
  fee: number
  note: string
  source: 'MANUAL' | 'STRATEGY' | 'AUTO'
}

export interface PortfolioSnapshot {
  date: string
  total_value: number
  cash: number
  positions_value: number
  daily_return: number
  cumulative_return: number
}

export interface Portfolio {
  id: string
  name: string
  base_currency: 'USD' | 'KRW'
  cash: number
  positions: Record<string, Position>
  trades: Trade[]
  snapshots: PortfolioSnapshot[]
}

export interface Strategy {
  id: string
  name: string
  description: string
  status: 'draft' | 'testing' | 'active' | 'stopped'
  market: 'US' | 'KR' | 'ALL'
  code: string
  params: Record<string, unknown>
  trigger: StrategyTrigger
  last_signal?: Signal
  created_at: string
  updated_at: string
}

export interface StrategyTrigger {
  type: 'schedule' | 'event' | 'manual'
  config?: {
    cron?: string
    condition?: string
  }
}

export interface StrategyRule {
  rule_id: string
  required: boolean
}

export interface StrategyComposition {
  id: string
  name: string
  rules: StrategyRule[]
  is_active: boolean
}

export interface Signal {
  symbol: string
  market: string
  action: 'BUY' | 'SELL' | 'HOLD'
  quantity: number | null
  price: number | null
  order_type: 'MARKET' | 'LIMIT'
  strategy_id: string
  generated_at: string
  reason: string
}
```

---

## DataService 추상화 구조

```typescript
// services/dataService.ts
interface DataService {
  getPortfolios(): Promise<Portfolio[]>
  savePortfolio(portfolio: Portfolio): Promise<void>
  deletePortfolio(id: string): Promise<void>
  getStrategies(): Promise<Strategy[]>
  saveStrategy(strategy: Strategy): Promise<void>
  deleteStrategy(id: string): Promise<void>
}

// services/localStorageService.ts — 현재 구현체
// localStorage key: 'quant_portfolios', 'quant_strategies'

// services/supabaseService.ts — 껍데기만 (추후 교체용)

// 사용처
export const dataService: DataService = new LocalStorageService()
```

---

## Zustand 스토어 구조

```typescript
// store/portfolioStore.ts
interface PortfolioStore {
  portfolios: Portfolio[]
  activePortfolioId: string | null
  setActivePortfolio: (id: string) => void
  addPortfolio: (portfolio: Portfolio) => void
  updatePortfolio: (portfolio: Portfolio) => void
  deletePortfolio: (id: string) => void
  addTrade: (portfolioId: string, trade: Trade) => void
}

// store/strategyStore.ts
interface StrategyStore {
  strategies: Strategy[]
  compositions: StrategyComposition[]
  addStrategy: (strategy: Strategy) => void
  updateStrategy: (strategy: Strategy) => void
  deleteStrategy: (id: string) => void
  addComposition: (composition: StrategyComposition) => void
}
```

---

## UI/UX 기준 (baco 프로토타입과 동일하게 유지)

- 다크모드: `bg-gray-950` 기반
- 글래스모피즘: `bg-gray-900/50 backdrop-blur`
- 헤더 그라디언트: `from-blue-400 to-teal-400`
- 배경 효과: `radial-gradient from-blue-900/20`
- 수익: `text-green-400`, 손실: `text-red-400`
- 카드 테두리: `border border-gray-800`
- 테이블: `bg-gray-900 rounded-xl border border-gray-800`

---

## 주요 기능 동작 기준

### 시세 갱신 (actions.ts)
- Yahoo Finance 직접 fetch (yahoo-finance2 라이브러리 사용 금지)
- URL: `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=1d`
- User-Agent 헤더 필수 (차단 우회)
- 병렬 비동기: `Promise.all()`

### 종목 검색 (api/stock/route.ts)
- Yahoo Finance 직접 fetch (라이브러리 사용 금지)
- 반환: symbol, name, currency, current_price, daily_change_rate, sector

### localStorage
- key: `quant_portfolios` (baco의 `baco_portfolio_data` 아님)

### DnD (StockList)
- `@hello-pangea/dnd` 사용
- 드래그 중 스타일: `display: 'table'`, `tableLayout: 'fixed'` (width: 100% 사용 금지)

### Execution Engine (3단계 설계 기준)

**시세 API**
- 한국투자증권 OpenAPI + pykis 라이브러리
- 국내(KRX) + 미국(NYSE/NASDAQ) 통합 지원
- 현재 yfinance는 1~2단계 보조용으로 유지, 3단계부터 pykis로 전환

**트래킹 대상 (유니버스)**
- 전략 코드 안에서 `initialize(context)`로 직접 정의 (전략 스스로 감시 종목 결정)
- 사용자가 별도 지정한 관심 종목 목록도 병행 지원

**폴링 엔진**
- APScheduler BackgroundScheduler 기반 (BackgroundTasks는 단발성이라 부적합)
- 폴링 주기는 전략 단위로 설정 (`StrategyTrigger.config.cron` 활용)
- 준실시간 (초~분 단위 폴링), 실시간 WebSocket은 4단계에서 검토

**알림 채널**
- 카카오 나에게 보내기
- 알림 내용: 종목명, 신호(BUY/SELL), 현재가, 충족된 규칙 목록

**실행 모드**

| 모드 | 설명 |
|------|------|
| 백테스트 | 과거 데이터로 전략 검증 |
| 페이퍼 트레이딩 | 실제 체결 없이 모의 실행 |
| 실거래 알림 | 신호 발생 시 알림, 실제 주문은 사용자가 직접 |

**실행 흐름**
```
한국투자증권 API로 시세 수신
      ↓
전략별 폴링 주기에 따라 규칙 체크
      ↓
필수 규칙 모두 충족 시 신호 발생
      ↓
카카오 나에게 보내기로 알림 전송
      ↓
사용자가 직접 증권사 앱에서 매매
```

---

## 백엔드 구조 (FastAPI)

### 환경
- Python 3.14.4
- 가상환경: ~/quant-project/backend/venv/
- 실행: uvicorn app.main:app --reload
- Swagger UI: http://localhost:8000/docs

### 설치된 패키지
- fastapi — 웹 프레임워크
- uvicorn — ASGI 서버
- pandas — 데이터 처리
- numpy — 수치 계산
- yfinance — 주식 시세 (현재 1~2단계용)
- pykis — 한국투자증권 OpenAPI 클라이언트 (3단계 Execution Engine부터 사용)

### 백엔드 실행 방법
```bash
cd ~/quant-project/backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### 백엔드 폴더 역할
| 폴더 | 역할 |
|------|------|
| app/api/ | API 라우터 |
| app/core/ | 설정, 공통 유틸 |
| app/models/ | 데이터 모델 |
| app/services/ | 비즈니스 로직 (전략 실행, 시세 조회 등) |

### 키움 OpenAPI 제외 이유
- Windows 전용 (32bit COM 방식), Mac 미지원
- 대안: 한국투자증권 OpenAPI (REST + WebSocket, Mac 지원) + pykis 라이브러리

---

## 로컬 서버 실행 방법

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

---

## 현재 작업 상태

| 단계 | 기능 | 상태 |
|------|------|------|
| 1 | Portfolio View 재구성 | ✅ 완료 |
| 2 | Strategy Management | ✅ 완료 |
| 3 | Execution Engine | ✅ 완료 (API 키 연동 제외) |
| 4 | Auto Trading | ⬜ 예정 |
| 5 | 외부 서비스 전환 (Auth + DB + 결제) | ⬜ 예정 |
| 6 | 글로벌 확장 (i18n, Stripe) | ⬜ 예정 |

### 1단계 — Portfolio View 세부 진행 상태

| 파일 | 상태 |
|------|------|
| types/index.ts | ✅ 완료 |
| services/dataService.ts | ✅ 완료 |
| services/localStorageService.ts | ✅ 완료 |
| services/supabaseService.ts | ✅ 완료 (껍데기) |
| store/portfolioStore.ts | ✅ 완료 |
| store/strategyStore.ts | ✅ 완료 |
| features/portfolio/components/SummaryCards.tsx | ✅ 완료 |
| features/portfolio/components/StockList.tsx | ✅ 완료 |
| features/portfolio/components/TreemapView.tsx | ✅ 완료 |
| features/portfolio/components/PositionModal.tsx | ✅ 완료 |
| features/portfolio/components/PortfolioView.tsx | ✅ 완료 |
| features/portfolio/hooks/usePortfolioData.ts | ✅ 완료 |
| features/portfolio/utils/calc.ts | ✅ 완료 |
| features/navigation/Nav.tsx | ✅ 완료 |
| app/actions.ts | ✅ 완료 |
| app/page.tsx | ✅ 완료 |
| app/layout.tsx | ✅ 완료 |

### 2단계 — Strategy Management 세부 진행 상태

| 파일 | 상태 |
|------|------|
| app/strategy/page.tsx | ✅ 완료 |
| features/strategy/hooks/useStrategyData.ts | ✅ 완료 |
| features/strategy/components/StrategyView.tsx | ✅ 완료 |
| features/strategy/components/StrategyList.tsx | ✅ 완료 |
| features/strategy/components/StrategyFormModal.tsx | ✅ 완료 |
| features/strategy/components/StrategyCodeModal.tsx | ✅ 완료 |
| features/strategy/components/CompositionPanel.tsx | ✅ 완료 |

### 3단계 — Execution Engine 세부 진행 상태

| 파일 | 상태 |
|------|------|
| types/index.ts (StockQuote, SignalRecord, StrategyJob, WatchlistItem 추가) | ✅ 완료 |
| store/executionStore.ts | ✅ 완료 |
| features/navigation/Nav.tsx (Execution 탭 추가) | ✅ 완료 |
| features/execution/hooks/useExecutionData.ts | ✅ 완료 |
| features/execution/components/ExecutionView.tsx | ✅ 완료 |
| features/execution/components/EngineControl.tsx | ✅ 완료 |
| features/execution/components/SignalFeed.tsx | ✅ 완료 |
| features/execution/components/WatchlistPanel.tsx | ✅ 완료 |
| app/execution/page.tsx | ✅ 완료 |
| backend/app/models/execution.py | ✅ 완료 |
| backend/app/services/market_data.py | ✅ 완료 (yfinance) |
| backend/app/services/strategy_runner.py | ✅ 완료 |
| backend/app/services/execution_engine.py | ✅ 완료 (APScheduler) |
| backend/app/services/notification.py | ✅ 완료 (카카오 키 대기 중) |
| backend/app/api/execution.py | ✅ 완료 |
| backend/app/main.py (lifespan + execution router) | ✅ 완료 |

---

## Git 관리

### 문서 최신화 후 push 방법
```bash
cd ~/quant-project
git add .
git commit -m "docs: 최신 문서 업데이트"
git push
```

## Git 정보

- GitHub ID: KwangMookkkk
- 레포: https://github.com/KwangMookkkk/KquantM.git

---

## 메일 알림

- 작업 완료 시: `python3 ~/notify.py 완료` → 메일 내용: "완료"
- 작업 중단 시: `python3 ~/notify.py 중단` → 메일 내용: "중단. 멈춘 시각: HH:MM:SS"
- notify.py 위치: ~/notify.py (홈 폴더)
- 실행 시점: 모든 작업 완료 후 또는 3회 재시도 실패로 중단 시 반드시 실행

---

## 작업 규칙

- 에러 발생 시 수정 후 재시도, 포기하지 말 것
- 타입 오류는 any 처리 금지 — 올바른 타입으로 해결
- 컴포넌트에서 DataService 직접 호출 금지 — 반드시 Zustand store 통해서
- `// @ts-nocheck` 사용 금지

---

## 핸드오프 문서 업데이트 규칙

- 파일 하나 완성될 때마다 이 문서(CLAUDE.md)의 세부 진행 상태 표에서 해당 항목 ⬜ → ✅ 로 변경
- 전체 재작성 금지 — 상태값만 변경
- 새로 생성한 파일은 세부 진행 상태 표에 추가
- 설계 결정사항이 생기면 "핵심 설계 원칙" 항목에 추가
- 업데이트 완료 후 `python3 ~/notify.py 완료` 실행

---

## 에이전트 하네스 규칙

### 구현 전 반론 검토 절차 (모든 기능 추가/수정 시 필수)
1. 수정 범위와 접근 방식을 먼저 텍스트로 작성
2. 예상 부작용 및 타입/상태 영향 범위 명시
3. 대안 접근법이 있다면 비교 후 선택 이유 기록
4. 스스로 반론 역할로 한 번 검토 — "이 접근법의 문제점은 무엇인가?"
5. 위 내용을 commit 메시지 초안에 포함
→ 검토 완료 후 APPLY(구현) 단계 진행

### 프론트엔드 검증 절차 (파일 하나 완성할 때마다 반드시 수행)
1. `tsc --noEmit` 타입 체크
2. `npm run lint` ESLint 검사
3. `npm run build` 빌드 확인
4. `npm run start` 실행 확인 (빌드 후 정상 실행 여부)
5. 모두 통과해야만 `git commit` 허용
6. 실패 시 스스로 수정 후 재시도
7. 3회 재시도 후에도 실패하면 작업 중단

### 백엔드 검증 절차 (1~2단계는 참고용, 3단계 Execution Engine부터 필수 적용)
1. `mypy app/` Python 타입 체크
2. `flake8 app/` 문법/스타일 검사
3. `uvicorn app.main:app` 서버 실행 확인
4. `http://localhost:8000/docs` Swagger UI 정상 응답 확인
5. 모두 통과해야만 `git commit` 허용
6. 실패 시 스스로 수정 후 재시도
7. 3회 재시도 후에도 실패하면 작업 중단

### 프론트-백엔드 연동 검증 (2단계부터 적용)
1. 백엔드 서버 실행 상태에서 프론트 빌드 확인
2. FastAPI API 엔드포인트 실제 호출 확인
3. 응답 타입이 프론트 타입 정의와 일치하는지 확인

### 자율 판단 규칙
- 애매한 부분이 생겨도 절대 질문하지 말 것
- 스스로 판단해서 구현할 것
- 판단한 내용과 근거를 commit 메시지에 상세히 기록할 것
- 예시: `feat: portfolioStore.ts 구현 / 판단: positions를 Record<string, Position> 대신 Position[]로 관리 — DnD 순서 보존 필요`
