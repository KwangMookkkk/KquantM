'use client'

import { useEffect } from 'react'
import { useStrategyStore } from '@/store/strategyStore'

export function useStrategyData() {
  const store = useStrategyStore()

  useEffect(() => {
    store.loadStrategies()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return store
}
