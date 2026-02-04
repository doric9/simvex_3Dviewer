import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.api.router import api_router
from app.models.database import init_db

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    settings = get_settings()
    logger.info("Starting SimVex AI Teacher API")
    logger.info(f"Debug mode: {settings.debug}")
    logger.info(f"Database: {settings.database_url.split('://')[0] if '://' in settings.database_url else 'unknown'}")

    await init_db()
    logger.info("Database initialized")

    yield

    # Shutdown
    logger.info("Shutting down SimVex AI Teacher API")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="SimVex AI Teacher API",
        description="AI Engineering Teacher Backend for SimVex 3D machinery learning",
        version="1.0.0",
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(api_router, prefix="/api/v1")

    @app.get("/health")
    async def health_check():
        """Health check endpoint with server info."""
        worker_id = os.getpid()
        return {
            "status": "healthy",
            "version": "1.0.0",
            "worker_pid": worker_id,
            "database": "postgres" if settings.is_postgres else "sqlite",
        }

    return app


app = create_app()
