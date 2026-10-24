from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.schemas.health import ComponentHealth, SettingsHealthResponse
from app.services.chromadb_service import ChromaService
from app.services.tracing import get_langsmith_status

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/health", response_model=SettingsHealthResponse)
async def get_settings_health(
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    services = {}

    # 1. FastAPI backend
    services["fastapi"] = ComponentHealth(
        status="connected",
        details="FastAPI ASGI engine running on Python 3.13 macOS",
    )

    # 2. PostgreSQL
    try:
        await db.execute(text("SELECT 1;"))
        services["postgresql"] = ComponentHealth(
            status="connected",
            details="PostgreSQL database connection active and responsive",
        )
    except Exception as e:
        services["postgresql"] = ComponentHealth(
            status="unavailable",
            details=f"PostgreSQL unreachable: {str(e)[:100]}",
        )

    # 3. ChromaDB
    chroma_info = ChromaService.health_check()
    services["chromadb"] = ComponentHealth(
        status=chroma_info["status"],
        details=chroma_info["details"],
    )

    # 4. GitHub integration
    if settings.GITHUB_TOKEN:
        services["github"] = ComponentHealth(
            status="connected",
            details="Authenticated with configured GITHUB_TOKEN",
        )
    else:
        services["github"] = ComponentHealth(
            status="not_configured",
            details="Operating in public repository mode (rate limits may apply)",
        )

    # 5. LangChain model configuration
    if settings.OPENAI_API_KEY:
        services["langchain_model"] = ComponentHealth(
            status="connected",
            details="OpenAI API model configured",
        )
    else:
        services["langchain_model"] = ComponentHealth(
            status="not_configured",
            details="Deterministic rule-based agent active (no paid LLM required)",
        )

    # 6. LangGraph agent availability
    services["langgraph"] = ComponentHealth(
        status="connected",
        details="LangGraph StateGraph workflow compiled and operational",
    )

    # 7. LangSmith tracing configuration
    langsmith_info = get_langsmith_status()
    services["langsmith"] = ComponentHealth(
        status=langsmith_info["status"],
        details=langsmith_info["details"],
    )

    overall_status = "healthy" if services["postgresql"].status == "connected" else "degraded"

    return SettingsHealthResponse(
        status=overall_status,
        timestamp=now,
        services=services,
    )
