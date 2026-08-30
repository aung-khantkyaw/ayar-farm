from typing import List, Dict, Any, Optional
import base64
import uuid
from services.api_key_manager import api_key_manager
from services.ai_client import get_ai_client
from services.pdf_processor import PDFProcessor
from utils.text_chunker import TextChunker
from config.settings import settings


class Vectorizer:
    """Handle text and PDF vectorization using different AI providers."""

    def __init__(self, ai_client_factory=None):
        self.pdf_processor = PDFProcessor()
        self.text_chunker = TextChunker(chunk_size=400, chunk_overlap=50)
        self._ai_client_factory = ai_client_factory or get_ai_client

    def _embedding_info(self, api_key_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Embedding info for the given (or ACTIVE) key, stamped onto each
        vector so points are self-describing and searchable per-model."""
        return api_key_manager.get_embedding_info(api_key_data)

    def vectorize_text(
        self,
        text: str,
        api_key_data: Optional[Dict[str, Any]] = None,
    ) -> Optional[List[float]]:
        """Vectorize a single text string using the given (or ACTIVE) key."""
        try:
            key_data = api_key_data or api_key_manager.get_active_api_key_with_recovery()
            if not key_data:
                print("❌ No active API key available")
                return None

            ai = self._ai_client_factory(key_data)
            vector = ai.embed_text(text, task_type="retrieval_document")
            api_key_manager.increment_usage(key_data["id"])

            return vector
        except Exception as e:
            print(f"❌ Failed to vectorize text: {e}")
            return None

    def vectorize_chunks(
        self,
        chunks: List[Dict[str, Any]],
        api_key_data: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Vectorize multiple text chunks."""
        vectorized_chunks = []

        for chunk in chunks:
            text = chunk.get("text", "")
            if not text:
                continue

            vector = self.vectorize_text(text, api_key_data)
            if vector:
                vectorized_chunks.append({
                    **chunk,
                    "vector": vector,
                })

        return vectorized_chunks

    def process_post(
        self,
        post_data: Dict[str, Any],
        api_key_data: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Process a post for vectorization."""
        text = post_data.get("content", "") or post_data.get("description", "")
        if not text:
            print("⚠️  No text content found in post")
            return []

        title_preview = text[:100] + "..." if len(text) > 100 else text
        author_name = post_data.get("author_name") or post_data.get("author") or post_data.get("createdBy", "")

        chunks = self.text_chunker.chunk_text(text, {
            "type": "post",
            "title": title_preview,
            "author": author_name,
            "post_id": post_data.get("id"),
            **self._embedding_info(api_key_data),
        })

        return self.vectorize_chunks(chunks, api_key_data)

    def _process_pdf_content(
        self,
        pdf_data: Dict[str, Any],
        source_type: str,
        api_key_data: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Shared logic for processing PDF-based content (documents + knowledge base)."""
        pdf_urls = (
            pdf_data.get("file_urls")
            or pdf_data.get("file_url")
            or pdf_data.get("fileUrl")
            or pdf_data.get("url")
        )

        if isinstance(pdf_urls, list) and len(pdf_urls) > 0:
            pdf_url = pdf_urls[0]
        elif isinstance(pdf_urls, str):
            pdf_url = pdf_urls
        else:
            print(f"⚠️  No PDF URL found in {source_type}")
            return []

        content = self.pdf_processor.process_pdf(pdf_url, {
            "source_type": source_type,
            "source_id": pdf_data.get("id"),
            "title": pdf_data.get("title", ""),
        })

        if not content:
            print(f"⚠️  No content extracted from {source_type}")
            return []

        chunks = self.text_chunker.chunk_structured_content(content, {
            "type": source_type,
            "title": pdf_data.get("title", ""),
            "author": pdf_data.get("author", ""),
            f"{source_type}_id": pdf_data.get("id"),
            **self._embedding_info(api_key_data),
        })

        return self.vectorize_chunks(chunks, api_key_data)

    def process_document(
        self,
        document_data: Dict[str, Any],
        api_key_data: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Process a document (PDF) for vectorization."""
        return self._process_pdf_content(document_data, "document", api_key_data)

    def process_knowledge_base(
        self,
        kb_data: Dict[str, Any],
        api_key_data: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Process a knowledge base entry for vectorization."""
        return self._process_pdf_content(kb_data, "knowledge_base", api_key_data)

    def prepare_qdrant_points(
        self,
        vectorized_chunks: List[Dict[str, Any]],
        record_id: str,
    ) -> List[Dict[str, Any]]:
        """Prepare vectorized chunks for Qdrant insertion."""
        from qdrant_client.models import PointStruct

        points = []
        for chunk in vectorized_chunks:
            point = PointStruct(
                id=str(uuid.uuid4()),
                vector=chunk["vector"],
                payload={
                    "text": chunk["text"],
                    "chunk_index": chunk["chunk_index"],
                    "record_id": record_id,
                    **chunk.get("metadata", {}),
                },
            )
            points.append(point)

        return points


# Global instance
vectorizer = Vectorizer()
