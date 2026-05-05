'use client'

import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import { Portfolio } from '@/types'
import { calcPositionRows, fmtCurrency, fmtPct } from '../utils/calc'

interface Props {
  portfolio: Portfolio
  onEdit: (symbol: string) => void
}

interface TreeNode {
  name: string
  value: number
  pnlRate: number
  [key: string]: unknown
}

const COLORS_POS = ['#10b981', '#059669', '#047857', '#065f46', '#064e3b']
const COLORS_NEG = ['#f43f5e', '#e11d48', '#be123c', '#9f1239', '#881337']

function TreemapCell(props: {
  x?: number; y?: number; width?: number; height?: number
  name?: string; pnlRate?: number; value?: number; currency?: 'USD' | 'KRW'
  onEdit?: (symbol: string) => void
}) {
  const { x = 0, y = 0, width = 0, height = 0, name, pnlRate = 0, value = 0, currency = 'USD', onEdit } = props
  if (width < 30 || height < 30) return null

  const colorSet = pnlRate >= 0 ? COLORS_POS : COLORS_NEG
  const intensity = Math.min(Math.abs(pnlRate) / 5, 1)
  const colorIdx = Math.floor(intensity * (colorSet.length - 1))
  const fill = colorSet[colorIdx]

  return (
    <g onDoubleClick={() => name && onEdit?.(name)} style={{ cursor: 'default' }}>
      <rect x={x} y={y} width={width} height={height} fill={fill} fillOpacity={0.85} rx={6} />
      <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2} fill="transparent"
        stroke="rgba(255,255,255,0.08)" strokeWidth={1} rx={5} />
      {width > 60 && height > 40 && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 8} textAnchor="middle" fill="white"
            fontSize={Math.min(14, width / 5)} fontWeight={600}>
            {name}
          </text>
          <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle"
            fill="rgba(255,255,255,0.75)" fontSize={Math.min(11, width / 6)}>
            {fmtCurrency(value, currency)}
          </text>
          {height > 60 && (
            <text x={x + width / 2} y={y + height / 2 + 26} textAnchor="middle"
              fill="rgba(255,255,255,0.6)" fontSize={Math.min(10, width / 7)}>
              {fmtPct(pnlRate)}
            </text>
          )}
        </>
      )}
    </g>
  )
}

export function TreemapView({ portfolio, onEdit }: Props) {
  const rows = calcPositionRows(portfolio)
  const currency = portfolio.base_currency

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-12 text-center text-slate-500">
        종목이 없습니다.
      </div>
    )
  }

  const data: TreeNode[] = rows.map(r => ({
    name: r.symbol,
    value: r.valueUsdCalc,
    pnlRate: r.pnlRateCalc,
  }))

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4" style={{ height: 420 }}>
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="value"
          content={<TreemapCell currency={currency} onEdit={onEdit} />}
        >
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null
              const d = payload[0].payload as TreeNode
              return (
                <div className="rounded-xl border border-white/10 bg-slate-900/90 backdrop-blur-sm px-3 py-2 text-sm shadow-xl">
                  <div className="font-semibold text-white">{d.name}</div>
                  <div className="text-slate-300">{fmtCurrency(d.value, currency)}</div>
                  <div className={d.pnlRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {fmtPct(d.pnlRate)}
                  </div>
                </div>
              )
            }}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  )
}
