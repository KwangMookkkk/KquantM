'use client'

import { useState } from 'react'
import { Plus, RefreshCw, LayoutList, Map } from 'lucide-react'
import { Position } from '@/types'
import { usePortfolioData } from '../hooks/usePortfolioData'
import { SummaryCards } from './SummaryCards'
import { StockList } from './StockList'
import { TreemapView } from './TreemapView'
import { PositionModal } from './PositionModal'

type ViewMode = 'list' | 'map'

export function PortfolioView() {
  const { store, portfolio, isRefreshing, refreshPrices } = usePortfolioData()
  const [view, setView] = useState<ViewMode>('list')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null)

  if (store.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-500">
        <RefreshCw size={20} className="animate-spin mr-2" />
        Loading...
      </div>
    )
  }

  if (!portfolio) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-10 text-center max-w-sm">
          <p className="text-slate-400 mb-4">포트폴리오가 없습니다.</p>
          <button
            onClick={() => store.createPortfolio('My Portfolio', 'USD', 0)}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            포트폴리오 만들기
          </button>
        </div>
      </div>
    )
  }

  const editingPosition = editingSymbol ? portfolio.positions[editingSymbol] : null

  function openAdd() {
    setEditingSymbol(null)
    setModalOpen(true)
  }

  function openEdit(symbol: string) {
    setEditingSymbol(symbol)
    setModalOpen(true)
  }

  async function handleSave(position: Position) {
    await store.upsertPosition(portfolio!.id, position)
    setModalOpen(false)
  }

  async function handleDelete(symbol: string) {
    if (!confirm(`${symbol}을(를) 삭제하시겠습니까?`)) return
    await store.removePosition(portfolio!.id, symbol)
  }

  function handleReorder(orderedSymbols: string[]) {
    store.reorderPositions(portfolio!.id, orderedSymbols)
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-screen-xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{portfolio.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{portfolio.base_currency} · Portfolio</p>
        </div>

        <div className="flex items-center gap-2">
          {/* refresh */}
          <button
            onClick={refreshPrices}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? '갱신 중' : '시세 갱신'}
          </button>

          {/* view toggle */}
          <div className="flex rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
                view === 'list' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutList size={14} />
              List
            </button>
            <button
              onClick={() => setView('map')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
                view === 'map' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Map size={14} />
              Map
            </button>
          </div>

          {/* add position */}
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            <Plus size={14} />
            종목 추가
          </button>
        </div>
      </div>

      {/* Summary */}
      <SummaryCards portfolio={portfolio} />

      {/* Content */}
      {view === 'list' ? (
        <StockList
          portfolio={portfolio}
          onEdit={openEdit}
          onDelete={handleDelete}
          onReorder={handleReorder}
        />
      ) : (
        <TreemapView portfolio={portfolio} onEdit={openEdit} />
      )}

      {/* Modal */}
      {modalOpen && (
        <PositionModal
          initial={editingPosition ?? null}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
