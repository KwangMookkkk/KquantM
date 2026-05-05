'use client'

import { create } from 'zustand'
import { Strategy, StrategyComposition } from '@/types'
import { localStorageService } from '@/services/localStorageService'

interface StrategyState {
  strategies: Strategy[]
  compositions: StrategyComposition[]
  isLoading: boolean

  loadStrategies: () => Promise<void>
  addStrategy: (strategy: Strategy) => Promise<void>
  updateStrategy: (strategy: Strategy) => Promise<void>
  deleteStrategy: (id: string) => Promise<void>
  addComposition: (composition: StrategyComposition) => Promise<void>
  updateComposition: (composition: StrategyComposition) => void
  deleteComposition: (id: string) => void
}

const COMPOSITIONS_KEY = 'qp_compositions'

function loadCompositions(): StrategyComposition[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(COMPOSITIONS_KEY)
  return raw ? JSON.parse(raw) : []
}

function saveCompositions(compositions: StrategyComposition[]) {
  localStorage.setItem(COMPOSITIONS_KEY, JSON.stringify(compositions))
}

export const useStrategyStore = create<StrategyState>((set, get) => ({
  strategies: [],
  compositions: [],
  isLoading: false,

  loadStrategies: async () => {
    set({ isLoading: true })
    const strategies = await localStorageService.getStrategies()
    const compositions = loadCompositions()
    set({ strategies, compositions, isLoading: false })
  },

  addStrategy: async (strategy) => {
    await localStorageService.saveStrategy(strategy)
    set(s => ({ strategies: [...s.strategies, strategy] }))
  },

  updateStrategy: async (strategy) => {
    await localStorageService.saveStrategy(strategy)
    set(s => ({
      strategies: s.strategies.map(x => (x.id === strategy.id ? strategy : x)),
    }))
  },

  deleteStrategy: async (id) => {
    await localStorageService.deleteStrategy(id)
    set(s => ({ strategies: s.strategies.filter(x => x.id !== id) }))
  },

  addComposition: async (composition) => {
    const next = [...get().compositions, composition]
    saveCompositions(next)
    set({ compositions: next })
  },

  updateComposition: (composition) => {
    const next = get().compositions.map(c => (c.id === composition.id ? composition : c))
    saveCompositions(next)
    set({ compositions: next })
  },

  deleteComposition: (id) => {
    const next = get().compositions.filter(c => c.id !== id)
    saveCompositions(next)
    set({ compositions: next })
  },
}))
