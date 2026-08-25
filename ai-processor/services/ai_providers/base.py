from abc import ABC, abstractmethod
from typing import List, Dict, Any, Generator


class AIProvider(ABC):
    """Abstract base class for AI providers.

    Each provider implements both embedding and LLM streaming.
    To add a new provider (e.g. OpenRouter, Cohere, Mistral):
      1. Create a new file in ai_providers/
      2. Subclass AIProvider
      3. Register the provider string in ProviderFactory.PROVIDERS
    """

    def __init__(self, api_key_data: Dict[str, Any]):
        self.api_key_data = api_key_data
        self.api_key = api_key_data.get("apiKey", "")
        self.base_url = api_key_data.get("baseUrl")
        self.llm_model = api_key_data.get("llmModelName", "")
        self.embedding_model = api_key_data.get("embeddingModelName", "")
        self.vector_size = api_key_data.get("vectorSize", 768)

    @abstractmethod
    def embed_text(self, text: str, task_type: str = "retrieval_document") -> List[float]:
        """Generate embedding for a single text."""
        ...

    @abstractmethod
    def generate_stream(
        self,
        question: str,
        context: str,
        history: List[Dict[str, str]],
        system_prompt: str,
    ) -> Generator[str, None, None]:
        """Stream LLM response tokens."""
        ...
