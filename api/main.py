import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from database import init_db

# Imports dos módulos
from routers import health, network, speedtest, power
from tasks.network import ping_task, speedtest_task
from tasks.power import power_task

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup database
    init_db()
    
    # Start background tasks
    p_task = asyncio.create_task(ping_task())
    s_task = asyncio.create_task(speedtest_task())
    pw_task = asyncio.create_task(power_task())
    
    yield
    
    # Shutdown gracefully
    p_task.cancel()
    s_task.cancel()
    pw_task.cancel()

app = FastAPI(title="HomePulse API", description="API de monitorização do servidor", lifespan=lifespan)

# Incluir Routers
app.include_router(health.router)
app.include_router(network.router)
app.include_router(speedtest.router)
app.include_router(power.router)
