from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Project Manager"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://pvsairamsaketh@localhost:5432/project_manager"

    # Vector store
    CHROMA_PERSIST_DIR: str = "./chroma_data"

    # GitHub Integration
    GITHUB_TOKEN: Optional[str] = None

    # LangSmith Tracing
    LANGSMITH_TRACING: bool = False
    LANGSMITH_API_KEY: Optional[str] = None
    LANGSMITH_PROJECT: str = "personal-project-manager"

    # AI Models (Optional)
    OPENAI_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # Local Project Execution (macOS)
    LOCAL_PROJECTS_DIR: str = "/Users/pvsairamsaketh/Documents/projects_local"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
