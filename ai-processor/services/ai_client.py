from typing import List, Dict, Any, Generator
from services.ai_providers.base import AIProvider
from services.ai_providers.provider_factory import ProviderFactory
from services.api_key_manager import api_key_manager


class AIClient:
    """Thin facade over AIProvider.

    Backward-compatible — all existing callers (Vectorizer, RAGService, etc.)
    still use `get_ai_client()` and call `.embed_text()` / `.generate_stream()`.
    Internally delegates to the correct provider via the factory.
    """

    def __init__(self, provider: AIProvider):
        self._provider = provider

    def embed_text(self, text: str, task_type: str = "retrieval_document") -> List[float]:
        return self._provider.embed_text(text, task_type)

    def generate_stream(
        self,
        question: str,
        context: str,
        history: List[Dict[str, str]],
        system_prompt: str,
    ) -> Generator[str, None, None]:
        yield from self._provider.generate_stream(question, context, history, system_prompt)


def get_ai_client(api_key_data: Dict[str, Any] | None = None) -> AIClient:
    """Factory: create an AIClient from api_key_data.

    If api_key_data is None, fetches the active API key from the database.
    This preserves backward compatibility with all existing callers.
    """
    if api_key_data is None:
        api_key_data = api_key_manager.get_active_api_key_with_recovery()
    if not api_key_data:
        raise Exception("No active API key available")
    provider = ProviderFactory.create(api_key_data)
    return AIClient(provider)
