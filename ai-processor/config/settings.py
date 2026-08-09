import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env.example instead of .env
# env_path = Path(__file__).parent.parent / '.env.example'
load_dotenv()

class Settings:
    REDIS_URL: str = os.getenv('REDIS_URL')
    DATABASE_URL: str = os.getenv('DATABASE_URL')
    QDRANT_URL: str = os.getenv('QDRANT_URL')
    QDRANT_API_KEY: str = os.getenv('QDRANT_API_KEY')
    
    # Stream names
    API_KEY_UPDATES_STREAM: str = 'api_key_updates'
    VECTOR_TASK_STREAM: str = 'vector_task_stream'
    
    # Consumer group settings
    CONSUMER_GROUP: str = 'vector_workers'
    CONSUMER_NAME: str = 'worker_1'
    
    # Qdrant collection names
    POSTS_COLLECTION: str = 'posts'
    DOCUMENTS_COLLECTION: str = 'documents'
    KNOWLEDGE_BASE_COLLECTION: str = 'knowledge_base'
    
    @classmethod
    def validate(cls):
        if not cls.REDIS_URL:
            raise ValueError('REDIS_URL is required')
        if not cls.DATABASE_URL:
            raise ValueError('DATABASE_URL is required')
        if not cls.QDRANT_URL:
            raise ValueError('QDRANT_URL is required')
        if not cls.QDRANT_API_KEY:
            raise ValueError('QDRANT_API_KEY is required')

settings = Settings()
