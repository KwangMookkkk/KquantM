'use client'

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import { Portfolio } from '@/types'
import { calcPositionRows, fmtCurrency, fmtPct } from '../utils/calc'

interface Props {
  portfolio: Portfolio
  onEdit: (symbol: string) => void
  onDelete: (symbol: string) => void
  onReorder: (orderedSymbols: string[]) => void
}

export function StockList({ portfolio, onEdit, onDelete, onReorder }: Props) {
  const rows = calcPositionRows(portfolio)

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return
    const symbols = rows.map(r => r.symbol)
    const [moved] = symbols.splice(result.source.index, 1)
    symbols.splice(result.destination.index, 0, moved)
    onReorder(symbols)
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-12 text-center text-slate-500">
        종목이 없습니다. + 버튼으로 추가하세요.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider">
            <th className="w-8 px-3 py-3" />
            <th className="px-4 py-3 text-left">Ticker</th>
            <th className="px-4 py-3 text-left">종목명</th>
            <th className="px-4 py-3 text-right">수량</th>
            <th className="px-4 py-3 text-right">매입금액</th>
            <th className="px-4 py-3 text-right">평균단가</th>
            <th className="px-4 py-3 text-right">현재가</th>
            <th className="px-4 py-3 text-right">평가금액</th>
            <th className="px-4 py-3 text-right">등락률</th>
            <th className="px-4 py-3 text-right">비중</th>
            <th className="w-16 px-3 py-3" />
          </tr>
        </thead>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="stock-list">
            {provided => (
              <tbody ref={provided.innerRef} {...provided.droppableProps}>
                {rows.map((row, index) => (
                  <Draggable key={row.symbol} draggableId={row.symbol} index={index}>
                    {(drag, snapshot) => (
                      <tr
                        ref={drag.innerRef}
                        {...drag.draggableProps}
                        onDoubleClick={() => onEdit(row.symbol)}
                        className={`group border-b border-white/5 transition-colors cursor-default ${
                          snapshot.isDragging
                            ? 'bg-white/10 rounded-xl'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        {/* drag handle */}
                        <td className="px-3 py-3 text-slate-600 cursor-grab" {...drag.dragHandleProps}>
                          <GripVertical size={14} />
                        </td>

                        {/* ticker */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{row.symbol}</div>
                        </td>

                        {/* 종목명 */}
                        <td className="px-4 py-3 text-slate-300 max-w-36">
                          <div className="truncate">{row.name}</div>
                        </td>

                        <td className="px-4 py-3 text-right text-slate-300">{row.quantity.toLocaleString()}</td>

                        <td className="px-4 py-3 text-right text-slate-300">
                          {fmtCurrency(row.totalCostCalc, row.currency)}
                        </td>

                        <td className="px-4 py-3 text-right text-slate-300">
                          {fmtCurrency(row.avg_cost, row.currency)}
                        </td>

                        <td className="px-4 py-3 text-right text-slate-300">
                          {row.current_price != null ? fmtCurrency(row.current_price, row.currency) : '—'}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="font-medium text-white">{fmtCurrency(row.valueUsdCalc, row.currency)}</div>
                          <div className={`text-xs font-medium ${row.pnlRateCalc >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {fmtPct(row.pnlRateCalc)}
                          </div>
                        </td>

                        {/* 등락률 */}
                        <td className={`px-4 py-3 text-right font-medium ${
                          (row.daily_change_rate ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {row.daily_change_rate != null ? fmtPct(row.daily_change_rate) : '—'}
                        </td>

                        {/* 비중 (progress bar) */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-indigo-400"
                                style={{ width: `${Math.min(row.weightCalc, 100)}%` }}
                              />
                            </div>
                            <span className="text-slate-400 text-xs w-12 text-right">
                              {row.weightCalc.toFixed(1)}%
                            </span>
                          </div>
                        </td>

                        {/* actions */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEdit(row.symbol)}
                              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => onDelete(row.symbol)}
                              className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </tbody>
            )}
          </Droppable>
        </DragDropContext>
      </table>
    </div>
  )
}
