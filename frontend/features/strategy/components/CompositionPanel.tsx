'use client'

import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { Strategy, StrategyComposition, StrategyRule } from '@/types'

interface Props {
  compositions: StrategyComposition[]
  strategies: Strategy[]
  onAdd: (c: StrategyComposition) => void
  onUpdate: (c: StrategyComposition) => void
  onDelete: (id: string) => void
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

interface FormState {
  name: string
  rules: StrategyRule[]
}

export function CompositionPanel({ compositions, strategies, onAdd, onUpdate, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({ name: '', rules: [] })

  function openAdd() {
    setEditingId(null)
    setForm({ name: '', rules: [] })
    setShowForm(true)
  }

  function openEdit(c: StrategyComposition) {
    setEditingId(c.id)
    setForm({ name: c.name, rules: [...c.rules] })
    setShowForm(true)
  }

  function toggleRule(id: string) {
    setForm(f => {
      const exists = f.rules.find(r => r.rule_id === id)
      if (exists) return { ...f, rules: f.rules.filter(r => r.rule_id !== id) }
      return { ...f, rules: [...f.rules, { rule_id: id, required: true }] }
    })
  }

  function toggleRequired(ruleId: string) {
    setForm(f => ({
      ...f,
      rules: f.rules.map(r => r.rule_id === ruleId ? { ...r, required: !r.required } : r),
    }))
  }

  function handleSave() {
    if (!form.name.trim() || form.rules.length < 2) return
    if (editingId) {
      const existing = compositions.find(c => c.id === editingId)
      if (!existing) return
      onUpdate({ ...existing, name: form.name.trim(), rules: form.rules })
    } else {
      onAdd({ id: makeId(), name: form.name.trim(), rules: form.rules, is_active: false })
    }
    setShowForm(false)
  }

  function toggleActive(c: StrategyComposition) {
    onUpdate({ ...c, is_active: !c.is_active })
  }

  const strategyMap = Object.fromEntries(strategies.map(s => [s.id, s]))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-200">전략</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-teal-700 hover:bg-teal-600 rounded-lg transition-colors"
        >
          <Plus size={12} />
          전략 추가
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300">{editingId ? '전략 수정' : '새 전략'}</span>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
              <X size={14} />
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="전략 이름"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />

            <div>
              <p className="text-xs text-slate-400 mb-2">
                규칙 선택 (최소 2개)
                <span className="ml-2 text-slate-600">— 클릭으로 필수/옵션 전환</span>
              </p>
              <div className="grid gap-1.5 max-h-48 overflow-y-auto">
                {strategies.length === 0 && (
                  <p className="text-xs text-slate-500 italic">등록된 규칙이 없습니다.</p>
                )}
                {strategies.map(s => {
                  const formRule = form.rules.find(r => r.rule_id === s.id)
                  const selected = !!formRule
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                        selected ? 'bg-white/5 border border-white/10' : ''
                      }`}
                    >
                      <div
                        onClick={() => toggleRule(s.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          selected ? 'bg-teal-600 border-teal-600' : 'border-white/20 hover:border-teal-500'
                        }`}
                      >
                        {selected && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
                      </div>
                      <span className="text-xs text-slate-300 flex-1 truncate">{s.name}</span>
                      <span className="text-[11px] text-slate-600">{s.market}</span>
                      {selected && formRule && (
                        <button
                          onClick={() => toggleRequired(s.id)}
                          className={`text-[11px] px-2 py-0.5 rounded-full font-semibold transition-colors shrink-0 ${
                            formRule.required
                              ? 'bg-blue-900/50 text-blue-300 hover:bg-gray-700/60 hover:text-gray-400'
                              : 'bg-gray-700/60 text-gray-400 hover:bg-blue-900/50 hover:text-blue-300'
                          }`}
                        >
                          {formRule.required ? '필수' : '옵션'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5">
                필수: 모두 충족해야 신호 발생 / 옵션: 충족 시 신호 강도 보완
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={!form.name.trim() || form.rules.length < 2}
              className="w-full py-2 text-xs font-medium bg-teal-700 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {editingId ? '저장' : '전략 추가'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {compositions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-500 border border-dashed border-white/10 rounded-xl">
          <p className="text-xs">등록된 전략이 없습니다.</p>
          <p className="text-xs mt-1 opacity-60">규칙을 조합해 전략을 만들어보세요.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {compositions.map(c => (
            <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-3 hover:border-white/20 transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-200 truncate block mb-1.5">{c.name}</span>
                  <div className="flex flex-wrap gap-1">
                    {c.rules.map(rule => (
                      <span
                        key={rule.rule_id}
                        className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border ${
                          rule.required
                            ? 'bg-blue-900/20 border-blue-900/40 text-blue-300'
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        <span className={`font-bold ${rule.required ? 'text-blue-400' : 'text-gray-500'}`}>
                          {rule.required ? '필수' : '옵션'}
                        </span>
                        {strategyMap[rule.rule_id]?.name ?? rule.rule_id}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleActive(c)}
                    className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                      c.is_active
                        ? 'bg-green-900/50 text-green-400 hover:bg-red-900/50 hover:text-red-400'
                        : 'bg-white/5 text-slate-500 hover:bg-green-900/50 hover:text-green-400'
                    }`}
                  >
                    {c.is_active ? '활성' : '비활성'}
                  </button>
                  <button
                    onClick={() => openEdit(c)}
                    className="p-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors px-2"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
