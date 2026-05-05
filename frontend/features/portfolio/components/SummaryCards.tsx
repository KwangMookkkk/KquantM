'use client'

import { Portfolio } from '@/types'
import { calcPortfolioMetrics, fmtCurrency, fmtPct } from '../utils/calc'

interface Props {
  portfolio: Portfolio
}

export function SummaryCards({ portfolio }: Props) {
  const { totalValue, totalInvested, pnl, pnlRate } = calcPortfolioMetrics(portfolio)
  const currency = portfolio.base_currency

  const cards = [
    {
      label: 'Total Assets',
      value: fmtCurrency(totalValue, currency),
      sub: `Cash ${fmtCurrency(portfolio.cash, currency)}`,
      color: 'text-white',
    },
    {
      label: 'Total Invested',
      value: fmtCurrency(totalInvested, currency),
      sub: `${Object.keys(portfolio.positions).length} positions`,
      color: 'text-white',
    },
    {
      label: 'Profit & Loss',
      value: fmtCurrency(pnl, currency),
      sub: fmtPct(pnlRate),
      color: pnl >= 0 ? 'text-emerald-400' : 'text-rose-400',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map(card => (
        <div
          key={card.label}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 flex flex-col gap-1"
        >
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{card.label}</span>
          <span className={`text-2xl font-semibold ${card.color}`}>{card.value}</span>
          <span className={`text-sm ${card.color === 'text-white' ? 'text-slate-400' : card.color}`}>
            {card.sub}
          </span>
        </div>
      ))}
    </div>
  )
}
