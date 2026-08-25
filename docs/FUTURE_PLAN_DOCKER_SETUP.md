# Future Plan — Docker Setup Evolution

> **Purpose:** Document the current Docker architecture and the planned migration to fully self-hosted data services when the server budget allows an upgrade.
>
> **Status:** Current setup is live. Self-hosted plan is a future migration — do NOT apply yet.

---

## Table of Contents

- [Current Setup (Active)](#current-setup-active)
- [Why Cloud Services Now](#why-cloud-services-now)
- [Future Plan Overview](#future-plan-overview)
- [When to Migrate](#when-to-migrate)
- [Recommended Server Upgrade](#recommended-server-upgrade)
- [Future Production Compose](#future-production-compose)
- [Future Development Compose](#future-development-compose)
- [Environment Variable Changes](#environment-variable-changes)
- [Data Migration Checklist](#data-migration-checklist)
- [Resource Comparison](#resource-comparison)

---

## Current Setup (Active)

**Server:** Z.com.mm Cloud VPS Standard C4 — 8 vCPU · 16 GB RAM · Ubuntu · 50 GB boot disk (500 IOPS)

The current C4 plan has only **16 GB RAM**, which is mostly consumed by Ollama (`qwen2.5:7b` LLM + `bge-m3` embeddings ≈ 6 GB resident). There is no headroom for PostgreSQL, Redis, and Qdrant containers, so all data services are **cloud-managed**:

| Service | Provider | Reason |
|---|---|---|
| PostgreSQL | **Neon DB** | Serverless, generous free tier, branching, managed backups |
| Redis | **Upstash** | Pay-per-request, TLS included, zero maintenance |
| Qdrant | **Qdrant Cloud** | Managed vector DB, free tier sufficient at current scale |

**Self-hosted today:** `api`, `web`, `mobile`, `ai-processor`, `ollama`

```
docker-compose.yml      → production (cloud data services)
docker-compose.dev.yml  → development (same cloud data services, hot-reload)
```

---

## Why Cloud Services Now

1. **RAM budget** — Ollama alone needs ~10 GB. Adding Postgres (~2 GB tuned) + Redis (~0.5 GB) + Qdrant (~1–2 GB growing) exceeds 16 GB quickly.
2. **Zero ops burden** — Neon handles backups/PITR, Upstash handles failover, Qdrant Cloud handles upgrades. On a 500-IOPS disk with no auto-backup, self-hosting means building our own backup routines.
3. **Cost at current scale** — free tiers cover current traffic. Monthly cost ≈ $0 vs. a bigger VPS (~$40–80/mo).

---

## Future Plan Overview

When revenue allows a larger VPS plan, migrate all three data services **inside the server** as internal containers:

```
BEFORE (current)                        AFTER (future)
─────────────────                       ─────────────────
VPS: api/web/mobile/ai/ollama           VPS: api/web/mobile/ai/ollama
     │                                       │
     └──► Internet ──► Neon                  ├── database (PostgreSQL)   ← internal
                   ──► Upstash               ├── redis (Redis)           ← internal
                   ──► Qdrant Cloud          └── qdrant (Qdrant)         ← internal

Latency: ~20–50 ms per query            Latency: <1 ms per query
Backups: provider-managed               Backups: self-managed (cron + volume snapshots)
Cost:    ~$0/mo (free tiers)            Cost:    one bigger VPS bill only
```

### Benefits

- **Lower latency** — RAG queries hit local Qdrant/Postgres (<1 ms vs 20–50 ms round trip)
- **No rate limits / usage caps** — Upstash free tier limits daily commands; Neon scales storage billing
- **Full data ownership** — vectors and content stay on our server
- **Predictable cost** — flat VPS bill instead of usage-based cloud bills at scale
- **Custom tuning** — Postgres/Qdrant tuned exactly for our workload

### Trade-offs (must accept)

- **We own backups** — must schedule `pg_dump` + Qdrant snapshots to off-site storage (e.g., S3/Cloudinary/backblaze). No auto-backup on Z.com.mm plans.
- **We own updates** — watch for Postgres/Redis/Qdrant major versions manually.
- **Single point of failure** — everything on one VPS; document a restore-from-backup runbook.

---

## When to Migrate

Trigger conditions (any two):

- [ ] Monthly cloud service bills exceed the price difference of the next VPS plan
- [ ] Qdrant Cloud free-tier storage (>1 GB vectors) is exceeded
- [ ] Upstash daily command limits are hit regularly
- [ ] RAG latency becomes user-visible (>300 ms search step due to network round trips)
- [ ] Data-residency requirements demand on-server storage

---

## Recommended Server Upgrade

| Item | Current (C4) | Minimum for Migration | Recommended |
|---|---|---|---|
| vCPU | 8 | 12 | **16** |
| RAM | 16 GB | 24 GB | **32 GB** |
| Disk | 50 GB / 500 IOPS | 100 GB SSD | **200 GB NVMe/SSD (≥1000 IOPS)** |

RAM math (32 GB plan):

```
ollama         12G   (qwen2.5:7b + bge-m3 resident)
postgres        4G   (shared_buffers 1G + connections/work_mem headroom)
qdrant          3G   (grows with vector count — monitor)
redis           1G   (streams + cache)
ai-processor    2G
api             1G
web+mobile    384M
OS overhead   ~2.5G
─────────────────────
Total        ~26G of 32G ✓ leaves safe headroom
```

---

## Future Production Compose

Target file: `docker-compose.yml` (after migration). Key additions vs current: `database`, `redis`, `qdrant` services; new volumes; env vars point at internal hostnames.

```yaml
name: ayar-farm

# ─────────────────────────────────────────────────────────────────────────────
# PRODUCTION (FUTURE) — Fully self-hosted
#   Target server: 16 vCPU · 32 GB RAM · Ubuntu · 200 GB SSD
#
# ALL data services run as internal containers:
#   PostgreSQL → database container → postgres_data volume
#   Redis      → redis container    → redis_data volume
#   Qdrant     → qdrant container   → qdrant_data volume
#
# Self-hosted containers: api, web, mobile, ai-processor, ollama,
#                         database, redis, qdrant
#
# Ollama models (pull once after first start):
#   docker compose exec ollama ollama pull qwen2.5:7b
#   docker compose exec ollama ollama pull bge-m3
#
# BACKUPS (self-managed — schedule via cron on host):
#   docker compose exec database pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql
#   curl -X POST "http://localhost:6333/snapshots" ... (Qdrant full snapshot)
#   Upload both to off-site storage (S3 / Backblaze B2).
# ─────────────────────────────────────────────────────────────────────────────

services:
  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    env_file:
      - ./api/.env
    environment:
      NODE_ENV: production
      PORT: 3000
      PYTHON_RAG_SERVICE_URL: http://ai-processor:8001
    ports:
      - "3000:3000"
    depends_on:
      database:
        condition: service_healthy
      redis:
        condition: service_healthy
      qdrant:
        condition: service_started
      ai-processor:
        condition: service_healthy
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 512M
    healthcheck:
      test: ["CMD-SHELL", "node -e \"require('net').connect(3000, '127.0.0.1').on('connect', () => process.exit(0)).on('error', () => process.exit(1))\""]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    init: true
    restart: unless-stopped
    networks:
      - frontend
      - backend

  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    env_file:
      - ./web/.env
    ports:
      - "5173:4173"
    depends_on:
      api:
        condition: service_healthy
    deploy:
      resources:
        limits:
          cpus: "0.25"
          memory: 256M
    healthcheck:
      test: ["CMD-SHELL", "node -e \"require('net').connect(4173, '127.0.0.1').on('connect', () => process.exit(0)).on('error', () => process.exit(1))\""]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    init: true
    restart: unless-stopped
    networks:
      - frontend

  mobile:
    build:
      context: .
      dockerfile: docker/Dockerfile.mobile
      target: prod
    ports:
      - "8080:80"
    deploy:
      resources:
        limits:
          cpus: "0.25"
          memory: 128M
    healthcheck:
      test: ["CMD-SHELL", "wget -q --spider http://127.0.0.1/ || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    restart: unless-stopped
    networks:
      - frontend

  ai-processor:
    build:
      context: .
      dockerfile: docker/Dockerfile.ai-processor
    env_file:
      - ./ai-processor/.env
    environment:
      PORT: 8001
    expose:
      - "8001"
    depends_on:
      database:
        condition: service_healthy
      redis:
        condition: service_healthy
      qdrant:
        condition: service_started
      ollama:
        condition: service_started
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 2G
        reservations:
          cpus: "1"
          memory: 1G
    healthcheck:
      test: ["CMD-SHELL", "python -c \"from urllib.request import urlopen; urlopen('http://127.0.0.1:8001/health', timeout=3)\""]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    init: true
    restart: unless-stopped
    networks:
      - backend

  # ── Self-hosted data services (NEW — replaces Neon/Upstash/Qdrant Cloud) ──

  database:
    build:
      context: .
      dockerfile: docker/Dockerfile.database
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-ayarfarm}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env}
      POSTGRES_DB: ayar_farm_db
      POSTGRES_SHARED_BUFFERS: 1GB
      POSTGRES_EFFECTIVE_CACHE_SIZE: 4GB
      POSTGRES_WORK_MEM: 64MB
      POSTGRES_MAINTENANCE_WORK_MEM: 512MB
      POSTGRES_MAX_CONNECTIONS: 100
    # NO host port — internal network only (security)
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 4G
        reservations:
          cpus: "1"
          memory: 2G
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    restart: unless-stopped
    networks:
      - backend

  redis:
    image: redis:7.4-alpine
    command: ["redis-server", "--appendonly", "yes", "--maxmemory", "512mb", "--maxmemory-policy", "allkeys-lru"]
    volumes:
      - redis_data:/data
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 768M
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    restart: unless-stopped
    networks:
      - backend

  qdrant:
    image: qdrant/qdrant:v1.16.2
    volumes:
      - qdrant_data:/qdrant/storage
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 3G
        reservations:
          cpus: "1"
          memory: 1G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    restart: unless-stopped
    networks:
      - backend

  ollama:
    image: ollama/ollama:latest
    container_name: ayar_farm_ollama
    environment:
      OMP_NUM_THREADS: "8"
      OLLAMA_NUM_PARALLEL: "1"
      OLLAMA_MAX_LOADED_MODELS: "2"
      OLLAMA_KEEP_ALIVE: "30m"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        limits:
          cpus: "8"
          memory: 12G
        reservations:
          cpus: "6"
          memory: 8G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    restart: unless-stopped
    networks:
      - backend

volumes:
  postgres_data:
  redis_data:
  qdrant_data:
  ollama_data:

networks:
  frontend:
  # Internal again once all data services are local — only api still needs
  # outbound internet (Cloudinary PDF downloads pass through ai-processor).
  # If ai-processor no longer needs external access either, set internal: true.
  backend:
```

> ⚠️ **Security note:** in the future production file, `database`, `redis`, and `qdrant` have **no published host ports** — they are reachable only through the internal backend network. Never expose them publicly. Use `docker compose exec database psql ...` for admin access, or an SSH tunnel if remote access is required.

---

## Future Development Compose

Target file: `docker-compose.dev.yml` (after migration). Same structure as production plus hot-reload mounts and exposed debug ports.

```yaml
name: ayar-farm-dev

# ─────────────────────────────────────────────────────────────────────────────
# DEVELOPMENT (FUTURE) — Local machine, fully self-hosted
#
# All data services run as LOCAL containers:
#   PostgreSQL → database container  → postgres_data_dev volume
#   Redis      → redis container     → redis_data_dev volume
#   Qdrant     → qdrant container    → qdrant_data_dev volume
#
# Self-hosted containers: api, web, mobile, ai-processor, ollama,
#                         database, redis, qdrant
#
# All ports exposed to host for debugging.
#
# .env files point at LOCAL services:
#   DATABASE_URL=postgresql://ayarfarm:<DEV_DB_PASSWORD>@localhost:5432/ayar_farm_db
#   REDIS_URL=redis://localhost:6379
#   QDRANT_URL=http://localhost:6333
#
# Ollama models (pull once after first start):
#   docker compose -f docker-compose.dev.yml exec ollama ollama pull qwen2.5:7b
#   docker compose -f docker-compose.dev.yml exec ollama ollama pull bge-m3
#
# NOTE: keeping BOTH models resident needs ~6 GB RAM inside Docker.
#       Ensure Docker Desktop is allocated >= 10 GB, or set
#       OLLAMA_MAX_LOADED_MODELS to "1" on smaller machines.
# ─────────────────────────────────────────────────────────────────────────────

services:
  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    env_file:
      - ./api/.env
    environment:
      NODE_ENV: development
      PORT: 3000
      PYTHON_RAG_SERVICE_URL: http://ai-processor:8001
    ports:
      - "3000:3000"
    volumes:
      - ./api:/app
      - /app/node_modules
      - /app/dist
    command: npm run dev
    depends_on:
      database:
        condition: service_healthy
      redis:
        condition: service_healthy
      qdrant:
        condition: service_started
      ai-processor:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "node -e \"require('net').connect(3000, '127.0.0.1').on('connect', () => process.exit(0)).on('error', () => process.exit(1))\""]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    init: true
    restart: unless-stopped
    networks:
      - frontend
      - backend

  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    env_file:
      - ./web/.env
    ports:
      - "5173:5173"
    volumes:
      - ./web:/app
      - /app/node_modules
      - /app/dist
    command: npm run dev -- --host
    depends_on:
      api:
        condition: service_healthy
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    init: true
    restart: unless-stopped
    networks:
      - frontend

  mobile:
    build:
      context: .
      dockerfile: docker/Dockerfile.mobile
      target: dev
    ports:
      - "8080:8080"
    volumes:
      - ./mobile:/app
      - /app/.dart_tool
      - /app/build
    stdin_open: true
    tty: true
    command: >
      sh -c "flutter pub get &&
             flutter run -d web-server --web-port 8080 --web-hostname 0.0.0.0"
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    restart: unless-stopped
    networks:
      - frontend

  ai-processor:
    build:
      context: .
      dockerfile: docker/Dockerfile.ai-processor
    env_file:
      - ./ai-processor/.env
    environment:
      PORT: 8001
    ports:
      - "8001:8001"
    volumes:
      - ./ai-processor:/app
      - /app/__pycache__
    command: python -u dev.py
    depends_on:
      database:
        condition: service_healthy
      redis:
        condition: service_healthy
      qdrant:
        condition: service_started
      ollama:
        condition: service_started
    healthcheck:
      test: ["CMD-SHELL", "python -c \"from urllib.request import urlopen; urlopen('http://127.0.0.1:8001/health', timeout=3)\""]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    init: true
    restart: unless-stopped
    networks:
      - backend

  # ── Local data services (dev exposes ports for debugging) ─────────────────

  database:
    build:
      context: .
      dockerfile: docker/Dockerfile.database
    environment:
      POSTGRES_USER: ayarfarm
      POSTGRES_PASSWORD: ${DEV_DB_PASSWORD:?Set DEV_DB_PASSWORD}
      POSTGRES_DB: ayar_farm_db
      POSTGRES_SHARED_BUFFERS: 1GB
      POSTGRES_EFFECTIVE_CACHE_SIZE: 3GB
      POSTGRES_WORK_MEM: 32MB
      POSTGRES_MAINTENANCE_WORK_MEM: 256MB
      POSTGRES_MAX_CONNECTIONS: 50
    ports:
      - "5432:5432"
    volumes:
      - postgres_data_dev:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    restart: unless-stopped
    networks:
      - backend

  redis:
    image: redis:7.4-alpine
    command: ["redis-server", "--appendonly", "yes", "--maxmemory", "256mb", "--maxmemory-policy", "allkeys-lru"]
    ports:
      - "6379:6379"
    volumes:
      - redis_data_dev:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    restart: unless-stopped
    networks:
      - backend

  qdrant:
    image: qdrant/qdrant:v1.16.2
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data_dev:/qdrant/storage
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    restart: unless-stopped
    networks:
      - backend

  ollama:
    image: ollama/ollama:latest
    container_name: ayar_farm_ollama_dev
    ports:
      - "11434:11434"
    environment:
      OMP_NUM_THREADS: "6"
      OLLAMA_NUM_PARALLEL: "1"
      OLLAMA_MAX_LOADED_MODELS: "2"
      OLLAMA_KEEP_ALIVE: "30m"
    volumes:
      - ollama_data_dev:/root/.ollama
    deploy:
      resources:
        limits:
          cpus: "6"
          memory: 7G
        reservations:
          cpus: "4"
          memory: 4G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    restart: unless-stopped
    networks:
      - backend

volumes:
  postgres_data_dev:
  redis_data_dev:
  qdrant_data_dev:
  ollama_data_dev:

networks:
  frontend:
  backend:
```

---

## Environment Variable Changes

Only connection URLs change — application code requires **zero changes** thanks to the provider abstraction.

| Variable | Current (Cloud) | Future (Self-hosted Prod) | Future (Dev) |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://...@ep-xxx-pooler.aws.neon.tech/...?sslmode=require` | `postgresql://ayarfarm:<pw>@database:5432/ayar_farm_db` | `postgresql://ayarfarm:<pw>@localhost:5432/ayar_farm_db` |
| `REDIS_URL` | `rediss://default:<pw>@xxx.upstash.io:6379` | `redis://redis:6379` (internal, no TLS needed) | `redis://localhost:6379` |
| `QDRANT_URL` | `https://xxx.aws.cloud.qdrant.tech:6334` | `http://qdrant:6333` | `http://localhost:6333` |
| `QDRANT_API_KEY` | required | remove (not needed internally) | remove |

Unchanged: `baseUrl` in the `ApiKey` table stays `http://ollama:11434/v1` — Ollama is unaffected by this migration.

---

## Data Migration Checklist

Execute in order during a maintenance window:

**1. Pre-migration**
- [ ] Upgrade VPS plan (≥ 24 GB RAM, ideally 32 GB)
- [ ] Verify new disk capacity (Postgres data + Qdrant vectors + 6 GB models + images)

**2. Bring up new stack**
- [ ] Replace compose files with future versions above
- [ ] Set `POSTGRES_PASSWORD` / `DEV_DB_PASSWORD` in `.env`
- [ ] `docker compose up -d database redis qdrant` first — wait for healthy
- [ ] Run `npm run prisma:migrate` against the new local Postgres (schema only)

**3. Migrate PostgreSQL (Neon → local)**
- [ ] `pg_dump --format=custom` from Neon (or Neon branch export)
- [ ] Restore: `docker compose exec -T database pg_restore -U ayarfarm -d ayar_farm_db dump.dump`
- [ ] Verify row counts on `ApiKey`, `Post`, `Documents`, `KnowledgeBase`

**4. Migrate Qdrant (Cloud → local)**
- [ ] Create snapshot on Qdrant Cloud (dashboard or `POST /snapshots`)
- [ ] Download snapshot, upload to VPS
- [ ] Restore via `PUT /collections/{name}/snapshots/upload` for each collection
- [ ] Verify collection counts match (`posts`, `documents`, `knowledge_base`) and `vectorSize = 1024`

**5. Redis**
- [ ] No migration needed — streams/caches are ephemeral. They rebuild automatically.

**6. Switch over**
- [ ] Update `.env` files per table above
- [ ] `docker compose up -d --force-recreate api ai-processor`
- [ ] Smoke test: login, post creation (vectorization completes), AI chat streaming

**7. Rollback plan**
- [ ] Keep Neon/Upstash/Qdrant Cloud projects alive (paused/free tier) for 2 weeks
- [ ] Rollback = revert `.env` URLs + recreate app containers — data written locally during the window would be lost, so decide fast

**8. Cleanup (after 2 weeks stable)**
- [ ] Schedule cron backups: nightly `pg_dump` + weekly Qdrant snapshot → off-site upload
- [ ] Decommission cloud projects

---

## Resource Comparison

| Service | Current Limits (C4, cloud-hosted data) | Future Limits (32 GB, self-hosted) |
|---|---|---|
| ollama | 6 CPU / 10G | 8 CPU / 12G |
| ai-processor | 2 CPU / 2G | 2 CPU / 2G |
| api | 1 CPU / 1G | 1 CPU / 1G |
| web | 0.25 CPU / 256M | 0.25 CPU / 256M |
| mobile | 0.25 CPU / 128M | 0.25 CPU / 128M |
| database | *(Neon)* | 2 CPU / 4G |
| redis | *(Upstash)* | 0.5 CPU / 768M |
| qdrant | *(Qdrant Cloud)* | 2 CPU / 3G |
| **Container totals** | ~9.5 CPU / ~13.4G | **~15.9 CPU / ~23.2G** |
| OS overhead | ~2G | ~2.5G |
| Host total | 8 CPU / 16 GB | 16 CPU / 32 GB |

---

*Part of the Ayar Farm project. Review this plan when any migration trigger condition is met.*
