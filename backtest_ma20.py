import yfinance as yf                    # Yahoo Finance에서 주가 데이터를 가져오는 도구
import matplotlib.pyplot as plt          # 그래프를 그리는 도구
import matplotlib.dates as mdates        # 그래프의 날짜 형식을 다듬는 도구
import matplotlib.patches as mpatches   # 그래프에 색깔 범례를 만드는 도구
import pandas as pd                      # 표(엑셀처럼 행/열로 된 데이터)를 다루는 도구
import numpy as np                       # 수학 계산을 빠르게 해주는 도구

plt.rcParams["font.family"] = "AppleGothic"   # 그래프에서 한글이 깨지지 않도록 폰트 지정
plt.rcParams["axes.unicode_minus"] = False     # 마이너스(-) 기호가 깨지지 않도록 설정

# ── 1. 데이터 수집 ──────────────────────────────────────────
TICKER = "005930.KS"           # 삼성전자 종목 코드
INITIAL_CASH = 10_000_000      # 초기 자본금 1000만원 (숫자 가독성을 위해 _로 구분)

df = yf.download(TICKER, period="1y", auto_adjust=True)   # 삼성전자 최근 1년 주가를 다운로드해서 df(표)에 저장
if isinstance(df.columns, pd.MultiIndex):                  # 열 이름이 2단계 구조로 되어 있다면
    df.columns = df.columns.get_level_values(0)            # 첫 번째 단계만 남겨서 "Close"처럼 단순하게 만듦

df["MA20"] = df["Close"].rolling(window=20).mean()   # 최근 20일 종가의 평균을 계산해서 MA20 열로 추가
df = df.dropna(subset=["MA20"]).copy()               # MA20이 계산 안 된 행(초반 19일)을 제거하고 복사본 저장

# ── 2. 시그널 생성 ──────────────────────────────────────────
# 종가가 MA20 위: 1 / 아래: 0
df["above"] = (df["Close"] > df["MA20"]).astype(int)   # 종가가 MA20보다 높으면 1, 낮으면 0으로 표시

# 교차 감지: 1 = 상향돌파(매수), -1 = 하향이탈(매도)
df["signal"] = df["above"].diff()   # 오늘 값에서 어제 값을 빼서 변화 감지 (0→1이면 +1, 1→0이면 -1)

# ── 3. 백테스팅 ─────────────────────────────────────────────
cash = INITIAL_CASH   # 현재 보유 현금을 초기 자본금으로 설정
shares = 0            # 현재 보유 주식 수 (처음엔 0주)
position = False      # 현재 주식을 보유 중인지 여부 (False = 미보유)
trades = []           # 매매 내역을 저장할 빈 리스트

for date, row in df.iterrows():       # 표의 각 행(날짜별 데이터)을 하나씩 순서대로 꺼냄
    price = float(row["Close"])       # 오늘 종가를 숫자(실수)로 가져옴
    sig   = float(row["signal"])      # 오늘 시그널 값을 숫자로 가져옴

    # 매수: 상향돌파 & 미보유
    if sig == 1 and not position:           # 시그널이 +1(상향돌파)이고 주식을 안 갖고 있다면
        shares = int(cash // price)         # 가진 현금으로 살 수 있는 최대 주식 수 계산
        if shares > 0:                      # 1주 이상 살 수 있다면
            cost = shares * price           # 총 매수 금액 계산
            cash -= cost                    # 현금에서 매수 금액만큼 차감
            position = True                 # 주식 보유 상태로 변경
            trades.append({                 # 매수 내역을 리스트에 추가
                "type": "BUY", "date": date,
                "price": price, "shares": shares,
                "cash": cash
            })

    # 매도: 하향이탈 & 보유 중
    elif sig == -1 and position:            # 시그널이 -1(하향이탈)이고 주식을 갖고 있다면
        proceeds = shares * price           # 총 매도 금액 계산
        cash += proceeds                    # 현금에 매도 금액만큼 추가
        trades.append({                     # 매도 내역을 리스트에 추가
            "type": "SELL", "date": date,
            "price": price, "shares": shares,
            "cash": cash
        })
        shares = 0                          # 보유 주식 수를 0으로 초기화
        position = False                    # 미보유 상태로 변경

# 마지막 포지션 청산 (보유 중이면 최종 가격으로)
if position:                                         # 백테스팅 종료 시점에도 주식을 갖고 있다면
    final_price = float(df["Close"].iloc[-1])        # 마지막 날의 종가를 가져옴
    proceeds = shares * final_price                  # 총 청산 금액 계산
    cash += proceeds                                 # 현금에 청산 금액 추가
    trades.append({                                  # 청산 내역을 리스트에 추가
        "type": "SELL(청산)", "date": df.index[-1],
        "price": final_price, "shares": shares,
        "cash": cash
    })
    shares = 0                                       # 보유 주식 수를 0으로 초기화
    position = False                                 # 미보유 상태로 변경

final_value = cash   # 백테스팅 최종 자산 = 남은 현금

# ── 4. 일별 포트폴리오 가치 추적 ─────────────────────────────
portfolio_values = []   # 날짜별 포트폴리오 가치를 저장할 빈 리스트
_cash = INITIAL_CASH    # 추적용 현금 변수 (앞서 계산한 cash와 별개로 다시 시작)
_shares = 0             # 추적용 주식 수 변수

for date, row in df.iterrows():      # 다시 날짜별로 순서대로 반복
    price = float(row["Close"])      # 오늘 종가
    sig   = float(row["signal"])     # 오늘 시그널

    if sig == 1 and _shares == 0:    # 상향돌파 시그널이고 주식이 없다면
        _shares = int(_cash // price)  # 최대한 주식 매수
        _cash  -= _shares * price      # 현금 차감
    elif sig == -1 and _shares > 0:  # 하향이탈 시그널이고 주식이 있다면
        _cash  += _shares * price      # 주식 전량 매도해서 현금 추가
        _shares = 0                    # 보유 주식 초기화

    portfolio_values.append(_cash + _shares * price)   # 오늘의 포트폴리오 가치 = 현금 + 주식 평가액

df["portfolio"] = portfolio_values   # 계산한 일별 포트폴리오 가치를 표에 새 열로 추가

# 바이앤홀드 비교
df["buy_and_hold"] = INITIAL_CASH * (df["Close"] / df["Close"].iloc[0])   # 처음에 사서 끝까지 보유했을 때의 가치 계산

# ── 5. 성과 지표 계산 ─────────────────────────────────────────
total_return = (final_value - INITIAL_CASH) / INITIAL_CASH * 100          # 전략 수익률(%) 계산
bah_return   = (float(df["buy_and_hold"].iloc[-1]) - INITIAL_CASH) / INITIAL_CASH * 100   # 바이앤홀드 수익률(%) 계산

trade_df = pd.DataFrame(trades)                                            # 매매 내역 리스트를 표로 변환
buy_trades  = trade_df[trade_df["type"] == "BUY"]                         # 매수 내역만 따로 추출
sell_trades = trade_df[trade_df["type"].isin(["SELL", "SELL(청산)"])]     # 매도 내역만 따로 추출

# 거래별 손익
pnl_list = []                                                              # 거래별 손익률을 저장할 빈 리스트
for (_, b), (_, s) in zip(buy_trades.iterrows(), sell_trades.iterrows()): # 매수/매도를 한 쌍씩 묶어서 반복
    pnl = (s["price"] - b["price"]) / b["price"] * 100                    # 해당 거래의 손익률(%) 계산
    pnl_list.append(pnl)                                                   # 리스트에 추가

win_trades  = [p for p in pnl_list if p > 0]                              # 수익이 난 거래만 추출
lose_trades = [p for p in pnl_list if p <= 0]                             # 손실이 난 거래만 추출
win_rate    = len(win_trades) / len(pnl_list) * 100 if pnl_list else 0    # 승률(%) 계산 (거래가 없으면 0)

# MDD 계산
rolling_max = df["portfolio"].cummax()                          # 날짜별 포트폴리오 최고점을 누적으로 계산
drawdown    = (df["portfolio"] - rolling_max) / rolling_max * 100  # 최고점 대비 현재 얼마나 떨어졌는지(%) 계산
mdd         = drawdown.min()                                    # 그 중 가장 많이 떨어진 값 = 최대낙폭(MDD)

# ── 6. 결과 출력 ─────────────────────────────────────────────
print("=" * 55)                                                            # 구분선 출력
print("       삼성전자 MA20 돌파 전략 백테스팅 결과")                     # 제목 출력
print("=" * 55)                                                            # 구분선 출력
print(f"  기간         : {df.index[0].date()} ~ {df.index[-1].date()}")   # 백테스팅 시작~종료 날짜 출력
print(f"  초기 자본    : {INITIAL_CASH:>12,} 원")                         # 초기 자본금 출력 (,로 자릿수 구분)
print(f"  최종 자산    : {int(final_value):>12,} 원")                     # 최종 자산 출력
print(f"  전략 수익률  : {total_return:>+.2f}%")                          # 전략 수익률 출력 (+/-부호 포함, 소수점 2자리)
print(f"  B&H 수익률   : {bah_return:>+.2f}%")                            # 바이앤홀드 수익률 출력
print(f"  최대낙폭(MDD): {mdd:.2f}%")                                     # 최대낙폭 출력
print(f"  총 거래 횟수 : {len(pnl_list)}회")                              # 총 거래 횟수 출력
print(f"  승률         : {win_rate:.1f}%")                                 # 승률 출력 (소수점 1자리)
print("-" * 55)                                                            # 구분선 출력
print("  거래 내역")                                                       # 소제목 출력
print("-" * 55)                                                            # 구분선 출력
for t in trades:                                                           # 매매 내역을 하나씩 출력
    mark = "▲" if t["type"] == "BUY" else "▼"                            # 매수면 ▲, 매도면 ▼ 표시
    print(f"  {mark} {t['type']:<10} {str(t['date'].date())}  "
          f"{int(t['price']):>8,}원  {t['shares']:>5}주  "
          f"잔고: {int(t['cash']):>12,}원")                               # 거래 유형, 날짜, 가격, 주수, 잔고 출력
print("=" * 55)                                                            # 구분선 출력

# ── 7. 차트 ──────────────────────────────────────────────────
fig, (ax1, ax2, ax3) = plt.subplots(
    3, 1, figsize=(15, 11),
    gridspec_kw={"height_ratios": [3, 1.5, 1]}    # 위에서부터 3:1.5:1 비율로 3개 그래프 생성
)
fig.suptitle("삼성전자 MA20 돌파 전략 백테스팅", fontsize=15, fontweight="bold")   # 전체 그래프 제목 설정

# 상단: 종가 + MA20 + 매수/매도 시그널
ax1.plot(df.index, df["Close"], label="종가", color="#1f77b4", linewidth=1.2, zorder=2)         # 종가를 파란 실선으로 그림
ax1.plot(df.index, df["MA20"],  label="MA20",  color="#ff7f0e", linewidth=1.8,
         linestyle="--", zorder=2)                                                               # MA20을 주황 점선으로 그림

for t in trades:                                              # 매매 내역을 하나씩 꺼내서
    if t["type"] == "BUY":                                    # 매수라면
        ax1.axvline(t["date"], color="green", alpha=0.25, linewidth=1)          # 해당 날짜에 초록 세로선 그림
        ax1.scatter(t["date"], t["price"], marker="^", color="green",
                    s=120, zorder=5)                                             # 매수 가격에 초록 삼각형(▲) 표시
    else:                                                     # 매도라면
        ax1.axvline(t["date"], color="red", alpha=0.25, linewidth=1)            # 해당 날짜에 빨간 세로선 그림
        ax1.scatter(t["date"], t["price"], marker="v", color="red",
                    s=120, zorder=5)                                             # 매도 가격에 빨간 삼각형(▼) 표시

buy_patch  = mpatches.Patch(color="green", label="매수")                        # 범례용 초록 색상 패치 생성
sell_patch = mpatches.Patch(color="red",   label="매도")                        # 범례용 빨간 색상 패치 생성
ax1.legend(handles=[ax1.lines[0], ax1.lines[1], buy_patch, sell_patch],
           loc="upper left", fontsize=9)                                         # 종가/MA20/매수/매도 범례를 왼쪽 위에 표시
ax1.set_ylabel("주가 (KRW)")                                  # y축 이름 설정
ax1.grid(True, alpha=0.3)                                     # 격자선을 30% 투명도로 표시
ax1.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m"))  # x축 날짜를 "2024-01" 형식으로 표시
ax1.xaxis.set_major_locator(mdates.MonthLocator())            # x축 눈금을 월 단위로 표시

# 중단: 포트폴리오 가치 vs 바이앤홀드
ax2.plot(df.index, df["portfolio"],    label="MA20 전략", color="steelblue", linewidth=1.5)      # MA20 전략의 일별 자산을 파란 실선으로 그림
ax2.plot(df.index, df["buy_and_hold"], label="Buy & Hold", color="gray",
         linewidth=1.5, linestyle="--")                                                           # 바이앤홀드 자산을 회색 점선으로 그림
ax2.set_ylabel("포트폴리오 (KRW)")                            # y축 이름 설정
ax2.legend(loc="upper left", fontsize=9)                      # 범례를 왼쪽 위에 표시
ax2.grid(True, alpha=0.3)                                     # 격자선을 30% 투명도로 표시
ax2.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m"))  # x축 날짜를 "2024-01" 형식으로 표시
ax2.xaxis.set_major_locator(mdates.MonthLocator())            # x축 눈금을 월 단위로 표시
ax2.yaxis.set_major_formatter(
    plt.FuncFormatter(lambda x, _: f"{int(x):,}")            # y축 숫자를 1,000,000 처럼 쉼표로 구분해서 표시
)

# 하단: 낙폭(Drawdown)
ax3.fill_between(df.index, drawdown, 0, color="salmon", alpha=0.6, label="Drawdown")   # 낙폭 영역을 연어색으로 채움
ax3.axhline(mdd, color="darkred", linestyle="--", linewidth=1,
            label=f"MDD {mdd:.1f}%")                                                    # MDD 값에 빨간 가로 점선 표시
ax3.set_ylabel("Drawdown (%)")                                # y축 이름 설정
ax3.set_xlabel("날짜")                                        # x축 이름 설정
ax3.legend(loc="lower left", fontsize=9)                      # 범례를 왼쪽 아래에 표시
ax3.grid(True, alpha=0.3)                                     # 격자선을 30% 투명도로 표시
ax3.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m"))  # x축 날짜를 "2024-01" 형식으로 표시
ax3.xaxis.set_major_locator(mdates.MonthLocator())            # x축 눈금을 월 단위로 표시

plt.xticks(rotation=45)                                       # x축 날짜 글씨를 45도 기울여서 겹치지 않게 함
plt.tight_layout()                                            # 그래프 요소들이 겹치지 않도록 여백 자동 조정
plt.savefig("backtest_ma20.png", dpi=150, bbox_inches="tight")  # 그래프를 파일로 저장
plt.show()                                                    # 화면에 그래프를 띄움
