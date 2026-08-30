import re
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue, PayloadSchemaType
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
            cls._instance._sizes_cache: Optional[Dict[str, int]] = None
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
            self._sizes_cache = None
            self.ensure_collections()

            self._initialized = True
        except Exception as e:
            print(f"❌ Failed to initialize Qdrant client: {e}")
            raise

    def ensure_collections(self):
        """Ensure a model-sized collection exists for the ACTIVE provider —
        for every logical collection (posts/documents/kb).

        Naming is deterministic: ALWAYS '<base>_<model>_<vectorSize>'
        (e.g. posts_bge-m3_1024, documents_gemini-embedding-2_3072).
        Each embedding model gets its own isolated collections, so switching
        providers never mixes vector spaces. Idempotent, and invoked
        automatically whenever the active API key changes.
        """
        if not self._client:
            print("❌ Qdrant client not initialized")
            return

        self._ensure_collection(settings.POSTS_COLLECTION)
        self._ensure_collection(settings.DOCUMENTS_COLLECTION)
        self._ensure_collection(settings.KNOWLEDGE_BASE_COLLECTION)

    @staticmethod
    def _model_slug(model: str) -> str:
        """Sanitize an embedding model name for use in a collection name.
        'BAAI/bge-m3' -> 'bge-m3', 'text-embedding-3-small' stays as-is."""
        return re.sub(r"[^a-zA-Z0-9_-]", "_", (model or "unknown").strip()) or "unknown"

    @classmethod
    def _target_collection_name(cls, base_collection: str, model: str, size: int) -> str:
        """Deterministic physical name: '<base>_<modelSlug>_<size>'."""
        return f"{base_collection}_{cls._model_slug(model)}_{size}"

    def _get_sizes_map(self) -> Dict[str, int]:
        """name -> vector_size for all existing collections (cached)."""
        if self._sizes_cache is None:
            sizes: Dict[str, int] = {}
            for c in self._client.get_collections().collections:
                try:
                    info = self._client.get_collection(c.name)
                    vectors = info.config.params.vectors
                    sizes[c.name] = int(vectors.size) if hasattr(vectors, "size") else 0
                except Exception as e:
                    print(f"⚠️  Could not read collection '{c.name}': {e}")
            self._sizes_cache = sizes
        return self._sizes_cache

    def resolve_collection_name(
        self,
        base_collection: str,
        api_key_data: Optional[Dict[str, Any]] = None,
    ) -> Optional[str]:
        """Resolve the physical collection for the given (or ACTIVE) provider:
        '<base>_<model>_<size>' (e.g. posts_bge-m3_1024). Returns None when it
        does not exist yet.

        Readers (RAG search) and writers (worker upserts) both route through
        this so they always hit collections built by the same embedding model.
        """
        embedding_info = api_key_manager.get_embedding_info(api_key_data)
        expected = embedding_info["vector_size"]
        if not expected or not self._client:
            return None

        target = self._target_collection_name(
            base_collection, embedding_info["embedding_model"], expected
        )
        if self._get_sizes_map().get(target) == expected:
            return target

        return None

    def _create(self, name: str, size: int, embedding_model: str):
        self._client.create_collection(
            collection_name=name,
            vectors_config=VectorParams(size=size, distance=Distance.COSINE),
        )
        self._client.create_payload_index(
            collection_name=name,
            field_name="embedding_model",
            field_schema=PayloadSchemaType.KEYWORD,
        )
        if self._sizes_cache is not None:
            self._sizes_cache[name] = size
        print(f"✅ Created Qdrant collection: {name} ({size} dims) for provider '{embedding_model}'")

    def _ensure_collection(self, collection_name: str):
        """Provision '<collection_name>_<model>_<size>' for the active provider.
        Naming is deterministic — every model owns its own collections."""
        try:
            embedding_info = api_key_manager.get_embedding_info()
            expected_size = embedding_info["vector_size"]
            model = embedding_info["embedding_model"]
            if not expected_size:
                raise Exception("No active API key with vectorSize available")

            target = self._target_collection_name(collection_name, model, expected_size)
            sizes = self._get_sizes_map()

            if target in sizes:
                if sizes[target] == expected_size:
                    print(f"✅ Qdrant collection matches provider: {target} ({expected_size} dims)")
                else:
                    print(
                        f"⚠️  '{target}' has {sizes[target]} dims but active provider "
                        f"'{model}' needs {expected_size}. Manual fix required."
                    )
                return

            self._create(target, expected_size, model)

            # Migration hints for pre-model-suffix eras that match this size
            for legacy in (collection_name, f"{collection_name}_{expected_size}"):
                if sizes.get(legacy) == expected_size:
                    print(
                        f"ℹ️  Legacy collection '{legacy}' also matches this provider. "
                        f"Consider migrating its points to '{target}', then deleting it."
                    )
        except Exception as e:
            print(f"❌ Error ensuring collection {collection_name}: {e}")
    
    def upsert_points(
        self,
        collection_name: str,
        points: List[PointStruct]
    ) -> bool:
        """Upsert points to a collection (rejects dimension mismatches early)"""
        try:
            # Guard: point dims must match the collection's configured size.
            # A mismatch means the active embedding model changed but the
            # collection was not recreated — fail loudly instead of letting
            # Qdrant reject with a cryptic error.
            if points:
                info = self.get_collection_info(collection_name)
                configured = info.get('vector_size') if info else None
                first_vector = points[0].vector
                actual = len(first_vector) if isinstance(first_vector, list) else None
                if configured and actual and actual != configured:
                    print(
                        f"❌ Vector dimension mismatch for {collection_name}: "
                        f"points have {actual} dims but collection expects {configured}. "
                        f"Delete + recreate the collection, then re-vectorize."
                    )
                    return False

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
                'name': collection_name,
                'points_count': info.points_count,
                'vector_size': info.config.params.vectors.size
            }
        except Exception as e:
            print(f"❌ Failed to get collection info for {collection_name}: {e}")
            return None

# Global instance
qdrant_service = QdrantService()
