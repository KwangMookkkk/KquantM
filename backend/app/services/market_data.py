"""
시세 데이터 추상화 레이어.
현재: yfinance
3단계 이후: 한국투자증권 OpenAPI (pykis) 로 교체 예정.
"""
import pandas as pd
import yfinance as yf
from typing import Optional


def _to_yf_symbol(symbol: str, market: str) -> str:
    """한국 종목은 .KS 접미사 추가"""
    s = symbol.upper().strip()
    if market == 'KR' and not s.endswith('.KS') and not s.endswith('.KQ'):
        return s + '.KS'
    return s


def fetch_ohlcv(
    symbol: str,
    market: str,
    period: str = '3mo',
    interval: str = '1d',
) -> Optional[pd.DataFrame]:
    """단일 종목 OHLCV 조회. 실패 시 None 반환."""
    yf_sym = _to_yf_symbol(symbol, market)
    try:
        ticker = yf.Ticker(yf_sym)
        df = ticker.history(period=period, interval=interval)
        if df.empty:
            return None
        df = df[['Open', 'High', 'Low', 'Close', 'Volume']].copy()
        df.index = pd.to_datetime(df.index)
        return df
    except Exception:
        return None


def fetch_bulk_ohlcv(
    symbols: list[str],
    market: str,
    period: str = '3mo',
    interval: str = '1d',
) -> dict[str, pd.DataFrame]:
    """여러 종목 OHLCV 일괄 조회. 실패 종목은 결과에서 제외."""
    result: dict[str, pd.DataFrame] = {}
    for symbol in symbols:
        df = fetch_ohlcv(symbol, market, period, interval)
        if df is not None:
            result[symbol.upper()] = df
    return result


def fetch_current_price(symbol: str, market: str) -> Optional[float]:
    """현재가 단일 조회."""
    df = fetch_ohlcv(symbol, market, period='5d', interval='1d')
    if df is None or df.empty:
        return None
    return float(df['Close'].iloc[-1])
