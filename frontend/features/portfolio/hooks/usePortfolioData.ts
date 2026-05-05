'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePortfolioStore } from '@/store/portfolioStore'
import { getStockPrices } from '@/app/actions'

export function usePortfolioData() {
  const store = usePortfolioStore()
  const portfolio = store.getActivePortfolio()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const refreshedAt = useRef<Date | null>(null)

  useEffect(() => {
    store.loadPortfolios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshPrices = useCallback(async () => {
    if (!portfolio) return
    const symbols = Object.keys(portfolio.positions)
    if (symbols.length === 0) return

    setIsRefreshing(true)
    try {
      const quotes = await getStockPrices(symbols)
      for (const [symbol, quote] of Object.entries(quotes)) {
        if (quote) {
          store.updatePositionPrice(portfolio.id, symbol, quote.price, quote.dailyChangeRate)
        }
      }
      refreshedAt.current = new Date()
    } finally {
      setIsRefreshing(false)
    }
  }, [portfolio, store])

  // 첫 로드 후 자동 가격 갱신
  useEffect(() => {
    if (portfolio && Object.keys(portfolio.positions).length > 0 && !refreshedAt.current) {
      refreshPrices()
    }
  }, [portfolio?.id, refreshPrices])

  return { store, portfolio, isRefreshing, refreshPrices }
}
