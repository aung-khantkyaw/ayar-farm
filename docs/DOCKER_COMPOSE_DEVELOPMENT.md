# Docker Compose - Development

> **Target Machine:** i7 12th Gen (10 cores) / 16 GB RAM (~8 GB usable by Docker)
> **File:** `docker-compose.dev.yml`
> **Project Name:** `ayar-farm-dev`
>
> Development uses the **same cloud-managed data services as production** (Neon DB, Upstash, Qdrant Cloud). Only the app containers run locally.
>
> ⚡ **Dev AI note:** Ollama runs in **swap mode** (`MAX_LOADED_MODELS=1`) on dev because Docker Desktop only gets ~8 GB. Models load/unload per RAG request (~7–20s slower), but there is zero OOM risk. Production keeps both models resident — see [Key Differences](#key-differences-from-production).

---

## Architecture Overview

```
                          INTERNET
                             │
     ┌───────────────────────┼───────────────────────────┐
     │                       │                           │
     ▼                       ▼                           ▼
┌─────────────┐    ┌─────────────────┐         ┌──────────────────┐
│ Neon DB     │    │ Upstash Redis   │         │ Qdrant Cloud     │
│ (PostgreSQL)│    │ (TLS)           │         │                  │
└──────▲──────┘    └────────▲────────┘         └─────────▲────────┘
       │                    │                            │
       └────────────────────┼────────────────────────────┘
                            │ HTTPS/TLS (outbound from host)
┌───────────────────────────┼───────────────────────────────────┐
│  LOCAL DOCKER (hot-reload)│                                   │
│                           │                                   │
│  frontend network         │      backend network              │
│  ┌──────────────────┐     │      ┌─────────────────────┐      │
│  │ web   :5173 HMR  │     │      │ ai-processor :8001  │      │
│  │ mobile :8080     │  api ◄┼────► │  ├─ RAG service     │      │
│  └──────────────────┘  │   │      │  └─ vector worker   │      │
│                  :3000 │   │      └─────────┬───────────┘      │
│                        │   │                │                  │
│                 api (nodemon)       ┌──────────▼──────────┐     │
│                        │            │ ollama :11434       │     │
│                        │            │  ├─ qwen2.5:7b LLM  │     │
│                        │            │  └─ bge-m3 embed    │     │
│                        │            └─────────────────────┘     │
└────────────────────────┴────────────────────────────────────────┘
```

- **All ports exposed to host** for debugging (incl. ai-processor `:8001`, ollama `:11434`)
- **Source code mounted** as volumes for hot reload
- **backend network is NOT internal** — containers need outbound access to Neon, Upstash, and Qdrant Cloud (plus Cloudinary PDF downloads)

---

## Managed Cloud Services

Same providers as production:

| Service | Provider | Configured Via | Used By |
|---|---|---|---|
| PostgreSQL | **Neon DB** | `DATABASE_URL` | api, ai-processor |
| Redis | **Upstash** | `REDIS_URL` (`rediss://`) | api, ai-processor |
| Vector DB | **Qdrant Cloud** | `QDRANT_URL`, `QDRANT_API_KEY` | ai-processor |

> 💡 **Recommended:** Use a separate Neon **branch** (e.g., `development`) for local work so you don't test against production data. Neon's branching gives each environment an isolated copy of the schema/data.

> ⚠️ If dev and prod point at the same database, dev testing mutates real data (seeds, migrations, vectorization tasks).

---

## Key Differences from Production

| Feature | Production (`docker-compose.yml`) | Development (`docker-compose.dev.yml`) |
|---|---|---|
| NODE_ENV | `production` | `development` |
| API command | default (built) | `npm run dev` (nodemon) |
| Web command | default (Nginx) | `npm run dev -- --host` (Vite HMR) |
| Mobile target | `prod` (nginx :80) | `dev` (flutter run :8080) |
| AI Processor | `python main.py`, internal port | `python -u dev.py`, port exposed |
| Host ports | Only frontend (3000/5173/8080) | All services exposed (+8001, +11434) |
| Source volumes | None | `./service:/app` mounted |
| Ollama memory limit | 10G / 6 CPUs | 7G / 6 CPUs |
| Ollama resident models | `MAX_LOADED_MODELS=2` — both stay in RAM, no swap | `MAX_LOADED_MODELS=1` — models swap per request (~7–20s slower, zero OOM risk) |
| First AI request speed | Fast (~1s model overhead) | Slow (~15–25s incl. model load), faster after |
| Ollama container name | `ayar_farm_ollama` | `ayar_farm_ollama_dev` (side-by-side safe) |

Data services and provider configuration are identical between environments.

---

## Environment Files Setup

Point `.env` files at your cloud services before starting:

**`api/.env`:**
```env
NODE_ENV=development
DATABASE_URL=postgresql://neondb_owner:<password>@ep-xxx-pooler.aws.neon.tech/ayar_farm_db?sslmode=require
REDIS_URL=rediss://default:<password>@xxx.upstash.io:6379
JWT_SECRET=...
# ...see api/.env.example for the full list
```

**`ai-processor/.env`:**
```env
DATABASE_URL=postgresql://neondb_owner:<password>@ep-xxx-pooler.aws.neon.tech/ayar_farm_db?sslmode=require
REDIS_URL=rediss://default:<password>@xxx.upstash.io:6379
QDRANT_URL=https://xxx.aws.cloud.qdrant.tech:6334
QDRANT_API_KEY=<qdrant-api-key>
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080
```

**`web/.env`:**
```env
VITE_API_URL=http://localhost:3000/api
```

---

## Services

### 1. `api` — Node.js Backend (Dev)

| Property | Value |
|---|---|
| Port | `3000:3000` |
| Command | `npm run dev` |
| CPU / Memory Limit | 1 core / 1G |
| Networks | frontend + backend |

**Volumes (Hot Reload):**
| Mount | Purpose |
|---|---|
| `./api:/app` | Live source code |
| `/app/node_modules` | Prevent host node_modules from overriding |
| `/app/dist` | Prevent host dist from overriding |

Hot reload via nodemon.

---

### 2. `web` — React Frontend (Dev)

| Property | Value |
|---|---|
| Port | `5173:5173` |
| Command | `npm run dev -- --host` |
| CPU / Memory Limit | 0.5 core / 512M |
| Network | frontend |

Vite HMR on port 5173, accessible from host browser.

---

### 3. `mobile` — Flutter Web (Dev)

| Property | Value |
|---|---|
| Port | `8080:8080` |
| Target | `dev` |
| CPU / Memory Limit | 1 core / 1G |
| Network | frontend |

**Command:**
```sh
flutter pub get && flutter run -d web-server --web-port 8080 --web-hostname 0.0.0.0
```

Flutter hot reload enabled. Access at `http://localhost:8080`.

---

### 4. `ai-processor` — Python RAG Service (Dev)

| Property | Value |
|---|---|
| Port | `8001:8001` (exposed to host) |
| Command | `python -u dev.py` |
| CPU / Memory Limit | 2 cores / 2G |
| Network | backend |

**Volumes (Hot Reload):**
| Mount | Purpose |
|---|---|
| `./ai-processor:/app` | Live source code |
| `/app/__pycache__` | Prevent override |

Embeddings are served by the Ollama container (`bge-m3`) — no local embedding model download needed.

**Dev Server:** Uvicorn with `--reload` flag via `dev.py` for auto-restart on code changes.

---

### 5. `ollama` — Local LLM + Embeddings (Dev)

| Property | Value |
|---|---|
| Port | `11434:11434` (exposed to host) |
| Container Name | `ayar_farm_ollama_dev` |
| CPU Limit | 6 cores (reserved 4) |
| Memory Limit | 7G (reserved 4G) |
| Network | backend |

**Models Served:**
| Model | Role | Size |
|---|---|---|
| `qwen2.5:7b` | LLM (RAG generation) | ~4.7 GB |
| `bge-m3` | Embeddings (dense, 1024 dim) | ~1.2 GB |

**Environment Variables:**
| Variable | Value | Description |
|---|---|---|
| `OMP_NUM_THREADS` | `6` | Matches CPU limit |
| `OLLAMA_NUM_PARALLEL` | `1` | One request at a time |
| `OLLAMA_MAX_LOADED_MODELS` | `2` | Keep BOTH models resident (matches production behavior). Set to `"1"` if Docker RAM < 10 GB |
| `OLLAMA_KEEP_ALIVE` | `30m` | Unload after 30 min idle |

**Volumes:** `ollama_data_dev:/root/.ollama`

**First Run — Pull Models (~6 GB one-time):**
```bash
docker compose -f docker-compose.dev.yml exec ollama ollama pull qwen2.5:7b
docker compose -f docker-compose.dev.yml exec ollama ollama pull bge-m3
```

**Test from Host:**
```bash
curl http://localhost:11434/api/tags
curl http://localhost:8001/health
```

---

## Volumes

Only **one** volume remains:

| Volume | Purpose |
|---|---|
| `ollama_data_dev` | Ollama model files (qwen2.5:7b + bge-m3, ~6 GB) |

All application data lives in the cloud services (Neon / Upstash / Qdrant Cloud).

---

## Networks

| Network | Internal | Purpose |
|---|---|---|
| `frontend` | No | User-facing services (api, web, mobile) |
| `backend` | No | Service-to-service traffic + outbound access to cloud services |

> The backend network is intentionally **not** internal in both dev and prod — containers must reach Neon DB, Upstash Redis, and Qdrant Cloud over the public internet, and ai-processor downloads PDFs from Cloudinary.

---

## Logging

All services use JSON file logging:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

Max 30MB per container. Check logs:
```bash
docker compose -f docker-compose.dev.yml logs -f [service-name]
```

---

## Quick Start

```bash
# 1. Create .env files pointing at cloud services (section above)

# 2. Start all containers
docker compose -f docker-compose.dev.yml up --build

# 3. Pull AI models into Ollama (one-time, ~6 GB)
docker compose -f docker-compose.dev.yml exec ollama ollama pull qwen2.5:7b
docker compose -f docker-compose.dev.yml exec ollama ollama pull bge-m3

# 4. Verify services
docker compose -f docker-compose.dev.yml ps

# 5. Access services
# API:          http://localhost:3000
# Web:          http://localhost:5173
# Mobile:       http://localhost:8080
# AI Processor: http://localhost:8001/health
# Ollama:       http://localhost:11434
```

---

## Resource Summary (i7 12th Gen / Docker RAM ≥ 10 GB recommended)

| Service | CPU Limit | RAM Limit | Storage |
|---|---|---|---|
| api | 1 core | 1G | — |
| web | 0.5 core | 512M | — |
| mobile | 1 core | 1G | — |
| ai-processor | 2 cores | 2G | — |
| ollama | 6 cores | 7G | ~6 GB models (volume) |
| **Total** | **10.5 cores (limits)** | **~11.5G (limits)** | **~6 GB** |

---

## Troubleshooting

### Ollama out of memory
Loading both models needs ~6 GB inside Docker. Either increase Docker Desktop's memory allocation to ≥ 10 GB, or set `OLLAMA_MAX_LOADED_MODELS: "1"` in `docker-compose.dev.yml` (models will swap in/out — slower RAG responses).

### Cannot connect to Neon / Upstash / Qdrant
Check outbound internet access and that `.env` URLs are correct. Test connectivity from inside a container:
```bash
docker compose -f docker-compose.dev.yml exec api node -e "require('dns').lookup('aws.neon.tech', console.log)"
```

### Hot reload not working
Ensure source volumes are mounted correctly. Check that `/app/node_modules` and `/app/__pycache__` are excluded (anonymous volumes).

### Port conflicts
If any port is already in use on your host, change the host port in `docker-compose.dev.yml`:
```yaml
ports:
  - "3001:3000"  # Use 3001 on host instead of 3000
```

### Accidentally testing against production data
If migrations/seeds ran against the wrong environment, check which Neon branch your `DATABASE_URL` points to. Always keep a separate branch for development.
