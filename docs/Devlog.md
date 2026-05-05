# Devlog — quant-project

> 개발 진행 내용, 결정사항, 이슈 및 변경 이력
> 최종 업데이트: 2026-04-26 (규칙/전략 명칭 정합성 수정)

---

## 현재 진행 상태

| 단계 | 기능 | 상태 |
|------|------|------|
| 1 | Portfolio View 재구성 | ✅ 완료 |
| 2 | Strategy Management | ✅ 완료 |
| 3 | Execution Engine | ✅ 완료 (API 키 연동 제외) |
| 4 | Auto Trading | ⬜ 예정 |
| 5 | 외부 서비스 전환 | ⬜ 예정 |
| 6 | 글로벌 확장 | ⬜ 예정 |

---

## 1단계: Portfolio View 재구성

### 구현 완료 파일

| 파일 | 내용 |
|------|------|
| `types/index.ts` | Position, Trade, Portfolio, Strategy, Signal 등 전체 타입 정의 |
| `services/dataService.ts` | DataService 인터페이스 (Portfolio/Strategy CRUD) |
| `services/localStorageService.ts` | localStorage 구현체. key: `qp_portfolios`, `qp_strategies` |
| `services/supabaseService.ts` | Supabase 스켈레톤 (추후 교체용) |
| `store/portfolioStore.ts` | Zustand 스토어. 포트폴리오 CRUD, 종목 관리, 가격 업데이트, DnD 순서 보존 |
| `features/portfolio/utils/calc.ts` | 포트폴리오 지표 계산 (총자산, 매입금액, 손익, 비중) |
| `features/portfolio/hooks/usePortfolioData.ts` | 초기 로드 + 자동 시세 갱신 훅 |
| `features/portfolio/components/SummaryCards.tsx` | Total Assets / Total Invested / P&L 요약 카드 3개 |
| `features/portfolio/components/StockList.tsx` | DnD 드래그 정렬 테이블. 더블클릭 편집. 비중 프로그레스바 |
| `features/portfolio/components/TreemapView.tsx` | Recharts Treemap. 수익률 기반 색상. 더블클릭 편집 |
| `features/portfolio/components/PositionModal.tsx` | 종목 추가/편집 모달. 티커 검색 → 종목명·섹터 자동기입 |
| `features/portfolio/components/PortfolioView.tsx` | 전체 오케스트레이션. List/Map 뷰 토글, 헤더, 시세 갱신 버튼 |
| `app/actions.ts` | Server Functions. `lookupTicker`, `getStockPrices`, `getStockPrice` |
| `app/page.tsx` | PortfolioView 렌더링 |
| `app/layout.tsx` | 타이틀, 다크모드 기반 레이아웃 |
| `app/globals.css` | 다크 배경(`#030712`) + `.input-glass` 유틸리티 |
| `backend/app/main.py` | FastAPI 앱. CORS: localhost:3000, 5173 허용 |
| `backend/app/api/stock.py` | `/api/stock/lookup`, `/api/stock/prices` 엔드포인트 |

---

### UI 구성

- **배경**: `bg-gray-950` 다크모드
- **카드**: 글래스모피즘 (`bg-white/5 backdrop-blur-md border border-white/10`)
- **수익**: `text-emerald-400` / 손실: `text-rose-400`
- **헤더**: 포트폴리오명 + 시세갱신 버튼 + List/Map 토글 + 종목추가 버튼
- **List 뷰**: 티커 / 종목명 / 수량 / 매입금액 / 평균단가 / 현재가 / 평가금액(+수익률) / 등락률 / 비중
- **Map 뷰**: Treemap (수익률 강도별 초록/빨강 그라디언트)

---

### 주요 설계 결정

#### 시세 API 구조
- **결정**: Next.js Server Action에서 Yahoo Finance 직접 호출 → FastAPI 백엔드 경유로 변경
- **이유**: Node.js undici(Next.js fetch)의 TLS 핑거프린트가 브라우저/curl과 달라 Yahoo Finance에서 지속 차단(429). 코드 레벨 우회 불가.
- **구조**: `Next.js actions.ts → FastAPI /api/stock/* → Python yfinance`
- **장점**: yfinance가 Yahoo Finance 세션을 자동 관리. 배포 환경에서 `BACKEND_URL` env만 교체하면 됨.

#### DnD 종목 순서 보존
- `positions`를 `Record<string, Position>`으로 관리하되, Zustand의 `reorderPositions`에서 orderedSymbols 순서대로 새 객체 재구성
- `@hello-pangea/dnd` 사용. 드래그 중 스타일: 테이블 행 분리 방지를 위해 `display: table` 계열 적용

#### DataService 추상화
- `localStorageService` ↔ `supabaseService` 교체 시 컴포넌트/스토어 수정 불필요
- 현재 `portfolioStore.ts`에서 `localStorageService`를 직접 import. 추후 DI 패턴으로 교체 예정.

---

### 이슈 및 해결

| 이슈 | 원인 | 해결 |
|------|------|------|
| 시세 갱신 미작동 | Yahoo Finance가 Node.js undici TLS 핑거프린트 차단 | FastAPI + yfinance로 우회 |
| 삭제 버튼 안 보임 | `<tr>`에 `group` 클래스 누락으로 hover 미동작 | `group` 클래스 추가 |
| Treemap 타입 에러 | `TreeNode`에 index signature 없음 | `[key: string]: unknown` 추가 |
| 백엔드 포트 충돌 | 이미 실행 중인 uvicorn 프로세스 있음 | 기존 프로세스 재사용 |
| `fc.yahoo.com` 404 | Yahoo Finance 쿠키 발급 경로 변경됨 | `guce.yahoo.com/consent`로 수정 (최종 yfinance로 대체) |

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

### 환경 변수 (`frontend/.env.local`)
```
BACKEND_URL=http://localhost:8000
```

---

## 2단계: Strategy Management

### 구현 완료 파일

| 파일 | 내용 |
|------|------|
| `store/strategyStore.ts` | Zustand 스토어. 전략 CRUD + 조합(Composition) 관리. localStorage 직접 사용 |
| `features/strategy/hooks/useStrategyData.ts` | 스토어 초기화 훅 (마운트 시 loadStrategies 호출) |
| `features/strategy/components/StrategyList.tsx` | 전략 카드 목록. 상태 뱃지, 시장 뱃지, 활성/중지 토글, 코드 보기, 수정, 삭제 |
| `features/strategy/components/StrategyFormModal.tsx` | 전략 추가/수정 모달. 이름·설명·시장·트리거 입력 + AI 자연어→Python 코드 변환 |
| `features/strategy/components/StrategyCodeModal.tsx` | Monaco Editor 기반 Python 코드 편집기 (full-screen 모달) |
| `features/strategy/components/CompositionPanel.tsx` | 전략 패널. 규칙별 필수/옵션 지정, 전략 CRUD, 활성/비활성 토글 |
| `features/strategy/components/StrategyView.tsx` | 전체 오케스트레이션. 2열 레이아웃 (전략 목록 + 조합 패널) |
| `app/strategy/page.tsx` | `/strategy` 라우트 |
| `app/actions.ts` | `convertStrategyText` Server Action 추가. Anthropic SDK로 claude-sonnet-4-6 호출 |

---

### AI 전략 변환 구조

- **입력**: 자연어 전략 설명 + 시장(US/KR/ALL)
- **처리**: `convertStrategyText` Server Action → Anthropic claude-sonnet-4-6
- **출력**: `initialize(context)` + `generate_signal(data, portfolio, params, context)` 표준 인터페이스 Python 코드
- **필요 환경변수**: `ANTHROPIC_API_KEY` (`.env.local`)

### 전략 (Composition)

- 2개 이상 규칙을 묶어 전략으로 구성
- 규칙별로 **필수** (모두 충족해야 신호 발생) / **옵션** (충족 시 신호 강도 보완) 개별 지정
- 전략별 활성/비활성 토글 지원
- localStorage key: `qp_compositions`

---

### 주요 설계 결정

#### setState-in-effect 패턴 제거
- **문제**: `useEffect` 안에서 `setState` 동기 호출 시 ESLint `react-hooks/set-state-in-effect` 에러
- **해결**: `useState(() => initial?.field ?? default)` lazy initializer 패턴으로 교체. 모달은 열릴 때마다 새로 마운트되므로 lazy init으로 충분.

---

### 이슈 및 해결

| 이슈 | 원인 | 해결 |
|------|------|------|
| ESLint set-state-in-effect 에러 | PositionModal, StrategyFormModal에서 useEffect 내 setState | useState lazy initializer로 교체 |
| EMPTY_TRIGGER unused 경고 | StrategyFormModal에서 선언 후 미사용 | 제거 |

---

## 3단계: Execution Engine

### 구현 완료 파일

**백엔드**

| 파일 | 내용 |
|------|------|
| `backend/app/models/execution.py` | SignalRecord, StrategyJob, RunStrategyRequest 등 Pydantic 모델 |
| `backend/app/services/market_data.py` | yfinance 기반 시세 추상화. pykis 교체 대비 레이어 분리 |
| `backend/app/services/strategy_runner.py` | 전략 Python 코드 exec() 실행. initialize → universe 수집 → 시세 조회 → generate_signal |
| `backend/app/services/execution_engine.py` | APScheduler BackgroundScheduler 기반 폴링 엔진. 전략별 잡 등록/제거/수동 실행 |
| `backend/app/services/notification.py` | 카카오 나에게 보내기. KAKAO_ACCESS_TOKEN 없으면 콘솔 로그 출력 |
| `backend/app/api/execution.py` | 전략 등록/제거/수동실행/상태조회/신호조회 API |
| `backend/app/main.py` | lifespan으로 엔진 시작/종료, execution router 추가 |

**프론트엔드**

| 파일 | 내용 |
|------|------|
| `types/index.ts` | StockQuote, TickerInfo를 types로 이동. SignalRecord, StrategyJob, WatchlistItem 추가 |
| `store/executionStore.ts` | 엔진 상태·신호·관심종목 관리. 백엔드 API 호출 포함 |
| `features/navigation/Nav.tsx` | Execution 탭 추가 |
| `features/execution/hooks/useExecutionData.ts` | 10초 폴링으로 엔진 상태·신호 자동 갱신 |
| `features/execution/components/EngineControl.tsx` | 활성 전략 등록·수동 실행·에러 표시 |
| `features/execution/components/SignalFeed.tsx` | 신호 피드 (BUY/SELL/HOLD, 현재가, 사유, 알림 여부) |
| `features/execution/components/WatchlistPanel.tsx` | 관심 종목 추가/삭제/가격 표시 |
| `features/execution/components/ExecutionView.tsx` | 전체 오케스트레이션. 2열 레이아웃 |
| `app/execution/page.tsx` | `/execution` 라우트 |

---

### 실행 흐름

```
Strategy 탭에서 전략 활성(active) 상태로 설정
      ↓
Execution 탭 → "등록 + 실행" 버튼
      ↓
백엔드 APScheduler에 전략 잡 등록
      ↓
전략 코드 exec() → universe 확인 → yfinance 시세 수집 → generate_signal
      ↓
신호 발생 시 카카오 알림 (키 없으면 콘솔 로그)
      ↓
프론트 신호 피드에 10초 폴링으로 표시
```

---

### API 키 연동 대기 중

| 항목 | 환경변수 | 연동 방법 |
|------|----------|----------|
| 카카오 나에게 보내기 | `KAKAO_ACCESS_TOKEN` | `.env`에 추가만 하면 자동 활성화 |
| 한국투자증권 OpenAPI (pykis) | 별도 설정 | `market_data.py` pykis 교체 예정 |

---

### 주요 설계 결정

#### 시세 추상화 레이어 분리
- `market_data.py`를 별도 서비스로 분리해 yfinance → pykis 교체 시 다른 코드 수정 불필요
- 한국 종목은 yfinance 심볼에 `.KS` 접미사 자동 추가

#### APScheduler vs FastAPI BackgroundTasks
- `BackgroundTasks`는 단발성 실행만 지원 → 반복 폴링에 부적합
- `APScheduler BackgroundScheduler` 채택. 전략별 cron 또는 기본 5분 인터벌 지원

#### 전략 코드 실행 방식
- `exec()`로 사용자 Python 코드 실행. 개인 도구이므로 허용
- `initialize(context)` 실행 후 `context['universe']`로 감시 종목 결정
- 실행 오류는 `StrategyJob.last_error`에 저장, 프론트에서 표시

---

### 이슈 및 해결

| 이슈 | 원인 | 해결 |
|------|------|------|
| StockQuote 타입 미정의 | actions.ts 로컬 선언이 types에 없었음 | types/index.ts로 이동, actions.ts에서 re-export |
| set-state-in-effect 에러 | useEffect 내 async 함수 호출 시 linter가 transitively setState 감지 | `.then(cb)` 패턴으로 변경해 직접 호출이 아님을 명시 |

---

## 아키텍처 검토 (2026-04-26)

### 현재 구조가 버티는 규모

| 시나리오 | 현재 구조로 OK? | 비고 |
|----------|----------------|------|
| 전략 20개 동시 실행 | ✅ | APScheduler 충분 |
| 종목 100개 트래킹 | ✅ | yfinance bulk 가능 |
| 신호 히스토리 조회 | ⚠️ | 재시작 시 소실 (DB 필요) |
| 멀티유저 SaaS 확장 | ❌ | exec 격리 + Auth + DB 필요 |

---

### 잘 잡힌 설계 결정

| 항목 | 이유 |
|------|------|
| DataService 추상화 | localStorage → Supabase 전환 시 컴포넌트 수정 없이 service 파일만 교체 |
| `market_data.py` 분리 | yfinance → pykis 교체 시 이 파일만 수정, 다른 코드 불변 |
| Strategy 표준 인터페이스 | `initialize` + `generate_signal` 규격 고정 → 실행 엔진이 전략 내용 몰라도 됨 |
| APScheduler 선택 | BackgroundTasks(단발성) 대신 잡 단위 반복 관리, 다수 전략 동시 실행 지원 |

---

### 기술 부채 및 보완 계획

#### 1. 신호(Signal) 휘발성 — **우선순위 높음**
- **현재**: 백엔드 메모리 `deque(maxlen=200)` → 서버 재시작 시 전체 소실
- **영향**: 매매 판단 근거 데이터가 날아감, 신호 이력 추적 불가
- **해결**: Stage 5 DB 전환(Supabase) 시 `signals` 테이블 persist로 해결 예정

#### 2. 프론트 10초 폴링 — **Stage 4에서 해결 예정**
- **현재**: `useExecutionData`에서 10초 인터벌로 상태·신호 polling
- **영향**: 전략/종목 수 증가 시 서버 부하 누적 가능
- **해결**: Stage 4 자동매매 구현 시 WebSocket으로 전환 예정 (이미 로드맵에 포함)

#### 3. `exec()` 격리 없음 — **개인 도구 기준 허용**
- **현재**: 사용자 전략 코드를 격리 없이 exec() 실행
- **영향**: 개인 도구이므로 보안 위험 없음. 멀티유저 확장 시에는 subprocess 격리 필요
- **해결**: 외부 서비스 전환(Stage 5) 시 재검토

#### 4. prompt 타입 훅 (2단계 하네스) — **Stage 4 Auto Trading 때 도입**
- **현재**: command 타입 훅만 적용 (guard.sh, quality-gate.sh)
- **영향**: 구현 방향 자체의 오류는 잡지 못함
- **해결**: Auto Trading 작업 시작 전 PreToolUse에 prompt 타입 훅 추가
  - 파일 수정 전 LLM이 "기존 타입/상태에 영향을 주는지" 판단
  - 도입 완료 시 이 항목 삭제

#### 5. 인증 없음 — **Stage 5에서 해결 예정**
- **현재**: 로컬 전용, 인증 없음
- **해결**: Supabase Auth 연동 예정. 그 전까지 외부 노출 금지

---

### 결론

개인 플랫폼 → 자동 매매(Stage 4)까지 현재 구조로 충분히 진행 가능. **구조 변경 없이** Stage 5 DB 전환 때 신호 persist 추가하는 것이 유일한 선행 기술 부채.

---

## 2단계 보완: 규칙/전략 명칭 정합성 수정 (2026-04-26)

### 문제
기획서에서 정의한 Rule(규칙) → Strategy(전략) 계층 구조가 코드에 반영되지 않았음.
- 기획서: 규칙(개별 조건) → 전략(규칙 묶음, 필수/옵션 구분)
- 기존 코드: "전략 목록"(개별 코드 단위) + "전략 조합"(AND/OR 결합) — 명칭 역전 상태

### 수정 내용

| 파일 | 변경 내용 |
|------|----------|
| `types/index.ts` | `StrategyComposition`에서 `strategy_ids + operator('AND'\|'OR')` 제거 → `rules: StrategyRule[]` 추가 (`StrategyRule = { rule_id, required }`) |
| `features/strategy/components/StrategyList.tsx` | "전략 목록" → "규칙 목록", "+ 전략 추가" → "+ 규칙 추가" |
| `features/strategy/components/StrategyFormModal.tsx` | 모달 제목/레이블 "전략" → "규칙" |
| `features/strategy/components/CompositionPanel.tsx` | "전략 조합" → "전략". AND/OR 토글 제거, 규칙별 필수/옵션 토글로 전면 교체 |

### 필수/옵션 로직
- **필수 규칙**: 모두 충족해야 신호 발생 (AND 조건)
- **옵션 규칙**: 충족 시 신호 보완, 미충족 시에도 신호 발생 가능
- 전략 생성 폼에서 각 규칙마다 필수/옵션 토글로 개별 지정

---

## 다음 작업 예정 (4단계: Auto Trading)

- 한국투자증권 OpenAPI + pykis 연동 (시세 + 주문)
- 자동 진입/청산 로직
- 안전 장치 (주문 상한, 일간 손실 제한, 긴급 종료)
