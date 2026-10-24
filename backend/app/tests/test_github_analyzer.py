import base64
from unittest.mock import patch

import httpx
import pytest

from app.services.github_analyzer import GitHubAnalyzerService


def test_parse_github_url():
    owner, repo = GitHubAnalyzerService.parse_github_url("https://github.com/PVSaketh2003/In-out-Project-")
    assert owner == "PVSaketh2003"
    assert repo == "In-out-Project-"

    owner, repo = GitHubAnalyzerService.parse_github_url("https://github.com/owner/my-repo.git")
    assert owner == "owner"
    assert repo == "my-repo"

    owner, repo = GitHubAnalyzerService.parse_github_url("github.com/owner/repo")
    assert owner == "owner"
    assert repo == "repo"

    invalid_owner, invalid_repo = GitHubAnalyzerService.parse_github_url("https://google.com/test")
    assert invalid_owner is None
    assert invalid_repo is None


@pytest.mark.asyncio
async def test_analyze_repository_mocked():
    fake_repo_meta = {
        "name": "sample-edge-app",
        "owner": {"login": "PVSaketh2003"},
        "description": "Jetson edge analytics application",
        "default_branch": "main",
        "language": "Python",
        "stargazers_count": 12,
        "forks_count": 2,
        "open_issues_count": 0,
        "homepage": "https://sample.app",
        "license": {"name": "MIT"},
        "fork": False,
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-02-01T00:00:00Z",
    }
    fake_readme_b64 = base64.b64encode(b"# Sample Edge App\nReal time camera feed analytics with Jetson.\nCheck out Colab: https://colab.research.google.com/drive/xyz").decode()
    fake_tree = {
        "tree": [
            {"path": "requirements.txt"},
            {"path": "main.py"},
            {"path": "notebooks/demo.ipynb"},
            {"path": "Dockerfile"},
        ]
    }

    async def mock_get(client_self, url, *args, **kwargs):
        u = str(url)
        if "readme" in u:
            return httpx.Response(200, json={"content": fake_readme_b64})
        elif "git/trees" in u:
            return httpx.Response(200, json=fake_tree)
        elif "languages" in u:
            return httpx.Response(200, json={"Python": 45000})
        elif "raw.githubusercontent.com" in u:
            return httpx.Response(200, text="fastapi==0.111.0\nuvicorn>=0.29.0\ntorch>=2.2.0\nopencv-python")
        elif "/repos/" in u:
            return httpx.Response(200, json=fake_repo_meta)
        return httpx.Response(404)

    with patch.object(httpx.AsyncClient, "get", new=mock_get):
        success, result, error = await GitHubAnalyzerService.analyze_repository(
            "https://github.com/PVSaketh2003/sample-edge-app"
        )
        assert success is True
        assert result is not None
        assert result.repository_name.value == "sample-edge-app"
        assert result.repository_owner.value == "PVSaketh2003"
        assert result.backend_framework.value == "FastAPI"
        assert "PyTorch" in result.technologies.value
        assert "OpenCV" in result.technologies.value
        assert result.docker_support.value is True
        assert any("colab.research.google.com" in u for u in result.notebook_urls.value)


@pytest.mark.asyncio
async def test_analyze_rate_limit_handling():
    async def mock_rate_limit(client_self, url, *args, **kwargs):
        return httpx.Response(403, headers={"x-ratelimit-remaining": "0"})

    with patch.object(httpx.AsyncClient, "get", new=mock_rate_limit):
        success, result, error = await GitHubAnalyzerService.analyze_repository(
            "https://github.com/PVSaketh2003/test-repo"
        )
        assert success is False
        assert "rate limit exceeded" in error.lower()


@pytest.mark.asyncio
async def test_analyze_not_found():
    async def mock_not_found(client_self, url, *args, **kwargs):
        return httpx.Response(404)

    with patch.object(httpx.AsyncClient, "get", new=mock_not_found):
        success, result, error = await GitHubAnalyzerService.analyze_repository(
            "https://github.com/PVSaketh2003/nonexistent-repo"
        )
        assert success is False
        assert "not found or is private" in error.lower()
