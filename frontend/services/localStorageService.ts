import { DataService } from './dataService'
import { Portfolio, Strategy } from '@/types'

const PORTFOLIOS_KEY = 'qp_portfolios'
const STRATEGIES_KEY = 'qp_strategies'

export class LocalStorageService implements DataService {
  async getPortfolios(): Promise<Portfolio[]> {
    if (typeof window === 'undefined') return []
    const raw = localStorage.getItem(PORTFOLIOS_KEY)
    return raw ? JSON.parse(raw) : []
  }

  async savePortfolio(portfolio: Portfolio): Promise<void> {
    const portfolios = await this.getPortfolios()
    const idx = portfolios.findIndex(p => p.id === portfolio.id)
    if (idx >= 0) {
      portfolios[idx] = portfolio
    } else {
      portfolios.push(portfolio)
    }
    localStorage.setItem(PORTFOLIOS_KEY, JSON.stringify(portfolios))
  }

  async deletePortfolio(id: string): Promise<void> {
    const portfolios = await this.getPortfolios()
    localStorage.setItem(PORTFOLIOS_KEY, JSON.stringify(portfolios.filter(p => p.id !== id)))
  }

  async getStrategies(): Promise<Strategy[]> {
    if (typeof window === 'undefined') return []
    const raw = localStorage.getItem(STRATEGIES_KEY)
    return raw ? JSON.parse(raw) : []
  }

  async saveStrategy(strategy: Strategy): Promise<void> {
    const strategies = await this.getStrategies()
    const idx = strategies.findIndex(s => s.id === strategy.id)
    if (idx >= 0) {
      strategies[idx] = strategy
    } else {
      strategies.push(strategy)
    }
    localStorage.setItem(STRATEGIES_KEY, JSON.stringify(strategies))
  }

  async deleteStrategy(id: string): Promise<void> {
    const strategies = await this.getStrategies()
    localStorage.setItem(STRATEGIES_KEY, JSON.stringify(strategies.filter(s => s.id !== id)))
  }
}

export const localStorageService = new LocalStorageService()
