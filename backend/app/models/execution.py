from typing import Literal, Optional
from pydantic import BaseModel


class SignalRecord(BaseModel):
    id: str
    strategy_id: str
    strategy_name: str
    symbol: str
    market: str
    action: Literal['BUY', 'SELL', 'HOLD']
    quantity: Optional[int] = None
    price: Optional[float] = None
    current_price: float
    order_type: Literal['MARKET', 'LIMIT']
    reason: str
    generated_at: str
    notified: bool = False


class StrategyJob(BaseModel):
    strategy_id: str
    strategy_name: str
    market: str
    code: str
    params: dict
    trigger_type: str
    cron: Optional[str] = None
    last_run: Optional[str] = None
    last_error: Optional[str] = None
    run_count: int = 0


class RunStrategyRequest(BaseModel):
    strategy_id: str
    strategy_name: str
    market: str
    code: str
    params: dict
    trigger_type: str = 'manual'
    cron: Optional[str] = None


class EngineStatusResponse(BaseModel):
    is_running: bool
    active_strategy_count: int
    jobs: list[StrategyJob]


class SignalsResponse(BaseModel):
    signals: list[SignalRecord]
    total: int
