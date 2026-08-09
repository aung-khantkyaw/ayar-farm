import redis
import threading
from typing import Optional, Dict, Any
from config.settings import settings
from database.repositories import ApiKeyRepository

class ApiKeyManager:
    _instance = None
    _lock = threading.Lock()
    _active_api_key: Optional[Dict[str, Any]] = None
    _redis_client: Optional[redis.Redis] = None
    _listening_thread: Optional[threading.Thread] = None
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def initialize(self):
        """Initialize the API key manager"""
        print("🔑 Initializing API Key Manager...")
        
        # Fetch initial active API key from database
        self._active_api_key = ApiKeyRepository.get_active_api_key()
        if self._active_api_key:
            print(f"✅ Loaded active API key: {self._active_api_key['id']}")
        else:
            print("⚠️  No active API key found in database")
        
        # Start listening to Redis stream for updates
        self._start_redis_listener()
    
    def _start_redis_listener(self):
        """Start background thread to listen for API key updates"""
        def listen_for_updates():
            try:
                self._redis_client = redis.Redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_timeout=30,
                    socket_connect_timeout=10
                )
                
                stream_name = settings.API_KEY_UPDATES_STREAM
                consumer_group = 'api_key_listeners'
                consumer_name = 'listener_1'
                
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
                
                print(f"👂 Listening for API key updates on stream: {stream_name}")
                
                while True:
                    try:
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
                                self._handle_api_key_update(fields)
                                self._redis_client.xack(stream_name, consumer_group, message_id)
                    
                    except redis.exceptions.ConnectionError as e:
                        print(f"❌ Redis connection error in listener: {e}")
                        import time
                        time.sleep(2)
                        # Reconnect
                        self._redis_client = redis.Redis.from_url(
                            settings.REDIS_URL,
                            decode_responses=True,
                            socket_timeout=30,
                            socket_connect_timeout=10
                        )
                    except Exception as e:
                        print(f"❌ Error in listener: {e}")
                        import time
                        time.sleep(1)
            
            except Exception as e:
                print(f"❌ Failed to start Redis listener: {e}")
        
        self._listening_thread = threading.Thread(target=listen_for_updates, daemon=True)
        self._listening_thread.start()
    
    def _handle_api_key_update(self, fields: Dict[str, str]):
        """Handle API key update from Redis stream"""
        try:
            api_key_id = fields.get('apiKeyId')
            active = fields.get('active') == 'true'
            
            print(f"📥 Received API key update: {api_key_id}, active: {active}")
            
            if active:
                # Fetch the updated API key from database
                updated_key = ApiKeyRepository.get_active_api_key()
                if updated_key and updated_key['id'] == api_key_id:
                    with self._lock:
                        self._active_api_key = updated_key
                    print(f"✅ Updated active API key to: {api_key_id}")
            else:
                # If the current active key was deactivated, fetch a new one
                with self._lock:
                    if self._active_api_key and self._active_api_key['id'] == api_key_id:
                        new_key = ApiKeyRepository.get_active_api_key()
                        self._active_api_key = new_key
                        if new_key:
                            print(f"✅ Switched to new active API key: {new_key['id']}")
                        else:
                            print("⚠️  No active API key available")
        
        except Exception as e:
            print(f"❌ Error handling API key update: {e}")
    
    def get_active_api_key(self) -> Optional[Dict[str, Any]]:
        """Get the current active API key"""
        with self._lock:
            return self._active_api_key
    
    def increment_usage(self, api_key_id: str):
        """Increment usage count for an API key"""
        try:
            from database.connection import db_conn, check_and_reconnect
            global db_conn
            db_conn = check_and_reconnect(db_conn)
            cursor = db_conn.cursor()
            cursor.execute(
                'UPDATE "ApiKey" SET "used" = "used" + 1 WHERE id = %s',
                (api_key_id,)
            )
            db_conn.commit()
            cursor.close()
        except Exception as e:
            print(f"❌ Failed to increment API key usage: {e}")

# Global instance
api_key_manager = ApiKeyManager()
