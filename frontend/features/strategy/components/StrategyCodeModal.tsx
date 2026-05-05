'use client'

import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { Strategy } from '@/types'
import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface Props {
  strategy: Strategy
  onClose: () => void
  onSave: (code: string) => void
}

export function StrategyCodeModal({ strategy, onClose, onSave }: Props) {
  const [code, setCode] = useState(strategy.code)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{strategy.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">전략 코드 편집기</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSave(code)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
            >
              <Save size={12} />
              저장
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden rounded-b-2xl">
          <MonacoEditor
            height="100%"
            language="python"
            theme="vs-dark"
            value={code}
            onChange={val => setCode(val ?? '')}
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              insertSpaces: true,
              wordWrap: 'on',
              padding: { top: 16, bottom: 16 },
            }}
          />
        </div>
      </div>
    </div>
  )
}
