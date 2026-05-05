'use client'

import { useEffect, useState } from 'react'
import { useExecutionData } from '../hooks/useExecutionData'
import { useStrategyStore } from '@/store/strategyStore'
import { getStockPrices } from '@/app/actions'
import { StockQuote } from '@/types'
import { EngineControl } from './EngineControl'
import { SignalFeed } from './SignalFeed'
import { WatchlistPanel } from './WatchlistPanel'

export function ExecutionView() {
  const store = useExecutionData()
  const strategyStore = useStrategyStore()
  const [watchlistPrices, setWatchlistPrices] = useState<Record<string, StockQuote | null>>({})

  useEffect(() => {
    strategyStore.loadStrategies()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function refreshWatchlistPrices(symbols: string[]) {
    if (symbols.length === 0) return
    const prices = await getStockPrices(symbols)
    setWatchlistPrices(prices)
  }

  useEffect(() => {
    if (store.watchlist.length === 0) return
    const symbols = store.watchlist.map(w => w.symbol)
    let cancelled = false
    getStockPrices(symbols).then(prices => {
      if (!cancelled) setWatchlistPrices(prices)
    })
    return () => { cancelled = true }
  }, [store.watchlist])

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
      {/* Background glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-900/10 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          {/* Engine Control */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5">
            <EngineControl strategies={strategyStore.strategies} />
          </div>

          {/* Signal Feed */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5">
            <SignalFeed
              signals={store.signals}
              onClear={store.clearSignals}
            />
          </div>
        </div>

        {/* Right column — Watchlist */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5">
          <WatchlistPanel
            watchlist={store.watchlist}
            prices={watchlistPrices}
            onRefreshPrices={refreshWatchlistPrices}
          />
        </div>
      </div>
    </div>
  )
}
