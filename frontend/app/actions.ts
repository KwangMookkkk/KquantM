'use server'

import Anthropic from '@anthropic-ai/sdk'
import type { StockQuote, TickerInfo } from '@/types'

export type { StockQuote, TickerInfo }

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8000'

export async function lookupTicker(symbol: string): Promise<TickerInfo> {
  const sym = symbol.toUpperCase().trim()
  let res: Response
  try {
    res = await fetch(`${BACKEND}/api/stock/lookup?symbol=${encodeURIComponent(sym)}`, { cache: 'no-store' })
  } catch {
    throw new Error('백엔드 서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인하세요.')
  }
  if (res.status === 404) throw new Error(`"${sym}" 티커를 찾을 수 없습니다.`)
  if (!res.ok) throw new Error(`조회 실패 (HTTP ${res.status})`)
  const data = await res.json() as { name: string; sector: string; price: number; daily_change_rate: number }
  return { name: data.name, sector: data.sector, price: data.price, dailyChangeRate: data.daily_change_rate }
}

export async function getStockPrices(symbols: string[]): Promise<Record<string, StockQuote | null>> {
  if (symbols.length === 0) return {}
  const syms = symbols.map(s => s.toUpperCase())
  const empty: Record<string, StockQuote | null> = Object.fromEntries(syms.map(s => [s, null]))
  try {
    const res = await fetch(`${BACKEND}/api/stock/prices?symbols=${syms.map(encodeURIComponent).join(',')}`, { cache: 'no-store' })
    if (!res.ok) return empty
    const data = await res.json() as { symbol: string; price: number; daily_change_rate: number }[]
    const out = { ...empty }
    for (const item of data) {
      const s = item.symbol.toUpperCase()
      if (item.price > 0) out[s] = { price: item.price, dailyChangeRate: item.daily_change_rate }
    }
    return out
  } catch { return empty }
}

export async function getStockPrice(symbol: string): Promise<StockQuote | null> {
  const result = await getStockPrices([symbol])
  return result[symbol.toUpperCase()] ?? null
}

// ─── AI 전략 텍스트 → Python 코드 변환 ──────────────────────

const STRATEGY_SYSTEM = `당신은 퀀트 투자 전략을 Python 코드로 변환하는 전문가입니다.
사용자의 자연어 전략 설명을 아래 표준 인터페이스에 맞는 Python 코드로 변환하세요.

표준 인터페이스:
\`\`\`python
def initialize(context):
    # 파라미터, 유니버스 설정
    # context에 설정값 저장
    pass

def generate_signal(data, portfolio, params, context):
    """
    data: dict[symbol, DataFrame(OHLCV)]  — 종목별 가격 데이터
    portfolio: dict — 현재 포트폴리오 (positions, cash)
    params: dict — 사용자 파라미터
    context: dict — {"timeframe": "1d", "lookback": int}

    반환: list[Signal]
    """
    signals = []
    # 전략 로직 구현
    return signals
\`\`\`

Signal 형식:
{"action": "BUY"|"SELL"|"HOLD", "symbol": str, "quantity": int|None, "order_type": "MARKET"|"LIMIT", "reason": str}

규칙:
- 코드만 출력 (설명 없이)
- import pandas as pd, numpy as np 포함
- 한국어 주석 허용
- quantity가 불확실하면 None 사용`

export async function convertStrategyText(
  text: string,
  market: 'US' | 'KR' | 'ALL',
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local을 확인하세요.')

  const client = new Anthropic({ apiKey })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: STRATEGY_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `시장: ${market}\n\n전략 설명:\n${text}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('AI 응답 오류')

  // 코드 블록 추출 (```python ... ``` 형식 처리)
  const raw = content.text.trim()
  const match = raw.match(/```(?:python)?\n?([\s\S]*?)```/)
  return match ? match[1].trim() : raw
}
