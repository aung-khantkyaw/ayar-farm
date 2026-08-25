from typing import List, Dict, Any, Generator
from services.ai_providers.openai_provider import OpenAIProvider


class OllamaProvider(OpenAIProvider):
    """Ollama provider (OpenAI-compatible API).

    Both LLM and embeddings are served by Ollama:
    - LLM: e.g. qwen2.5:7b
    - Embedding: BAAI/bge-m3 (dense, 1024 dimensions)

    Requires models to be pulled into the Ollama container:
        docker compose exec ollama ollama pull qwen2.5:7b
        docker compose exec ollama ollama pull bge-m3
    """

    DEFAULT_BASE_URL = "http://localhost:11434/v1"
    DEFAULT_EMBEDDING_MODEL = "bge-m3"
