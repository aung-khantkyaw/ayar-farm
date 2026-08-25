from typing import Dict, Any, Type
from services.ai_providers.base import AIProvider
from services.ai_providers.google_provider import GoogleProvider
from services.ai_providers.openai_provider import OpenAIProvider
from services.ai_providers.ollama_provider import OllamaProvider


class ProviderFactory:
    """Factory to create the right AIProvider from api_key_data.

    To add a new provider:
      1. Create a class that subclasses AIProvider
      2. Add the provider string → class mapping to PROVIDERS below
      3. Done — no other code changes needed.

    Example:
        PROVIDERS = {
            "GOOGLE": GoogleProvider,
            "CUSTOM": OllamaProvider,
            "OPENAI": OpenAIProvider,
            "OPENROUTER": OpenRouterProvider,  # future
        }
    """

    PROVIDERS: Dict[str, Type[AIProvider]] = {
        "GOOGLE": GoogleProvider,
        "CUSTOM": OllamaProvider,
        "OPENAI": OpenAIProvider,
    }

    @classmethod
    def create(cls, api_key_data: Dict[str, Any]) -> AIProvider:
        """Create an AIProvider instance from api_key_data."""
        provider_name = api_key_data.get("provider", "GOOGLE")
        provider_cls = cls.PROVIDERS.get(provider_name)
        if not provider_cls:
            raise ValueError(
                f"Unknown provider: {provider_name}. "
                f"Available: {list(cls.PROVIDERS.keys())}"
            )
        return provider_cls(api_key_data)

    @classmethod
    def register(cls, name: str, provider_cls: Type[AIProvider]):
        """Register a new provider at runtime (optional)."""
        cls.PROVIDERS[name] = provider_cls
