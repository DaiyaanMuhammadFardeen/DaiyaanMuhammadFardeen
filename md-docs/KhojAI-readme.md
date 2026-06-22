# KhojAI

**An intelligent AI-powered search and chat application** that combines a local LLM (Ollama) with real-time web search to provide context-aware, factually-grounded responses.

KhojAI is a full-stack, multi-module platform with a **Java Spring Boot** backend, **Python FastAPI** AI engine, **Next.js** web frontend, and a **Flutter** cross-platform mobile app.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Quick Start](#quick-start)
- [Services & Ports](#services--ports)
- [Full API Reference](#full-api-reference)
- [Database Schema](#database-schema)
- [AI Pipeline Deep Dive](#ai-pipeline-deep-dive)
- [Frontend Architecture](#frontend-architecture)
- [Mobile App Architecture](#mobile-app-architecture)
- [Design System](#design-system)
- [Environment Variables](#environment-variables)
- [Scripts Reference](#scripts-reference)
- [Security Model](#security-model)
- [Known Issues & Gotchas](#known-issues--gotchas)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Documentation](#documentation)
- [Git History](#git-history)
- [License](#license)

---

## Architecture Overview

```
┌─────────────────────┐     ┌──────────────────────────────────────────────────────┐
│   Next.js Frontend  │────▶│              Java Spring Boot Backend                  │
│   (Port 3000)       │     │              (Port 5000 / 8080)                        │
│                     │     │  ┌──────────────────────────────────────────────────┐  │
│  React 19 + TSX     │     │  │  REST API (/api/v1/*) · SSE Streaming            │  │
│  Tailwind CSS 4     │     │  │  JWT Auth · Spring Security · CORS               │  │
│  Axios + SSE via    │     │  │  PostgreSQL (JPA/Hibernate)                       │  │
│  fetch ReadableStream│     │  │  WebClient Proxy to Python (reactive)           │  │
└─────────────────────┘     │  └──────────────────────────────────────────────────┘  │
                            └──────────────────────┬───────────────────────────────┘
                                                   │ HTTP Proxy (WebClient)
                                                   │ http://127.0.0.1:8000
                                                   ▼
                            ┌──────────────────────────────────────────────────────┐
                            │              Python FastAPI AI Engine                  │
                            │              (Port 8000)                              │
                            │                                                       │
                            │  ┌─────────────────────────────────────────────┐     │
                            │  │  Streaming Pipeline (SSE Events)            │     │
                            │  │                                            │     │
                            │  │  Prompt → spaCy + KeyBERT + Ollama LLM     │     │
                            │  │    → Intent Detection (33 patterns)         │     │
                            │  │    → Keyword Extraction (YAKE/KeyBERT/MMR)  │     │
                            │  │    → Search Query Generation (LLM)          │     │
                            │  │    → Google PSE Web Search                  │     │
                            │  │    → Async Scraping (3 strategies)          │     │
                            │  │    → BM25 + WordNet + NER Relevance        │     │
                            │  │    → Context Building                       │     │
                            │  │    → Ollama gemma3 Response (grounded)      │     │
                            │  └─────────────────────────────────────────────┘     │
                            │                                                       │
                            │  Circuit Breakers · Disk Cache · Warm-Up on Boot      │
                            └──────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────┐
│                        Flutter Mobile App (Cross-Platform)                          │
│  Android · iOS · Web · Linux · macOS · Windows                                      │
│  flutter_bloc · sqflite · SharedPreferences · flutter_markdown                     │
│  Cubits: ConversationCubit, ChatCubit · Theme: dark/light toggle                   │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### End-to-End Data Flow

```
User sends message
      │
      ▼
Browser/Mobile App
      │  POST /api/v1/ai/stream-ai-response { "prompt": "..." }
      │  (or POST /api/v1/messages for save + auto-reply)
      ▼
Spring Boot Backend
      │  1. Saves USER message in PostgreSQL
      │  2. Proxies prompt to Python via WebClient (reactive, no buffering)
      │  3. Returns SSE stream to client
      ▼
Python FastAPI AI Engine
      │  1. Warm-up on startup preloads all models (spaCy, YAKE, KeyBERT, Ollama)
      │  2. Analyze prompt concurrently:
      │     ├─ spaCy: NER, dependency parsing, Matcher-based intent detection (33 categories)
      │     ├─ KeyBERT: MMR keyword extraction (top 10)
      │     └─ Ollama (gemma3:1b): Deterministic search query generation (temp=0)
      │  3. If search intent detected:
      │     ├─ Google PSE search (up to 3 queries, 7 results each)
      │     ├─ Concurrent async scraping (max 3 concurrent, 3 strategies)
      │     ├─ BM25 + WordNet synonym expansion + NER entity overlap ranking
      │     └─ Context building from top sentences
      │  4. Ollama (gemma3:4b) generates grounded response with source citations
      │  5. Emits typed SSE events: intent_detected → search_started → search_progress →
      │     search_result → search_completed → response_started → response_token → stream_complete
      ▼
Browser/Mobile App
      │  - Parses SSE events in real-time
      │  - Shows search progress (SearchProgress component)
      │  - Renders response tokens as they arrive (react-markdown)
      │  - On complete: saves AI message to backend
      ▼
Spring Boot Backend
      └─ Saves AI message in PostgreSQL (linked to conversation)
```

---

## Project Structure

```
KhojAI/
├── src/                                      # Java Spring Boot Backend
│   └── main/java/com/khojgroup/KhojAI/
│       ├── KhojAiApplication.java            # Entry point
│       ├── config/
│       │   ├── SecurityConfig.java           # Spring Security (demo mode: all open)
│       │   ├── CorsConfig.java               # CORS filter (all origins, methods, headers)
│       │   ├── JwtUtil.java                  # JWT generation/validation (HS256)
│       │   ├── JwtRequestFilter.java         # JWT auth filter (currently commented out)
│       │   ├── UserDetailsServiceImpl.java   # Loads user for Spring Security
│       │   ├── WebClientConfig.java          # Reactive WebClient (no buffering, 5min timeout)
│       │   └── NoBufferingWebFilter.java     # Disables response buffering for SSE
│       ├── controller/
│       │   ├── AIController.java             # /api/v1/ai/* — SSE streaming endpoint
│       │   ├── AuthController.java           # /api/v1/auth/* — JWT login
│       │   ├── ChatController.java           # /api/chat/* — legacy chat endpoints
│       │   ├── ConversationController.java   # /api/v1/conversations/* — CRUD
│       │   ├── DocumentController.java       # /api/v1/documents/* — file upload
│       │   ├── MessageController.java        # /api/v1/messages/* — CRUD + auto AI reply
│       │   ├── UserController.java           # /api/v1/users/* — CRUD
│       │   └── TestController.java           # /api/v1/auth/test — CORS health check
│       ├── dto/                              # Records: AiRequest/Response, ConversationDTO,
│       │                                     #   MessageDTO, UserDTO, JwtResponse, LoginRequest
│       ├── entity/
│       │   ├── User.java                     # app_user table (UUID PK, username, password, email)
│       │   ├── Conversation.java             # conversation table (UUID PK, title, timestamps)
│       │   ├── Message.java                  # message table (UUID PK, role USER/AI, content TEXT)
│       │   └── Document.java                 # documents table (Long PK, metadata only)
│       ├── repository/                       # Spring Data JPA repos
│       └── service/
│           ├── AiService.java                # WebClient proxy to Python /stream
│           ├── ChatService.java              # Conversation + message creation
│           ├── ConversationService.java      # CRUD + find by user
│           ├── DocumentService.java          # Document metadata management
│           ├── MessageService.java           # Messages + auto AI reply generation
│           └── UserService.java              # User CRUD
│   └── main/resources/
│       ├── application.properties            # DB, JWT, SSE, server config
│       └── init.sql                          # Reference DB schema (commented, JPA auto-creates)

├── AI/                                       # Python FastAPI AI Engine
│   ├── app.py                                # FastAPI server (lifespan warm-up, /health, /stream)
│   ├── unified_stream.py                     # SSE event protocol (9 event types, StreamEvent class)
│   ├── ai_orchestrator.py                    # Main pipeline + circuit breakers (543 lines)
│   ├── prompt_analyzer.py                    # Legacy spaCy+YAKE analyzer (353 lines)
│   ├── prompt_analyzer_llm.py               # Primary hybrid LLM analyzer (308 lines)
│   ├── patterns.py                           # 33 intent categories with spaCy token patterns
│   ├── web_search.py                         # Google PSE API + async scraping orchestrator
│   ├── scrape_util.py                        # Enterprise-grade async scraper (3 strategies, 1052 lines)
│   ├── search_utils.py                       # BM25 ranking + WordNet + NER scoring
│   ├── requirements.txt                      # Python dependencies
│   ├── terminal_app.py                       # CLI for testing
│   ├── INSTALL.md                            # AI setup instructions
│   └── cache/                                # Hot/cold disk cache (xxhash, orjson, aiofiles)

├── frontend/                                 # Next.js Web Frontend
│   ├── app/                                  # Next.js App Router
│   │   ├── layout.tsx                        # Root layout (Geist fonts, Vercel Analytics)
│   │   ├── page.tsx                          # Home / Signup (/)
│   │   ├── globals.css                       # Tailwind v4 + CSS custom properties
│   │   ├── login/page.tsx                    # Login page (/login)
│   │   ├── chat/page.tsx                     # Chat listing (/chat)
│   │   ├── chat/[id]/page.tsx                # Specific chat (/chat/[id])
│   │   ├── test-stream/page.tsx              # SSE debug page (/test-stream)
│   │   └── api/
│   │       ├── chat/route.ts                 # All API clients (Auth, User, Conv, Message, AI, Doc)
│   │       └── documents/route.ts            # Document upload API
│   ├── components/                           # React components
│   │   ├── chat-interface.tsx                # Main chat with SSE streaming + event handling
│   │   ├── chat-message.tsx                  # Markdown rendering + copy button
│   │   ├── sidebar.tsx                       # Conversation list with date grouping + CRUD
│   │   ├── signup.tsx                        # Signup form + guest access
│   │   ├── search-progress.tsx               # SSE event visualizer
│   │   ├── settings-modal.tsx                # Dark mode, API config, logout
│   │   ├── prompt-bar.tsx                    # Auto-resize text input
│   │   ├── document-uploader.tsx             # Drag-and-drop file upload
│   │   ├── theme-provider.tsx                # next-themes wrapper
│   │   ├── test-stream.tsx                   # SSE debug component
│   │   └── ui/                               # ~40 shadcn/ui primitives
│   ├── hooks/
│   │   ├── use-toast.ts                      # Toast notification system
│   │   └── use-mobile.ts                     # Responsive breakpoint detection
│   ├── lib/                                  # Utilities
│   │   ├── utils.ts                          # cn() classname merger
│   │   └── cors-test.ts                      # CORS test helper
│   └── styles/
│       ├── variables.scss                    # Design tokens (colors, spacing, radius, z-index)
│       ├── globals.scss                      # Global styles + animations
│       └── components/                       # SCSS modules per component

├── mobile_application/                       # Flutter Cross-Platform App
│   └── lib/
│       ├── main.dart                         # Entry point with platform init + error zone
│       ├── ui/
│       │   ├── screens/
│       │   │   ├── home_screen.dart          # Conversation list + sidebar
│       │   │   ├── chat_screen.dart          # Chat messages + input
│       │   │   └── settings_screen.dart      # Dark mode, API URL, account
│       │   ├── widgets/
│       │   │   ├── chat_input.dart           # Message input with send
│       │   │   ├── chat_message.dart         # Markdown rendering
│       │   │   ├── conversation_list_item.dart
│       │   │   ├── error_boundary.dart       # Error boundary widget
│       │   │   ├── new_conversation_button.dart
│       │   │   └── skeleton_loader.dart      # Loading skeleton animation
│       │   └── components/
│       │       └── sidebar.dart              # Navigation drawer
│       ├── state/cubits/
│       │   ├── conversation_cubit.dart       # BLoC for conversation list
│       │   └── chat_cubit.dart               # BLoC for chat messages + streaming
│       ├── data/
│       │   ├── models/
│       │   │   ├── conversation.dart         # Local conversation model
│       │   │   └── message.dart              # Local message model
│       │   └── database/
│       │       └── database_helper.dart      # sqflite local DB helper
│       ├── services/
│       │   ├── api/
│       │   │   └── api_service.dart          # HTTP API client
│       │   └── settings_service.dart         # SharedPreferences wrapper
│       └── main.dart                         # App entry + theme

├── documentation/                            # Project docs
│   ├── features.md
│   ├── setup_and_run.md
│   ├── api_testing.md
│   ├── cors_configuration.md
│   └── frontend_testing.md

├── run.sh                                    # Start all services (Ollama → Backend → Frontend)
├── stop.sh                                   # Gracefully stop all services
└── pom.xml                                   # Maven build (Spring Boot 3.5.6, Java 25)
```

---

## Tech Stack

### Backend (Java)

| Technology | Version | Purpose |
|---|---|---|
| **Spring Boot** | 3.5.6 | Application framework |
| **Java** | 25 | Runtime |
| **Spring Data JPA / Hibernate** | — | ORM / persistence |
| **PostgreSQL** | 12+ | Relational database |
| **Spring Security** | — | Authentication framework |
| **JWT (jjwt)** | — | Token-based auth (HS256) |
| **Spring WebFlux (WebClient)** | — | Reactive streaming AI proxy |
| **Maven** | 3.6+ | Build tool |

### AI Engine (Python)

| Technology | Version | Purpose |
|---|---|---|
| **FastAPI** | ≥0.68 | Async HTTP server |
| **uvicorn** | ≥0.15 | ASGI server |
| **Ollama** | ≥0.1.7 | Local LLM client (gemma3:4b / gemma3:1b) |
| **spaCy** | ≥3.7 | NLP pipeline (NER, dependency parse, Matcher) |
| **KeyBERT** | — | Embedding-based keyword extraction (all-MiniLM-L6-v2) |
| **YAKE** | ≥0.4.8 | Unsupervised keyword extraction |
| **NLTK** | ≥3.8 | WordNet synonyms, tokenization, stopwords |
| **rank-bm25** | ≥0.2.2 | BM25 relevance ranking |
| **Google PSE API** | — | Web search (Programmable Search Engine) |
| **trafilatura** | — | Specialized text extraction |
| **BeautifulSoup** | — | HTML parsing |
| **aiofiles + orjson + xxhash** | — | Async disk cache |
| **PyTorch** | ≥2.0 | Backend for sentence-transformers |

### Frontend (Web)

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 16 | React framework (App Router) |
| **React** | 19 | UI library |
| **TypeScript** | 5 | Type safety |
| **Tailwind CSS** | 4.1.9 | Utility-first CSS |
| **Sass** | — | SCSS modules |
| **Lucide React** | 0.454 | Icons |
| **Axios** | 1.13 | HTTP client |
| **react-markdown** | latest | Markdown rendering |
| **class-variance-authority** | 0.7 | Component variants (shadcn) |
| **tailwind-merge + clsx** | — | Classname merging |
| **Zod** | latest | Schema validation |
| **next-themes** | — | Dark mode |

### Mobile (Flutter)

| Technology | Version | Purpose |
|---|---|---|
| **Flutter** | 3.x | Cross-platform framework |
| **Dart SDK** | 3.9 | Language |
| **flutter_bloc** | 8.1 | State management (Cubits) |
| **http** | 1.2 | HTTP client |
| **sqflite** | 2.3 | Local SQLite database |
| **shared_preferences** | 2.2 | Settings persistence |
| **flutter_markdown** | 0.7 | Markdown rendering |
| **animations** | 2.0 | Page transitions |
| **google_fonts** | 6.2 | Typography |
| **intl** | 0.19 | Date formatting |

---

## Features

### AI & Search
- **Local LLM reasoning** via Ollama (gemma3 models) — no cloud AI dependency
- **33 intent categories** — comprehensive pattern matching for factual questions, comparisons, code generation, translation, analysis, planning, creative writing, and more
- **Hybrid NLP analysis pipeline** — spaCy entity recognition + dependency parsing, KeyBERT embedding-based keywords (MMR diversity 0.5), YAKE unsupervised extraction, and Ollama LLM for deep understanding
- **Real-time web search** — Google Programmable Search Engine integration with configurable result count (7 default)
- **Concurrent async web scraping** — 3 extraction strategies (trafilatura, JSON-LD, custom ad-filtered), max 3 concurrent, 80+ ad selectors, IAB ad dimension detection
- **BM25 relevance ranking** — with WordNet synonym expansion (×2) + spaCy NER entity overlap scoring (weighted: 1.5× BM25, 2× keyword hits, 0.5× synonyms)
- **Disk cache** — hybrid hot/cold storage with xxhash keys, caches both search results and scraped pages
- **Circuit breakers** — 2 instances (Ollama + Search), state machine (CLOSED → OPEN → HALF_OPEN), 5 failures → 60s cooldown
- **Deterministic query generation** — Ollama gemma3:1b at temperature 0.0, strict JSON-only output, with in-memory LRU cache (1000 entries)
- **Typed SSE streaming** — 9 structured event types with ISO timestamps

### Chat & UI
- **ChatGPT-like interface** with conversation history and real-time streaming responses
- **Conversation management** — create, rename, delete with date-based grouping (Today, Yesterday, This Week, Older)
- **Dark mode** with theme toggle (next-themes + CSS custom properties)
- **Responsive design** — mobile sidebar with hamburger menu, adaptive layout
- **Markdown rendering** with copy-to-clipboard button per message
- **Search progress visualization** — real-time display of intent detection, search queries, scraping progress, and result counts
- **Document upload** — drag-and-drop file sharing with metadata capture
- **Settings modal** — theme toggle, API configuration, logout
- **SSE debug page** at `/test-stream` for testing
- **shadcn/ui components** — 40+ accessible primitives

### Mobile (Flutter)
- **Cross-platform** — Android, iOS, Web, Linux, macOS, Windows
- **BLoC state management** — 2 cubits (ConversationCubit, ChatCubit)
- **Local storage** — sqflite database + SharedPreferences
- **Markdown rendering** for chat messages
- **Skeleton loaders** with shimmer animation
- **Error boundary** widget for graceful error handling
- **Animated page transitions** (PageTransitionSwitcher)
- **Dark mode toggle** with persistent preference
- **Configurable API base URL**

---

## Quick Start

### Prerequisites
- **Java 25+** and **Maven 3.6+**
- **Node.js 18+** and **npm/pnpm**
- **Python 3.10+** with pip + virtualenv
- **PostgreSQL 12+**
- **Ollama** (for local LLM)

### Step 1: Database
```sql
CREATE DATABASE khojai_db;
CREATE USER khojai_user WITH PASSWORD 'khojai_pass_1620#';
GRANT ALL PRIVILEGES ON DATABASE khojai_db TO khojai_user;
```

### Step 2: Python AI Engine
```bash
cd AI
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
# Pull LLM models
ollama pull gemma3:4b
ollama pull gemma3:1b
# Configure Google Search API
cp .env .env  # Edit GOOGLE_API_KEY and GOOGLE_CX
# Start the server
python app.py
```

### Step 3: Java Backend
```bash
# Ensure PostgreSQL is running with the database created
./mvnw clean package -DskipTests
java -jar target/KhojAI-0.0.1-SNAPSHOT.jar
# Or run directly:
./mvnw spring-boot:run
```

### Step 4: Frontend
```bash
cd frontend
npm install
npm run dev
```

### Step 5: Mobile App (Optional)
```bash
cd mobile_application
flutter pub get
flutter run
```

### All-in-One Script
```bash
./run.sh    # Starts Ollama → Spring Boot Backend → Next.js Frontend
./stop.sh   # Gracefully stops all services
```

Access the web app at **http://localhost:3000**

---

## Services & Ports

| Service | Port | Technology | Start Command |
|---|---|---|---|
| Frontend | 3000 | Next.js | `npm run dev` |
| Spring Boot Backend | 5000/8080 | Java | `./mvnw spring-boot:run` |
| Python AI Engine | 8000 | FastAPI | `python app.py` |
| Ollama | 11434 | Go | `ollama serve` |

The backend `application.properties` sets `server.port=8080`, but `run.sh` and documentation reference port 5000 (previously changed to avoid conflicts). The frontend `.env` files point to `http://localhost:8080`.

The Next.js `next.config.mjs` defines a rewrite proxy at `/api/v1/:path*` → `http://localhost:8080/api/v1/:path*`, though the Axios client uses `NEXT_PUBLIC_API_URL` directly rather than relative paths, making CORS the actual mechanism.

---

## Full API Reference

### Authentication

#### `POST /api/v1/auth/login`
Authenticate user and receive JWT.

**Request:**
```json
{ "username": "testuser", "password": "testpassword" }
```
**Response `200`:**
```json
{ "token": "eyJhbGci...", "username": "testuser", "userId": "550e8400-..." }
```
**Response `401`:** Error string

#### `GET /api/v1/auth/test`
CORS health check (no auth required).

**Response:**
```json
{ "message": "CORS is working correctly", "status": "success" }
```

### Users

#### `POST /api/v1/users`
Register a new user. Password is BCrypt-encoded.

**Request:**
```json
{ "username": "newuser", "email": "newuser@example.com", "password": "securepassword" }
```
**Response `200`:** `UserDTO { id, username, email }`

#### `GET /api/v1/users/{id}`
Get user by ID. Returns `UserDTO` or throws.

#### `PUT /api/v1/users/{id}`
Update user. Password optional — only re-encoded if non-blank.

**Request:**
```json
{ "username": "updated", "email": "updated@example.com", "password": "newpass" }
```
**Response `200`:** `UserDTO`

#### `DELETE /api/v1/users/{id}`
Delete user. **Response:** `204 No Content`

### Conversations

#### `POST /api/v1/conversations`
Create a new conversation.

**Request:**
```json
{ "userId": "550e8400-...", "title": "My Chat" }
```
**Response `200`:** `ConversationDTO { id, title, createdAt, messages: [] }`

#### `GET /api/v1/conversations/{id}`
Get conversation by ID with all messages.

**Response:** `ConversationDTO`

#### `GET /api/v1/conversations/user/{userId}`
Get all conversations for a user.

**Response:** `List<ConversationDTO>`

#### `PUT /api/v1/conversations/{id}/title`
Update conversation title.

**Request:** `{ "title": "New Title" }`
**Response:** `ConversationDTO`

#### `DELETE /api/v1/conversations/{id}`
Delete conversation. **Response:** `204 No Content`

### Messages

#### `POST /api/v1/messages`
Create a message. If role is `"USER"`, this **auto-generates an AI reply** by proxying to the Python AI engine and saves both messages. The AI reply is generated synchronously via `AiService.generateResponseFromStream()` (30s timeout).

**Request:**
```json
{ "convId": "a1b2c3d4-...", "role": "USER", "content": "What is AI?" }
```
**Response `200`:**
```json
{
  "id": "...",
  "title": "My Chat",
  "createdAt": "2024-01-01T00:00:00Z",
  "messages": [
    { "id": "...", "role": "USER", "content": "What is AI?", "sentAt": "..." },
    { "id": "...", "role": "AI", "content": "Artificial intelligence is...", "sentAt": "..." }
  ]
}
```

#### `PUT /api/v1/messages/{id}`
Update message content.

**Request:** `{ "content": "Updated text" }`
**Response:** `MessageDTO`

#### `DELETE /api/v1/messages/{id}`
Delete message. **Response:** `204 No Content`

### AI Streaming

#### `POST /api/v1/ai/stream-ai-response`
Stream AI response as SSE. This is the **primary AI endpoint** used by the frontend.

**Request:**
```json
{ "prompt": "What is quantum computing?" }
```
**Response:** `Flux<DataBuffer>` with `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `X-Accel-Buffering: no`

The flux proxies `POST /stream` on the Python backend (port 8000) via WebClient with no buffering, no read/write timeouts, and 5-minute response timeout.

**Frontend consumes this via** `fetch()` + `ReadableStream.getReader()` — parses `\n\n`-delimited SSE blocks, handles `data:` prefix, and fires typed event callbacks.

### Legacy AI Endpoints

#### `POST /api/v1/ai/stream-search`
Identical to `stream-ai-response` — both exist, both hit the same Python `/stream` endpoint. Only `streamSearch` is called from `ChatInterface`.

#### `POST /api/v1/ai/generate-response`
Blocking endpoint — POSTs to Python `/generate-response`, waits for full JSON response, returns `AiResponse { message }`.

### Documents

#### `POST /api/v1/documents/upload`
Upload a document (multipart form). Saves metadata only (name, type, size, userId).

**Request:** Multipart: `file` (binary) + `userId` (string)
**Response `201`:** `DocumentDTO`

#### `GET /api/v1/documents/user/{userId}`
List user's documents.

**Response:** `List<DocumentDTO>`

#### `DELETE /api/v1/documents/{id}`
Delete document. **Response:** `204 No Content`

### Legacy Chat Endpoints

#### `POST /api/chat/conversation`
Legacy conversation creation (not under `/api/v1/`).

**Request:** `{ "userId": "...", "title": "..." }`
**Response:** Raw `Conversation` entity

#### `POST /api/chat/message`
Legacy message sending.

**Request:** `{ "convId": "...", "role": "USER", "content": "..." }`
**Response:** Raw `Message` entity

### SSE Event Protocol

The Python AI engine emits **9 typed SSE events** during streaming:

| SSE Event | Data Fields | When |
|---|---|---|
| `intent_detected` | `{ intent, keywords, search_queries }` | Start/end of intent analysis |
| `search_started` | `{ query }` | Before first web search |
| `search_progress` | `{ query, current, total }` | Per-query progress update |
| `search_result` | `{ title, url }` | Each individual source found |
| `search_completed` | `{ total_results }` | All searches done |
| `response_started` | `{ }` | LLM starts generating |
| `response_token` | `{ data }` | Each LLM response token |
| `response_completed` | `{ }` | LLM response finished |
| `stream_complete` | `{ }` | Entire stream finished |
| `processing_error` | `{ error }` | Pipeline error |

**Wire format:**
```
data: {"type":"intent_detected","data":{"intent":"web_search","keywords":["quantum computing"]},"timestamp":"2024-01-01T00:00:00.000Z"}\n\n
data: {"type":"response_token","data":{"data":"Quantum"},"timestamp":"..."}\n\n
data: {"type":"stream_complete","data":{},"timestamp":"..."}\n\n
```

### API Summary Table

| # | Method | Path | Purpose | Auth |
|---|---|---|---|---|
| 1 | GET | `/api/v1/auth/test` | CORS health check | None |
| 2 | POST | `/api/v1/auth/login` | JWT login | None |
| 3 | POST | `/api/v1/users` | Register user | None |
| 4 | GET | `/api/v1/users/{id}` | Get user | None |
| 5 | PUT | `/api/v1/users/{id}` | Update user | None |
| 6 | DELETE | `/api/v1/users/{id}` | Delete user | None |
| 7 | POST | `/api/v1/conversations` | Create conversation | None |
| 8 | GET | `/api/v1/conversations/{id}` | Get conversation + messages | None |
| 9 | GET | `/api/v1/conversations/user/{userId}` | List user conversations | None |
| 10 | PUT | `/api/v1/conversations/{id}/title` | Update title | None |
| 11 | DELETE | `/api/v1/conversations/{id}` | Delete conversation | None |
| 12 | POST | `/api/v1/messages` | Send message + auto AI reply | None |
| 13 | PUT | `/api/v1/messages/{id}` | Update message | None |
| 14 | DELETE | `/api/v1/messages/{id}` | Delete message | None |
| 15 | POST | `/api/v1/ai/stream-ai-response` | Stream AI response (SSE) | None |
| 16 | POST | `/api/v1/ai/stream-search` | Stream AI with search (SSE) | None |
| 17 | POST | `/api/v1/ai/generate-response` | Blocking AI response | None |
| 18 | GET | `/api/v1/documents/user/{userId}` | List user documents | None |
| 19 | POST | `/api/v1/documents/upload` | Upload document | None |
| 20 | DELETE | `/api/v1/documents/{id}` | Delete document | None |
| 21 | POST | `/api/chat/conversation` | Create conversation (legacy) | None |
| 22 | POST | `/api/chat/message` | Send message (legacy) | None |

> **Note:** Currently ALL endpoints are unauthenticated (demo mode). See [Security Model](#security-model).

---

## Database Schema

JPA/Hibernate is configured with `ddl-auto=update`, so tables are auto-created. The reference schema (`init.sql`, commented out) shows the intended structure:

### `app_user`
| Column | Type | Constraints |
|---|---|---|
| `id` | `UUID` | PK, generated |
| `username` | `VARCHAR(50)` | UNIQUE, NOT NULL |
| `password` | `VARCHAR(255)` | NOT NULL (BCrypt) |
| `email` | `VARCHAR(100)` | — |

### `conversation`
| Column | Type | Constraints |
|---|---|---|
| `id` | `UUID` | PK, generated |
| `user_id` | `UUID` | FK → `app_user(id)` ON DELETE CASCADE |
| `title` | `TEXT` | NOT NULL |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() |

### `message`
| Column | Type | Constraints |
|---|---|---|
| `id` | `UUID` | PK, generated |
| `conversation_id` | `UUID` | FK → `conversation(id)` ON DELETE CASCADE |
| `role` | `VARCHAR(20)` | NOT NULL, CHECK (IN 'USER','AI') |
| `content` | `TEXT` | NOT NULL |
| `sent_at` | `TIMESTAMPTZ` | DEFAULT now() |

### `documents`
| Column | Type | Constraints |
|---|---|---|
| `id` | `BIGINT` | PK, auto-increment |
| `name` | `VARCHAR` | NOT NULL |
| `type` | `VARCHAR` | NOT NULL (MIME type) |
| `size` | `BIGINT` | NOT NULL |
| `uploaded_at` | `TIMESTAMP` | NOT NULL |
| `user_id` | `VARCHAR` | NOT NULL (flat, no FK) |

**Key relationships:**
- `User` 1→N `Conversation` (cascade ALL, orphan removal)
- `Conversation` 1→N `Message` (cascade ALL, orphan removal, ordered by `sentAt ASC`)
- `Message.role` is constrained to `"USER"` or `"AI"` (defined as constants in `Message` entity)
- `Document` is a flat entity — no JPA relationships
- Indexes recommended: `conversation(user_id)`, `message(conversation_id, sent_at DESC)`

---

## AI Pipeline Deep Dive

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    app.py (FastAPI Server)                           │
│  Lifespan: Warm-up by consuming generate_unified_stream("hi")       │
│  Routes: /health (GET), /stream (POST, SSE StreamingResponse)       │
│  CORS: All origins, methods, headers (development)                  │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────────┐
│              ai_orchestrator.py (Pipeline Orchestrator)              │
│                                                                     │
│  Circuit Breakers:                                                   │
│    _ollama_circuit_breaker (CLOSED → OPEN after 5 failures, 60s)    │
│    _search_circuit_breaker (CLOSED → OPEN after 5 failures, 60s)    │
│                                                                     │
│  generate_response_with_web_search(prompt) — Non-Streaming          │
│  generate_unified_stream(prompt) — Streaming (9 event types)        │
│  generate_fallback_response(prompt) — No context, direct LLM        │
│                                                                     │
│  LLM Templates:                                                     │
│    - System: "KhojAI — truthful, source-grounded AI search assist." │
│    - 10 strict rules: No hallucination, only retrieved context      │
│    - Output: Markdown with Sources section                          │
│    - Model: gemma3:4b, stream=True for streaming                    │
└──┬───────────────┬──────────────┬───────────────┬───────────────────┘
   │               │              │               │
   ▼               ▼              ▼               ▼
┌────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────┐
│prompt_ │  │web_search │  │scrape_   │  │search_utils  │
│analyzer│  │.py        │  │util.py   │  │.py           │
│.py +   │  │           │  │          │  │              │
│llm.py  │  │Google PSE │  │3-strategy│  │BM25 + WordNet│
│        │  │API + async│  │async     │  │+ NER scoring │
│spaCy + │  │scraping   │  │web scrape│  │              │
│KeyBERT │  │semaphore  │  │80+ ad    │  │Score weights:│
│+ Ollama│  │(max 3)    │  │selectors │  │BM25: 1.0     │
│        │  │           │  │IAB sizes │  │Keyword: 2.0  │
│Hybrid  │  │Disk cache │  │3 methods:│  │Synonyms: 0.5 │
│analysis│  │(xxhash +  │  │1.Trafilat│  │Entity: 1.5   │
│in      │  │orjson +   │  │2.JSON-LD │  │              │
│parallel│  │aiofiles)  │  │3.Custom  │  │Top N: 5-10   │
└──┬─────┘  └───────────┘  └──────────┘  └──────────────┘
   │
   ▼
┌──────────┐
│patterns │
│.py      │
│         │
│33 intent│
│categories│
│~400     │
│spaCy    │
│token    │
│patterns │
└─────────┘
```

### Pipeline Steps (Streaming)

1. **Warm-up** (app.py lifespan) — Preloads spaCy, YAKE, KeyBERT, Ollama by consuming a dummy stream
2. **Prompt entry** — `/stream` endpoint accepts flexible JSON (fields: `prompt`, `query`, `message`, or `text`)
3. **Intent analysis** — `prompt_analyzer_llm.py` runs concurrently:
   - spaCy: Parses text, runs Matcher against 33 intent categories, extracts dependency structure
   - KeyBERT: `all-MiniLM-L6-v2` embeddings, MMR (Maximal Marginal Relevance), ngram(1,3), diversity 0.5, top 20 → top 10
   - Output: `{ intents, keywords: [{term, score}], goals: [{action, object, modifiers}], search_queries }`
4. **Search query generation** — Ollama gemma3:1b at temp=0.0 generates 1-3 search queries (strict JSON output)
5. **Web search** — Google PSE API (up to 3 queries, 7 results each), retry with exponential backoff (3 attempts)
6. **Scraping** — Concurrent async scraping (max 3), 3 extraction strategies with fallback, 80+ ad selectors, content scoring
7. **Relevance ranking** — BM25 scoring + WordNet synonym expansion + NER entity overlap (combined weighted score)
8. **Context building** — Top sentences per source, deduplication
9. **LLM response** — Ollama gemma3:4b with strict grounded prompt, token-by-token streaming
10. **SSE output** — 9 typed events with ISO timestamps

### Intent Categories (33)

| Category | Sample Triggers | Patterns |
|---|---|---|
| `computation` | calculate, solve, evaluate, compute, integrate | ~30 |
| `web_search` | search, find, lookup, search the web, browse | ~20 |
| `generation` | generate, create, make, build, write code | ~30 |
| `summarization` | summarize, tl;dr, recap, outline, key points | ~15 |
| `explanation` | explain, what is, why, how, describe, clarify | ~20 |
| `translation` | translate, convert, interpret, paraphrase | ~10 |
| `analysis` | analyze, examine, evaluate, dissect, critique | ~15 |
| `comparison` | compare, contrast, versus vs, differences | ~15 |
| `recommendation` | recommend, suggest, advise, best option, pick | ~15 |
| `definition` | define, definition, what does ___ mean | ~10 |
| `tutorial` | how to, guide, tutorial, steps, instructions | ~10 |
| `code_generation` | write code, implement function, create script | ~20 |
| `math` | solve equation, formula, theorem, calculus | ~15 |
| `reasoning` | reason, think, deduce, infer, logic, hypothesize | ~12 |
| `planning` | plan, strategy, roadmap, schedule, steps | ~12 |
| `creative` | story, poem, idea, brainstorm, write poem | ~15 |
| `question_answering` | what, who, where, when, why, tell me about | ~15 |
| `fact_check` | verify, fact check, confirm, is this true | ~10 |
| `data_processing` | process data, clean dataset, transform format | ~10 |
| `visualization` | visualize, plot, graph, chart, diagram | ~12 |
| `simulation` | simulate, model, scenario, what if | ~10 |
| `optimization` | optimize, improve, maximize, efficient | ~10 |
| `database_search` | query database, vector search, SQL query | ~12 |
| `sentiment_analysis` | analyze sentiment, tone, mood | ~4 |
| `entity_recognition` | recognize entities, NER, named entity | ~5 |
| `classification` | classify, categorize, label, sort | ~5 |
| `extraction` | extract, pull, retrieve, mine | ~5 |
| `product_search` | search products, shop for, recommend items | ~5 |
| `order_tracking` | track order, check shipment, delivery status | ~5 |
| `support_query` | help, support, troubleshoot, fix issue | ~5 |
| `learning_query` | learn, study, teach, tutorial on | ~5 |
| `health_advice` | health, symptom, diagnosis, treatment | ~4 |
| `financial_inquiry` | finance, balance, budget, investment, stock | ~4 |
| `casual_chat` | Default when no pattern matches | — |
| ≈400 total patterns | | |

### Scraping Engine (`scrape_util.py`)

1052 lines of sophisticated web scraping:

- **robots.txt compliance** — async check with jittered timeout
- **3 extraction strategies** in priority order:
  1. **Trafilatura** — specialized text extraction (30s timeout)
  2. **JSON-LD** — structured data extraction (schema.org Article/BlogPosting)
  3. **Custom** — ad removal → content scoring → best container selection
- **80+ ad selectors** — comprehensive coverage of ad networks, banners, popups
- **IAB standard ad dimension detection** — 728×90, 300×250, 160×600, etc.
- **12-pass noise removal pipeline** — scripts → comments → honeypots → ads → nav → ARIA → breadcrumbs → social → forms → empties → promos
- **Content scoring** — text length, paragraph count, link density, class names, HTML5 tags
- **Sentence extraction** — 15 filters including min/max words, dedup, promo density, ALL CAPS rejection
- **Error detection** — 403/429/503 handling, CAPTCHA detection, error page identification

---

## Frontend Architecture

### Component Hierarchy

```
<RootLayout> (Geist fonts, Vercel Analytics, antialiased)
├── {children}
│
├── [/] <Home>
│   ├── (if not logged in) <Signup onLoginSuccess>
│   │   ├── Username/Email/Password form → UserAPI.create()
│   │   └── "Continue as guest" → generates guest_<timestamp> username
│   ├── (if logged in) redirect to /chat
│
├── [/login] <LoginPage>
│   └── Username/Password → AuthAPI.login() → stores JWT → redirect /chat
│
├── [/chat] <ChatPage>                       ← layout.tsx wraps with ThemeProvider
│   ├── <Sidebar>
│   │   ├── Conversations grouped by date (Today/Yesterday/This Week/Older)
│   │   ├── Create new, rename, delete conversations
│   │   ├── Settings gear icon → opens <SettingsModal>
│   │   └── Hamburger menu for mobile toggle
│   ├── <ChatInterface chatId={null}>
│   │   ├── Empty state when no chatId
│   │   └── Prompt bar at bottom
│
├── [/chat/[id]] <ChatPage>
│   ├── <Sidebar selectedChatId={id}>
│   ├── <ChatInterface chatId={id}>
│   │   ├── Messages list with <ChatMessage> components
│   │   ├── <SearchProgress> bar during streaming
│   │   ├── Text input + send button
│   │   └── SSE stream handling:
│   │       ├── Creates USER message via MessageAPI.create()
│   │       ├── AI placeholder shown ("Thinking...")
│   │       ├── fetch() → ReadableStream → parseSSEEvent()
│   │       ├── Updates <SearchProgress> per event
│   │       ├── Builds final response from final_response event
│   │       └── Saves AI message on stream complete
│   └── <SettingsModal>
│       ├── Theme toggle
│       ├── API configuration
│       └── Logout

└── [/test-stream] <StreamTestPage>
    └── Direct SSE test to Python http://127.0.0.1:8000/stream
```

### State Management

- **No global state store** — no Redux, Zustand, or React Context for auth
- **Auth**: localStorage (`token`, `userId`, `username`) — checked on page load
- **Chat state**: `useState` in ChatInterface — `messages[]`, `streamData[]`, `isLoading`, `finalResponseRef`
- **Cross-component communication**: Custom events via `window.dispatchEvent(new CustomEvent('conversationCreated'))` → Sidebar re-fetches
- **Axios interceptor**: Injects `Bearer {token}` from localStorage into all requests

### SSE Streaming Client

The frontend uses **native `fetch()`** (not Axios) for streaming:

```typescript
// Key flow in ChatInterface.handleSend():
const response = await fetch(`${NEXT_PUBLIC_API_URL}/api/v1/ai/stream-search`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt })
});
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = decoder.decode(value, { stream: true });
  // Split on \n\n, parse data: prefix
  // Fire onEvent() or onComplete() callbacks
}
```

**Stream events handled in UI:**
- `analysis` → show "Analyzing query..."
- `search` → show "Searching for {query}..."
- `urls_found` → show "Found {count} URLs"
- `scraping` → show "Reading {url}..."
- `scraping_error` → show "Could not read {url}"
- `extracting` → show "Extracting key information..."
- `search_result` → individual result display
- `deduplication` → show "{original} → {final} unique sources"
- `response_generation` → show "Generating response..."
- `final_response` → store in `finalResponseRef`, render as final AI answer
- `done` → save AI message, clean up

### Styling Architecture

| Layer | Technology | Used For |
|---|---|---|
| Tier 1 | `globals.css` (Tailwind v4) | Dark mode CSS variables, Tailwind directives |
| Tier 2 | SCSS modules (`*.module.scss`) | ChatGPT-inspired component styles |
| Tier 3 | shadcn/ui (`components/ui/`) | ~40 primitives with CVA + tailwind-merge |
| Hybrid | Inline Tailwind | `chat-message.tsx`, `sidebar.tsx` |

**Design tokens** (from `variables.scss`):
- Primary: `#10a37f` (ChatGPT green)
- Background: `#ffffff` / `#0d0d0d` (dark)
- Secondary surface: `#f7f7f8` / `#1a1a1a` (dark)
- Text: `#0d0d0d` / `#ececf1` (dark)

---

## Mobile App Architecture

### App Entry (`main.dart`)

```
main()
└─ runZonedGuarded()
   └─ WidgetsFlutterBinding.ensureInitialized()
   └─ sqfliteFfiInit() (desktop platforms only)
   └─ SettingsService().init()
   └─ runApp(MyApp)
      └─ MultiBlocProvider
         ├─ BlocProvider<ConversationCubit>
         └─ BlocProvider<ChatCubit>
         └─ MaterialApp with ThemeData (light/dark)
```

### Screen Hierarchy

```
MyApp (MaterialApp)
├── HomeScreen (conversation list + sidebar drawer)
│   ├── AppBar with menu/drawer toggle
│   ├── ListView of ConversationListItems
│   ├── FloatingActionButton → new conversation
│   ├── Drawer with settings + about
│   └── ErrorBoundary wrapper
│
├── ChatScreen (messages + input)
│   ├── AppBar (back, conversation title)
│   ├── ListView of ChatMessage widgets (markdown)
│   ├── SkeletonLoader during streaming
│   └── ChatInput (TextField + send button)
│
└── SettingsScreen
    ├── Dark Mode toggle
    ├── API Base URL field
    ├── Account info
    └── About section
```

### State Management (Cubits)

**`ConversationCubit`**: Manages conversation list
- `loadConversations(userId)` → fetches from API, emits `[Conversation]`
- `createConversation(userId, title)` → POST, adds to list
- `deleteConversation(id)` → DELETE, removes from list

**`ChatCubit`**: Manages chat messages + streaming
- `loadMessages(conversationId)` → fetches history
- `sendMessage(convId, content)` → POSTs message, handles AI response
- `streamUpdate(partialResponse)` → incremental update during streaming

### Local Storage
- **sqflite**: Conversations and messages cached locally for offline access
- **SharedPreferences**: Dark mode preference, API base URL, user data
- Platform-specific database factory (FFI for desktop, standard for mobile)

---

## Design System

### Color Palette (ChatGPT-inspired)

| Token | Light | Dark | Usage |
|---|---|---|---|
| Primary | `#10a37f` | `#10a37f` | Brand, accents |
| Primary Dark | `#0d8659` | `#0d8659` | Hover states |
| Background | `#ffffff` | `#0d0d0d` | Page background |
| Background Secondary | `#f7f7f8` | `#1a1a1a` | Sidebar, cards |
| Surface | `#ffffff` | `#1a1a1a` | Component surface |
| Surface Secondary | `#ececf1` | `#2a2a2a` | Input fields |
| Text Primary | `#0d0d0d` | `#ececf1` | Headings, body |
| Text Secondary | `#565869` | `#b4b4b8` | Subtle text |
| Border | `#d1d5db` | `#4a4a4a` | Default borders |

### Spacing Scale
`xs: 0.25rem` | `sm: 0.5rem` | `md: 1rem` | `lg: 1.5rem` | `xl: 2rem` | `2xl: 3rem`

### Border Radius
`sm: 0.375rem` | `md: 0.5rem` | `lg: 0.75rem` | `full: 9999px`

### Typography
- Primary font: Geist (Next.js app), system fonts (Flutter)
- Chat messages: Markdown-rendered with `react-markdown` (web) / `flutter_markdown` (mobile)
- Monospace for code blocks in chat

---

## Environment Variables

### Python AI Engine (`AI/.env`)
| Variable | Default | Description |
|---|---|---|
| `GOOGLE_API_KEY` | — | Google Custom Search API key |
| `GOOGLE_CX` | — | Google Programmable Search Engine ID |
| `MAX_SEARCH_RESULTS` | 7 | Results per search query (max 10) |

### Next.js Frontend (`frontend/.env*`)
| Variable | Example | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Spring Boot backend URL |

### Spring Boot Backend (`src/main/resources/application.properties`)
| Property | Default | Description |
|---|---|---|
| `server.port` | 8080 | Backend HTTP port |
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/khojai_db` | PostgreSQL connection URL |
| `spring.datasource.username` | `khojai_user` | DB user |
| `spring.datasource.password` | `khojai_pass_1620#` | DB password |
| `jwt.secret` | `mySecretKeyThatIsAtLeast32BytesLongForHS256` | JWT signing key |
| `jwt.expiration` | 86400 | JWT expiry in seconds (24h) |
| `spring.jpa.hibernate.ddl-auto` | `update` | Schema generation strategy |
| `spring.codec.max-in-memory-size` | -1 | Unlimited buffer for SSE streaming |
| `spring.webflux.streaming.enabled` | true | Enable reactive streaming |
| `server.netty.max-keep-alive-timeout` | 300000 | Keep-alive for SSE (5min) |

### `.gitignore` excludes
- `target/`, `.mvn/` — Maven build artifacts
- `.env*` — Environment files with secrets
- `.idea/`, `.vscode/` — IDE configs
- `__pycache__` — Python cache

---

## Scripts Reference

### `run.sh` — Start All Services
```
./run.sh
```
1. Kills existing processes on ports 11434 (Ollama), 8080 (Backend), 3000 (Frontend)
2. Starts Ollama (`ollama serve` → background)
3. Pulls `llama3` model if not present (background)
4. Starts Spring Boot Backend (`./mvnw spring-boot:run` → background, waits 10s)
5. Starts Next.js Frontend (`npm run dev` → background)

### `stop.sh` — Stop All Services
```
./stop.sh
```
1. Finds and kills processes on ports 3000, 8080, 11434
2. Also kills Node.js (next), Java (spring), and Ollama processes

---

## Security Model

### Current State: Demo Mode

**All endpoints are unauthenticated.** The application is configured for development convenience:

- `SecurityConfig.java`: `requestMatchers("/**").permitAll()` — no security rules enforced
- `JwtRequestFilter.java`: **Commented out** — JWT validation is disabled
- `CorsConfig.java`: Allows all origins (`*`), all methods, all headers with credentials
- CSRF: Disabled
- Sessions: Stateless
- No buffering filter: Applies to all responses

### JWT Implementation (Ready but Inactive)

The JWT infrastructure is fully implemented and can be activated:
- `JwtUtil.java`: HS256 token generation, validation, username extraction via `io.jsonwebtoken`
- `UserDetailsServiceImpl.java`: Loads user from DB, wraps in Spring Security `UserDetails`
- `JwtRequestFilter.java`: Extracts `Authorization: Bearer {token}` header, validates, sets SecurityContext
- `AuthenticationManager`: Used in `AuthController` for login

### To Enable Authentication
1. Uncomment the `JwtRequestFilter` registration in `SecurityConfig`
2. Add `.authenticated()` or role-based matchers to security rules
3. Ensure the frontend SSE streams also include `Authorization` headers (currently missing in `streamSearch()`)

---

## Known Issues & Gotchas

### Backend
- **`init.sql` is fully commented out** — JPA Hibernate auto-creates tables via `ddl-auto=update` instead
- **`application.properties` uses port 8080**, but `run.sh` and documentation reference port 5000
- **No unit tests** — `src/test/` may be empty or missing
- **WebClient compression disabled** — important for SSE to work correctly
- **Demo mode**: All endpoints are open — JWT filter is commented out

### Frontend
- **Missing `/types` directory** — `chat-interface.tsx` imports `MessageDTO` from `../types` which doesn't exist
- **No JWT on SSE streams** — `streamSearch()` and `streamAiResponse()` use native `fetch()` without `Authorization: Bearer` header
- **Duplicate code** — `AuthAPI` and `handleLogout()` are each defined twice in `app/api/chat/route.ts`
- **Rewrite proxy unused** — `next.config.mjs` rewrites `/api/v1/*` → backend, but Axios hits `NEXT_PUBLIC_API_URL` directly (cross-origin), so CORS is the actual mechanism
- **Signup doesn't get JWT** — `UserAPI.create()` returns `UserDTO` with `id` but no `token`. The `Signup` component stores `userId`/`username` but not a JWT. Guest access has the same issue. Users must log in separately to get a token.
- **`handleLogout` import** — `app/page.tsx` imports from `@/app/api/chat/route` which is a client-side utility, not a server route

### AI Engine
- **Missing dependencies in requirements.txt** — `keybert` and `sentence-transformers` (all-MiniLM-L6-v2) are imported but not listed in `requirements.txt`
- **Legacy analyzer** — `prompt_analyzer.py` is marked LEGACY and maintained for backward compatibility only
- **Hardcoded model names** — `gemma3:4b` and `gemma3:1b` are hardcoded in `ai_orchestrator.py` and `prompt_analyzer_llm.py`
- **Search cache** — disk-based, may grow unbounded without eviction policy
- **Warm-up on startup** — consumes a dummy stream `generate_unified_stream("hi")`, which loads all models but may delay first readiness by 10-30s

### Mobile App
- **sqflite_common_ffi** — database factory initialization differs per platform (FFI for desktop, standard for mobile)
- **Flutter dependencies** — require `flutter pub get` before building (dart/flutter SDK not always available in dev environments)

---

## Development Workflow

### Recommended Development Order

1. **Start Python AI Engine** — it must be running for the backend to proxy requests
   ```bash
   cd AI && source venv/bin/activate && python app.py
   ```
2. **Start Spring Boot Backend** — the main API server
   ```bash
   ./mvnw spring-boot:run -DskipTests  # or java -jar target/KhojAI-*.jar
   ```
3. **Start Frontend** — web UI
   ```bash
   cd frontend && npm run dev
   ```
4. **Optional: Mobile App**
   ```bash
   cd mobile_application && flutter run
   ```

### Hot Reload
- **Frontend**: Next.js dev server supports hot reload via `npm run dev`
- **Backend**: Spring Boot DevTools can be enabled for hot reload (not currently configured)
- **AI Engine**: FastAPI auto-reload with `python app.py` (uvicorn reload not enabled by default)
- **Mobile**: Flutter hot reload via `flutter run`

### Debugging SSE Streams
- Visit `/test-stream` on the frontend for raw SSE debugging
- The Python terminal can be tested via `python terminal_app.py`
- Check AI engine health: `curl http://localhost:8000/health`
- Test CORS: `curl http://localhost:5000/api/v1/auth/test` (or port 8080)

---

## Testing

### Backend (Java)
```bash
./mvnw test
# Skip tests:
./mvnw package -DskipTests
```

### AI Engine (Python)
```bash
cd AI
source venv/bin/activate
python -m pytest test_stream.py test_patterns.py test_web_search.py -v
```

### Frontend (Next.js)
```bash
cd frontend
npm test  # Jest configured with babel
```

### Mobile (Flutter)
```bash
cd mobile_application
flutter test
```

### Manual API Testing
See [`documentation/api_testing.md`](documentation/api_testing.md) for comprehensive curl examples.

---

## Documentation

Additional documentation is available in the [`documentation/`](documentation/) directory:

| Document | Description |
|---|---|
| [Setup & Run Guide](documentation/setup_and_run.md) | Detailed setup instructions |
| [Features](documentation/features.md) | Current and upcoming features |
| [API Testing](documentation/api_testing.md) | Curl examples + HTTP request/response specs |
| [CORS Configuration](documentation/cors_configuration.md) | CORS setup across frontend and backend |
| [Frontend Testing](documentation/frontend_testing.md) | Frontend testing configuration |

---

## Git History

```
2fd16a1  Pesky little app won't start unless I ensure Initialization because I used async functions in the code.
5fc830e  A pesky little widget to show error information
0a31c94  Removed widget test
ddbe669  Removed print and added proper stream data handling
816c724  Some mainActivity issue the debug APK returned. Fix
aab2fd3  Gradle updates for building the damn thing to apk
0ad8995  Search cache update
db97f7e  Removed print messages for debugging from production
4291c02  Search cache update
2fd0448  Flutter Package Update
64ba9fc  Cache update
b9579f7  New icon for the mobile app
633599f  Skeleton loader animation
bffab98  Updated package list
bb0bb13  Overhauled settings page
```

---

## License

This project is licensed under the MIT License.
