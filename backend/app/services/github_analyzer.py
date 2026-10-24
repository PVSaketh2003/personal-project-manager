import base64
import logging
import re
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import httpx

from app.core.config import settings
from app.schemas.github import GitHubAnalysisResult, ProvenanceItem

logger = logging.getLogger(__name__)


class GitHubAnalyzerService:
    @staticmethod
    def parse_github_url(url: str) -> Tuple[Optional[str], Optional[str]]:
        if not url:
            return None, None
        clean_url = url.strip()
        if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
            clean_url = "https://" + clean_url

        try:
            parsed = urlparse(clean_url)
            if "github.com" not in parsed.netloc:
                return None, None
            parts = [p for p in parsed.path.strip("/").split("/") if p]
            if len(parts) >= 2:
                owner = parts[0]
                repo = parts[1]
                if repo.endswith(".git"):
                    repo = repo[:-4]
                return owner, repo
        except Exception as e:
            logger.warning(f"Failed to parse GitHub URL '{url}': {e}")
        return None, None

    @classmethod
    async def analyze_repository(cls, repo_url: str) -> Tuple[bool, Optional[GitHubAnalysisResult], Optional[str]]:
        owner, repo = cls.parse_github_url(repo_url)
        if not owner or not repo:
            return False, None, "Invalid GitHub repository URL. Expected format: https://github.com/owner/repository"

        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Project-Manager-Platform",
        }
        if settings.GITHUB_TOKEN:
            headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"

        async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
            # 1. Fetch Repository Metadata
            repo_api_url = f"https://api.github.com/repos/{owner}/{repo}"
            try:
                resp = await client.get(repo_api_url)
                if resp.status_code == 404:
                    return False, None, f"Repository '{owner}/{repo}' not found or is private."
                if resp.status_code == 403:
                    limit_remaining = resp.headers.get("x-ratelimit-remaining")
                    if limit_remaining == "0":
                        return False, None, "GitHub API rate limit exceeded. Please configure GITHUB_TOKEN in settings."
                    return False, None, "Access forbidden by GitHub API."
                if resp.status_code != 200:
                    return False, None, f"GitHub API error: HTTP {resp.status_code}"
                repo_data = resp.json()
            except httpx.RequestError as e:
                return False, None, f"Network error connecting to GitHub: {str(e)}"

            default_branch = repo_data.get("default_branch", "main")
            description = repo_data.get("description") or ""
            homepage = repo_data.get("homepage") or None
            primary_lang = repo_data.get("language")

            # 2. Fetch Languages
            languages_dict = {}
            try:
                lang_resp = await client.get(f"https://api.github.com/repos/{owner}/{repo}/languages")
                if lang_resp.status_code == 200:
                    languages_dict = lang_resp.json()
            except Exception:
                pass

            # 3. Fetch README
            readme_text = ""
            readme_summary = ""
            colab_urls = []
            try:
                readme_resp = await client.get(f"https://api.github.com/repos/{owner}/{repo}/readme")
                if readme_resp.status_code == 200:
                    readme_data = readme_resp.json()
                    content_b64 = readme_data.get("content", "")
                    readme_text = base64.b64decode(content_b64).decode("utf-8", errors="ignore")

                    # Extract Colab links
                    colab_matches = re.findall(r'https?://colab\.research\.google\.com/[^\s\)\"\'>]+', readme_text)
                    colab_urls = list(set(colab_matches))

                    # Generate clean summary from README lines
                    lines = [line.strip() for line in readme_text.splitlines() if line.strip() and not line.strip().startswith(("#", "[!", "<!--", "```"))]
                    if lines:
                        readme_summary = " ".join(lines[:4])[:500]
                    else:
                        readme_summary = description
            except Exception as e:
                logger.info(f"README fetch skipped or not found: {e}")

            # 4. Fetch Tree
            tree_items = []
            try:
                tree_resp = await client.get(f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1")
                if tree_resp.status_code == 200:
                    tree_json = tree_resp.json()
                    tree_items = [item.get("path", "") for item in tree_json.get("tree", []) if "path" in item]
            except Exception as e:
                logger.info(f"Tree fetch skipped: {e}")

            # 5. Inspect Tree for manifests & entry points
            manifests: Dict[str, Any] = {}
            entry_points: Dict[str, Any] = {}
            notebook_files: List[str] = []
            technologies = set()
            frontend_framework = None
            backend_framework = None
            database_tech = None
            docker_support = False
            ci_workflows = []

            for path in tree_items:
                lower = path.lower()
                if lower.endswith(".ipynb"):
                    notebook_files.append(path)
                elif "docker-compose" in lower or lower == "dockerfile":
                    docker_support = True
                    technologies.add("Docker")
                elif lower.startswith(".github/workflows/") and (lower.endswith(".yml") or lower.endswith(".yaml")):
                    ci_workflows.append(path)

            # Check key manifests
            has_package_json = any(p == "package.json" or p.endswith("/package.json") for p in tree_items)
            has_requirements = any("requirements.txt" in p for p in tree_items)
            has_pyproject = any("pyproject.toml" in p for p in tree_items)

            # Sample fetch package.json if present
            if has_package_json:
                pkg_path = "package.json" if "package.json" in tree_items else [p for p in tree_items if p.endswith("package.json")][0]
                try:
                    pkg_resp = await client.get(f"https://raw.githubusercontent.com/{owner}/{repo}/{default_branch}/{pkg_path}")
                    if pkg_resp.status_code == 200:
                        pkg_json = pkg_resp.json()
                        all_deps = {**pkg_json.get("dependencies", {}), **pkg_json.get("devDependencies", {})}
                        manifests[pkg_path] = list(all_deps.keys())

                        # Framework detection
                        if "react" in all_deps or "react-dom" in all_deps:
                            frontend_framework = "React"
                            technologies.add("React")
                        elif "next" in all_deps:
                            frontend_framework = "Next.js"
                            technologies.add("Next.js")
                        elif "vue" in all_deps:
                            frontend_framework = "Vue"
                            technologies.add("Vue")
                        elif "svelte" in all_deps:
                            frontend_framework = "Svelte"
                            technologies.add("Svelte")

                        if "vite" in all_deps:
                            technologies.add("Vite")
                        if "typescript" in all_deps:
                            technologies.add("TypeScript")
                        if "tailwindcss" in all_deps:
                            technologies.add("Tailwind CSS")
                        if "express" in all_deps:
                            backend_framework = "Express.js"
                            technologies.add("Express.js")
                        if "prisma" in all_deps or "@prisma/client" in all_deps:
                            database_tech = "Prisma ORM"
                        elif "pg" in all_deps:
                            database_tech = "PostgreSQL"
                        elif "mongoose" in all_deps or "mongodb" in all_deps:
                            database_tech = "MongoDB"
                except Exception as e:
                    logger.info(f"Error parsing package.json: {e}")

            # Sample fetch requirements.txt or pyproject.toml
            if has_requirements or has_pyproject:
                req_path = "requirements.txt" if "requirements.txt" in tree_items else ("pyproject.toml" if "pyproject.toml" in tree_items else [p for p in tree_items if "requirements" in p][0])
                try:
                    req_resp = await client.get(f"https://raw.githubusercontent.com/{owner}/{repo}/{default_branch}/{req_path}")
                    if req_resp.status_code == 200:
                        req_text = req_resp.text.lower()
                        manifests[req_path] = [line.strip().split("==")[0].split(">=")[0] for line in req_text.splitlines() if line.strip() and not line.startswith("#")][:30]

                        if "fastapi" in req_text:
                            backend_framework = "FastAPI"
                            technologies.add("FastAPI")
                        elif "django" in req_text:
                            backend_framework = "Django"
                            technologies.add("Django")
                        elif "flask" in req_text:
                            backend_framework = "Flask"
                            technologies.add("Flask")

                        if "torch" in req_text or "pytorch" in req_text:
                            technologies.add("PyTorch")
                        if "tensorflow" in req_text or "keras" in req_text:
                            technologies.add("TensorFlow")
                        if "opencv-python" in req_text or "cv2" in req_text:
                            technologies.add("OpenCV")
                        if "langchain" in req_text or "langgraph" in req_text:
                            technologies.add("LangChain")
                        if "chromadb" in req_text:
                            technologies.add("ChromaDB")

                        if "psycopg2" in req_text or "asyncpg" in req_text:
                            database_tech = "PostgreSQL"
                        elif "pymongo" in req_text or "motor" in req_text:
                            database_tech = "MongoDB"
                        elif "sqlite3" in req_text or "aiosqlite" in req_text:
                            database_tech = "SQLite"
                except Exception as e:
                    logger.info(f"Error reading Python requirements: {e}")

            # Check entry points
            for p in tree_items:
                if p in ["main.py", "app.py", "manage.py", "wsgi.py", "server.py", "run.py"]:
                    entry_points["backend"] = p
                elif p in ["src/main.tsx", "src/main.jsx", "src/index.tsx", "src/index.js", "src/App.tsx", "index.html"]:
                    entry_points["frontend"] = p

            # Add primary language to technologies
            if primary_lang:
                technologies.add(primary_lang)
            for lang in languages_dict.keys():
                technologies.add(lang)

            # Determine Project Category
            category = "Web Application"
            cat_prov = "inferred"
            if notebook_files and not frontend_framework and not backend_framework:
                category = "Jupyter Notebook"
                cat_prov = "detected"
            elif any(t in ["PyTorch", "TensorFlow", "OpenCV"] for t in technologies):
                category = "Machine Learning / Edge AI"
                cat_prov = "detected"
            elif any(t in ["Pandas", "NumPy", "Scikit-Learn"] for t in technologies) and not frontend_framework:
                category = "Data Science & Analytics"
                cat_prov = "detected"
            elif backend_framework and not frontend_framework:
                category = "Backend API"
                cat_prov = "detected"
            elif frontend_framework or has_package_json:
                category = "Web Application"
                cat_prov = "detected"

            result = GitHubAnalysisResult(
                repository_name=ProvenanceItem(value=repo, provenance="detected", source="GitHub API"),
                repository_owner=ProvenanceItem(value=owner, provenance="detected", source="GitHub API"),
                repository_url=ProvenanceItem(value=f"https://github.com/{owner}/{repo}", provenance="detected", source="GitHub API"),
                description=ProvenanceItem(
                    value=description or (readme_summary[:180] if readme_summary else f"Project {repo}"),
                    provenance="detected" if description else ("inferred" if readme_summary else "missing"),
                    source="repo.description" if description else "README"
                ),
                readme_summary=ProvenanceItem(
                    value=readme_summary,
                    provenance="detected" if readme_summary else "missing",
                    source="README.md"
                ),
                primary_language=ProvenanceItem(
                    value=primary_lang,
                    provenance="detected" if primary_lang else "missing",
                    source="GitHub API"
                ),
                languages=ProvenanceItem(
                    value=languages_dict,
                    provenance="detected" if languages_dict else "missing",
                    source="GitHub API"
                ),
                project_category=ProvenanceItem(
                    value=category,
                    provenance=cat_prov,
                    source="manifests & structure"
                ),
                frontend_framework=ProvenanceItem(
                    value=frontend_framework,
                    provenance="detected" if frontend_framework else "missing",
                    source="package.json" if frontend_framework else None
                ),
                backend_framework=ProvenanceItem(
                    value=backend_framework,
                    provenance="detected" if backend_framework else "missing",
                    source="manifests" if backend_framework else None
                ),
                database_technology=ProvenanceItem(
                    value=database_tech,
                    provenance="detected" if database_tech else "missing",
                    source="manifests" if database_tech else None
                ),
                technologies=ProvenanceItem(
                    value=sorted(list(technologies)),
                    provenance="detected" if technologies else "missing",
                    source="manifests & API"
                ),
                dependency_manifests=ProvenanceItem(
                    value=manifests,
                    provenance="detected" if manifests else "missing",
                    source="tree inspection"
                ),
                entry_points=ProvenanceItem(
                    value=entry_points,
                    provenance="detected" if entry_points else "missing",
                    source="tree inspection"
                ),
                notebook_urls=ProvenanceItem(
                    value=colab_urls or [f"https://github.com/{owner}/{repo}/blob/{default_branch}/{nb}" for nb in notebook_files],
                    provenance="detected" if (colab_urls or notebook_files) else "missing",
                    source="README & tree"
                ),
                docker_support=ProvenanceItem(
                    value=docker_support,
                    provenance="detected" if docker_support else "missing",
                    source="tree inspection"
                ),
                ci_workflows=ProvenanceItem(
                    value=ci_workflows,
                    provenance="detected" if ci_workflows else "missing",
                    source=".github/workflows"
                ),
                default_branch=ProvenanceItem(
                    value=default_branch,
                    provenance="detected",
                    source="GitHub API"
                ),
                stars_count=repo_data.get("stargazers_count", 0),
                forks_count=repo_data.get("forks_count", 0),
                open_issues_count=repo_data.get("open_issues_count", 0),
                license=repo_data.get("license", {}).get("name") if repo_data.get("license") else None,
                homepage=homepage,
                is_fork=repo_data.get("fork", False),
                created_at=repo_data.get("created_at"),
                updated_at=repo_data.get("updated_at"),
                directory_tree_sample=tree_items[:40]
            )

            return True, result, None
