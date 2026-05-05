"""
전략 코드를 안전하게 실행하는 러너.
사용자 Python 코드를 exec()로 실행하고 신호를 수집한다.
"""
import traceback
import pandas as pd
import numpy as np
from typing import Any

from app.services import market_data as md


def _build_namespace() -> dict[str, Any]:
    return {'pd': pd, 'np': np}


def run_strategy(
    code: str,
    strategy_id: str,
    market: str,
    params: dict,
) -> tuple[list[dict], str | None]:
    """
    전략 코드 실행.
    반환: (signals, error_message)
    """
    namespace = _build_namespace()
    context: dict[str, Any] = {
        'timeframe': '1d',
        'lookback': 60,
        'market': market,
        'universe': [],
    }

    try:
        exec(compile(code, f'<strategy:{strategy_id}>', 'exec'), namespace)
    except SyntaxError as e:
        return [], f'문법 오류: {e}'

    # initialize 실행 → universe 결정
    if 'initialize' in namespace:
        try:
            namespace['initialize'](context)
        except Exception as e:
            return [], f'initialize 오류: {e}'

    universe: list[str] = context.get('universe', [])
    if not universe:
        return [], 'universe가 비어 있습니다. initialize에서 context[\'universe\'] 설정 필요.'

    lookback = context.get('lookback', 60)
    period = _lookback_to_period(lookback)

    # 시세 데이터 수집
    data = md.fetch_bulk_ohlcv(universe, market, period=period, interval='1d')
    if not data:
        return [], '시세 데이터를 가져올 수 없습니다.'

    # generate_signal 실행
    if 'generate_signal' not in namespace:
        return [], 'generate_signal 함수가 정의되지 않았습니다.'

    mock_portfolio = {'positions': {}, 'cash': 0}

    try:
        raw_signals = namespace['generate_signal'](data, mock_portfolio, params, context)
    except Exception:
        return [], f'generate_signal 오류:\n{traceback.format_exc()}'

    if not raw_signals:
        return [], None

    # 신호에 현재가 보강
    signals: list[dict] = []
    for sig in raw_signals:
        if not isinstance(sig, dict):
            continue
        symbol = str(sig.get('symbol', '')).upper()
        df = data.get(symbol)
        current_price = float(df['Close'].iloc[-1]) if df is not None and not df.empty else 0.0
        signals.append({
            'symbol': symbol,
            'market': market,
            'action': sig.get('action', 'HOLD'),
            'quantity': sig.get('quantity'),
            'price': sig.get('price'),
            'current_price': current_price,
            'order_type': sig.get('order_type', 'MARKET'),
            'reason': sig.get('reason', ''),
        })

    return signals, None


def _lookback_to_period(lookback: int) -> str:
    if lookback <= 30:
        return '1mo'
    if lookback <= 90:
        return '3mo'
    if lookback <= 180:
        return '6mo'
    return '1y'
