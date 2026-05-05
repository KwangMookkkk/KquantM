'use client'

import { create } from 'zustand'
import { Portfolio, Position, Trade } from '@/types'
import { localStorageService } from '@/services/localStorageService'

interface PortfolioState {
  portfolios: Portfolio[]
  activePortfolioId: string | null
  isLoading: boolean

  getActivePortfolio: () => Portfolio | null
  loadPortfolios: () => Promise<void>
  setActivePortfolio: (id: string) => void
  createPortfolio: (name: string, base_currency: 'USD' | 'KRW', cash: number) => Promise<void>
  deletePortfolio: (id: string) => Promise<void>
  upsertPosition: (portfolioId: string, position: Position) => Promise<void>
  removePosition: (portfolioId: string, symbol: string) => Promise<void>
  addTrade: (portfolioId: string, trade: Trade) => Promise<void>
  updatePositionPrice: (portfolioId: string, symbol: string, price: number, dailyChangeRate?: number) => void
  reorderPositions: (portfolioId: string, orderedSymbols: string[]) => void
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolios: [],
  activePortfolioId: null,
  isLoading: false,

  getActivePortfolio: () => {
    const { portfolios, activePortfolioId } = get()
    return portfolios.find(p => p.id === activePortfolioId) ?? null
  },

  loadPortfolios: async () => {
    set({ isLoading: true })
    const portfolios = await localStorageService.getPortfolios()
    set({
      portfolios,
      isLoading: false,
      activePortfolioId: portfolios.length > 0 ? portfolios[0].id : null,
    })
  },

  setActivePortfolio: (id) => set({ activePortfolioId: id }),

  createPortfolio: async (name, base_currency, cash) => {
    const portfolio: Portfolio = {
      id: crypto.randomUUID(),
      name,
      base_currency,
      cash,
      positions: {},
      trades: [],
      snapshots: [],
    }
    await localStorageService.savePortfolio(portfolio)
    set(state => ({
      portfolios: [...state.portfolios, portfolio],
      activePortfolioId: portfolio.id,
    }))
  },

  deletePortfolio: async (id) => {
    await localStorageService.deletePortfolio(id)
    set(state => {
      const portfolios = state.portfolios.filter(p => p.id !== id)
      return {
        portfolios,
        activePortfolioId: portfolios.length > 0 ? portfolios[0].id : null,
      }
    })
  },

  upsertPosition: async (portfolioId, position) => {
    const portfolio = get().portfolios.find(p => p.id === portfolioId)
    if (!portfolio) return
    const updated: Portfolio = {
      ...portfolio,
      positions: {
        ...portfolio.positions,
        [position.symbol]: { ...position, id: position.id ?? crypto.randomUUID() },
      },
    }
    await localStorageService.savePortfolio(updated)
    set(state => ({
      portfolios: state.portfolios.map(p => (p.id === portfolioId ? updated : p)),
    }))
  },

  removePosition: async (portfolioId, symbol) => {
    const portfolio = get().portfolios.find(p => p.id === portfolioId)
    if (!portfolio) return
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [symbol]: _removed, ...remaining } = portfolio.positions
    const updated: Portfolio = { ...portfolio, positions: remaining }
    await localStorageService.savePortfolio(updated)
    set(state => ({
      portfolios: state.portfolios.map(p => (p.id === portfolioId ? updated : p)),
    }))
  },

  addTrade: async (portfolioId, trade) => {
    const portfolio = get().portfolios.find(p => p.id === portfolioId)
    if (!portfolio) return
    const updated: Portfolio = { ...portfolio, trades: [...portfolio.trades, trade] }
    await localStorageService.savePortfolio(updated)
    set(state => ({
      portfolios: state.portfolios.map(p => (p.id === portfolioId ? updated : p)),
    }))
  },

  updatePositionPrice: (portfolioId, symbol, price, dailyChangeRate) => {
    set(state => ({
      portfolios: state.portfolios.map(p => {
        if (p.id !== portfolioId) return p
        const pos = p.positions[symbol]
        if (!pos) return p
        return {
          ...p,
          positions: {
            ...p.positions,
            [symbol]: {
              ...pos,
              current_price: price,
              daily_change_rate: dailyChangeRate ?? pos.daily_change_rate,
            },
          },
        }
      }),
    }))
  },

  reorderPositions: (portfolioId, orderedSymbols) => {
    set(state => ({
      portfolios: state.portfolios.map(p => {
        if (p.id !== portfolioId) return p
        const reordered: Record<string, Position> = {}
        orderedSymbols.forEach(sym => {
          if (p.positions[sym]) reordered[sym] = p.positions[sym]
        })
        return { ...p, positions: reordered }
      }),
    }))
  },
}))
