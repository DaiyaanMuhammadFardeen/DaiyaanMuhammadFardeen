# CVTailor

**AI-powered CV tailoring engine.** Paste a job description, upload your CV, and get a semantically tailored version optimized for ATS systems — with every change transparent and reversible.

## Quick Start

### Docker (Recommended)

```bash
# 1. Pull AI models on your host (only needed once)
ollama pull llama3.1:8b-instruct-q4_K_M
ollama pull nomic-embed-text

# 2. Set up NuExtract custom model
curl -L -o NuExtract-2.0-2B-Q8_0.gguf "https://huggingface.co/mradermacher/NuExtract-2.0-2B-GGUF/resolve/main/NuExtract-2.0-2B.Q8_0.gguf"
# Create a Modelfile:
#   FROM ./NuExtract-2.0-2B-Q8_0.gguf
#   PARAMETER temperature 0.0
#   SYSTEM """You are NuExtract, an information extraction tool created by NuMind. Your job is to always extract the exact relevant information from the text without deviation and always according to proper JSON syntax. YOU CAN NOT DEVIATE FROM THE JSON SYNTAX AT ALL AND CAN NOT INVENT INFORMATION OUT OF THINN AIR ALWAYS MAKE SURE YOU ARE RETURNING THE CORRECT INFORMATION FROM THE TEXT INTO THE CORRECT SPECIFIED TEMPLATE."""
ollama create nuextract2b -f ./Modelfile

# 3. Configure auth secret (optional — default works for local dev)
echo 'AUTH__SECRET_KEY=your-strong-secret-here' >> .env

# 4. Start everything
docker compose up --build
```

That's it. The API, database, Redis, Celery worker, and migrations all start automatically.

- **Frontend dashboard:** `http://localhost:8000/`
- **API docs (Swagger):** `http://localhost:8000/docs`
- **Health check:** `http://localhost:8000/health`

### Local Development

```bash
# 1. Start infrastructure
docker compose up -d db redis

# 2. Pull AI models
ollama pull llama3.1:8b-instruct-q4_K_M
ollama pull nomic-embed-text
# Pull the nuextract model like above

# 3. Install dependencies & run
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 4. In a second terminal — start Celery worker
celery -A celery_worker worker --loglevel=info
```

### First-Run Data Seeding

The skills taxonomy database is populated by a one-time seed command. This is run automatically in Docker via the `init` service, but for local dev you can run:

```bash
python -m app.services.skill_seeder
```

This parses three data sources (see [Skill Taxonomy Datasets](#skill-taxonomy-datasets) below) and generates 14,260 skill definitions with 768-dim embeddings. The seeder is idempotent — it will skip already-seeded skills on re-run.

---

## Skill Taxonomy Datasets

The skill knowledge base is built from **three data sources** merged by priority (Tanova > Hierarchy > ESCO):

| Source | File | Records | Description |
|--------|------|---------|-------------|
| **Tanova Skills Taxonomy** | `data/tanova_skills_taxonomy.json` | 139 curated | Hand-curated skill taxonomy with parent hierarchies and related skills. Includes categories (hard, soft, tool, certification, language) and BERT-based related-skill relationships. [Source](https://github.com/kensuio-org/tanova-skills-taxonomy) — MIT license. |
| **ESCO Skills Classification (European Commission)** | `data/skills_en.csv` | 13,960 | European multilingual classification of Skills, Competences, Qualifications and Occupations. Wide coverage including transversal skills, language skills, and occupation-specific skills. [Source](https://esco.ec.europa.eu/en/classification/skill) — CC BY 4.0 license. |
| **In-code SKILL_HIERARCHY** | `app/globals.py` | 213 | Manually curated hierarchy of ~30+ skill categories (e.g. "Cloud Platforms" → AWS, Azure, GCP) with canonical skill names and aliases. Used as the primary taxonomy in the scorer. |

**Merge strategy:** When the same skill name appears in multiple sources, priority is Tanova > Hierarchy > ESCO. This ensures manually curated relationships (Tanova) and canonical groupings (Hierarchy) override the broader ESCO classification. Each skill record stores its source, canonical name, category, description, aliases, and a 768-dimensional embedding vector.

**Usage in the app:**
- **Taxonomy scorer** (`taxonomy_scorer.py`) — scores CV skills by mapping them through `SKILL_HIERARCHY`
- **Skill KB** (`skill_knowledge_base.py`) — vector-similarity search, gap analysis, auto-fill, related-skill discovery
- **Skills rewrite agent** (`agents/rewrite/skills.py`) — enriches CV skills with KB canonical names, aliases, and resolves JD must-haves
- **Frontend suggestion panel** — "Auto-Fill from CV" button in the CV builder Skills tab

---

## Architecture

### System Overview

```mermaid
graph TD
    Client["Client / Frontend<br/>Upload CV · Paste JD · View Diff · Export · Authenticate"] -->|HTTPS REST + SSE| FastAPI

    subgraph FastAPI ["FastAPI Layer"]
        CV["/cv/upload, /cv/create, /cv/{id}"]
        JD["/jd/upload, /jd/create, /jd/{id}"]
        Tailor["/tailor/, /tailor/{id}/accept, /tailor/{id}/retry"]
        Improve["/cv/{id}/improve, /cv/{id}/improve-all"]
        Skills["/skills/search, /skills/auto-fill, /skills/suggest-gaps, /skills/resolve"]
        Export["/export/{job_id}"]
        Score["/score/"]
        Dashboard["/dashboard"]
        Auth["/auth/register, /auth/login, /auth/refresh, /auth/me"]
        Health["/health"]
    end

    subgraph Auth ["Authentication JWT + httpOnly Cookies"]
        BFF["BFF Proxy (Next.js)<br/>api/v1/[...path]/route.ts<br/>Auto-refresh on 401"]
        Session["Session expiry<br/>expires_at in /auth/me<br/>5-min warning toast"]
    end

    FastAPI --> Celery
    FastAPI --> Pipeline

    subgraph Celery ["Task Queue (Celery + Redis)"]
        CeleryLabel["job_id tracking<br/>SSE progress<br/>retry logic"]
    end

    subgraph Pipeline ["Agent Pipeline"]
        S1["1. Score Original CV<br/>(deterministic)"]
        S2["2. Rewrite Sections<br/>(LLM: llama3.1)"]
        S3["3. Score Tailored CV<br/>(deterministic)"]
        S4["4. Assemble Diff + CV<br/>(deterministic)"]
        S1 --> S2 --> S3 --> S4
    end

    Pipeline --> PostgreSQL
    Pipeline --> Pgvector
    Pipeline --> Redis

    subgraph Storage ["Storage"]
        PostgreSQL[("PostgreSQL<br/>Users, CVs, JDs, Jobs, Scores, SkillDefs")]
        Pgvector[("pgvector<br/>Skill Embeddings (768d)")]
        Redis[("Redis<br/>Task Broker, Results")]
    end

    subgraph SkillsRAG ["Skills Knowledge Base"]
        SKB[("SkillKnowledgeBase<br/>14,260 skills<br/>resolve · search · related<br/>suggest-gaps · auto-fill")]
        ESCO["ESCO CSV<br/>13,960 skills"]
        Tanova["Tanova JSON<br/>139 curated skills"]
        Hierarchy["SKILL_HIERARCHY<br/>213 entries"]
        ESCO --> SKB
        Tanova --> SKB
        Hierarchy --> SKB
    end

    FastAPI --> SkillsRAG

    style Client fill:#e1f5fe,stroke:#0288d1
    style FastAPI fill:#fff3e0,stroke:#f57c00
    style Auth fill:#f3e5f5,stroke:#7b1fa2
    style Celery fill:#fce4ec,stroke:#c62828
    style Pipeline fill:#e8f5e9,stroke:#2e7d32
    style Storage fill:#f3e5f5,stroke:#7b1fa2
    style SkillsRAG fill:#e8eaf6,stroke:#283593
```

### Component Responsibilities

| Component | Role |
|-----------|------|
| **FastAPI** | REST API layer, request validation, file upload handling, JWT auth |
| **Celery + Redis** | Async task queue for long-running tailoring pipelines |
| **PostgreSQL** | Persistent storage for users, CVs, JDs, jobs, scores, results, skill definitions, embeddings |
| **pgvector** | Vector similarity search for skill matching |
| **Ollama** | Local LLM inference server for all AI models |
| **llama3.1-8B** | Primary LLM — rewriting, summarization, improvement, commentary |
| **NuExtract** | Extraction SLM — CV normalization, JD parsing |
| **nomic-embed-text** | Embedding model — semantic similarity for skills and alignment |
| **JWT (python-jose)** | Stateless authentication — HS256 tokens with access/refresh pair |
| **httpOnly Cookies** | Token transport via BFF proxy — XSS-safe |
| **bcrypt** | Password hashing (12 rounds) |

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Next as Next.js BFF
    participant API as FastAPI
    participant DB as PostgreSQL

    User->>Next: POST /api/auth/login {email, password}
    Next->>API: POST /v1/auth/login
    API->>DB: Lookup user by email
    API->>API: Verify password (bcrypt)
    API->>API: Generate access_token (1h) + refresh_token (7d)
    API-->>Next: {access_token, refresh_token, user}
    Next->>Next: Set httpOnly cookies
    Next-->>User: {user}

    Note over User,Next: All /api/v1/* requests go through BFF proxy

    User->>Next: GET /api/v1/cv/{id} (cookie attached automatically)
    Next->>API: GET /v1/cv/{id} (Bearer header)
    alt 401 expired token
        Next->>Next: Auto-refresh: POST /v1/auth/refresh
        API-->>Next: New token pair
        Next->>API: Retry original request with new token
    end
    API-->>Next: CV data
    Next-->>User: JSON response

    User->>Next: POST /api/auth/logout
    Next->>Next: Clear auth cookies
    Next-->>User: 200

    Note over User: Session expiry: expires_at in GET /auth/me<br/>5-min warning toast → auto-logout
```

---

## Directory Structure

```
CV-Tailor/
├── app/
│   ├── main.py                  # FastAPI app factory, CORS, static mount
│   ├── config.py                # Pydantic Settings — all env vars and defaults
│   ├── dependencies.py          # FastAPI dependency injection (get_cv_or_404, etc.)
│   ├── globals.py               # SKILL_HIERARCHY, ACTION_VERBS, static constants
│   │
│   ├── api/                     # HTTP route handlers
│   │   ├── cv.py                # CV CRUD, upload, create, delete, rename, SSE stream
│   │   ├── jd.py                # JD CRUD, upload, create, analyze, rename, delete
│   │   ├── tailor.py            # Tailor start, accept/reject, retry
│   │   ├── improve.py           # SSE streaming improve (bullet + all), accept
│   │   ├── skills.py            # Skills KB: search, resolve, auto-fill, suggest-gaps, related
│   │   ├── export.py            # JSON/DOCX/TXT export
│   │   ├── score.py             # Score CV against JD
│   │   ├── dashboard.py         # Per-user aggregate stats
│   │   └── services/            # Internal proxy endpoints (e.g. NuExtract config)
│   │
│   ├── auth/                    # Authentication system
│   │   ├── jwt.py               # create_access_token, create_refresh_token, decode_token
│   │   ├── deps.py              # get_current_user (required), get_optional_user (optional)
│   │   └── routes.py            # POST /auth/register, /auth/login, /auth/refresh, GET /auth/me
│   │
│   ├── agents/                  # Pipeline + feature implementations
│   │   ├── cv_normalizer.py     # NuExtract-based CV text → CVSchema normalization
│   │   ├── cv_validator.py      # CV minimum field validation quality gate
│   │   ├── jd_parser.py         # Two-pass JD parsing (NuExtract + keyword hierarchy)
│   │   ├── rewrite_executor.py  # Summary, skills, education, projects, experience rewrites
│   │   ├── scorer.py            # Composite scoring: ATS + semantic + structural + readability
│   │   ├── assembler.py         # DiffReport + tailored CV assembly
│   │   ├── improve/             # JD-agnostic ATS bullet/text improvement (SSE streaming)
│   │   │   ├── __init__.py
│   │   │   └── bullet_improver.py
│   │   ├── rewrite/             # CV section rewrite agents
│   │   │   ├── base.py          # Shared rewrite base with tag extraction
│   │   │   ├── copilot_validator.py  # 6-dimension rewrite quality validator
│   │   │   ├── experience.py, education.py, summary.py, skills.py, ...
│   │   └── normalizer/          # NuExtract-based CV normalization pipeline
│   │
│   ├── clients/                 # External service wrappers
│   │   ├── llm_client.py        # Ollama LLM client (singleton) — complete, stream, chat
│   │   └── nuextract_client.py  # NuExtract extraction client
│   │
│   ├── db/                      # Database layer
│   │   ├── models.py            # SQLAlchemy ORM models (users, cvs, jds, jobs, scores,
│   │   │                       #   rewrite_results, embeddings, skill_definitions)
│   │   ├── session.py           # AsyncSession factory + get_db dependency
│   │   └── migrations/          # (unused — Alembic at root level)
│   │
│   ├── pipeline/                # Pipeline orchestration
│   │   ├── orchestrator.py      # Central pipeline driver (called by Celery)
│   │   └── progress.py          # SSE streaming for job progress
│   │
│   ├── schemas/                 # Pydantic data models
│   │   ├── __init__.py          # Re-exports all schema classes
│   │   ├── cv.py                # CVSchema, ContactInfo, WorkExperience, Education, etc.
│   │   ├── jd.py                # JDSchema, qualifications, conditions, duties
│   │   ├── skill.py             # SkillEntry, SkillCategory, RequirementLevel enums
│   │   ├── tailor.py            # TailorRequest/Response, JobStatus enum
│   │   ├── diff.py              # DiffReport, BulletDiff
│   │   ├── score.py             # CVScore, SectionScore, ScoreBreakdown
│   │   └── user.py              # UserRegister, UserLogin, UserResponse, TokenResponse
│   │
│   ├── services/                # Deterministic business logic + ML
│   │   ├── embedding_service.py # nomic-embed-text via Ollama API
│   │   ├── skill_knowledge_base.py  # Vector similarity search, gap analysis, auto-fill
│   │   ├── skill_seeder.py      # ESCO + Tanova + Hierarchy → skill_definitions table
│   │   ├── taxonomy_scorer.py   # Skill hierarchy mapping for CV vs JD scoring
│   │   ├── ai_copilot_scorer.py # AI quality assessment of CV vs JD fit
│   │   ├── keyword_intelligence.py  # Keyword extraction and intelligence
│   │   ├── export_service.py    # JSON/DOCX/TXT export generation
│   │   ├── pdf_extractor.py     # PyMuPDF text extraction
│   │   ├── tfidf_scorer.py      # ATS keyword scoring (TF-IDF)
│   │   ├── structural_scorer.py # Rules-based structural quality checks
│   │   └── readability.py       # Flesch-Kincaid readability calculation
│   │
│   ├── tasks/                   # Celery task definitions
│   │   ├── celery_tasks.py      # run_tailoring_pipeline async task
│   │   └── cv_tasks.py          # process_cv_pdf async task
│   │
│   ├── prompts/                 # LLM prompt templates (12 .j2 files)
│   │   ├── experience_rewrite.j2, summary_rewrite.j2, ...
│   │   ├── general_bullet_improve.j2, general_text_improve.j2
│   │   ├── ai_copilot_evaluation.j2, jd_rewrite_validator.j2
│   │   └── score_commentary.j2
│   │
│   └── utils/                   # Shared utilities
│       ├── ids.py               # new_ulid() — centralized ID generation
│       ├── hashing.py           # content hash for JD deduplication
│       ├── text.py              # text processing helpers
│       ├── llm_utils.py         # safe_json_loads, prompt formatting
│       ├── logging.py           # structlog logger wrapper
│       └── exceptions.py        # Custom exception classes
│
├── alembic/                     # Database migrations
│   ├── env.py
│   └── versions/
│       ├── 0001_initial.py      # Schema: cvs, job_descriptions, tailoring_jobs, etc.
│       ├── 0002_add_score_columns.py
│       ├── 0003_add_embedding_updated_at.py
│       ├── 0004_sync_models_after_refactor.py
│       ├── 0005_add_current_section.py
│       ├── 0006_add_users_scores.py  # Users, scores tables + user_id FKs
│       ├── 0007_add_cv_status.py
│       ├── 0008_drop_score_columns.py
│       ├── 0009_add_titles.py        # Human-readable title columns for CVs and JDs
│       ├── 0010_add_skill_definitions.py  # Skill definitions table with embeddings
│       └── 0010 fix_jsonb_columns.py      # Fix nullable JSONB columns
│
├── data/                        # Data files (not committed; must be present at seed time)
│   ├── skills_en.csv            # ESCO skills classification (13,960 records)
│   └── tanova_skills_taxonomy.json  # Tanova curated skills taxonomy
│
├── tests/
│   ├── conftest.py              # Shared fixtures
│   ├── fixtures/                # Test data files (PDFs)
│   ├── unit/                    # 25+ unit test files
│   │   ├── test_agents/         # Agent-specific tests
│   │   └── *.py                 # Individual module tests
│   └── integration/             # End-to-end pipeline tests
│
├── frontend/                    # Next.js 16 dashboard
│   ├── src/
│   │   ├── app/                 # App Router pages, API routes
│   │   ├── components/          # React components (shadcn/ui + custom)
│   │   ├── lib/                 # Utilities, API client, types, hooks
│   │   └── middleware.ts        # Auth guard + security headers
│   ├── e2e/                     # Playwright E2E tests
│   ├── Dockerfile               # 3-stage standalone build
│   └── package.json             # React 19, shadcn/ui, Recharts
│
├── docker-compose.yml           # Full stack: PostgreSQL, Redis, API, Worker
├── docker-compose.e2e.yml       # E2E test stack
├── Dockerfile                   # Python 3.12 image for API + Worker
├── .dockerignore                # Docker build context exclusions
├── alembic.ini                  # Alembic configuration
├── requirements.txt             # Python dependencies
├── celery_worker.py             # Celery worker entrypoint
├── .env.example                 # Environment variable template
├── .env                         # Local environment config
└── AGENTS.md                    # Agent guide for AI coding assistants
```

---

## Requirements

### Hard Prerequisites

| Software | Version | Purpose |
|----------|---------|---------|
| Python | 3.12+ | Runtime |
| PostgreSQL | 16+ | Primary database |
| Redis | 7+ | Celery broker + result backend |
| Ollama | Latest | Local LLM inference |

### AI Models (via Ollama)

| Model | Size | Purpose |
|-------|------|---------|
| `llama3.1:8b-instruct-q4_K_M` | ~4.7 GB | All LLM tasks — rewriting, summarization, improvement, validation |
| `nomic-embed-text` | ~274 MB | Embedding model for skill vectors and semantic alignment |
| `nuextract2b` (custom) | ~1.8 GB | Extraction — CV normalization, JD parsing (requires custom Modelfile) |

All three models run locally — no cloud API keys required.

### Python Dependencies

Core: FastAPI, SQLAlchemy 2.0 (async), Alembic, Celery, Redis, Pydantic v2

Auth: python-jose (JWT), bcrypt (password hashing)

AI: ollama SDK, structlog, instructor

ML: numpy, scikit-learn (TF-IDF, cosine similarity)

Document: PyMuPDF (PDF extraction), python-docx (DOCX export)

See `requirements.txt` for exact versions.

---

## Environment Configuration

All settings live in `app/config.py` and are overridable via `.env` using `pydantic-settings`. Nested config overrides use `__` delimiter (e.g. `AUTH__SECRET_KEY`).

### General

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG` | `False` | Debug mode |
| `LOG_LEVEL` | `INFO` | Logging level |
| `API_PREFIX` | `/v1` | API route prefix |
| `DATA_DIR` | `./data` | Data directory |

### LLM

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM__MODEL_NAME` | `llama3.1:8b-instruct-q4_K_M` | Primary LLM model |
| `LLM__FAST_MODEL` | `llama3.1:8b-instruct-q4_K_M` | Fast model for cheap calls |
| `LLM__MAX_TOKENS` | `4096` | Max tokens per LLM response |
| `LLM__TEMPERATURE` | `0.7` | LLM temperature |
| `LLM__BASE_URL` | `http://localhost:11434` | Ollama base URL |
| `LLM__NUM_CTX` | `4096` | Context window size in tokens |

### Embedding

| Variable | Default | Description |
|----------|---------|-------------|
| `EMBEDDING__MODEL` | `nomic-embed-text` | Embedding model |
| `EMBEDDING__DIMENSION` | `768` | Embedding vector dimension |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DB__URL` | `postgresql+asyncpg://cvtailor:cvtailor@localhost:5432/cvtailor` | PostgreSQL connection |
| `DB__POOL_SIZE` | `10` | Connection pool size |
| `DB__MAX_OVERFLOW` | `20` | Max overflow connections |

### Celery

| Variable | Default | Description |
|----------|---------|-------------|
| `CELERY__BROKER_URL` | `redis://localhost:6379/0` | Redis broker |
| `CELERY__RESULT_BACKEND` | `redis://localhost:6379/1` | Redis results |

### Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH__SECRET_KEY` | `change-me-in-production-use-a-real-secret` | JWT signing key (change in production!) |
| `AUTH__ALGORITHM` | `HS256` | JWT signing algorithm |
| `AUTH__ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Access token TTL (minutes) |
| `AUTH__REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token TTL (days) |

### Scoring

| Variable | Default | Description |
|----------|---------|-------------|
| `SCORE__SECTION_KEYWORD` | `0.25` | Section keyword weight |
| `SCORE__SEMANTIC` | `0.20` | Semantic relevance weight |
| `SCORE__STRUCTURAL` | `0.15` | Structural quality weight |
| `SCORE__READABILITY` | `0.08` | Readability weight |
| `SCORE__SKILLS_TAXONOMY` | `0.15` | Skills taxonomy weight |
| `SCORE__TITLE_SENIORITY` | `0.05` | Title seniority weight |
| `SCORE__YEARS_EXPERIENCE` | `0.10` | Years experience weight |
| `SCORE__AI_COPILOT` | `0.07` | AI co-pilot weight |

### NuExtract

| Variable | Default | Description |
|----------|---------|-------------|
| `NUEXTRACT__MODEL_VERSION` | `nuextract2b` | NuExtract model |
| `NUEXTRACT__MAX_RETRIES` | `3` | Max extraction retries |
| `NUEXTRACT__TIMEOUT` | `60` | Extraction timeout (seconds) |
| `NUEXTRACT__CTX_SIZE` | `32768` | Context window |
| `NUEXTRACT__HOST` | `http://localhost:11434` | Ollama host |

---

## Running the Project

### Docker (full stack)

```bash
# Prerequisites: Ollama running on host with models pulled
ollama pull llama3.1:8b-instruct-q4_K_M
ollama pull nomic-embed-text

# Start everything
docker compose up --build
```

This starts 6 services:
| Service | Description |
|---------|-------------|
| `db` | PostgreSQL 16 |
| `redis` | Redis 7 |
| `init` | Runs `alembic upgrade head` + skill seed once, then exits |
| `api` | FastAPI server on port 8000 |
| `worker` | Celery worker for background tailoring |
| `frontend` | Next.js standalone server on port 3000 |

### Local Development

```bash
# 1. Start only database and Redis
docker compose up -d db redis

# 2. Pull AI models
ollama pull llama3.1:8b-instruct-q4_K_M
ollama pull nomic-embed-text

# 3. Install Python dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env — use localhost URLs (already the defaults)

# 5. Run migrations
alembic upgrade head

# 6. Seed skill definitions (one-time)
python -m app.services.skill_seeder

# 7. Start the API server
uvicorn app.main:app --reload --port 8000

# 8. Start Celery worker (second terminal)
celery -A celery_worker worker --loglevel=info

# 9. Start frontend dev server (third terminal)
cd frontend && npm run dev
```

### Verification

```bash
# Health check
curl http://localhost:8000/health

# API docs
open http://localhost:8000/docs
```

---

## API Reference

Base URL: `http://localhost:8000/v1`

### Authentication

All auth endpoints are **public** — no token required.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | None | Register a new user account |
| `POST` | `/auth/login` | None | Login with email + password |
| `POST` | `/auth/refresh` | None | Refresh access token using refresh token |
| `GET` | `/auth/me` | Required | Return the authenticated user's profile |

**Register request:**
```json
{ "email": "user@example.com", "password": "SecurePass1!", "name": "Jane Doe" }
```

**Register response (201):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": { "user_id": "01J...", "email": "...", "name": "...", "created_at": "..." }
}
```

**Login request:**
```json
{ "email": "user@example.com", "password": "SecurePass1!" }
```

All authenticated endpoints require the header: `Authorization: Bearer <access_token>`
In production, the frontend uses httpOnly cookies via the BFF proxy — tokens are never exposed to JavaScript.

**Session management:** `GET /auth/me` now returns an `expires_at` field (ISO datetime). The frontend shows a warning toast 5 minutes before expiry and auto-logs out when the session expires.

### CV Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/cv/upload` | Optional | Upload CV (PDF file or JSON Resume body) |
| `POST` | `/cv/create` | Required | Create a blank CV from scratch |
| `GET` | `/{cv_id}` | Required | Get a CV by ID |
| `PUT` | `/{cv_id}` | Required | Update a CV (full schema replace) |
| `PATCH` | `/{cv_id}/title` | Required | Rename a CV (human-readable title) |
| `DELETE` | `/{cv_id}` | Required | Hard-delete a CV and all associated data |
| `GET` | `/{cv_id}/stream` | None | SSE stream of processing progress |
| `POST` | `/{cv_id}/improve` | Required | Improve a single bullet/text (SSE streaming) |
| `POST` | `/{cv_id}/improve-all` | Required | Improve all bullets/texts (SSE streaming batch) |
| `POST` | `/{cv_id}/accept-improvements` | Required | Accept/reject individual improvements |

**Auth behavior:**
- Upload with token → CV is linked to your user (owned)
- Upload without token → CV is anonymous (user_id = null)
- Delete/update requires authentication + ownership (403 if you don't own the CV)
- Create from scratch creates a blank CVSchema with `source_format="manual"`

**PDF upload** — send as `multipart/form-data` with field `file`.

**JSON upload** — send as `application/x-www-form-urlencoded` with field `json_body` containing a [JSON Resume](https://jsonresume.org/schema.json) object.

### JD Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/jd/upload` | None | Upload raw JD text (PDF file or plain text body) |
| `POST` | `/jd/create` | Required | Create a blank JD from scratch |
| `POST` | `/jd/analyze` | None | Parse and analyze JD text, return structured schema |
| `GET` | `/{jd_id}` | None | Retrieve a parsed JD by ID |
| `PUT` | `/{jd_id}` | Required | Update a JD (full schema replace) |
| `PATCH` | `/{jd_id}/title` | Required | Rename a JD (human-readable title) |
| `DELETE` | `/{jd_id}` | None | Delete a JD and all associated data |

JD endpoints do **not** require authentication — JDs are cached by content hash for deduplication.

### Skills Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/skills/search` | Required | Vector-similarity search for skills |
| `POST` | `/skills/resolve` | Required | Resolve a skill name to KB entry (canonical name, aliases) |
| `POST` | `/skills/related` | Required | Find related skills (KB relations + vector similarity) |
| `POST` | `/skills/suggest-gaps` | Required | Suggest skills missing from CV given a JD |
| `POST` | `/skills/find-common` | Required | Find skills common across multiple CVs |
| `POST` | `/skills/auto-fill` | Required | Auto-fill skills from a text blob |
| `POST` | `/skills/categorize` | Required | Categorize a raw skill string |

### Tailoring Endpoints

All tailoring endpoints except SSE streaming require **authentication + ownership checks**.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/tailor/` | Required | Start tailoring pipeline (returns `job_id`) |
| `GET` | `/tailor/{job_id}/stream` | None | SSE stream of pipeline progress |
| `POST` | `/tailor/{job_id}/accept` | Required | Accept/reject individual bullet rewrites (ownership checked) |
| `POST` | `/tailor/{job_id}/retry` | Required | Retry a failed tailoring job with score feedback (ownership checked) |

### Score Endpoint

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/score/` | Required | Score a CV against a JD (ownership of CV checked) |

**Request:**
```json
{ "cv_id": "...", "jd_id": "..." }
```

Returns a `CVScore` with all 8 sub-scores, composite score, section breakdown, and recommendations.

### Export Endpoint

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/export/{job_id}` | Required | Export tailored CV (JSON/DOCX/TXT) — ownership checked |

**Request body:** `{ "format": "json" | "docx" | "txt" }`

### Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/dashboard` | Required | Per-user aggregate stats + recent CVs and jobs |

**Response:**
```json
{
  "stats": {
    "total_cvs": 5,
    "total_jobs": 12,
    "completed_jobs": 8,
    "failed_jobs": 2,
    "avg_composite_score": 67.3
  },
  "recent_cvs": [ { "cv_id": "...", "title": "...", "source_format": "...", "created_at": "..." } ],
  "recent_jobs": [ ... ]
}
```

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | None | Health check |

---

## Testing

```bash
# Run all unit tests
python -m pytest tests/ -v --ignore=tests/integration

# Run specific test file
python -m pytest tests/unit/test_skill_knowledge_base.py -v

# Run with coverage
python -m pytest tests/ --cov=app --cov-report=term-missing --ignore=tests/integration

# Integration tests (requires full Docker stack)
python -m pytest tests/integration/ -v

# Frontend E2E (requires backend running)
cd frontend && npx playwright test
```

---

## Database Schema

### Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | Registered accounts | user_id (PK, ULID), email (unique), hashed_password (bcrypt), name |
| `cvs` | Parsed CV documents | cv_id (PK), user_id (FK→users, nullable), title, schema_json (JSONB), source_format, status |
| `job_descriptions` | Parsed job descriptions | jd_id (PK), jd_hash (unique), title, schema_json (JSONB) |
| `tailoring_jobs` | Pipeline job tracking | job_id (PK), user_id (FK→users), cv_id (FK), jd_id (FK), status |
| `rewrite_results` | Pipeline output | result_id (PK), job_id (FK), diff_report (JSONB), tailored_cv_json (JSONB) |
| `scores` | CV score history | score_id (PK), job_id (FK), 9 float score columns, full_breakdown (JSONB) |
| `embeddings` | Vector embeddings | embedding_id (PK), cv_id (FK) / jd_id (FK), Vector(768) |
| `skill_definitions` | Skills knowledge base | skill_id (PK), name (unique), category, description, aliases, related, source, embedding Vector(768) |

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| **API Framework** | FastAPI + Uvicorn |
| **Task Queue** | Celery + Redis |
| **Database** | PostgreSQL 16 + pgvector |
| **ORM** | SQLAlchemy 2.0 (async) |
| **Migrations** | Alembic |
| **Data Validation** | Pydantic v2 |
| **Authentication** | JWT (python-jose, HS256) + bcrypt + httpOnly cookies via BFF proxy |
| **LLM Inference** | Ollama (llama3.1-8B, NuExtract) |
| **Embeddings** | nomic-embed-text via Ollama (768d) |
| **Skills RAG** | 14,260 skills from ESCO + Tanova + Hierarchy, pgvector IVFFlat index |
| **CV Improvement** | SSE-streaming JD-agnostic bullet/text improve |
| **PDF Extraction** | PyMuPDF |
| **DOCX Export** | python-docx |
| **NLP/ML** | scikit-learn (TF-IDF, cosine similarity) |
| **Logging** | structlog |
| **IDs** | ULID (python-ulid) |
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, React Query 5 |

---

## Further Reading

For a technical deep dive into how each agent works individually and how they collaborate as a unified system, see [ADDITIONALS.md](./ADDITIONALS.md).

For the Next.js dashboard architecture, component tree, route map, and UI reference, see [UI.md](./UI.md).
