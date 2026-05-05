'use client'

import { useState } from 'react'
import { Strategy } from '@/types'
import { useStrategyData } from '../hooks/useStrategyData'
import { StrategyList } from './StrategyList'
import { StrategyFormModal } from './StrategyFormModal'
import { StrategyCodeModal } from './StrategyCodeModal'
import { CompositionPanel } from './CompositionPanel'

export function StrategyView() {
  const store = useStrategyData()
  const [formTarget, setFormTarget] = useState<Strategy | null | undefined>(undefined)
  const [codeTarget, setCodeTarget] = useState<Strategy | null>(null)

  const isFormOpen = formTarget !== undefined
  const isCodeOpen = codeTarget !== null

  function handleToggleStatus(strategy: Strategy) {
    const next: Strategy['status'] =
      strategy.status === 'active' ? 'stopped' : 'active'
    store.updateStrategy({ ...strategy, status: next, updated_at: new Date().toISOString() })
  }

  async function handleSaveStrategy(strategy: Strategy) {
    if (store.strategies.find(s => s.id === strategy.id)) {
      await store.updateStrategy(strategy)
    } else {
      await store.addStrategy(strategy)
    }
    setFormTarget(undefined)
  }

  async function handleSaveCode(code: string) {
    if (!codeTarget) return
    await store.updateStrategy({ ...codeTarget, code, updated_at: new Date().toISOString() })
    setCodeTarget(null)
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
      {/* Background glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-900/10 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Left — Strategy List */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5">
          <StrategyList
            strategies={store.strategies}
            onAdd={() => setFormTarget(null)}
            onEdit={s => setFormTarget(s)}
            onViewCode={s => setCodeTarget(s)}
            onToggleStatus={handleToggleStatus}
            onDelete={store.deleteStrategy}
          />
        </div>

        {/* Right — Composition Panel */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5">
          <CompositionPanel
            compositions={store.compositions}
            strategies={store.strategies}
            onAdd={store.addComposition}
            onUpdate={store.updateComposition}
            onDelete={store.deleteComposition}
          />
        </div>
      </div>

      {/* Modals */}
      {isFormOpen && (
        <StrategyFormModal
          initial={formTarget ?? null}
          onClose={() => setFormTarget(undefined)}
          onSave={handleSaveStrategy}
        />
      )}

      {isCodeOpen && codeTarget && (
        <StrategyCodeModal
          strategy={codeTarget}
          onClose={() => setCodeTarget(null)}
          onSave={handleSaveCode}
        />
      )}
    </div>
  )
}
