import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import init_database, database_has_data

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_path = os.environ.get("DATABASE_PATH") or settings.database_path
    logger.info(f"Initializing database at {db_path}")
    init_database(db_path)

    from .gateway.session import session_manager
    from .agents.orchestrator import set_orchestrator_session_manager
    set_orchestrator_session_manager(session_manager)

    from .channels.service import channel_service
    await channel_service.reconnect_all()

    if os.environ.get("HUB_API_URL") and not os.environ.get("DISABLE_HUB_REPORT"):
        try:
            from .hub_client import report_ready_to_hub
            await report_ready_to_hub(settings.workspace_id)
        except Exception as e:
            logger.warning(f"Could not report ready to hub: {e}")

    logger.info(f"Workspace {settings.workspace_id} server started")
    yield

    await channel_service.disconnect_all()
    logger.info(f"Workspace {settings.workspace_id} server stopped")


app = FastAPI(
    title="dropin.bot Workspace Server",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .gateway.router import router as gateway_router
from .agents.router import router as agents_router
from .channels.router import router as channels_router
from .tools.router import router as tools_router
from .teams.router import router as teams_router
from .knowledge.router import router as knowledge_router
from .files.router import router as files_router
from .mcp.router import router as mcp_router
from .dashboard.router import router as dashboard_router

app.include_router(gateway_router)
app.include_router(agents_router, prefix="/api/v1/ws")
app.include_router(channels_router, prefix="/api/v1/ws")
app.include_router(tools_router, prefix="/api/v1/ws")
app.include_router(teams_router, prefix="/api/v1/ws")
app.include_router(knowledge_router, prefix="/api/v1/ws")
app.include_router(files_router, prefix="/api/v1/ws")
app.include_router(mcp_router, prefix="/api/v1/ws")
app.include_router(dashboard_router, prefix="/api/v1/ws")


@app.get("/api/v1/ws/health")
async def health():
    from .gateway.session import session_manager
    return {
        "status": "ok",
        "workspace_id": settings.workspace_id,
        "uptime": session_manager.uptime_seconds(),
        "version": "0.1.0",
    }
