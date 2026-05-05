import yfinance as yf                    # Yahoo Finance에서 주가 데이터를 가져오는 도구
import matplotlib.pyplot as plt          # 그래프를 그리는 도구 (plt라고 짧게 부름)
import matplotlib.dates as mdates        # 그래프의 날짜 형식을 다듬는 도구
import matplotlib.font_manager as fm     # 글꼴(폰트)을 관리하는 도구
import pandas as pd                      # 표(엑셀처럼 행/열로 된 데이터)를 다루는 도구

# macOS 한글 폰트 설정
plt.rcParams["font.family"] = "AppleGothic"   # 그래프에서 한글이 깨지지 않도록 폰트 지정
plt.rcParams["axes.unicode_minus"] = False     # 마이너스(-) 기호가 깨지지 않도록 설정

# 삼성전자 티커 (Yahoo Finance 기준)
TICKER = "005930.KS"   # 삼성전자 종목 코드 (.KS는 한국 거래소를 의미)

# 데이터 수집 (1년치)
df = yf.download(TICKER, period="1y", auto_adjust=True)   # 삼성전자 최근 1년 주가를 다운로드해서 df(표)에 저장

if df.empty:   # 만약 표가 비어있다면 (데이터를 못 받아왔다면)
    raise ValueError("데이터를 불러오지 못했습니다. 인터넷 연결 또는 티커를 확인하세요.")   # 오류 메시지를 보여주고 종료

# yfinance 멀티인덱스 컬럼 평탄화
if isinstance(df.columns, pd.MultiIndex):      # 열 이름이 2단계 구조로 되어 있다면
    df.columns = df.columns.get_level_values(0)  # 첫 번째 단계만 남겨서 "Close"처럼 단순하게 만듦

# 20일 이동평균선 계산
df["MA20"] = df["Close"].rolling(window=20).mean()   # 최근 20일 종가의 평균을 계산해서 MA20 열로 추가

# 차트 그리기
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 8), gridspec_kw={"height_ratios": [3, 1]})   # 위아래 2개 그래프 틀 생성 (위가 3배 크게)
fig.suptitle("삼성전자 (005930.KS) — 종가 & 20일 이동평균선", fontsize=15, fontweight="bold")    # 전체 그래프 제목 설정

# --- 상단: 종가 + MA20 ---
ax1.plot(df.index, df["Close"], label="종가", color="#1f77b4", linewidth=1.2)                      # 종가를 파란 실선으로 그림
ax1.plot(df.index, df["MA20"], label="MA20", color="#ff7f0e", linewidth=1.8, linestyle="--")       # MA20을 주황 점선으로 그림
ax1.set_ylabel("주가 (KRW)")                          # y축 이름을 "주가 (KRW)"로 설정
ax1.legend(loc="upper left")                          # 범례(종가/MA20 설명)를 왼쪽 위에 표시
ax1.grid(True, alpha=0.3)                             # 격자선을 30% 투명도로 표시
ax1.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m"))   # x축 날짜를 "2024-01" 형식으로 표시
ax1.xaxis.set_major_locator(mdates.MonthLocator())             # x축 눈금을 월 단위로 표시

# --- 하단: 거래량 ---
ax2.bar(df.index, df["Volume"], color="#aec7e8", width=1.5, label="거래량")   # 거래량을 하늘색 막대 그래프로 그림
ax2.set_ylabel("거래량")                              # y축 이름을 "거래량"으로 설정
ax2.set_xlabel("날짜")                                # x축 이름을 "날짜"로 설정
ax2.grid(True, alpha=0.3)                             # 격자선을 30% 투명도로 표시
ax2.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m"))   # x축 날짜를 "2024-01" 형식으로 표시
ax2.xaxis.set_major_locator(mdates.MonthLocator())             # x축 눈금을 월 단위로 표시

plt.xticks(rotation=45)                               # x축 날짜 글씨를 45도 기울여서 겹치지 않게 함
plt.tight_layout()                                    # 그래프 요소들이 겹치지 않도록 여백 자동 조정
plt.savefig("samsung_ma20.png", dpi=150, bbox_inches="tight")  # 그래프를 파일로 저장 (dpi=150은 해상도)
plt.show()                                            # 화면에 그래프를 띄움

# 최근 5거래일 데이터 출력
print("\n[ 최근 5거래일 ]")                           # 빈 줄 한 칸 띄우고 제목 출력
print(df[["Close", "MA20"]].tail().to_string())       # 종가와 MA20 열만 골라서 마지막 5행을 출력

