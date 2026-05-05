from fastapi import APIRouter, HTTPException
from app.models.execution import (
    RunStrategyRequest, EngineStatusResponse,
    SignalsResponse, StrategyJob,
)
from app.services import execution_engine

router = APIRouter(prefix='/api/execution', tags=['execution'])


@router.post('/strategies/register')
def register_strategy(req: RunStrategyRequest):
    """전략을 엔진에 등록 (스케줄 전략은 자동 실행 시작)."""
    job = StrategyJob(
        strategy_id=req.strategy_id,
        strategy_name=req.strategy_name,
        market=req.market,
        code=req.code,
        params=req.params,
        trigger_type=req.trigger_type,
        cron=req.cron,
    )
    execution_engine.register_strategy(job)
    return {'ok': True, 'strategy_id': req.strategy_id}


@router.delete('/strategies/{strategy_id}')
def remove_strategy(strategy_id: str):
    """전략 엔진에서 제거."""
    execution_engine.remove_strategy(strategy_id)
    return {'ok': True}


@router.post('/strategies/{strategy_id}/run')
def run_strategy_now(strategy_id: str):
    """전략 즉시 수동 실행."""
    job = next((j for j in execution_engine.get_active_jobs() if j.strategy_id == strategy_id), None)
    if not job:
        raise HTTPException(status_code=404, detail='등록되지 않은 전략입니다. 먼저 register 해주세요.')
    signals = execution_engine.run_now(strategy_id)
    return {'ok': True, 'signals': [s.model_dump() for s in signals]}


@router.get('/status', response_model=EngineStatusResponse)
def get_status():
    """엔진 상태 조회."""
    jobs = execution_engine.get_active_jobs()
    return EngineStatusResponse(
        is_running=execution_engine.is_running(),
        active_strategy_count=len(jobs),
        jobs=jobs,
    )


@router.get('/signals', response_model=SignalsResponse)
def get_signals(limit: int = 50):
    """최근 신호 목록 조회."""
    signals = execution_engine.get_recent_signals(limit=limit)
    return SignalsResponse(signals=signals, total=len(signals))


@router.delete('/signals')
def clear_signals():
    """신호 이력 초기화."""
    execution_engine.get_recent_signals.__self__ if False else None
    from app.services.execution_engine import _recent_signals
    _recent_signals.clear()
    return {'ok': True}
