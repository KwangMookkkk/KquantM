'use client'

import { useState } from 'react'
import { Play, Loader2, Trash2, RefreshCw } from 'lucide-react'
import { Strategy } from '@/types'
import { useExecutionStore } from '@/store/executionStore'

interface Props {
  strategies: Strategy[]
}

export function EngineControl({ strategies }: Props) {
  const store = useExecutionStore()
  const [running, setRunning] = useState<string | null>(null)

  const activeStrategies = strategies.filter(s => s.status === 'active')

  async function handleRegisterAndRun(strategy: Strategy) {
    setRunning(strategy.id)
    try {
      await store.registerStrategy({
        strategy_id: strategy.id,
        strategy_name: strategy.name,
        market: strategy.market,
        code: strategy.code,
        params: strategy.params,
        trigger_type: strategy.trigger.type,
        cron: strategy.trigger.config?.cron ?? null,
      })
      await store.runNow(strategy.id)
    } catch (e) {
      console.error(e)
    } finally {
      setRunning(null)
    }
  }

  async function handleRemove(strategyId: string) {
    await store.removeStrategy(strategyId)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-200">전략 실행 제어</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${store.isEngineRunning ? 'bg-green-400' : 'bg-gray-600'}`} />
          <span className="text-xs text-slate-400">{store.isEngineRunning ? '엔진 실행 중' : '엔진 대기'}</span>
        </div>
      </div>

      {activeStrategies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 border border-dashed border-white/10 rounded-xl text-slate-500">
          <p className="text-xs">활성 전략이 없습니다.</p>
          <p className="text-xs mt-1 opacity-60">Strategy 탭에서 전략 상태를 활성으로 변경하세요.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {activeStrategies.map(strategy => {
            const job = store.activeJobs.find(j => j.strategy_id === strategy.id)
            const isRunning = running === strategy.id

            return (
              <div key={strategy.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{strategy.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                      <span>{strategy.market}</span>
                      <span>{strategy.trigger.type === 'schedule' ? `스케줄 ${strategy.trigger.config?.cron ?? ''}` : '수동'}</span>
                      {job && (
                        <>
                          <span>실행 {job.run_count}회</span>
                          {job.last_run && <span>최근: {new Date(job.last_run).toLocaleTimeString('ko-KR')}</span>}
                          {job.last_error && <span className="text-red-400 truncate max-w-32" title={job.last_error}>오류</span>}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleRegisterAndRun(strategy)}
                      disabled={isRunning}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                      {job ? '지금 실행' : '등록 + 실행'}
                    </button>
                    {job && (
                      <button
                        onClick={() => handleRemove(strategy.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {job?.last_error && (
                  <p className="mt-2 text-[11px] text-red-400 bg-red-900/10 border border-red-900/30 rounded-lg px-2 py-1.5 font-mono line-clamp-2">
                    {job.last_error}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
        <button
          onClick={() => { store.fetchStatus(); store.fetchSignals() }}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors"
        >
          <RefreshCw size={11} />
          상태 새로고침
        </button>
      </div>
    </div>
  )
}
