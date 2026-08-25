# AyarFarm Link MSME

A cross-platform agricultural knowledge and management system designed specifically for farmers in Myanmar. This solution connects the agricultural community with expert knowledge, real-time market information, and support networks.

The platform consists of three main components:

- **Mobile App:** A user-friendly application for farmers (end-users) to access resources, track crops, and connect with experts.
- **Web Dashboard:** A comprehensive admin panel for managing content, users, and analyzing platform data.
- **AI Processor:** A Python service that vectorizes content (posts, PDFs, knowledge base) and serves RAG-based AI chat with streaming responses.

## Project Structure

```structure
ayar-farm/
├── api/                      # Node.js REST API (Express + Prisma)
├── web/                      # React web application (Vite + TypeScript)
├── mobile/                   # Flutter mobile application
├── ai-processor/             # Python AI service (FastAPI + RAG + embeddings)
├── docker-compose.dev.yml    # Development Docker Compose (hot-reload)
├── docker-compose.yml        # Production Docker Compose
└── docs/                     # Detailed compose documentation
```

> Both environments use the same **cloud-managed data services**: PostgreSQL on **Neon DB**, Redis on **Upstash**, and vector search on **Qdrant Cloud**. No database/cache/vector containers are deployed locally.

## Tech Stack

### API

- **Runtime:** Node.js
- **Framework:** Express 5
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Real-time:** Socket.io
- **Storage:** Cloudinary
- **Authentication:** JWT
- **Services:** Twilio (SMS), Nodemailer (Email)

### Web

- **Framework:** React 19
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** TailwindCSS 4
- **Routing:** TanStack Router
- **UI Components:** Radix UI, Lucide React
- **State/Data:** TanStack Table, React Hook Form
- **Visualization:** Recharts
- **Real-time:** Socket.io Client

### Mobile

- **Framework:** Flutter 3.7+
- **Language:** Dart
- **Key Packages:**
  - `http`: API communication
  - `geolocator`: Location services

### AI Processor

- **Language:** Python 3.14
- **Framework:** FastAPI + Uvicorn
- **LLM:** Google Gemini / OpenAI / Ollama (`qwen2.5:7b`) via provider abstraction (Strategy + Factory patterns)
- **Embeddings:** Provider-based (`text-embedding-004`, `bge-m3`, etc.)
- **Vector DB:** Qdrant
- **Task Queue:** Redis Streams

---

## Prerequisites

- Node.js 22+
- Docker & Docker Compose
- Flutter SDK 3.7+ (for mobile development)

---

# 🛠️ Development Setup

Use this environment for day-to-day development. Data services are **cloud-managed** (same as production), app containers run locally with hot-reload.

## Architecture (Development)

```
┌──────────────────────────────────────────────────────────────┐
│                docker-compose.dev.yml                        │
│                                                              │
│  api (:3000) ── web (:5173) ── mobile (:8080)                │
│       │                                                      │
│       ├── ai-processor (:8001, hot-reload)                   │
│       │        │                                             │
│       │        └── ollama :11434 (qwen2.5:7b + bge-m3)       │
│       │                                                      │
│       ▼            outbound HTTPS/TLS                        │
│  ┌─────────────────────────────────────────┐                 │
│  │ Neon DB (PostgreSQL)                    │                 │
│  │ Upstash (Redis)                         │                 │
│  │ Qdrant Cloud (vector search)            │                 │
│  └─────────────────────────────────────────┘                 │
└──────────────────────────────────────────────────────────────┘
```

> 💡 Use a separate Neon branch (e.g., `development`) for local work so you don't test against production data. See `docs/DOCKER_COMPOSE_DEVELOPMENT.md` for details.

## Prepare Development Environment Files

Point `.env` files at your cloud services before starting:

```env
# api/.env and ai-processor/.env
DATABASE_URL=postgresql://neondb_owner:<password>@ep-xxx-pooler.aws.neon.tech/ayar_farm_db?sslmode=require
REDIS_URL=rediss://default:<password>@xxx.upstash.io:6379

# ai-processor/.env only
QDRANT_URL=https://xxx.aws.cloud.qdrant.tech:6334
QDRANT_API_KEY=<qdrant-api-key>
```

## Start Development Mode

```bash
# Build and start all services with hot-reload
docker-compose -f docker-compose.dev.yml up --build

# Services will be available at:
# API:           http://localhost:3000
# Web:           http://localhost:5173
# Mobile (Web):  http://localhost:8080
# AI Processor:  http://localhost:8001
# Ollama:        http://localhost:11434
```

After the first startup, pull the Ollama models:

```bash
docker compose -f docker-compose.dev.yml exec ollama ollama pull qwen2.5:7b
docker compose -f docker-compose.dev.yml exec ollama ollama pull bge-m3
```

> Keeping both models resident needs ~6 GB RAM inside Docker — allocate Docker Desktop ≥ 10 GB, or set `OLLAMA_MAX_LOADED_MODELS=1` on smaller machines.

## Run Individual Services Without Docker

### API

```bash
cd api
npm install
cp .env.example .env

# Update .env — point DATABASE_URL at your Neon branch (use a dev branch!)
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed   # Optional: seed initial data
npm run dev
```

### Web

```bash
cd web
npm install
cp .env.example .env
npm run dev
```

### AI Processor

```bash
cd ai-processor
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env          # Configure Redis/DB/Qdrant/Ollama URLs
python dev.py                 # Hot-reload mode
```

### Mobile (Native)

```bash
cd mobile
flutter pub get
flutter run                    # Emulator or connected device
flutter run -d web-server      # Web version
```

## Understanding Run Modes

- **With `-d` (Detached Mode):**
  - Runs containers in the background.
  - Terminal is free for other commands.
  - Use `docker compose logs -f` to view logs.
  - Stop with `docker compose down`.

- **Without `-d` (Foreground Mode):**
  - Runs containers in the current terminal.
  - Shows live logs from all services.
  - Useful for debugging and seeing immediate errors.
  - Stop with `Ctrl+C`.

---

# 🚀 Production Deployment

Production runs on a **Z.com.mm Cloud VPS Standard C4** with cloud-managed data services — no database, Redis, or Qdrant containers are deployed locally.

## Server Specifications

| Item | Value |
|---|---|
| Provider | Z.com.mm |
| Plan | Cloud VPS Standard C4 |
| CPU | 8 vCPU |
| RAM | 16 GB |
| OS | Ubuntu |
| Boot disk | 50 GB (500 IOPS, no additional data disk) |

## Managed Cloud Services

| Service | Provider | Configured Via |
|---|---|---|
| PostgreSQL | **Neon DB** | `DATABASE_URL` |
| Redis | **Upstash** | `REDIS_URL` (rediss:// TLS) |
| Vector DB | **Qdrant Cloud** | `QDRANT_URL` + `QDRANT_API_KEY` |

## Self-Hosted Containers

| Container | Port | Purpose |
|---|---|---|
| `api` | 3000 | Node.js REST API |
| `web` | 5173 | React admin dashboard (nginx) |
| `mobile` | 8080 | Flutter web app (nginx) |
| `ai-processor` | internal 8001 | RAG chat + vectorization worker |
| `ollama` | internal 11434 | LLM (`qwen2.5:7b`) + Embeddings (`bge-m3`) |

## Resource Budget (16 GB RAM)

```
ollama        10G limit / 6 CPUs   (both models stay resident in memory)
ai-processor   2G limit / 2 CPUs
api            1G limit / 1 CPU
web          256M limit
mobile       128M limit
OS overhead   ~2G
```

> Ollama is configured with `OLLAMA_MAX_LOADED_MODELS=2` so `qwen2.5:7b` and `bge-m3` both remain loaded — this prevents slow model swapping during RAG search → generate cycles.

## Step 1 — Prepare Environment Files

Create `.env` files on the server from the `.env.example` templates.

**`api/.env`:**

```env
DATABASE_URL=postgresql://neondb_owner:<password>@ep-xxx-pooler.aws.neon.tech/ayar_farm_db?sslmode=require
REDIS_URL=rediss://default:<password>@xxx.upstash.io:6379
JWT_SECRET=...
CLOUDINARY_URL=...
# ...see api/.env.example for the full list
```

> Use Neon's **pooled connection string** (`-pooler` host) — the API handles many concurrent connections.

**`web/.env`:**

```env
VITE_API_URL=https://your-domain.com/api
# ...see web/.env.example
```

**`ai-processor/.env`:**

```env
DATABASE_URL=postgresql://neondb_owner:<password>@ep-xxx-pooler.aws.neon.tech/ayar_farm_db?sslmode=require
REDIS_URL=rediss://default:<password>@xxx.upstash.io:6379
QDRANT_URL=https://xxx.aws.cloud.qdrant.tech:6334
QDRANT_API_KEY=<qdrant-cloud-api-key>
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

## Step 2 — Deploy

```bash
# On the VPS
git clone <repo-url> && cd ayar-farm

# Create .env files (Step 1 above)

# Build and start everything
docker compose up -d --build

# Pull AI models into Ollama (first time only, ~6 GB download)
docker compose exec ollama ollama pull qwen2.5:7b
docker compose exec ollama ollama pull bge-m3

# Verify all services are healthy
docker compose ps
```

## Step 3 — Verify

```bash
# API health
curl http://localhost:3000/health

# RAG service health
docker compose exec ai-processor python -c "from urllib.request import urlopen; print(urlopen('http://127.0.0.1:8001/health').read())"

# Ollama models loaded
docker compose exec ollama ollama list
```

## Production Maintenance Commands

```bash
# View logs
docker compose logs -f api
docker compose logs -f ai-processor

# Restart after config change
docker compose up -d --force-recreate api

# Rebuild a single service after code update
git pull && docker compose up -d --build api

# Free disk space (50 GB boot disk — do this occasionally)
docker system prune -a --volumes --filter "until=168h"
```

> ⚠️ `--volumes` in the prune command removes unused volumes — the only volume is `ollama_data`. Prefer running `docker image prune -a` instead if models are already pulled, to avoid re-downloading ~6 GB of model weights.

## Switching AI Providers (No Code Changes)

The active AI provider is controlled by the `ApiKey` table in the database:

```sql
-- Example: switch to Ollama/CUSTOM (self-hosted, no API costs)
UPDATE "ApiKey" SET active = false;
UPDATE "ApiKey" SET active = true WHERE provider = 'CUSTOM';

-- CUSTOM provider configuration fields:
-- baseUrl            = 'http://ollama:11434/v1'
-- llmModelName       = 'qwen2.5:7b'
-- embeddingModelName = 'bge-m3'
-- vectorSize         = 1024
```

The change propagates to the AI Processor instantly via a Redis stream — no restart needed.

---

## Building Mobile Release Artifacts

For native mobile builds (outside Docker):

```bash
cd mobile

# Android APK
flutter build apk --release --dart-define=API_BASE_URL=https://your-domain.com/api

# Android APK with obfuscation, split per ABI
flutter build apk --release --split-per-abi --obfuscate --split-debug-info=build/debug-info --dart-define=API_BASE_URL=https://your-domain.com/api

# App Bundle for Play Store
flutter build appbundle --release --obfuscate --split-debug-info=build/debug-info --dart-define=API_BASE_URL=https://your-domain.com/api

# iOS
flutter build ios --release --dart-define=API_BASE_URL=https://your-domain.com/api
```

---

## Environment Variables Summary

Check `.env.example` in each directory for the full required variables:

| Directory | Key Variables |
|---|---|
| `api/` | `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `CLOUDINARY_*`, `TWILIO_*`, SMTP settings |
| `web/` | `VITE_API_URL` |
| `ai-processor/` | `DATABASE_URL`, `REDIS_URL`, `QDRANT_URL`, `QDRANT_API_KEY`, `CORS_ALLOWED_ORIGINS` |

---

Part of the Ayar Farm project.
