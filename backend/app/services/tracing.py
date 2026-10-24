import logging
import os
from typing import Any, Dict

from app.core.config import settings

logger = logging.getLogger(__name__)


def setup_langsmith_tracing():
    if settings.LANGSMITH_TRACING and settings.LANGSMITH_API_KEY:
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_API_KEY"] = settings.LANGSMITH_API_KEY
        os.environ["LANGCHAIN_PROJECT"] = settings.LANGSMITH_PROJECT
        logger.info(f"LangSmith tracing enabled for project: {settings.LANGSMITH_PROJECT}")
    else:
        os.environ["LANGCHAIN_TRACING_V2"] = "false"


def get_langsmith_status() -> Dict[str, Any]:
    if not settings.LANGSMITH_TRACING:
        return {
            "status": "disabled",
            "details": "LangSmith tracing is disabled (LANGSMITH_TRACING=False)",
        }
    if not settings.LANGSMITH_API_KEY:
        return {
            "status": "not_configured",
            "details": "LANGSMITH_TRACING is enabled but LANGSMITH_API_KEY is not configured",
        }
    return {
        "status": "connected",
        "details": f"LangSmith active for project '{settings.LANGSMITH_PROJECT}'",
    }


def redact_sensitive_data(payload: Dict[str, Any]) -> Dict[str, Any]:
    sensitive_keys = {"token", "password", "secret", "api_key", "key", "authorization"}
    sanitized = {}
    for k, v in payload.items():
        if any(sk in k.lower() for sk in sensitive_keys):
            sanitized[k] = "[REDACTED]"
        elif isinstance(v, dict):
            sanitized[k] = redact_sensitive_data(v)
        else:
            sanitized[k] = v
    return sanitized
