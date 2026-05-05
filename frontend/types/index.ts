// ─── Stock API ───────────────────────────────────
export interface StockQuote {
  price: number
  dailyChangeRate: number
}

export interface TickerInfo {
  name: string
  sector: string
  price: number
  dailyChangeRate: number
}

// ─── Position (보유 종목) ───────────────────────
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

// ─── Trade (거래 원장) ──────────────────────────
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

// ─── PortfolioSnapshot (일별 스냅샷) ────────────
export interface PortfolioSnapshot {
  date: string
  total_value: number
  cash: number
  positions_value: number
  daily_return: number
  cumulative_return: number
}

// ─── Portfolio ──────────────────────────────────
export interface Portfolio {
  id: string
  name: string
  base_currency: 'USD' | 'KRW'
  cash: number
  positions: Record<string, Position>
  trades: Trade[]
  snapshots: PortfolioSnapshot[]
}

// ─── Strategy ───────────────────────────────────
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

// ─── StrategyTrigger ────────────────────────────
export interface StrategyTrigger {
  type: 'schedule' | 'event' | 'manual'
  config?: {
    cron?: string
    condition?: string
  }
}

// ─── StrategyComposition ────────────────────────
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

// ─── Signal ─────────────────────────────────────
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

// ─── SignalRecord (백엔드 실행 엔진 신호) ──────────
export interface SignalRecord {
  id: string
  strategy_id: string
  strategy_name: string
  symbol: string
  market: string
  action: 'BUY' | 'SELL' | 'HOLD'
  quantity: number | null
  price: number | null
  current_price: number
  order_type: 'MARKET' | 'LIMIT'
  reason: string
  generated_at: string
  notified: boolean
}

// ─── StrategyJob (엔진 등록 전략) ─────────────────
export interface StrategyJob {
  strategy_id: string
  strategy_name: string
  market: string
  code: string
  params: Record<string, unknown>
  trigger_type: string
  cron: string | null
  last_run: string | null
  last_error: string | null
  run_count: number
}

// ─── WatchlistItem ────────────────────────────────
export interface WatchlistItem {
  symbol: string
  name: string
  market: 'US' | 'KR'
  added_at: string
}