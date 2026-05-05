from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import yfinance as yf

router = APIRouter(prefix="/api/stock", tags=["stock"])


class QuoteResponse(BaseModel):
    symbol: str
    name: str
    sector: str
    price: float
    daily_change_rate: float  # %


class PriceResponse(BaseModel):
    symbol: str
    price: float
    daily_change_rate: float  # %


@router.get("/lookup", response_model=QuoteResponse)
def lookup(symbol: str = Query(..., description="티커 심볼 (예: AAPL)")):
    """티커 조회 — 종목명·섹터·현재가 반환"""
    sym = symbol.upper().strip()
    try:
        ticker = yf.Ticker(sym)
        info = ticker.info

        price = float(info.get("regularMarketPrice") or info.get("currentPrice") or 0)
        prev  = float(info.get("previousClose") or info.get("regularMarketPreviousClose") or 0)
        daily_change_rate = ((price - prev) / prev * 100) if prev else 0.0

        name   = info.get("longName") or info.get("shortName") or sym
        sector = info.get("sector") or "Other"

        if price == 0:
            raise HTTPException(status_code=404, detail=f"{sym}: 가격 정보를 찾을 수 없습니다.")

        return QuoteResponse(
            symbol=sym,
            name=name,
            sector=sector,
            price=price,
            daily_change_rate=daily_change_rate,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"{sym}: {str(e)}")


@router.get("/prices", response_model=list[PriceResponse])
def prices(symbols: str = Query(..., description="콤마 구분 티커 목록 (예: AAPL,MSFT)")):
    """복수 종목 현재가 일괄 조회"""
    syms = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    if not syms:
        return []

    tickers = yf.Tickers(" ".join(syms))
    result: list[PriceResponse] = []

    for sym in syms:
        try:
            info  = tickers.tickers[sym].info
            price = float(info.get("regularMarketPrice") or info.get("currentPrice") or 0)
            prev  = float(info.get("previousClose") or info.get("regularMarketPreviousClose") or 0)
            daily_change_rate = ((price - prev) / prev * 100) if prev else 0.0
            result.append(PriceResponse(symbol=sym, price=price, daily_change_rate=daily_change_rate))
        except Exception:
            result.append(PriceResponse(symbol=sym, price=0.0, daily_change_rate=0.0))

    return result
