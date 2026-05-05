'use client'

import { create } from 'zustand'
import { SignalRecord, StrategyJob, WatchlistItem } from '@/types'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
const WATCHLIST_KEY = 'qp_watchlist'

function loadWatchlist(): WatchlistItem[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(WATCHLIST_KEY)
  return raw ? JSON.parse(raw) : []
}

function saveWatchlist(items: WatchlistItem[]) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items))
}

interface ExecutionState {
  isEngineRunning: boolean
  activeJobs: StrategyJob[]
  signals: SignalRecord[]
  watchlist: WatchlistItem[]
  isLoading: boolean

  fetchStatus: () => Promise<void>
  fetchSignals: () => Promise<void>
  registerStrategy: (job: Omit<StrategyJob, 'last_run' | 'last_error' | 'run_count'>) => Promise<void>
  removeStrategy: (strategyId: string) => Promise<void>
  runNow: (strategyId: string) => Promise<SignalRecord[]>
  clearSignals: () => Promise<void>

  loadWatchlist: () => void
  addToWatchlist: (item: WatchlistItem) => void
  removeFromWatchlist: (symbol: string) => void
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  isEngineRunning: false,
  activeJobs: [],
  signals: [],
  watchlist: [],
  isLoading: false,

  fetchStatus: async () => {
    try {
      const res = await fetch(`${BACKEND}/api/execution/status`)
      if (!res.ok) return
      const data = await res.json()
      set({ isEngineRunning: data.is_running, activeJobs: data.jobs })
    } catch { /* 백엔드 미실행 시 무시 */ }
  },

  fetchSignals: async () => {
    try {
      const res = await fetch(`${BACKEND}/api/execution/signals?limit=50`)
      if (!res.ok) return
      const data = await res.json()
      set({ signals: data.signals })
    } catch { /* 무시 */ }
  },

  registerStrategy: async (job) => {
    await fetch(`${BACKEND}/api/execution/strategies/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        strategy_id: job.strategy_id,
        strategy_name: job.strategy_name,
        market: job.market,
        code: job.code,
        params: job.params,
        trigger_type: job.trigger_type,
        cron: job.cron,
      }),
    })
    await get().fetchStatus()
  },

  removeStrategy: async (strategyId) => {
    await fetch(`${BACKEND}/api/execution/strategies/${strategyId}`, { method: 'DELETE' })
    await get().fetchStatus()
  },

  runNow: async (strategyId) => {
    const res = await fetch(`${BACKEND}/api/execution/strategies/${strategyId}/run`, { method: 'POST' })
    if (!res.ok) throw new Error('실행 실패')
    const data = await res.json()
    const newSignals: SignalRecord[] = data.signals ?? []
    set(s => ({ signals: [...newSignals, ...s.signals].slice(0, 50) }))
    return newSignals
  },

  clearSignals: async () => {
    await fetch(`${BACKEND}/api/execution/signals`, { method: 'DELETE' })
    set({ signals: [] })
  },

  loadWatchlist: () => {
    set({ watchlist: loadWatchlist() })
  },

  addToWatchlist: (item) => {
    const next = [item, ...get().watchlist.filter(w => w.symbol !== item.symbol)]
    saveWatchlist(next)
    set({ watchlist: next })
  },

  removeFromWatchlist: (symbol) => {
    const next = get().watchlist.filter(w => w.symbol !== symbol)
    saveWatchlist(next)
    set({ watchlist: next })
  },
}))
