'use client'

import { useState } from 'react'
import { X, Search, Loader2 } from 'lucide-react'
import { Position } from '@/types'
import { lookupTicker } from '@/app/actions'

interface Props {
  initial?: Position | null
  onSave: (position: Position) => void
  onClose: () => void
}

const SECTORS = [
  'Technology', 'Financials', 'Healthcare', 'Consumer Discretionary',
  'Industrials', 'Energy', 'Materials', 'Utilities', 'Real Estate',
  'Communication Services', 'Consumer Staples', 'ETF', 'Crypto', 'Other',
]

const emptyForm = (): Omit<Position, 'id'> => ({
  symbol: '',
  name: '',
  sector: 'Technology',
  quantity: 0,
  avg_cost: 0,
  currency: 'USD',
})

export function PositionModal({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<Omit<Position, 'id'>>(() => {
    if (!initial) return emptyForm()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...rest } = initial
    return rest
  })
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    if (name === 'symbol') setSearchError(null)
    setForm(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'avg_cost' ? parseFloat(value) || 0 : value,
    }))
  }

  async function handleSearch() {
    const sym = form.symbol.trim()
    if (!sym) return
    setIsSearching(true)
    setSearchError(null)
    try {
      const info = await lookupTicker(sym)
      setForm(prev => ({
        ...prev,
        symbol: sym.toUpperCase(),
        name: info.name,
        sector: SECTORS.includes(info.sector) ? info.sector : 'Other',
      }))
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : '조회 중 오류가 발생했습니다.')
    } finally {
      setIsSearching(false)
    }
  }

  function handleSymbolKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.symbol.trim()) return
    onSave({ ...form, symbol: form.symbol.toUpperCase(), id: initial?.id ?? crypto.randomUUID() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            {initial ? '종목 편집' : '종목 추가'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Ticker + Search */}
          <Field label="티커 (Symbol)">
            <div className="flex gap-2">
              <input
                name="symbol"
                value={form.symbol}
                onChange={handleChange}
                onKeyDown={handleSymbolKeyDown}
                placeholder="AAPL"
                required
                className="input-glass uppercase flex-1"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching || !form.symbol.trim()}
                title="종목명·섹터·시세 조회"
                className="flex items-center justify-center w-10 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
              >
                {isSearching
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Search size={14} />}
              </button>
            </div>
            {searchError && (
              <p className="text-xs text-rose-400 mt-1">{searchError}</p>
            )}
          </Field>

          {/* 종목명 */}
          <Field label="종목명">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Apple Inc."
              className="input-glass"
            />
          </Field>

          {/* 섹터 */}
          <Field label="섹터">
            <select name="sector" value={form.sector} onChange={handleChange} className="input-glass">
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="수량">
              <input
                name="quantity"
                type="number"
                min={0}
                step="any"
                value={form.quantity || ''}
                onChange={handleChange}
                placeholder="10"
                required
                className="input-glass"
              />
            </Field>
            <Field label="평균단가">
              <input
                name="avg_cost"
                type="number"
                min={0}
                step="any"
                value={form.avg_cost || ''}
                onChange={handleChange}
                placeholder="150.00"
                required
                className="input-glass"
              />
            </Field>
          </div>

          <Field label="통화">
            <select name="currency" value={form.currency} onChange={handleChange} className="input-glass">
              <option value="USD">USD</option>
              <option value="KRW">KRW</option>
            </select>
          </Field>

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">
              취소
            </button>
            <button type="submit"
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
              {initial ? '저장' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      {children}
    </label>
  )
}
