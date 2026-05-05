import { Portfolio, Strategy } from '@/types'

export interface DataService {
  // Portfolio
  getPortfolios(): Promise<Portfolio[]>
  savePortfolio(portfolio: Portfolio): Promise<void>
  deletePortfolio(id: string): Promise<void>
  // Strategy
  getStrategies(): Promise<Strategy[]>
  saveStrategy(strategy: Strategy): Promise<void>
  deleteStrategy(id: string): Promise<void>
}