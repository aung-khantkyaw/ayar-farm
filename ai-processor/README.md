# AI Processor Worker

Background worker service for processing and vectorizing content (posts, documents, knowledge base entries) using AI embeddings and storing them in Qdrant vector database.

## Overview

The AI Processor is a Python-based background worker that:
- Consumes vectorization tasks from Redis streams
- Processes different content types (posts, PDF documents, knowledge base entries)
- Extracts text, tables, and images from PDFs
- Chunks content into smaller pieces
- Generates embeddings using AI models (currently Google Gemini)
- Stores vectors in Qdrant for semantic search
- Dynamically uses active API keys from database

## Architecture

```
┌─────────────────┐
│   Main Entry    │
│    main.py      │
└────────┬────────┘
         │
         ├───┬──────────────────────────────────────┐
         │   │                                      │
         ▼   ▼                                      ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ API Key      │  │ Qdrant Service   │  │ Task Consumer    │
│ Manager      │  │                  │  │                  │
└──────────────┘  └──────────────────┘  └────────┬─────────┘
         │                                      │
         │                                      ▼
         │                            ┌──────────────────┐
         │                            │ Vectorizer       │
         │                            │                  │
         │                            └────────┬─────────┘
         │                                     │
         │                            ┌────────┴─────────┐
         │                            │                  │
         │                            ▼                  ▼
         │                    ┌──────────────┐  ┌──────────────┐
         │                    │ PDF Processor│  │ Text Chunker │
         │                    └──────────────┘  └──────────────┘
         │
         ▼
┌──────────────────┐
│ Database        │
│ Repositories     │
└──────────────────┘
```

## Project Flow

### 1. Initialization (`main.py`)

1. **Validate Settings** - Checks required environment variables
2. **Initialize API Key Manager** - Loads active API key from database, starts Redis listener for updates
3. **Initialize Qdrant Service** - Connects to Qdrant, creates collections if needed
4. **Start Task Consumer** - Begins consuming tasks from Redis stream

### 2. Task Processing Flow (`worker/consumer.py`)

```
Redis Stream → Task Consumer → Process Task → Vectorize → Store in Qdrant → Update Status
```

**Step-by-step:**
1. **Receive Task** - Consumer reads task from Redis stream (`vector_task_stream`)
2. **Update Status** - Sets embedding status to `PROCESSING`
3. **Fetch Record** - Retrieves record data from PostgreSQL database
4. **Process Content** - Routes to appropriate processor based on task type:
   - `POST` → Process post text content
   - `DOCUMENT` → Process PDF document
   - `KNOWLEDGE_BASE` → Process knowledge base PDF
5. **Vectorize** - Converts content chunks to embeddings
6. **Store Vectors** - Upserts vectors to Qdrant collection
7. **Update Status** - Sets embedding status to `COMPLETED` or `FAILED`

### 3. Content Processing (`services/vectorizer.py`)

**For Posts:**
- Extract text content
- Chunk into smaller pieces (500 chars with 50 char overlap)
- Vectorize each chunk using AI model
- Prepare Qdrant points

**For Documents/Knowledge Base:**
- Download PDF from Cloudinary URL
- Extract structured content (text, tables, images)
- Chunk each content type appropriately
- Vectorize chunks
- Prepare Qdrant points

### 4. PDF Processing (`services/pdf_processor.py`)

```
PDF URL → Download → Extract Content → [Text, Tables, Images] → Return Structured Data
```

**Extraction methods:**
- **Text**: pdfplumber (primary), PyPDF2 (fallback)
- **Tables**: camelot-py
- **Images**: pdf2image + pytesseract OCR

### 5. Text Chunking (`utils/text_chunker.py`)

- Splits text into sentences
- Groups sentences into chunks (500 chars default)
- Maintains overlap between chunks (50 chars default)
- Handles structured content (text, tables, images) separately

### 6. Vectorization (`services/vectorizer.py`)

- Uses active API key from database
- Dynamically selects embedding model from `embeddingModelName` field
- Currently supports Google Gemini (extensible for other providers)
- Increments API key usage counter

### 7. Qdrant Storage (`services/qdrant_client.py`)

- Creates collections with vector size from active API key
- Stores vectors with metadata (text, chunk_index, record_id)
- Supports search, delete, and collection info operations

### 8. API Key Management (`services/api_key_manager.py`)

- Loads active API key from database on startup
- Listens to Redis stream for API key updates
- Automatically switches to new active key when updated
- Thread-safe singleton pattern

## Components

### Core Services

- **`main.py`** - Entry point, initializes all services
- **`worker/consumer.py`** - Redis stream consumer, task processing orchestration
- **`services/vectorizer.py`** - Content vectorization using AI models
- **`services/qdrant_client.py`** - Qdrant vector database operations
- **`services/api_key_manager.py`** - Dynamic API key management with Redis updates
- **`services/pdf_processor.py`** - PDF content extraction

### Utilities

- **`utils/text_chunker.py`** - Text chunking for vectorization
- **`config/settings.py`** - Configuration management
- **`config/constants.py`** - Task types and status constants

### Database

- **`database/connection.py`** - PostgreSQL connection with retry logic
- **`database/repositories.py`** - Database repositories for API keys and embedding status

## Configuration

### Environment Variables (`.env`)

```env
REDIS_URL=rediss://...
DATABASE_URL=postgresql://...
QDRANT_URL=https://...
QDRANT_API_KEY=...
```

### Settings (`config/settings.py`)

- **Stream Names**: `API_KEY_UPDATES_STREAM`, `VECTOR_TASK_STREAM`
- **Consumer Group**: `vector_workers`
- **Collection Names**: `posts`, `documents`, `knowledge_base`
- **Vector Size**: Dynamically loaded from active API key

### Database Schema

The system relies on the following database tables:

**ApiKey Table:**
- `id` - UUID
- `provider` - AI provider (GOOGLE, OPENAI, etc.)
- `llmModelName` - LLM model name
- `embeddingModelName` - Embedding model name
- `vectorSize` - Vector dimension size
- `apiKey` - API key
- `baseUrl` - Custom base URL for custom providers
- `limit` - Usage limit (0 = unlimited)
- `used` - Usage counter
- `active` - Boolean flag for active key

**Content Tables:**
- `Post` - Posts with `embeddingStatus` field
- `Documents` - Documents with `embeddingStatus` field
- `KnowledgeBase` - Knowledge base entries with `embeddingStatus` field

## Task Types

- **POST** - Social media posts text content
- **DOCUMENT** - PDF documents (crop docs, machine docs, etc.)
- **KNOWLEDGE_BASE** - Knowledge base PDF entries

## Embedding Status

- **PENDING** - Waiting to be processed
- **PROCESSING** - Currently being processed
- **COMPLETED** - Successfully vectorized and stored
- **FAILED** - Processing failed

## Dynamic Configuration

The system is designed to be fully dynamic:

1. **API Keys**: Active API key is loaded from database and can be updated via Redis stream
2. **Embedding Models**: Model name comes from active API key's `embeddingModelName` field
3. **Vector Size**: Dimension size comes from active API key's `vectorSize` field
4. **AI Providers**: Provider type comes from active API key's `provider` field

This allows switching between different AI providers and models without code changes.

## Setup

### Prerequisites

- Python 3.12+
- PostgreSQL database
- Redis (for streams and pub/sub)
- Qdrant vector database
- Cloudinary account (for PDF storage)

### Installation

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Running

```bash
# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Run the worker
python main.py
```

### Docker

```bash
# Build and run using Docker
docker build -f docker/Dockerfile.ai -t ayar-farm-ai-processor .
docker run -e REDIS_URL=... -e DATABASE_URL=... -e QDRANT_URL=... -e QDRANT_API_KEY=... ayar-farm-ai-processor
```

## Dependencies

Key dependencies include:
- `google-genai` - Google Gemini AI SDK
- `qdrant-client` - Qdrant vector database client
- `redis` - Redis client for streams
- `psycopg2` - PostgreSQL adapter
- `pdfplumber` - PDF text extraction
- `camelot-py` - PDF table extraction
- `pdf2image` - PDF to image conversion
- `pytesseract` - OCR for images
- `requests` - HTTP client for PDF downloads

## Extending the System

### Adding New AI Providers

To add support for new AI providers:

1. Update `_get_client()` in `services/vectorizer.py` to handle the new provider
2. Install required SDK in `requirements.txt`
3. Update database with appropriate API key configuration

### Adding New Content Types

1. Add new task type in `config/constants.py`
2. Add processing method in `services/vectorizer.py`
3. Update table mapping in `database/repositories.py`
4. Add collection name in `config/settings.py`

### Custom Chunking Strategy

Modify `utils/text_chunker.py` to implement different chunking strategies based on your use case.

## Error Handling

The system includes comprehensive error handling:
- Database connection retry logic
- Redis connection recovery
- Graceful shutdown on KeyboardInterrupt
- Status updates to FAILED on errors
- Detailed error logging

## Monitoring

The worker outputs detailed logs including:
- Service initialization status
- Task reception and processing
- API key updates
- Vector insertion counts
- Error messages with context

## License

Part of the Ayar Farm project.
