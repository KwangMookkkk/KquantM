"""
전략 실행 엔진.
APScheduler BackgroundScheduler로 전략별 폴링 주기를 관리한다.
"""
import uuid
import logging
from collections import deque
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.models.execution import SignalRecord, StrategyJob
from app.services import strategy_runner, notification

logger = logging.getLogger(__name__)

_scheduler = BackgroundScheduler(timezone='Asia/Seoul')
_active_jobs: dict[str, StrategyJob] = {}
_recent_signals: deque[SignalRecord] = deque(maxlen=200)

DEFAULT_INTERVAL_MINUTES = 5


def start() -> None:
    if not _scheduler.running:
        _scheduler.start()
        logger.info('[엔진] 스케줄러 시작')


def stop() -> None:
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info('[엔진] 스케줄러 종료')


def is_running() -> bool:
    return _scheduler.running


def register_strategy(job: StrategyJob) -> None:
    """전략을 엔진에 등록하고 스케줄 잡 추가."""
    if job.strategy_id in _active_jobs:
        remove_strategy(job.strategy_id)

    _active_jobs[job.strategy_id] = job

    if job.trigger_type == 'manual':
        logger.info('[엔진] 수동 전략 등록: %s', job.strategy_name)
        return

    trigger = _build_trigger(job)
    _scheduler.add_job(
        func=_run_job,
        trigger=trigger,
        args=[job.strategy_id],
        id=job.strategy_id,
        name=job.strategy_name,
        replace_existing=True,
        misfire_grace_time=60,
    )
    logger.info('[엔진] 전략 스케줄 등록: %s', job.strategy_name)


def remove_strategy(strategy_id: str) -> None:
    """전략 잡 제거."""
    _active_jobs.pop(strategy_id, None)
    try:
        _scheduler.remove_job(strategy_id)
    except Exception:
        pass
    logger.info('[엔진] 전략 제거: %s', strategy_id)


def run_now(strategy_id: str) -> list[SignalRecord]:
    """수동 즉시 실행. 신호 목록 반환."""
    return _run_job(strategy_id)


def get_active_jobs() -> list[StrategyJob]:
    return list(_active_jobs.values())


def get_recent_signals(limit: int = 50) -> list[SignalRecord]:
    signals = list(_recent_signals)
    signals.sort(key=lambda s: s.generated_at, reverse=True)
    return signals[:limit]


def _build_trigger(job: StrategyJob):
    if job.trigger_type == 'schedule' and job.cron:
        try:
            parts = job.cron.strip().split()
            if len(parts) == 5:
                minute, hour, day, month, day_of_week = parts
                return CronTrigger(
                    minute=minute, hour=hour,
                    day=day, month=month,
                    day_of_week=day_of_week,
                    timezone='Asia/Seoul',
                )
        except Exception:
            pass
    return IntervalTrigger(minutes=DEFAULT_INTERVAL_MINUTES)


def _run_job(strategy_id: str) -> list[SignalRecord]:
    job = _active_jobs.get(strategy_id)
    if not job:
        return []

    now = datetime.now(tz=timezone.utc).isoformat()
    logger.info('[엔진] 전략 실행: %s', job.strategy_name)

    signals_raw, error = strategy_runner.run_strategy(
        code=job.code,
        strategy_id=job.strategy_id,
        market=job.market,
        params=job.params,
    )

    job.last_run = now
    job.run_count += 1

    if error:
        job.last_error = error
        logger.warning('[엔진] 전략 오류 (%s): %s', job.strategy_name, error)
        return []

    job.last_error = None
    records: list[SignalRecord] = []

    for sig in signals_raw:
        record = SignalRecord(
            id=str(uuid.uuid4()),
            strategy_id=job.strategy_id,
            strategy_name=job.strategy_name,
            symbol=sig['symbol'],
            market=sig['market'],
            action=sig['action'],
            quantity=sig.get('quantity'),
            price=sig.get('price'),
            current_price=sig['current_price'],
            order_type=sig['order_type'],
            reason=sig['reason'],
            generated_at=now,
        )
        _recent_signals.appendleft(record)

        notified = notification.send_signal_notification(record)
        record.notified = notified
        records.append(record)

    logger.info('[엔진] 전략 완료: %s — 신호 %d개', job.strategy_name, len(records))
    return records
