from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from google import genai
from google.genai import types
import os
from config.settings import settings
from database.connection import get_db_connection
from services.api_key_manager import api_key_manager

app = FastAPI(title="RAG Chat Service")

class ChatRequest(BaseModel):
    question: str
    user_id: str
    conversation_history: Optional[List[Dict[str, str]]] = []

class RAGService:
    def __init__(self):
        self.qdrant_client = None
        self._init_qdrant()
    
    def _init_qdrant(self):
        """Initialize Qdrant client"""
        try:
            self.qdrant_client = QdrantClient(
                url=settings.QDRANT_URL,
                api_key=settings.QDRANT_API_KEY
            )
            print("✅ Qdrant client initialized for RAG")
        except Exception as e:
            print(f"❌ Failed to initialize Qdrant: {e}")
    
    def search_qdrant(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search Qdrant for relevant documents"""
        try:
            # Get active API key for embedding model
            api_key_data = api_key_manager.get_active_api_key()
            if not api_key_data:
                raise Exception("No active API key available")
            
            # Generate embedding for query
            client = genai.Client(api_key=api_key_data['apiKey'])
            embedding_model = api_key_data.get('embeddingModelName')
            
            response = client.models.embed_content(
                model=embedding_model,
                contents=query,
                config=types.EmbedContentConfig(task_type="retrieval_query")
            )
            query_vector = response.embeddings[0].values
            
            # Search all collections
            all_results = []
            collections = ['posts', 'documents', 'knowledge_base']
            
            for collection in collections:
                try:
                    search_results = self.qdrant_client.query_points(
                        collection_name=collection,
                        query=query_vector,
                        limit=limit,
                        score_threshold=0.5
                    )
                    
                    for result in search_results.points:
                        # Use record_id as the appropriate ID based on collection type
                        record_id = result.payload.get('record_id', '')
                        post_id = result.payload.get('post_id') or (record_id if collection == 'posts' else None)
                        document_id = result.payload.get('document_id') or (record_id if collection == 'documents' else None)
                        kb_id = result.payload.get('kb_id') or (record_id if collection == 'knowledge_base' else None)
                        
                        all_results.append({
                            'collection': collection,
                            'score': result.score,
                            'text': result.payload.get('text', ''),
                            'record_id': record_id,
                            'chunk_index': result.payload.get('chunk_index', 0),
                            'metadata': {
                                'type': result.payload.get('type', collection),
                                'title': result.payload.get('title', ''),
                                'author': result.payload.get('author', ''),
                                'post_id': post_id,
                                'document_id': document_id,
                                'kb_id': kb_id
                            }
                        })
                except Exception as e:
                    print(f"⚠️  Failed to search collection {collection}: {e}")
            
            # Sort by score and return top results
            all_results.sort(key=lambda x: x['score'], reverse=True)
            return all_results[:limit]
            
        except Exception as e:
            print(f"❌ Qdrant search failed: {e}")
            return []
    
    def generate_response_stream(self, question: str, context: str, history: List[Dict[str, str]]):
        """Generate streaming response using AI"""
        try:
            api_key_data = api_key_manager.get_active_api_key()
            if not api_key_data:
                raise Exception("No active API key available")
            
            client = genai.Client(api_key=api_key_data['apiKey'])
            llm_model = api_key_data.get('llmModelName')
            
            # Build system prompt for domain-specific responses
            system_prompt = """You are an agricultural expert assistant for Ayar Farm. 
            You ONLY answer questions about:
            - Farming (crops, soil, irrigation, pesticides, fertilizers)
            - Livestock (pigs, cattle, poultry, fish farming)
            - Breeder (animal breeding, livestock management)
            
            IMPORTANT RULES:
            1. Only use information from the provided context (documents, posts, knowledge base)
            2. If the question is outside these domains, politely decline
            3. If the context doesn't contain relevant information, say so
            4. Do not use external knowledge or make up information
            5. Provide practical, actionable advice based on the context
            6. Answer in the same language as the question (Myanmar or English)
            
            Context from our database:
            {context}
            """
            
            # Build conversation history for Google GenAI
            # Convert role format: USER -> user, ASSISTANT -> model
            # Include history in contents array
            contents = []
            for msg in history:
                contents.append({
                    "role": "user" if msg['role'] == 'USER' else "model",
                    "parts": [{"text": msg['content']}]
                })
            
            # Add current question
            contents.append({
                "role": "user",
                "parts": [{"text": question}]
            })
            
            # Generate streaming response
            response = client.models.generate_content_stream(
                model=llm_model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt.format(context=context)
                )
            )
            
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            print(f"❌ Response generation failed: {e}")
            yield f"Error: {str(e)}"
    
    def check_domain_relevance(self, question: str) -> bool:
        """Check if question is relevant to farming/livestock/breeder domain"""
        farming_keywords = [
            'farm', 'crop', 'soil', 'water', 'irrigation', 'fertilizer', 'pesticide',
            'seed', 'harvest', 'plant', 'agriculture', 'လယ်ယာ', 'သီးနှံ', 'မြေ', 'ရေ'
        ]
        livestock_keywords = [
            'pig', 'cattle', 'cow', 'chicken', 'poultry', 'fish', 'animal', 'livestock',
            'breed', 'feeding', 'vaccine', 'ဝက်', 'နွား', 'ကြက်', 'ငါး', 'တိရစ္ဆာန်'
        ]
        
        question_lower = question.lower()
        has_farming = any(keyword in question_lower for keyword in farming_keywords)
        has_livestock = any(keyword in question_lower for keyword in livestock_keywords)
        
        return has_farming or has_livestock

rag_service = RAGService()

@app.post("/chat")
async def chat(request: ChatRequest):
    """RAG chat endpoint with streaming response"""
    
    # Check domain relevance
    if not rag_service.check_domain_relevance(request.question):
        return StreamingResponse(
            iter(["I can only answer questions about farming, livestock, and breeding. Please ask a question related to agriculture or animal husbandry."]),
            media_type="text/plain"
        )
    
    # Search Qdrant for relevant context
    search_results = rag_service.search_qdrant(request.question, limit=5)
    
    if not search_results:
        return StreamingResponse(
            iter(["I couldn't find relevant information in our database about your question. Please try rephrasing or ask about specific farming/livestock topics."]),
            media_type="text/plain"
        )
    
    # Build context from search results
    context_parts = []
    sources = []
    for result in search_results:
        context_parts.append(f"[{result['collection']}] {result['text']}")
        sources.append({
            'collection': result['collection'],
            'record_id': result['record_id'],
            'score': result['score'],
            'metadata': result['metadata']
        })
    
    context = "\n\n".join(context_parts)
    
    # Generate streaming response
    def generate():
        for chunk in rag_service.generate_response_stream(
            request.question, 
            context, 
            request.conversation_history
        ):
            yield chunk
        
        # Send sources metadata after response is complete
        yield f"\n\n[SOURCES]\n{json.dumps(sources)}\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/plain"
    )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "RAG Chat Service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
