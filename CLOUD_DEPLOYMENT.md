# Cloud-Ready Architecture & Deployment Guide

This document specifies the cloud-neutral architecture for **Personal Project Manager**, outlining the local development setup, database persistence guarantees, and future cloud transition strategy without vendor lock-in.

---

## 1. Cloud-Independent Architecture

The application is structured into decoupled, modular tiers:

1. **Frontend**: React 18 + Vite + TypeScript.
   - Built to static assets (`dist/`).
   - Serves from any static hosting provider (AWS S3 + CloudFront, GCP Cloud Storage, Cloudflare Pages, Vercel) or containerized with Nginx.
2. **Backend**: FastAPI + Python 3.13 ASGI.
   - Decoupled from cloud-specific SDKs.
   - Stateless web process running via Uvicorn.
   - Configured entirely via standard POSIX environment variables.
3. **Primary Relational Store**: PostgreSQL 15+.
   - Authoritative source of truth for projects, conversation sessions, and ordered messages.
   - Managed via Alembic migrations.
   - Compatible with local PostgreSQL, Docker volumes, AWS RDS, GCP Cloud SQL, Azure Database for PostgreSQL, Neon, or Supabase.
4. **Vector Store**: ChromaDB.
   - Embeds project descriptions and code manifests for semantic search.
   - Operates in embedded mode (`./chroma_data`) or client-server mode (`http://chromadb:8000`).
5. **AI Workflow**: LangGraph + LangSmith.
   - Multi-node state graph running locally or cloud-hosted.
   - Checkpointed via database conversation IDs to ensure full durability.

---

## 2. Conversation Memory & Database Durability

### Local Development Persistence
- When running locally on macOS, PostgreSQL stores data in its local data cluster (`/usr/local/var/postgres` or `/opt/homebrew/var/postgres`).
- When running with Docker Compose, PostgreSQL uses the named volume `pg_data` mapped to `/var/lib/postgresql/data`.
- **Durability Guarantee**: Conversations and messages persist across browser refreshes, terminal restarts, computer reboots, and container restarts (`docker compose down` and `docker compose up`).
- **Safety Rule**: Never run `docker compose down -v` unless you explicitly want to destroy all persistent volumes.

### Database Backup & Restore Procedures

#### Creating a Backup
```bash
# From local PostgreSQL:
pg_dump -U postgres -d project_manager -F c -b -v -f project_manager_backup_$(date +%Y%m%d).dump

# From Docker Compose container:
docker exec -t project_manager_db pg_dump -U postgres -d project_manager -F c -b -v -f /tmp/backup.dump
docker cp project_manager_db:/tmp/backup.dump ./project_manager_backup.dump
```

#### Restoring from a Backup
```bash
# To local PostgreSQL:
pg_restore -U postgres -d project_manager -v project_manager_backup.dump

# To a cloud database (AWS RDS / GCP Cloud SQL / Neon):
pg_restore -h your-cloud-db-host.rds.amazonaws.com -U your_db_user -d project_manager -v project_manager_backup.dump
```

#### Running Database Migrations
Alembic automatically brings any new PostgreSQL instance up to date:
```bash
cd backend
alembic upgrade head
```

---

## 3. Transitioning to the Cloud

When you select a cloud provider, follow this transition plan. **No frontend or backend business logic needs to be rewritten.**

### Option A: Fully Managed Cloud (AWS / GCP / Azure)
1. **Database**:
   - Provision a PostgreSQL 15+ instance (e.g., AWS RDS PostgreSQL or GCP Cloud SQL).
   - Run `alembic upgrade head` from CI/CD or a migration task.
   - Restore existing local conversations using `pg_restore` if migrating existing data.
2. **Backend**:
   - Build Docker container: `docker build -t project-manager-backend ./backend`.
   - Deploy container to AWS ECS / Fargate or GCP Cloud Run.
   - Set environment variables (`DATABASE_URL`, `GITHUB_TOKEN`, `OPENAI_API_KEY`).
3. **Frontend**:
   - Build bundle: `npm run build` in `frontend/`.
   - Upload `dist/` to AWS S3 or GCP Cloud Storage fronted by CloudFront or Cloud CDN.
   - Configure `VITE_API_URL` to point to the backend domain.

### Option B: Unified Container Cloud (Render / Railway / Fly.io)
1. Provision a managed PostgreSQL database in the dashboard.
2. Link the backend service to the managed PostgreSQL database URL.
3. Deploy the frontend as a static site or Docker container.

---

## 4. Cloud Changes Checklist (When Provider Is Chosen)

| Category | Local Setting | Cloud Target Action |
|---|---|---|
| **Database Connection** | `localhost:5432` | Update `DATABASE_URL` to managed DB host with SSL mode (`sslmode=require`) |
| **CORS Origins** | `http://localhost:5173` | Set `CORS_ORIGINS=["https://app.yourdomain.com"]` in backend environment |
| **Frontend API Base** | `/api/v1` (via Vite proxy) | Set `VITE_API_BASE_URL=https://api.yourdomain.com/api/v1` during build |
| **Vector Store** | Local filesystem `./chroma_data` | Persist to a cloud block volume (EBS/Persistent Disk) or standalone ChromaDB container |
| **Secrets Management** | `.env` file | Inject via AWS Secrets Manager, GCP Secret Manager, or platform environment variables |
