# AI Processor

The AI backbone service for the Ayar Farm platform — handles content vectorization, RAG-based chat, and multi-provider AI integration.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Code Structure](#code-structure)
- [Project Flow](#project-flow)
- [Model-Aware Vector Storage](#model-aware-vector-storage)
- [SOLID Design Patterns](#solid-design-patterns)
- [Adding New Providers](#adding-new-providers)
- [Configuration](#configuration)
- [Setup & Running](#setup--running)

---

## Overview

AI Processor is a two-in-one service:

1. **Embedding Worker** — Consumes vectorization tasks from Redis streams and stores them in Qdrant vector DB
2. **RAG Chat Service** — Receives user questions via FastAPI, searches Qdrant, and returns LLM streaming responses

It is built with OOP Design Patterns to be easily extensible for multiple AI providers (Google Gemini, OpenAI, Ollama, OpenRouter).

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      main.py                            │
│          (Starts Worker Thread + FastAPI Server)         │
└───────────┬─────────────────────────────┬───────────────┘
            │                             │
            ▼                             ▼
┌───────────────────────┐   ┌─────────────────────────────┐
│   Embedding Worker    │   │      RAG Chat Service       │
│   (Background Thread) │   │      (FastAPI + Uvicorn)    │
└───────────┬───────────┘   └──────────┬──────────────────┘
            │                          │
            ▼                          ▼
┌───────────────────────┐   ┌─────────────────────────────┐
│  TaskConsumer         │   │  RAGService                 │
│  (Redis Stream)       │   │  (Qdrant Search + LLM)      │
└───────────┬───────────┘   └──────────┬──────────────────┘
            │                          │
            ▼                          ▼
┌───────────────────────┐   ┌─────────────────────────────┐
│  Vectorizer           │   │  AIClient (Facade)          │
│  (Chunk + Embed)      │   │  └─ ProviderFactory         │
└───────────┬───────────┘   │     ├─ GoogleProvider       │
            │               │     ├─ OpenAIProvider       │
            ▼               │     └─ OllamaProvider       │
┌───────────────────────┐   └─────────────────────────────┐
│  AI Providers         │
│  (Strategy Pattern)   │
│  ├─ GoogleProvider    │
│  ├─ OpenAIProvider    │
│  └─ OllamaProvider    │
└───────────────────────┘
```

---

## Code Structure

```
ai-processor/
│
├── main.py                          # Entry point — starts worker + FastAPI
├── dev.py                           # Dev mode with hot-reload (uvicorn --reload)
├── rag_service.py                   # FastAPI app + RAGService class
├── requirements.txt                 # Python dependencies
│
├── config/
│   ├── settings.py                  # Environment variables + validation
│   └── constants.py                 # Task types, statuses, content types
│
├── services/
│   ├── ai_client.py                 # Facade — thin wrapper over AIProvider
│   ├── api_key_manager.py           # Singleton — dynamic API key from DB
│   ├── pdf_processor.py             # PDF download + text/table/image extraction
│   ├── qdrant_client.py             # Qdrant vector DB operations
│   ├── vectorizer.py                # Content → chunks → vectors pipeline
│   │
│   └── ai_providers/                # SOLID provider abstraction layer
│       ├── __init__.py
│       ├── base.py                  # ABC — interface for all providers
│       ├── google_provider.py       # Google GenAI (Gemini)
│       ├── openai_provider.py       # OpenAI SDK (base_url configurable)
│       ├── ollama_provider.py       # Ollama (extends OpenAI)
│       └── provider_factory.py      # Factory — maps provider string → class
│
├── utils/
│   └── text_chunker.py              # Sentence-aware text chunking
│
├── worker/
│   └── consumer.py                  # Redis stream consumer
│
└── database/
    ├── connection.py                # PostgreSQL connection with retry
    └── repositories.py              # API key + embedding status queries
```

### File-by-File Explanation

#### `main.py`

Application entry point. It performs two main tasks:

1. Starts `TaskConsumer` in a **Background Thread** to consume vectorization tasks from Redis streams
2. Runs the `rag_service` FastAPI app with Uvicorn in the **Main Thread**

```
main() → Thread(worker) + Uvicorn(rag_service)
```

#### `dev.py`

Used for development mode. Uses `uvicorn --reload` to auto-restart on every code change.

#### `rag_service.py`

A FastAPI application with two responsibilities:

- **HTTP Endpoints**: Accepts chat requests and runs the RAG pipeline
- **RAGService class**: Performs Qdrant search + LLM streaming generation

Key endpoints:

- `POST /ai-chat/stream` — SSE streaming chat
- `POST /chat-rooms` — Create chat room
- `GET /chat-rooms` — List chat rooms
- `GET /ai-chat/history` — Get chat history

---

### `services/ai_providers/` — SOLID Provider Layer

This package manages AI providers using **Strategy Pattern** + **Factory Pattern**.

#### `base.py` — Abstract Base Class (Interface)

```python
class AIProvider(ABC):
    @abstractmethod
    def embed_text(self, text, task_type) -> List[float]: ...

    @abstractmethod
    def generate_stream(self, question, context, history, system_prompt) -> Generator[str]: ...
```

All providers must implement this interface. It defines only two methods: `embed_text()` and `generate_stream()`.

#### `google_provider.py`

Uses Google GenAI SDK for embedding and streaming with Gemini models.

#### `openai_provider.py`

Uses OpenAI SDK with a configurable `base_url`. Works with any OpenAI-compatible API (OpenRouter, OpenAI, etc.).

#### `ollama_provider.py`

Extends `OpenAIProvider` with Ollama-specific defaults. Both LLM and embeddings are served by the Ollama container:

- LLM: e.g. `qwen2.5:7b`
- Embedding: `bge-m3` (BAAI/bge-m3, dense, 1024 dimensions)
- `base_url` = `http://localhost:11434/v1` (default)

Pull models into Ollama after startup:

```bash
docker compose exec ollama ollama pull qwen2.5:7b
docker compose exec ollama ollama pull bge-m3
```

#### `provider_factory.py` — Factory Pattern

```python
class ProviderFactory:
    PROVIDERS = {
        "GOOGLE": GoogleProvider,
        "CUSTOM": OllamaProvider,
        "OPENAI": OpenAIProvider,
    }

    @classmethod
    def create(cls, api_key_data) -> AIProvider:
        provider_name = api_key_data.get("provider", "GOOGLE")
        return cls.PROVIDERS[provider_name](api_key_data)
```

Creates the correct provider class based on the `provider` field from the database.

#### `ai_client.py` — Facade Pattern

```python
class AIClient:
    def __init__(self, provider: AIProvider):
        self._provider = provider

    def embed_text(self, text, task_type):
        return self._provider.embed_text(text, task_type)

    def generate_stream(self, question, context, history, system_prompt):
        yield from self._provider.generate_stream(...)
```

All callers (Vectorizer, RAGService) use `get_ai_client()` and call `.embed_text()` / `.generate_stream()`. The Facade handles provider selection internally.

---

### `services/vectorizer.py`

Orchestrates the Content → Chunks → Vectors pipeline.

```
Post Text ──→ chunk_text() ──→ vectorize_chunks() ──→ Qdrant Points
PDF ──→ download_pdf() ──→ extract_content() ──→ chunk_structured_content() ──→ vectorize_chunks()
```

Key methods:
| Method | Description |
|---|---|
| `vectorize_text(text)` | Single text → embedding vector |
| `vectorize_chunks(chunks)` | Multiple chunks → vectorized chunks |
| `process_post(post_data)` | Post content → vectorized chunks |
| `process_document(doc_data)` | PDF document → vectorized chunks |
| `process_knowledge_base(kb_data)` | KB PDF → vectorized chunks |
| `prepare_qdrant_points(chunks, record_id)` | Format for Qdrant insertion |

DRY fix: `process_document()` and `process_knowledge_base()` both call the shared `_process_pdf_content()` method.

Dependency Injection: `ai_client_factory` can be passed via the constructor for testability.

---

### `services/api_key_manager.py`

Uses the Singleton pattern for dynamic API key management.

**Flow:**

1. On startup, loads the active API key from the database
2. Listens to Redis stream (`api_key_updates`) and auto-switches on key updates
3. Uses thread-safe locking to handle concurrent access
4. Fires registered **update callbacks** on every successful key switch — Qdrant uses this to re-provision collections (see below)
5. Exposes `get_embedding_info()` — the single source of truth for the active provider's `embeddingModelName` + `vectorSize` (used by Vectorizer, RAGService, and Qdrant provisioning)

---

### `services/qdrant_client.py`

Qdrant vector DB operations:

- **Per-model collections**: deterministic naming — every collection is `<base>_<model>_<size>` (`posts_bge-m3_1024`, `documents_gemini-embedding-2_3072`, ...). Each embedding model owns isolated collections; same-dim models never collide
- **Auto-provisioning**: `ensure_collections()` runs at startup AND via an ApiKeyManager update callback — every provider switch provisions whatever is missing
- **Name resolver**: `resolve_collection_name(base)` maps logical names (`posts`) to the physical collection for the ACTIVE model; readers (RAG search) and writers (worker upserts) both route through it
- Point upsert with an early **dimension guard** (rejects wrong-dim points with a clear message instead of a cryptic Qdrant error)
- Vector search with score threshold
- Collection info and management

---

### `services/pdf_processor.py`

PDF content extraction pipeline:

```
Cloudinary URL → Download → Extract Content → [Text, Tables, Images]
```

Extraction methods:

- **Text**: `pdfplumber` (primary), `pdfminer.six` (fallback)
- **Tables**: `camelot-py`
- **Images**: `pdf2image` + `pytesseract` OCR

---

### `utils/text_chunker.py`

Sentence-aware text chunking for optimal embedding:

- Splits text into sentences
- Groups sentences into chunks (default: 500 chars)
- Maintains overlap between chunks (default: 50 chars)
- Handles structured content (text, tables, images) separately

---

### `worker/consumer.py`

Redis stream consumer:

- Reads tasks from `vector_task_stream`
- Routes to appropriate vectorizer method by task type
- Updates embedding status (PROCESSING → COMPLETED/FAILED)
- Auto-reconnects on Redis failures

---

### `database/`

- **`connection.py`**: PostgreSQL connection with retry logic and `check_and_reconnect()`
- **`repositories.py`**: `ApiKeyRepository` (active key lookup), `EmbeddingStatusRepository` (status updates + record data fetch)

---

## Project Flow

### 1. Startup Flow

```
main.py
  │
  ├─→ settings.validate()          # Check env vars
  ├─→ api_key_manager.initialize() # Load active API key + start Redis listener
  ├─→ qdrant_service.initialize()  # Connect to Qdrant + ensure collections
  ├─→ register_update_callback(qdrant_service.ensure_collections)
  │                                # Auto re-provision on provider switch
  ├─→ [Thread] consumer.start()    # Start consuming vectorization tasks
  └─→ [Main]   uvicorn.run(app)    # Start RAG HTTP server
```

### 2. Vectorization Flow (Worker)

```
Redis Stream  →  TaskConsumer  →  Vectorizer  →  AI Provider  →  Qdrant
  (task)          (receive)       (chunk)        (embed)         (store)
```

Step-by-step:

1. **TaskConsumer** reads task from Redis stream
2. Sets embedding status to `PROCESSING`
3. Fetches record data from PostgreSQL (post/document/knowledge base)
4. Routes to vectorizer method:
   - `POST` → `vectorizer.process_post()`
   - `DOCUMENT` → `vectorizer.process_document()`
   - `KNOWLEDGE_BASE` → `vectorizer.process_knowledge_base()`
5. **Vectorizer** chunks content and calls `ai.embed_text()` for each chunk
6. **AI Provider** (Google/OpenAI/Ollama) generates embedding vector
7. Vectors stored in Qdrant with metadata
8. Status updated to `COMPLETED` or `FAILED`

### 3. RAG Chat Flow

```
User Question → FastAPI → RAGService → Qdrant Search → Context Assembly → LLM Stream → SSE Response
```

Step-by-step:

1. User sends question via `POST /ai-chat/stream`
2. **RAGService** loads the active API key and generates the query embedding with the SAME provider's model
3. Sanity check: query dims must match `ApiKey.vectorSize` (clear config error if not)
4. Searches Qdrant across all collections (posts, documents, knowledge_base) **filtered to `embedding_model == active model`** — vectors from different models are never mixed
5. Assembles top results as context
6. Calls `ai.generate_stream()` with system prompt + context + history
7. Streams LLM response tokens via SSE

### 4. API Key Update Flow

```
Node.js API  →  Redis Stream  →  ApiKeyManager  →  Callbacks  →  Qdrant
  (update)        (publish)        (subscribe)      (notify)     (re-provision)
```

1. Node.js API publishes key update to Redis stream
2. ApiKeyManager listener receives the update
3. Fetches new active key from PostgreSQL
4. Updates in-memory cache (thread-safe)
5. Fires registered update callbacks → `qdrant_service.ensure_collections()` creates any missing collection for the new provider's `vectorSize`
6. Next AI call (vectorize or chat) uses the new provider/model automatically

---

## Model-Aware Vector Storage

Every stored point is **self-describing** — the Vectorizer stamps the active provider's embedding info onto each chunk:

```json
{
  "text": "...",
  "chunk_index": 0,
  "record_id": "abc-123",
  "type": "post",
  "title": "...",
  "author": "...",
  "post_id": "...",
  "embedding_model": "bge-m3",
  "vector_size": 1024
}
```

This enables safe multi-provider operation:

| Concern | Mechanism |
|---|---|
| Writes use the right dimension | Upsert guard rejects points whose dims ≠ collection config |
| Search never mixes vector spaces | Query filter `embedding_model == active model` |
| Config drift detected early | Startup + per-key-change size comparison warns loudly |
| Audit/debug | Inspect any point's payload in the Qdrant UI |

> ⚠️ Points stored before this feature (no `embedding_model` field) are invisible to search until re-vectorized — mixing models is worse than empty results.

### Switching Embedding Models

1. Deactivate old key, activate the new one (`ApiKey.active`) — set matching `embeddingModelName` + `vectorSize`
2. ApiKeyManager switches instantly; `ensure_collections()` provisions the model-sized collection automatically (`posts_bge-m3_1024`, `posts_gemini-embedding-2_3072`, ...)
3. Each model keeps its own data — switching back to a previous model makes its collection instantly searchable again
4. Content is re-vectorized per collection: reset `embeddingStatus = 'PENDING'` for items that should live in the new provider's collection, then re-trigger via `PUT /api/data-vectorization/status`

---

## SOLID Design Patterns

### Applied Patterns

| Pattern             | Where                                    | Purpose                                             |
| ------------------- | ---------------------------------------- | --------------------------------------------------- |
| **Strategy**        | `ai_providers/base.py`                   | Each provider implements same interface differently |
| **Factory**         | `provider_factory.py`                    | Creates correct provider from DB config             |
| **Facade**          | `ai_client.py`                           | Simplifies provider access for callers              |
| **Singleton**       | `api_key_manager.py`                     | One global API key manager instance                 |
| **Observer**        | `register_update_callback()`             | Qdrant re-provisions itself on provider switch      |
| **Template Method** | `OllamaProvider extends OpenAIProvider`  | Reuses OpenAI logic with different defaults         |
| **DI**              | `Vectorizer.__init__(ai_client_factory)` | Inject dependency instead of hardcoding             |

### SOLID Principles

| Principle                     | How It's Applied                                                                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **S** — Single Responsibility | Each file has one job. `ai_providers/` handles provider logic. `vectorizer.py` handles chunking pipeline. `rag_service.py` handles HTTP + RAG. |
| **O** — Open/Closed           | New provider = new file + one line in `PROVIDERS` dict. Zero changes to existing code.                                                         |
| **L** — Liskov Substitution   | `OllamaProvider` extends `OpenAIProvider` — both work interchangeably wherever `AIProvider` is expected.                                       |
| **I** — Interface Segregation | `AIProvider` ABC defines only 2 methods: `embed_text()` + `generate_stream()`. No bloated interfaces.                                          |
| **D** — Dependency Inversion  | `Vectorizer` depends on `AIProvider` abstraction, not concrete Google/OpenAI classes. `ProviderFactory` handles concrete instantiation.        |

---

## Adding New Providers

### Step-by-step

**1. Create provider file** — `services/ai_providers/my_provider.py`

```python
from services.ai_providers.base import AIProvider

class MyProvider(AIProvider):
    def embed_text(self, text: str, task_type: str = "retrieval_document") -> list[float]:
        # Your embedding implementation
        ...

    def generate_stream(self, question, context, history, system_prompt):
        # Your streaming implementation
        ...
```

**2. Register in factory** — `services/ai_providers/provider_factory.py`

```python
from services.ai_providers.my_provider import MyProvider

PROVIDERS = {
    ...
    "MY_PROVIDER": MyProvider,  # Add this line
}
```

**3. Install SDK** — `requirements.txt`

```
my-provider-sdk==1.0.0
```

**4. Add to database** — Insert API key record

```sql
INSERT INTO "ApiKey" (id, provider, "llmModelName", "embeddingModelName", "vectorSize", apiKey, active)
VALUES ('...', 'MY_PROVIDER', 'model-name', 'embedding-model', 1536, 'your-api-key', true);
```

**That's it.** No changes to Vectorizer, RAGService, or any other file.

---

## Configuration

### Environment Variables (`.env`)

```env
REDIS_URL=rediss://...
DATABASE_URL=postgresql://...
QDRANT_URL=https://...
QDRANT_API_KEY=...
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Database: ApiKey Table

| Field                | Type    | Description                                  |
| -------------------- | ------- | -------------------------------------------- |
| `id`                 | UUID    | Primary key                                  |
| `provider`           | String  | `GOOGLE`, `OPENAI`, `CUSTOM`                 |
| `llmModelName`       | String  | e.g. `gemini-1.5-flash`, `qwen2.5:7b`        |
| `embeddingModelName` | String  | e.g. `text-embedding-3-small`, `BAAI/bge-m3` |
| `vectorSize`         | Int     | Vector dimension (768, 1536, etc.)           |
| `apiKey`             | String  | API key                                      |
| `baseUrl`            | String? | Custom endpoint URL                          |
| `limit`              | Int     | Usage limit (0 = unlimited)                  |
| `used`               | Int     | Current usage count                          |
| `active`             | Boolean | Active key flag                              |

### Constants (`config/constants.py`)

```python
# Task types
TASK_TYPE_POST = 'POST'
TASK_TYPE_DOCUMENT = 'DOCUMENT'
TASK_TYPE_KNOWLEDGE_BASE = 'KNOWLEDGE_BASE'

# Embedding statuses
STATUS_PENDING = 'PENDING'
STATUS_PROCESSING = 'PROCESSING'
STATUS_COMPLETED = 'COMPLETED'
STATUS_FAILED = 'FAILED'
```

---

## Setup & Running

### Prerequisites

- Python 3.12+
- PostgreSQL
- Redis
- Qdrant vector database

### Local Development

```bash
cd ai-processor
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env          # Edit with your config
python dev.py                 # Hot-reload mode
```

### Production (Docker)

```bash
docker compose build ai-processor
docker compose up ai-processor
```

### Available Commands

```bash
python main.py       # Production mode (no hot-reload)
python dev.py        # Development mode (hot-reload)
```

---

## Dependencies

| Package               | Purpose                           |
| --------------------- | --------------------------------- |
| `google-genai`        | Google Gemini SDK                 |
| `openai`              | OpenAI + OpenAI-compatible APIs (Ollama LLM + bge-m3 embeddings) |
| `qdrant-client`       | Vector database                   |
| `redis`               | Stream processing + pub/sub       |
| `psycopg2-binary`     | PostgreSQL                        |
| `fastapi` + `uvicorn` | HTTP server                       |
| `pdfplumber`          | PDF text extraction               |
| `camelot-py`          | PDF table extraction              |
| `pytesseract`         | OCR for images                    |

---

Part of the Ayeyar Farm project.
