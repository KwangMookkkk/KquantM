"""
알림 서비스.
현재: 콘솔 로그 출력 (키 없이도 동작)
카카오 나에게 보내기 키 설정 후: KAKAO_ACCESS_TOKEN 환경변수 설정으로 활성화
"""
import os
import logging
import requests

from app.models.execution import SignalRecord

logger = logging.getLogger(__name__)

KAKAO_TOKEN = os.getenv('KAKAO_ACCESS_TOKEN', '')
KAKAO_API_URL = 'https://kapi.kakao.com/v2/api/talk/memo/default/send'


def send_signal_notification(signal: SignalRecord) -> bool:
    """
    신호 발생 알림 전송.
    KAKAO_ACCESS_TOKEN 환경변수가 없으면 콘솔 로그만 출력.
    """
    action_emoji = {'BUY': '🟢 매수', 'SELL': '🔴 매도', 'HOLD': '⚪ 보유'}.get(signal.action, signal.action)
    msg = (
        f"[KquantM 신호 발생]\n"
        f"{action_emoji} {signal.symbol}\n"
        f"전략: {signal.strategy_name}\n"
        f"현재가: {signal.current_price:,.2f}\n"
        f"사유: {signal.reason}\n"
        f"시각: {signal.generated_at}"
    )

    if not KAKAO_TOKEN:
        logger.info('[알림 (콘솔)] %s', msg)
        return True

    return _send_kakao(msg)


def _send_kakao(text: str) -> bool:
    """카카오 나에게 보내기 (텍스트 메시지)."""
    try:
        res = requests.post(
            KAKAO_API_URL,
            headers={
                'Authorization': f'Bearer {KAKAO_TOKEN}',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data={
                'template_object': (
                    '{"object_type":"text",'
                    f'"text":{repr(text)},'
                    '"link":{"web_url":"","mobile_web_url":""}}'
                )
            },
            timeout=5,
        )
        if res.status_code == 200:
            logger.info('[카카오 알림] 전송 성공')
            return True
        logger.warning('[카카오 알림] 전송 실패: %s %s', res.status_code, res.text)
        return False
    except Exception as e:
        logger.error('[카카오 알림] 예외: %s', e)
        return False
