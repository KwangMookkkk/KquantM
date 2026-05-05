'use client'

import { useState } from 'react'
import { X, Loader2, Sparkles } from 'lucide-react'
import { Strategy, StrategyTrigger } from '@/types'
import { convertStrategyText } from '@/app/actions'

interface Props {
  initial?: Strategy | null
  onClose: () => void
  onSave: (strategy: Strategy) => void
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function StrategyFormModal({ initial, onClose, onSave }: Props) {
  const [name, setName] = useState(() => initial?.name ?? '')
  const [description, setDescription] = useState(() => initial?.description ?? '')
  const [market, setMarket] = useState<Strategy['market']>(() => initial?.market ?? 'US')
  const [triggerType, setTriggerType] = useState<StrategyTrigger['type']>(() => initial?.trigger.type ?? 'manual')
  const [cron, setCron] = useState(() => initial?.trigger.config?.cron ?? '')
  const [naturalText, setNaturalText] = useState('')
  const [converting, setConverting] = useState(false)
  const [convertError, setConvertError] = useState('')
  const [generatedCode, setGeneratedCode] = useState(() => initial?.code ?? '')

  async function handleConvert() {
    if (!naturalText.trim()) return
    setConverting(true)
    setConvertError('')
    try {
      const code = await convertStrategyText(naturalText.trim(), market)
      setGeneratedCode(code)
    } catch (e) {
      setConvertError(e instanceof Error ? e.message : '변환 중 오류가 발생했습니다.')
    } finally {
      setConverting(false)
    }
  }

  function handleSave() {
    if (!name.trim()) return
    const now = new Date().toISOString()
    const trigger: StrategyTrigger = {
      type: triggerType,
      config: triggerType === 'schedule' && cron ? { cron } : undefined,
    }
    const strategy: Strategy = initial
      ? {
          ...initial,
          name: name.trim(),
          description: description.trim(),
          market,
          code: generatedCode,
          trigger,
          updated_at: now,
        }
      : {
          id: makeId(),
          name: name.trim(),
          description: description.trim(),
          status: 'draft',
          market,
          code: generatedCode,
          params: {},
          trigger,
          created_at: now,
          updated_at: now,
        }
    onSave(strategy)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-sm font-semibold text-slate-100">
            {initial ? '규칙 수정' : '새 규칙 추가'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">규칙 이름 *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="예: 골든크로스 모멘텀"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">설명</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="규칙에 대한 간단한 설명"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Market + Trigger */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">시장</label>
              <select
                value={market}
                onChange={e => setMarket(e.target.value as Strategy['market'])}
                className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="US">미국 (US)</option>
                <option value="KR">한국 (KR)</option>
                <option value="ALL">전체 (ALL)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">트리거 유형</label>
              <select
                value={triggerType}
                onChange={e => setTriggerType(e.target.value as StrategyTrigger['type'])}
                className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="manual">수동</option>
                <option value="schedule">스케줄</option>
                <option value="event">이벤트</option>
              </select>
            </div>
          </div>

          {triggerType === 'schedule' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">크론 표현식</label>
              <input
                type="text"
                value={cron}
                onChange={e => setCron(e.target.value)}
                placeholder="예: 0 9 * * 1-5  (평일 오전 9시)"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          )}

          {/* AI Conversion */}
          <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={13} className="text-indigo-400" />
              <span className="text-xs font-semibold text-slate-300">AI 전략 변환</span>
            </div>
            <textarea
              value={naturalText}
              onChange={e => setNaturalText(e.target.value)}
              rows={4}
              placeholder="전략을 자연어로 설명하세요.&#10;예: 20일 이동평균선이 60일 이동평균선을 상향 돌파하면 매수하고, 하향 돌파하면 매도한다."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
            {convertError && (
              <p className="text-xs text-red-400 mt-1">{convertError}</p>
            )}
            <button
              onClick={handleConvert}
              disabled={converting || !naturalText.trim()}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {converting ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  변환 중...
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  Python 코드로 변환
                </>
              )}
            </button>
          </div>

          {/* Code preview */}
          {generatedCode && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">생성된 코드 미리보기</label>
              <pre className="bg-gray-950 border border-white/10 rounded-lg p-3 text-xs text-slate-300 font-mono overflow-auto max-h-48 whitespace-pre-wrap">
                {generatedCode}
              </pre>
              <p className="text-[11px] text-slate-500 mt-1">규칙 저장 후 코드 편집기에서 수정할 수 있습니다.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {initial ? '저장' : '규칙 추가'}
          </button>
        </div>
      </div>
    </div>
  )
}
