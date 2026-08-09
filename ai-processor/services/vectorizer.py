from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types
import base64
import uuid
from services.api_key_manager import api_key_manager
from services.pdf_processor import PDFProcessor
from utils.text_chunker import TextChunker
from config.settings import settings

class Vectorizer:
    """Handle text and PDF vectorization using different AI providers"""
    
    def __init__(self):
        self.pdf_processor = PDFProcessor()
        self.text_chunker = TextChunker(chunk_size=500, chunk_overlap=50)
        self._client = None
    
    def _get_client(self):
        """Get AI client based on active API key provider"""
        api_key_data = api_key_manager.get_active_api_key()
        if not api_key_data:
            raise Exception("No active API key available")
        
        api_key = api_key_data.get('apiKey')
        if not api_key:
            raise Exception("API key not found in active key data")
        
        provider = api_key_data.get('provider')
        
        # Currently only Google is supported
        # TODO: Add support for OPENAI, ANTHROPIC, OPENROUTER, CUSTOM
        if provider == 'GOOGLE':
            return genai.Client(api_key=api_key)
        else:
            raise Exception(f"Provider {provider} is not yet supported for vectorization")
    
    def vectorize_text(self, text: str) -> Optional[List[float]]:
        """Vectorize a single text string"""
        try:
            client = self._get_client()
            
            # Get embedding model name from active API key
            api_key_data = api_key_manager.get_active_api_key()
            if not api_key_data:
                raise Exception("No active API key available to determine embedding model")
            
            embedding_model = api_key_data.get('embeddingModelName')
            if not embedding_model:
                raise Exception("embeddingModelName not found in active API key")
            
            response = client.models.embed_content(
                model=embedding_model,
                contents=text,
                config=types.EmbedContentConfig(
                    task_type="retrieval_document"
                )
            )
            
            # Increment API key usage
            if api_key_data:
                api_key_manager.increment_usage(api_key_data['id'])
            
            return response.embeddings[0].values
        except Exception as e:
            print(f"❌ Failed to vectorize text: {e}")
            return None
    
    def vectorize_chunks(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Vectorize multiple text chunks"""
        vectorized_chunks = []
        
        for chunk in chunks:
            text = chunk.get('text', '')
            if not text:
                continue
            
            vector = self.vectorize_text(text)
            if vector:
                vectorized_chunks.append({
                    **chunk,
                    'vector': vector
                })
        
        return vectorized_chunks
    
    def process_post(self, post_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Process a post for vectorization"""
        text = post_data.get('content', '') or post_data.get('description', '')
        if not text:
            print("⚠️  No text content found in post")
            return []
        
        # Chunk the text
        chunks = self.text_chunker.chunk_text(text, {
            'source_type': 'post',
            'source_id': post_data.get('id'),
            'title': post_data.get('title', '')
        })
        
        # Vectorize chunks
        return self.vectorize_chunks(chunks)
    
    def process_document(self, document_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Process a document (PDF) for vectorization"""
        pdf_url = document_data.get('file_url') or document_data.get('fileUrl') or document_data.get('url')
        if not pdf_url:
            print("⚠️  No PDF URL found in document")
            return []
        
        # Process PDF
        content = self.pdf_processor.process_pdf(pdf_url, {
            'source_type': 'document',
            'source_id': document_data.get('id'),
            'title': document_data.get('title', '')
        })
        
        if not content:
            print("⚠️  No content extracted from PDF")
            return []
        
        # Chunk structured content
        chunks = self.text_chunker.chunk_structured_content(content, {
            'source_type': 'document',
            'source_id': document_data.get('id'),
            'title': document_data.get('title', '')
        })
        
        # Vectorize chunks
        return self.vectorize_chunks(chunks)
    
    def process_knowledge_base(self, kb_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Process a knowledge base entry for vectorization"""
        # Similar to document processing
        pdf_url = kb_data.get('file_url') or kb_data.get('fileUrl') or kb_data.get('url')
        if not pdf_url:
            print("⚠️  No PDF URL found in knowledge base entry")
            return []
        
        # Process PDF
        content = self.pdf_processor.process_pdf(pdf_url, {
            'source_type': 'knowledge_base',
            'source_id': kb_data.get('id'),
            'title': kb_data.get('title', '')
        })
        
        if not content:
            print("⚠️  No content extracted from PDF")
            return []
        
        # Chunk structured content
        chunks = self.text_chunker.chunk_structured_content(content, {
            'source_type': 'knowledge_base',
            'source_id': kb_data.get('id'),
            'title': kb_data.get('title', '')
        })
        
        # Vectorize chunks
        return self.vectorize_chunks(chunks)
    
    def prepare_qdrant_points(
        self,
        vectorized_chunks: List[Dict[str, Any]],
        record_id: str
    ) -> List[Dict[str, Any]]:
        """Prepare vectorized chunks for Qdrant insertion"""
        from qdrant_client.models import PointStruct
        
        points = []
        for chunk in vectorized_chunks:
            point = PointStruct(
                id=str(uuid.uuid4()),
                vector=chunk['vector'],
                payload={
                    'text': chunk['text'],
                    'chunk_index': chunk['chunk_index'],
                    'record_id': record_id,
                    **chunk.get('metadata', {})
                }
            )
            points.append(point)
        
        return points

# Global instance
vectorizer = Vectorizer()
