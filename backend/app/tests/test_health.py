import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_health(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "1.0.0"


@pytest.mark.asyncio
async def test_api_v1_health(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_settings_health(client: AsyncClient):
    response = await client.get("/api/v1/settings/health")
    assert response.status_code == 200
    data = response.json()
    assert "services" in data
    assert "fastapi" in data["services"]
    assert "postgresql" in data["services"]
    assert "chromadb" in data["services"]
    assert "langgraph" in data["services"]
    assert data["services"]["fastapi"]["status"] == "connected"
