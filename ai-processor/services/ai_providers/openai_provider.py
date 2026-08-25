from typing import List, Dict, Any, Generator
import openai
from services.ai_providers.base import AIProvider


class OpenAIProvider(AIProvider):
    """OpenAI provider.

    Also covers any OpenAI-compatible API (Ollama, OpenRouter, etc.)
    by overriding base_url.
    """

    def _build_client(self) -> openai.OpenAI:
        return openai.OpenAI(
            api_key=self.api_key or "ollama",
            base_url=self.base_url,
        )

    def embed_text(self, text: str, task_type: str = "retrieval_document") -> List[float]:
        client = self._build_client()
        response = client.embeddings.create(model=self.embedding_model, input=text)
        return response.data[0].embedding

    def generate_stream(
        self,
        question: str,
        context: str,
        history: List[Dict[str, str]],
        system_prompt: str,
    ) -> Generator[str, None, None]:
        client = self._build_client()

        messages = [{"role": "system", "content": system_prompt.format(context=context)}]
        for msg in history:
            role = "user" if msg["role"] == "USER" else "assistant"
            messages.append({"role": role, "content": msg["content"]})
        messages.append({"role": "user", "content": question})

        stream = client.chat.completions.create(
            model=self.llm_model,
            messages=messages,
            stream=True,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content
