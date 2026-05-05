from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.stock import router as stock_router
from app.api.execution import router as execution_router
from app.services import execution_engine


@asynccontextmanager
async def lifespan(_app: FastAPI):
    execution_engine.start()
    yield
    execution_engine.stop()


app = FastAPI(title='Quant Platform API', lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:3000',
        'http://localhost:5173',
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(stock_router)
app.include_router(execution_router)


@app.get('/')
def root():
    return {'message': 'Quant Platform API 실행 중'}


@app.get('/health')
def health():
    return {'status': 'ok'}
