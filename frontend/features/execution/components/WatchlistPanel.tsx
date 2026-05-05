'use client'

import { useState } from 'react'
import { Plus, X, Loader2, Search } from 'lucide-react'
import { WatchlistItem, StockQuote } from '@/types'
import { lookupTicker } from '@/app/actions'
import { useExecutionStore } from '@/store/executionStore'

interface PriceMap { [symbol: string]: StockQuote | null }

interface Props {
  watchlist: WatchlistItem[]
  prices: PriceMap
  onRefreshPrices: (symbols: string[]) => void
}

export function WatchlistPanel({ watchlist, prices, onRefreshPrices }: Props) {
  const store = useExecutionStore()
  const [input, setInput] = useState('')
  const [market, setMarket] = useState<'US' | 'KR'>('US')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd() {
    const sym = input.trim().toUpperCase()
    if (!sym) return
    setSearching(true)
    setError('')
    try {
      const info = await lookupTicker(sym)
      const item: WatchlistItem = {
        symbol: sym,
        name: info.name,
        market,
        added_at: new Date().toISOString(),
      }
      store.addToWatchlist(item)
      onRefreshPrices([...watchlist.map(w => w.symbol), sym])
      setInput('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '조회 실패')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-200 mb-4">관심 종목</h2>

      {/* Add form */}
      <div className="flex gap-2 mb-3">
        <select
          value={market}
          onChange={e => setMarket(e.target.value as 'US' | 'KR')}
          className="bg-gray-800 border border-white/10 rounded-lg px-2 py-2 text-xs text-slate-300 focus:outline-none shrink-0"
        >
          <option value="US">US</option>
          <option value="KR">KR</option>
        </select>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="티커 입력 (예: AAPL)"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 uppercase"
        />
        <button
          onClick={handleAdd}
          disabled={searching || !input.trim()}
          className="flex items-center gap-1 px-3 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition-colors shrink-0"
        >
          {searching ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

      {watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 border border-dashed border-white/10 rounded-xl text-slate-500">
          <Search size={24} className="mb-2 opacity-30" />
          <p className="text-xs">관심 종목을 추가하세요.</p>
        </div>
      ) : (
        <div className="grid gap-1.5">
          {watchlist.map(item => {
            const quote = prices[item.symbol]
            const change = quote?.dailyChangeRate ?? null
            return (
              <div key={item.symbol} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">{item.symbol}</span>
                    <span className="text-[11px] text-slate-500 truncate">{item.name}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {quote ? (
                    <>
                      <p className="text-xs font-medium text-slate-200">{quote.price.toLocaleString()}</p>
                      <p className={`text-[11px] font-medium ${change !== null && change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {change !== null ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}
                      </p>
                    </>
                  ) : (
                    <p className="text-[11px] text-slate-600">—</p>
                  )}
                </div>
                <button
                  onClick={() => store.removeFromWatchlist(item.symbol)}
                  className="text-slate-600 hover:text-red-400 transition-colors ml-1"
                >
                  <X size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
