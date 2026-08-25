from typing import List, Dict, Any, Generator
from google import genai
from google.genai import types
from services.ai_providers.base import AIProvider


class GoogleProvider(AIProvider):
    """Google GenAI provider (Gemini)."""

    def embed_text(self, text: str, task_type: str = "retrieval_document") -> List[float]:
        client = genai.Client(api_key=self.api_key)
        response = client.models.embed_content(
            model=self.embedding_model,
            contents=text,
            config=types.EmbedContentConfig(task_type=task_type),
        )
        return response.embeddings[0].values

    def generate_stream(
        self,
        question: str,
        context: str,
        history: List[Dict[str, str]],
        system_prompt: str,
    ) -> Generator[str, None, None]:
        client = genai.Client(api_key=self.api_key)

        contents = []
        for msg in history:
            contents.append({
                "role": "user" if msg["role"] == "USER" else "model",
                "parts": [{"text": msg["content"]}],
            })
        contents.append({"role": "user", "parts": [{"text": question}]})

        response = client.models.generate_content_stream(
            model=self.llm_model,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt.format(context=context),
            ),
        )
        for chunk in response:
            if chunk.text:
                yield chunk.text
