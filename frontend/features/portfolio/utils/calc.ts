import { Portfolio, Position } from '@/types'

export interface PortfolioMetrics {
  totalValue: number      // 평가금액 합계 (현재가 기준, cash 포함)
  totalInvested: number   // 매입금액 합계
  pnl: number             // 손익 금액
  pnlRate: number         // 손익률 (%)
  positionsValue: number  // 종목 평가금액 합계
}

export interface PositionRow extends Position {
  totalCostCalc: number   // qty * avg_cost
  valueUsdCalc: number    // qty * current_price
  pnlCalc: number         // valueUsd - totalCost
  pnlRateCalc: number     // (pnl / totalCost) * 100
  weightCalc: number      // (valueUsd / positionsValue) * 100
}

export function calcPortfolioMetrics(portfolio: Portfolio): PortfolioMetrics {
  const positions = Object.values(portfolio.positions)

  const totalInvested = positions.reduce((acc, p) => acc + p.quantity * p.avg_cost, 0)
  const positionsValue = positions.reduce((acc, p) => {
    const price = p.current_price ?? p.avg_cost
    return acc + p.quantity * price
  }, 0)

  const totalValue = positionsValue + portfolio.cash
  const pnl = positionsValue - totalInvested
  const pnlRate = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0

  return { totalValue, totalInvested, pnl, pnlRate, positionsValue }
}

export function calcPositionRows(portfolio: Portfolio): PositionRow[] {
  const positions = Object.values(portfolio.positions)
  const { positionsValue } = calcPortfolioMetrics(portfolio)

  return positions.map(p => {
    const price = p.current_price ?? p.avg_cost
    const totalCostCalc = p.quantity * p.avg_cost
    const valueUsdCalc = p.quantity * price
    const pnlCalc = valueUsdCalc - totalCostCalc
    const pnlRateCalc = totalCostCalc > 0 ? (pnlCalc / totalCostCalc) * 100 : 0
    const weightCalc = positionsValue > 0 ? (valueUsdCalc / positionsValue) * 100 : 0

    return { ...p, totalCostCalc, valueUsdCalc, pnlCalc, pnlRateCalc, weightCalc }
  })
}

export function fmtCurrency(value: number, currency: 'USD' | 'KRW' = 'USD'): string {
  if (currency === 'KRW') {
    return value.toLocaleString('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 })
  }
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtPct(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}
