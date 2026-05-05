'use client'

import { Trash2 } from 'lucide-react'
import { SignalRecord } from '@/types'

interface Props {
  signals: SignalRecord[]
  onClear: () => void
}

const ACTION_STYLE: Record<SignalRecord['action'], string> = {
  BUY:  'bg-emerald-900/50 text-emerald-400 border border-emerald-900/60',
  SELL: 'bg-rose-900/50 text-rose-400 border border-rose-900/60',
  HOLD: 'bg-gray-800/60 text-gray-400 border border-gray-700',
}

const ACTION_LABEL: Record<SignalRecord['action'], string> = {
  BUY: '매수', SELL: '매도', HOLD: '보유',
}

export function SignalFeed({ signals, onClear }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-200">신호 피드</h2>
          {signals.length > 0 && (
            <span className="text-[11px] bg-indigo-900/50 text-indigo-300 border border-indigo-900/60 rounded-full px-2 py-0.5">
              {signals.length}
            </span>
          )}
        </div>
        {signals.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={11} />
            초기화
          </button>
        )}
      </div>

      {signals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-xl text-slate-500">
          <p className="text-xs">아직 신호가 없습니다.</p>
          <p className="text-xs mt-1 opacity-60">전략을 실행하면 신호가 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {signals.map(signal => (
            <div
              key={signal.id}
              className="bg-white/5 border border-white/10 rounded-xl p-3 hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${ACTION_STYLE[signal.action]}`}>
                  {ACTION_LABEL[signal.action]}
                </span>
                <span className="text-sm font-semibold text-slate-100">{signal.symbol}</span>
                <span className="text-xs text-slate-400">{signal.strategy_name}</span>
                <span className="ml-auto text-[11px] text-slate-500">
                  {new Date(signal.generated_at).toLocaleString('ko-KR')}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                <span>현재가 <span className="text-slate-200 font-medium">{signal.current_price.toLocaleString()}</span></span>
                {signal.quantity && <span>수량 {signal.quantity}</span>}
                <span>{signal.order_type === 'MARKET' ? '시장가' : '지정가'}</span>
                <span className={`text-[11px] ${signal.notified ? 'text-teal-400' : 'text-slate-600'}`}>
                  {signal.notified ? '알림 전송됨' : '알림 없음'}
                </span>
              </div>

              {signal.reason && (
                <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">{signal.reason}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
