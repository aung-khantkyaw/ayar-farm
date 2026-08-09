from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from typing import List, Dict, Any, Optional
from config.settings import settings
from services.api_key_manager import api_key_manager

class QdrantService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._client = None
            cls._instance._initialized = False
        return cls._instance
    
    def initialize(self):
        """Initialize Qdrant client and create collections if needed"""
        if self._initialized:
            return
        
        try:
            self._client = QdrantClient(
                url=settings.QDRANT_URL,
                api_key=settings.QDRANT_API_KEY
            )
            print("✅ Qdrant client connected")
            
            # Create collections if they don't exist
            self._ensure_collection(settings.POSTS_COLLECTION)
            self._ensure_collection(settings.DOCUMENTS_COLLECTION)
            self._ensure_collection(settings.KNOWLEDGE_BASE_COLLECTION)
            
            self._initialized = True
        except Exception as e:
            print(f"❌ Failed to initialize Qdrant client: {e}")
            raise
    
    def _ensure_collection(self, collection_name: str):
        """Ensure collection exists, create if not"""
        try:
            collections = self._client.get_collections().collections
            collection_names = [c.name for c in collections]
            
            if collection_name not in collection_names:
                # Get vector size from active API key
                api_key_data = api_key_manager.get_active_api_key()
                if not api_key_data:
                    raise Exception("No active API key available to determine vector size")
                
                vector_size = api_key_data.get('vectorSize')
                if not vector_size:
                    raise Exception("vectorSize not found in active API key")
                
                self._client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(
                        size=vector_size,
                        distance=Distance.COSINE
                    )
                )
                print(f"✅ Created Qdrant collection: {collection_name} with vector size: {vector_size}")
            else:
                print(f"✅ Qdrant collection exists: {collection_name}")
        except Exception as e:
            print(f"❌ Error ensuring collection {collection_name}: {e}")
    
    def upsert_points(
        self,
        collection_name: str,
        points: List[PointStruct]
    ) -> bool:
        """Upsert points to a collection"""
        try:
            self._client.upsert(
                collection_name=collection_name,
                points=points
            )
            return True
        except Exception as e:
            print(f"❌ Failed to upsert points to {collection_name}: {e}")
            return False
    
    def search(
        self,
        collection_name: str,
        query_vector: List[float],
        limit: int = 10,
        score_threshold: float = 0.7,
        filter: Optional[Filter] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar vectors"""
        try:
            results = self._client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=limit,
                score_threshold=score_threshold,
                query_filter=filter
            )
            
            return [
                {
                    'id': hit.id,
                    'score': hit.score,
                    'payload': hit.payload
                }
                for hit in results
            ]
        except Exception as e:
            print(f"❌ Failed to search in {collection_name}: {e}")
            return []
    
    def delete_points(
        self,
        collection_name: str,
        point_ids: List[str]
    ) -> bool:
        """Delete points from a collection"""
        try:
            self._client.delete(
                collection_name=collection_name,
                points_selector=point_ids
            )
            return True
        except Exception as e:
            print(f"❌ Failed to delete points from {collection_name}: {e}")
            return False
    
    def get_collection_info(self, collection_name: str) -> Optional[Dict[str, Any]]:
        """Get collection information"""
        try:
            info = self._client.get_collection(collection_name)
            return {
                'name': info.config.params.vectors.size,
                'points_count': info.points_count,
                'vector_size': info.config.params.vectors.size
            }
        except Exception as e:
            print(f"❌ Failed to get collection info for {collection_name}: {e}")
            return None

# Global instance
qdrant_service = QdrantService()
