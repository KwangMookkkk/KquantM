'use client'

import { useEffect, useRef } from 'react'
import { useExecutionStore } from '@/store/executionStore'

const POLL_INTERVAL_MS = 10_000

export function useExecutionData() {
  const store = useExecutionStore()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    store.loadWatchlist()
    store.fetchStatus()
    store.fetchSignals()

    timerRef.current = setInterval(() => {
      store.fetchStatus()
      store.fetchSignals()
    }, POLL_INTERVAL_MS)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return store
}
