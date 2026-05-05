import { DataService } from './dataService'
import { Portfolio, Strategy } from '@/types'

// Supabase 연동 시 이 클래스를 구현하고 localStorageService 대신 주입
export class SupabaseService implements DataService {
  async getPortfolios(): Promise<Portfolio[]> {
    throw new Error('SupabaseService: not implemented yet')
  }

  async savePortfolio(_portfolio: Portfolio): Promise<void> {
    throw new Error('SupabaseService: not implemented yet')
  }

  async deletePortfolio(_id: string): Promise<void> {
    throw new Error('SupabaseService: not implemented yet')
  }

  async getStrategies(): Promise<Strategy[]> {
    throw new Error('SupabaseService: not implemented yet')
  }

  async saveStrategy(_strategy: Strategy): Promise<void> {
    throw new Error('SupabaseService: not implemented yet')
  }

  async deleteStrategy(_id: string): Promise<void> {
    throw new Error('SupabaseService: not implemented yet')
  }
}
