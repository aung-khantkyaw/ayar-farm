# Docker Compose - Production

> **Target Server:** Z.com.mm Cloud VPS Standard C4 — 8 vCPU / 16 GB RAM / Ubuntu / 50 GB Boot disk (500 IOPS)
> **File:** `docker-compose.yml`
> **Project Name:** `ayar-farm`
>
> **Data services are fully cloud-managed** — PostgreSQL runs on **Neon DB**, Redis on **Upstash**, and Qdrant on **Qdrant Cloud**. No database/cache/vector containers are deployed locally.

---

## Architecture Overview

```
                        INTERNET
                           │
        ┌──────────────────┼──────────────────────────────┐
        │                  │                              │
        ▼                  ▼                              ▼
┌───────────────┐  ┌───────────────┐             ┌─────────────────┐
│ Neon DB       │  │ Upstash Redis │             │ Qdrant Cloud    │
│ (PostgreSQL)  │  │ (TLS)         │             │                 │
└───────▲───────┘  └───────▲───────┘             └────────▲────────┘
        │                  │                              │
        └──────────────────┼──────────────────────────────┘
                           │ HTTPS/TLS (outbound from VPS)
┌──────────────────────────┼──────────────────────────────────────┐
│  Z.com.mm VPS (8 vCPU · 16GB · 50GB)                            │
│                          │                                      │
│  frontend network        │      backend network                 │
│  ┌────────────────┐      │      ┌─────────────────────────┐     │
│  │ web   :5173    │      │      │ ai-processor :8001      │     │
│  │ mobile :8080   │  api ◄┼────► │  ├─ RAG search/stream   │     │
│  └────────────────┘  │    │      │  └─ vectorization worker│     │
│                :3000 │    │      └──────────┬──────────────┘     │
│                      │    │                 │                    │
│                 api (Node.js + Express)           ▼              │
│                      │           ┌─────────────────────────┐     │
│                      │           │ ollama                  │     │
│                      │           │  ├─ qwen2.5:7b  (LLM)   │     │
│                      │           │  └─ bge-m3 (embeddings) │     │
│                      │           └─────────────────────────┘     │
└──────────────────────┴───────────────────────────────────────────┘
```

- **frontend** — Exposed to host (ports 3000, 5173, 8080)
- **backend** — No host ports; carries api ↔ ai-processor ↔ ollama traffic
- **backend is NOT `internal`** — api and ai-processor need outbound HTTPS/TLS access to Neon, Upstash, and Qdrant Cloud

---

## Managed Cloud Services

| Service | Provider | Configured Via | Used By |
|---|---|---|---|
| PostgreSQL | **Neon DB** | `DATABASE_URL` | api, ai-processor |
| Redis | **Upstash** | `REDIS_URL` (`rediss://`) | api, ai-processor |
| Vector DB | **Qdrant Cloud** | `QDRANT_URL`, `QDRANT_API_KEY` | ai-processor |

> Use Neon's **pooled connection string** (`-pooler` host) for `DATABASE_URL`.

---

## Services

### 1. `api` — Node.js Backend

| Property | Value |
|---|---|
| Dockerfile | `docker/Dockerfile.api` |
| Port | `3000:3000` |
| Network | frontend + backend |
| Env File | `./api/.env` |
| CPU Limit | 1 core (reserved 0.5) |
| Memory Limit | 1G (reserved 512M) |

**Environment Variables:**
| Variable | Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `3000` | Express server port |
| `PYTHON_RAG_SERVICE_URL` | `http://ai-processor:8001` | Internal URL to Python RAG service |
| `DATABASE_URL` | *(from .env)* | Neon pooled connection string |
| `REDIS_URL` | *(from .env)* | Upstash TLS URL |

**Healthcheck:** TCP connection test on port 3000, 30s interval, 3 retries, 20s start period.

**Depends on:** ai-processor (healthy).

---

### 2. `web` — React Frontend

| Property | Value |
|---|---|
| Dockerfile | `docker/Dockerfile.web` |
| Port | `5173:4173` (host:container) |
| Network | frontend |
| Env File | `./web/.env` |
| CPU Limit | 0.25 cores |
| Memory Limit | 256M |

Built with Vite, served via Nginx on container port 4173, exposed as 5173 on host.

**Healthcheck:** TCP connection test on port 4173, 30s interval, 3 retries, 10s start period.

**Depends on:** api (healthy).

---

### 3. `mobile` — Flutter Web (Production Build)

| Property | Value |
|---|---|
| Dockerfile | `docker/Dockerfile.mobile` |
| Target | `prod` |
| Port | `8080:80` |
| Network | frontend |
| CPU Limit | 0.25 cores |
| Memory Limit | 128M |

Flutter web app built in release mode, served via Nginx on port 80.

**Healthcheck:** HTTP GET via `wget`, 30s interval, 3 retries, 10s start period.

---

### 4. `ai-processor` — Python RAG Service & Vectorization Worker

| Property | Value |
|---|---|
| Dockerfile | `docker/Dockerfile.ai-processor` |
| Port | Internal only (`expose: 8001`) |
| Network | backend |
| Env File | `./ai-processor/.env` |
| CPU Limit | 2 cores (reserved 1) |
| Memory Limit | 2G (reserved 1G) |

**Environment Variables (from `./ai-processor/.env`):**
| Variable | Description |
|---|---|
| `PORT` | Uvicorn server port (`8001`) |
| `DATABASE_URL` | Neon pooled connection string |
| `REDIS_URL` | Upstash TLS URL (task queue + API key updates) |
| `QDRANT_URL` | Qdrant Cloud endpoint (`https://...qdrant.tech:6334`) |
| `QDRANT_API_KEY` | Qdrant Cloud API key |
| `CORS_ALLOWED_ORIGINS` | Allowed browser origins |

**Embeddings:** served by the Ollama container (`bge-m3`) via the OpenAI-compatible API — no local embedding model download needed.

**Healthcheck:** Python HTTP check on `/health` endpoint, 30s interval, 3 retries, 30s start period.

**Depends on:** ollama (started).

---

### 5. `ollama` — Local LLM + Embeddings

| Property | Value |
|---|---|
| Image | `ollama/ollama:latest` |
| Container Name | `ayar_farm_ollama` |
| Port | Internal only (11434) |
| Network | backend |
| CPU Limit | 6 cores (reserved 4) |
| Memory Limit | 10G (reserved 6G) |

**Models Served:**
| Model | Role | Size |
|---|---|---|
| `qwen2.5:7b` | LLM (RAG generation) | ~4.7 GB |
| `bge-m3` | Embeddings (dense, 1024 dim) | ~1.2 GB |

**Environment Variables:**
| Variable | Value | Description |
|---|---|---|
| `OMP_NUM_THREADS` | `6` | CPU threads (matches CPU limit) |
| `OLLAMA_NUM_PARALLEL` | `1` | 1 concurrent inference request per model |
| `OLLAMA_MAX_LOADED_MODELS` | `2` | Keep BOTH models resident — prevents slow swaps between RAG search and generate steps |
| `OLLAMA_KEEP_ALIVE` | `30m` | Unload idle models after 30 min |
| `OLLAMA_CONTEXT_LENGTH` | `4096` | Pinned context size — prevents silent memory growth |
| `OLLAMA_KV_CACHE_TYPE` | `q8_0` | Quantized KV cache — halves cache RAM (~230MB → ~120MB), negligible quality impact |

**Memory budget (16 GB server):** peak demand ~6.9 GB vs 10G container limit; total committed across all containers ~11 GB of host RAM. Safe.

**Volumes:** `ollama_data:/root/.ollama` (persistent model files, ~6 GB total).

**First Run — Pull Models (~6 GB one-time):**
```bash
docker compose exec ollama ollama pull qwen2.5:7b
docker compose exec ollama ollama pull bge-m3
```

---

## Volumes

Only **one** volume remains — all data services are cloud-managed:

| Volume | Purpose |
|---|---|
| `ollama_data` | Ollama model files (qwen2.5:7b + bge-m3, ~6 GB) |

---

## Networks

| Network | Internal | Purpose |
|---|---|---|
| `frontend` | No | User-facing services (api, web, mobile) |
| `backend` | No | Service-to-service (api, ai-processor, ollama) + outbound access to cloud services |

> ⚠️ The backend network is intentionally **not** `internal: true`. The api and ai-processor containers must reach Neon DB, Upstash Redis, and Qdrant Cloud over the public internet. Internal networks have no outbound route and would break all cloud service connections.

---

## Logging

All services use JSON file logging with rotation:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"   # Max 10MB per log file
    max-file: "3"     # Keep max 3 files (30MB total per service)
```

Important on a 50 GB boot disk with no auto-backup — logs cannot be allowed to grow unbounded.

---

## Environment Files Setup

Create before first deploy:

**`api/.env`:**
```env
DATABASE_URL=postgresql://neondb_owner:<password>@ep-xxx-pooler.aws.neon.tech/ayar_farm_db?sslmode=require
REDIS_URL=rediss://default:<password>@xxx.upstash.io:6379
JWT_SECRET=<secret>
# ...see api/.env.example for the full list
```

**`web/.env`:**
```env
VITE_API_URL=https://your-domain.com/api
```

**`ai-processor/.env`:**
```env
DATABASE_URL=postgresql://neondb_owner:<password>@ep-xxx-pooler.aws.neon.tech/ayar_farm_db?sslmode=require
REDIS_URL=rediss://default:<password>@xxx.upstash.io:6379
QDRANT_URL=https://xxx.aws.cloud.qdrant.tech:6334
QDRANT_API_KEY=<qdrant-api-key>
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

> 🔐 Never commit real credentials. If a secret was ever committed (e.g., a previous compose file contained a Neon password), rotate it immediately in the provider console.

---

## Quick Start

```bash
# 1. Clone repo and create .env files (section above)
git clone <repo-url> && cd ayar-farm

# 2. Build and start all containers
docker compose up -d --build

# 3. Pull AI models into Ollama (one-time, ~6 GB)
docker compose exec ollama ollama pull qwen2.5:7b
docker compose exec ollama ollama pull bge-m3

# 4. Verify models loaded
docker compose exec ollama ollama list

# 5. Check all services healthy
docker compose ps

# 6. View logs
docker compose logs -f api
docker compose logs -f ai-processor

# 7. Test endpoints
curl http://localhost:3000/        # API
curl http://localhost:5173/        # Web
curl http://localhost:8080/        # Mobile
# AI Processor is internal-only (no host port)
```

---

## Database: Register Ollama as Custom Provider

After first run, insert the Ollama/CUSTOM provider into the Neon database:

```sql
INSERT INTO "ApiKey" (
  "id", "provider", "llmModelName", "embeddingModelName",
  "vectorSize", "baseUrl", "limit", "used", "active",
  "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'CUSTOM',
  'qwen2.5:7b',
  'bge-m3',
  1024,
  'http://ollama:11434/v1',
  0,
  0,
  true,
  NOW(),
  NOW()
);
```

| Field | Value | Notes |
|---|---|---|
| `provider` | `CUSTOM` | Maps to `AIProvider.CUSTOM` enum → `OllamaProvider` class |
| `llmModelName` | `qwen2.5:7b` | Ollama model name |
| `embeddingModelName` | `bge-m3` | BAAI/bge-m3 via Ollama `/v1/embeddings` |
| `vectorSize` | `1024` | bge-m3 output dimension |
| `baseUrl` | `http://ollama:11434/v1` | Ollama OpenAI-compatible endpoint |
| `limit` | `0` | Unlimited requests |
| `active` | `true` | Default provider |

Provider switching propagates instantly via the Redis stream (`api_key_updates`) — no container restart needed.

> ⚠️ If collections in Qdrant Cloud were created earlier with a different `vectorSize` (e.g., 768 from Gemini), delete and recreate them — vector dimensions cannot change after collection creation.

---

## Maintenance Commands

```bash
# Restart a single service after code update
git pull && docker compose up -d --build api

# Recreate after compose file changes
docker compose up -d --force-recreate

# Free disk space (50 GB boot disk — run occasionally)
docker image prune -a --filter "until=168h"

# Check disk usage
df -h /
docker system df

# Backup reminder: no auto backup on this plan.
# Data lives in Neon / Upstash / Qdrant Cloud (their own backups)
# plus ollama_data volume (re-downloadable models — safe to lose).
```

---

## Resource Summary (8 vCPU / 16 GB RAM)

| Service | CPU Limit | RAM Limit | Storage |
|---|---|---|---|
| api | 1 core | 1G | — |
| web | 0.25 core | 256M | — |
| mobile | 0.25 core | 128M | — |
| ai-processor | 2 cores | 2G | — |
| ollama | 6 cores | 10G | ~6 GB models (volume) |
| OS overhead | ~2 cores | ~2G | system |
| **Containers total** | **9.5 cores (limits)** | **~13.4G (limits)** | **~6 GB** |
