# Project Manager 🚀
### AI-Powered Personal Project Management, Repository Analyzer & Showcase Platform

**Project Manager** is a centralized, recruiter-friendly showcase and management platform designed to organize, analyze, and showcase software engineering projects — from deployed web applications and machine learning edge models to Jupyter notebooks and backend APIs.

Built with **React, Vite, TypeScript, FastAPI, PostgreSQL, ChromaDB, LangChain, and LangGraph**.

---

## 🌟 Key Features

1. **Automated GitHub Repository Extraction**:
   - Paste any GitHub URL (e.g. `https://github.com/PVSaketh2003/In-out-Project-`).
   - Automatically inspects the tree, parses manifests (`package.json`, `requirements.txt`, `pyproject.toml`), detects entry points, extracts README summaries, and categorizes the project with explicit provenance indicators (`detected`, `inferred`, `needs_review`).
   - Detects duplicate repositories to keep your portfolio clean.

2. **Personal Portfolio Dashboard**:
   - Real-time metrics computed directly from PostgreSQL: Total, Live Deployed, Completed, In Development, Incomplete.
   - Top technologies aggregation and fast tag filtering.
   - Recruiter-focused design: provides live demo links for deployed applications, and detailed architectural breakdowns for undeployed projects.

3. **LangGraph AI Assistant**:
   - Stateful agent workflow built on **LangGraph** (`StateGraph`) with typed state.
   - Natural language queries: "Find all projects using FastAPI", "Summarize Edge AI Surveillance", "Mark project as Completed".
   - Deterministic rule-based fallback: operates 100% out of the box without requiring paid third-party AI keys.
   - Built-in human-in-the-loop confirmation before applying database mutations.
   - Full task audit log stored in PostgreSQL.

4. **Local Repository Execution on macOS**:
   - For undeployed projects, launch directly on localhost with a single click.
   - Automatically clones the repository into `Documents/projects_local/<project_name>`, creates an isolated virtual environment (`.venv`), installs requirements, sets up Node dependencies, allocates free ports, and streams live terminal logs.

5. **Observability & Health Monitoring**:
   - Diagnostic status for FastAPI, PostgreSQL, ChromaDB, GitHub REST API, LangGraph, and LangSmith.
   - Sensitive credentials (tokens, keys, passwords) are kept strictly on the backend and are never committed or exposed to the client.

---

## 🏗️ Architecture & Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite + TypeScript | Modern SPA with React Router 7, Lucide icons, responsive minimal dark UI |
| **Backend** | Python 3.13 + FastAPI + Pydantic v2 | High-performance asynchronous REST API with OpenAPI documentation |
| **Relational Database** | PostgreSQL + SQLAlchemy 2.x + Alembic | Primary source of truth with database migrations |
| **Vector Database** | ChromaDB | Local persistent semantic search for project summaries and technologies |
| **Agent Framework** | LangChain + LangGraph | Stateful agent pipeline with typed state transitions and fallback logic |
| **Observability** | LangSmith (Optional) | Tracing and prompt telemetry with credential redaction |
| **CI / CD** | GitHub Actions | Automated Python linting, Pytest, Node linting, Vitest, and production build |

---

## 🚀 Local Development Quickstart

### Prerequisites
- macOS (Apple Silicon or Intel)
- Python 3.12+ or 3.13+
- Node.js 20+ or 22+ & npm
- PostgreSQL (via Homebrew: `brew install postgresql@15` or Docker Compose)

### 1. Database Setup
Start PostgreSQL service locally:
```bash
brew services start postgresql@15
# Or using Docker Compose:
docker compose up -d postgres
```

Create the application database:
```bash
createdb project_manager || psql -d postgres -c "CREATE DATABASE project_manager;"
```

### 2. Backend Setup & Startup
```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- **Backend API**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/health`

### 3. Frontend Setup & Startup
In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
- **Frontend URL**: `http://localhost:5173`

---

## 🧪 Testing & Quality Assurance

### Run Backend Tests & Ruff Linting
```bash
cd backend
source .venv/bin/activate
ruff check app
pytest -v
```

### Run Frontend Tests, Linting & Production Build
```bash
cd frontend
npm run lint
npm run test
npm run build
```

---

## 🔒 Security & Environment Configuration

Copy `.env.example` to `backend/.env`:
```env
PROJECT_NAME="Project Manager"
API_V1_STR="/api/v1"
DATABASE_URL=postgresql+asyncpg://pvsairamsaketh@localhost:5432/project_manager
CHROMA_PERSIST_DIR="./chroma_data"
GITHUB_TOKEN=
LANGSMITH_TRACING=false
LANGSMITH_API_KEY=
LANGSMITH_PROJECT="personal-project-manager"
LOCAL_PROJECTS_DIR="/Users/pvsairamsaketh/Documents/projects_local"
```

- **Zero-Secret Client**: No tokens or database passwords are ever sent to the browser.
- **SSRF & Path Traversal Guards**: URL validation and directory path sanitization prevent unsafe file access.
- **Untrusted Repository Content**: Parsed READMEs and manifests are sanitized before rendering.

---

## 📄 License
MIT License. Created by [PV Sairam Saketh](https://github.com/PVSaketh2003).
