import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import settings
from app.core.database import init_db
from app.schemas.health import HealthCheckResponse
from app.services.chromadb_service import get_chroma_client
from app.services.tracing import setup_langsmith_tracing

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("project_manager")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Project Manager application...")
    # Initialize DB tables
    try:
        await init_db()
        logger.info("PostgreSQL database initialized.")
    except Exception as e:
        logger.warning(f"Database initialization warning: {e}")

    # Initialize ChromaDB client in background
    try:
        get_chroma_client()
    except Exception as e:
        logger.warning(f"ChromaDB pre-warm notice: {e}")

    # Setup LangSmith tracing if enabled
    setup_langsmith_tracing()

    yield
    logger.info("Project Manager shutting down...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Personal Project Management and Showcase Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred.", "error_type": type(exc).__name__},
    )


@app.get("/health", response_model=HealthCheckResponse, tags=["health"])
async def root_health():
    return HealthCheckResponse(
        status="healthy",
        timestamp=datetime.now(timezone.utc),
        version="1.0.0",
    )


# Include v1 API routes
app.include_router(api_router, prefix=settings.API_V1_STR)
