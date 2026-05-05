'use client'

import { Strategy } from '@/types'
import { Play, Pause, Code2, Trash2, Plus } from 'lucide-react'

const STATUS_STYLE: Record<Strategy['status'], string> = {
  draft:   'bg-gray-700/60 text-gray-300',
  testing: 'bg-yellow-900/50 text-yellow-300',
  active:  'bg-green-900/50 text-green-400',
  stopped: 'bg-red-900/50 text-red-400',
}

const STATUS_LABEL: Record<Strategy['status'], string> = {
  draft:   '초안',
  testing: '테스트 중',
  active:  '활성',
  stopped: '중지',
}

const MARKET_LABEL: Record<Strategy['market'], string> = {
  US: '미국',
  KR: '한국',
  ALL: '전체',
}

interface Props {
  strategies: Strategy[]
  onAdd: () => void
  onEdit: (strategy: Strategy) => void
  onViewCode: (strategy: Strategy) => void
  onToggleStatus: (strategy: Strategy) => void
  onDelete: (id: string) => void
}

export function StrategyList({ strategies, onAdd, onEdit, onViewCode, onToggleStatus, onDelete }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-200">규칙 목록</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
        >
          <Plus size={12} />
          규칙 추가
        </button>
      </div>

      {strategies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 border border-dashed border-white/10 rounded-xl">
          <Code2 size={32} className="mb-3 opacity-40" />
          <p className="text-sm">아직 등록된 규칙이 없습니다.</p>
          <p className="text-xs mt-1 opacity-60">규칙 추가 버튼을 눌러 첫 번째 규칙을 만들어보세요.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {strategies.map(strategy => (
            <div
              key={strategy.id}
              className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-100 truncate">{strategy.name}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[strategy.status]}`}>
                      {STATUS_LABEL[strategy.status]}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-300 font-medium">
                      {MARKET_LABEL[strategy.market]}
                    </span>
                  </div>
                  {strategy.description && (
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{strategy.description}</p>
                  )}
                  {strategy.last_signal && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      마지막 신호: {strategy.last_signal.action} {strategy.last_signal.symbol} — {new Date(strategy.last_signal.generated_at).toLocaleString('ko-KR')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onToggleStatus(strategy)}
                    title={strategy.status === 'active' ? '중지' : '활성화'}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {strategy.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button
                    onClick={() => onViewCode(strategy)}
                    title="코드 보기"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Code2 size={14} />
                  </button>
                  <button
                    onClick={() => onEdit(strategy)}
                    title="수정"
                    className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors px-2"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => onDelete(strategy.id)}
                    title="삭제"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-4 text-[11px] text-slate-500">
                <span>트리거: {strategy.trigger.type === 'schedule' ? '스케줄' : strategy.trigger.type === 'event' ? '이벤트' : '수동'}</span>
                {strategy.trigger.config?.cron && <span>크론: {strategy.trigger.config.cron}</span>}
                <span className="ml-auto">수정: {new Date(strategy.updated_at).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
