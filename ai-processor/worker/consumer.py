import redis
import time
from typing import Dict, Any
from config.settings import settings
from config.constants import (
    TASK_TYPE_POST, TASK_TYPE_DOCUMENT, TASK_TYPE_KNOWLEDGE_BASE,
    STATUS_PROCESSING, STATUS_COMPLETED, STATUS_FAILED
)
from database.repositories import (
    ApiKeyRepository,
    EmbeddingRecordRepository,
    EmbeddingStatusRepository,
)
from services.api_key_manager import api_key_manager
from services.vectorizer import vectorizer
from services.qdrant_client import qdrant_service

class TaskConsumer:
    """Consume tasks from Redis stream and process them"""
    
    def __init__(self):
        self._redis_client = None
        self._running = False
    
    def get_redis_connection(self):
        """Get Redis connection with retry logic"""
        max_retries = 5
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                client = redis.Redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=False,
                    socket_timeout=30,
                    socket_connect_timeout=10
                )
                client.ping()
                print(f"✅ Redis connected (attempt {attempt + 1})")
                return client
            except Exception as e:
                print(f"❌ Redis connection failed (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                else:
                    raise Exception("Failed to connect to Redis after multiple attempts")
    
    def start(self):
        """Start consuming tasks from Redis stream"""
        print("🚀 Task Consumer Started. Waiting for tasks...")
        
        self._redis_client = self.get_redis_connection()
        self._running = True
        
        stream_name = settings.VECTOR_TASK_STREAM
        consumer_group = settings.CONSUMER_GROUP
        consumer_name = settings.CONSUMER_NAME
        
        # Create consumer group if it doesn't exist
        try:
            self._redis_client.xgroup_create(
                stream_name, 
                consumer_group, 
                id='0', 
                mkstream=True
            )
            print(f"✅ Created consumer group '{consumer_group}'")
        except redis.exceptions.ResponseError as e:
            if 'BUSYGROUP' not in str(e):
                print(f"⚠️  Error creating consumer group: {e}")
        
        while self._running:
            try:
                # Read from stream using XREADGROUP
                messages = self._redis_client.xreadgroup(
                    consumer_group,
                    consumer_name,
                    {stream_name: '>'},
                    count=1,
                    block=5000
                )
                
                if not messages:
                    continue
                
                for stream, entries in messages:
                    for message_id, fields in entries:
                        # Convert bytes to strings
                        task_data = {k.decode('utf-8'): v.decode('utf-8') for k, v in fields.items()}
                        
                        print(f"📥 Received Task: {task_data.get('type')} - {task_data.get('id')}")
                        print(f"📋 Task Metadata: {task_data}")
                        
                        self._process_task(task_data)
                        
                        # Acknowledge message processing
                        self._redis_client.xack(stream_name, consumer_group, message_id)
                        print(f"✅ Completed Task: {task_data.get('id')}\n")
            
            except redis.exceptions.ConnectionError as e:
                print(f"❌ Redis connection error: {e}")
                print("🔄 Reconnecting to Redis...")
                self._redis_client = self.get_redis_connection()
                time.sleep(2)
            except Exception as e:
                print(f"❌ Error in consumer: {e}")
                time.sleep(1)
    
    def _process_task(self, task_data: Dict[str, Any]):
        """Process a single task"""
        task_type = task_data.get('type', '').upper()
        record_id = task_data.get('id')
        
        if not record_id:
            print("❌ Task missing record ID")
            return

        # Phase 3: tasks may target a SPECIFIC api key (enqueued from the
        # admin dashboard). Embed with that key's model and attribute the
        # EmbeddingRecord to it; fall back to the ACTIVE key otherwise.
        task_api_key_id = task_data.get('api_key_id')
        effective_key = None
        if task_api_key_id:
            effective_key = ApiKeyRepository.get_api_key_by_id(task_api_key_id)
            if not effective_key:
                print(f"⚠️  Task key {task_api_key_id} not found — using active key")
        if not effective_key:
            effective_key = api_key_manager.get_active_api_key_with_recovery()
        api_key_id = effective_key['id'] if effective_key else None

        def record_embedding(status: str, **kwargs):
            """Parallel write to EmbeddingRecord (skipped when no active key)."""
            if api_key_id:
                EmbeddingRecordRepository.upsert(
                    api_key_id=api_key_id,
                    target_type=task_type,
                    target_id=record_id,
                    status=status,
                    **kwargs,
                )

        # Update status to PROCESSING
        record_embedding(STATUS_PROCESSING)
        
        try:
            # Get record data from database
            record_data = EmbeddingStatusRepository.get_record_data(task_type, record_id)
            if not record_data:
                print(f"❌ Record not found: {record_id}")
                record_embedding(STATUS_FAILED, error='record not found')
                return

            # Merge task_data with record_data (task_data has file_url from Redis stream)
            merged_data = {**record_data, **task_data}

            # Resolve the physical Qdrant collection for the ACTIVE provider's
            # vector size BEFORE embedding — skip wasted API calls if missing.
            base_collection = {
                TASK_TYPE_POST: settings.POSTS_COLLECTION,
                TASK_TYPE_DOCUMENT: settings.DOCUMENTS_COLLECTION,
                TASK_TYPE_KNOWLEDGE_BASE: settings.KNOWLEDGE_BASE_COLLECTION,
            }.get(task_type)
            collection_name = (
                qdrant_service.resolve_collection_name(
                    base_collection, api_key_data=effective_key
                )
                if base_collection
                else None
            )
            if not collection_name:
                print(
                    f"❌ No compatible Qdrant collection for '{base_collection}' "
                    f"with the active provider's vector size. Provision first."
                )
                record_embedding(STATUS_FAILED, error='no compatible qdrant collection')
                return

            # Process based on task type
            vectorized_chunks = []

            if task_type == TASK_TYPE_POST:
                print(f"📝 Processing POST: {record_id}")
                vectorized_chunks = vectorizer.process_post(merged_data, api_key_data=effective_key)

            elif task_type == TASK_TYPE_DOCUMENT:
                print(f"📄 Processing DOCUMENT: {record_id}")
                vectorized_chunks = vectorizer.process_document(merged_data, api_key_data=effective_key)

            elif task_type == TASK_TYPE_KNOWLEDGE_BASE:
                print(f"📚 Processing KNOWLEDGE_BASE: {record_id}")
                vectorized_chunks = vectorizer.process_knowledge_base(merged_data, api_key_data=effective_key)

            else:
                print(f"❌ Unknown task type: {task_type}")
                record_embedding(STATUS_FAILED, error=f'unknown task type {task_type}')
                return

            if not vectorized_chunks:
                print(f"⚠️  No chunks generated for {record_id}")
                record_embedding(STATUS_FAILED, error='no chunks generated')
                return

            # Prepare Qdrant points
            points = vectorizer.prepare_qdrant_points(vectorized_chunks, record_id)

            # Insert into Qdrant
            if qdrant_service.upsert_points(collection_name, points):
                print(f"✅ Inserted {len(points)} vectors into {collection_name}")
                record_embedding(
                    STATUS_COMPLETED,
                    collection_name=collection_name,
                    vector_count=len(points),
                )
            else:
                print(f"❌ Failed to insert vectors into {collection_name}")
                record_embedding(STATUS_FAILED, error='qdrant upsert failed')

        except Exception as e:
            print(f"❌ Error processing task: {e}")
            record_embedding(STATUS_FAILED, error=str(e))
    
    def stop(self):
        """Stop the consumer"""
        self._running = False
