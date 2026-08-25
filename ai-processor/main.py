import threading
import os
import uvicorn
from config.settings import settings
from services.api_key_manager import api_key_manager
from services.qdrant_client import qdrant_service
from worker.consumer import TaskConsumer

def start_embedding_worker():
    """Start the embedding worker in a background thread"""
    print("🚀 Starting AI Processor Worker...")
    
    # Validate settings
    try:
        settings.validate()
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        return
    
    # Initialize services
    print("🔧 Initializing services...")
    
    # Initialize API Key Manager (starts Redis listener in background)
    api_key_manager.initialize()

    # Initialize Qdrant service
    qdrant_service.initialize()

    # Re-provision Qdrant collections automatically when the active API key
    # changes (new provider may need a different vector size)
    api_key_manager.register_update_callback(qdrant_service.ensure_collections)
    
    # Start task consumer
    consumer = TaskConsumer()
    
    try:
        consumer.start()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down embedding worker gracefully...")
        consumer.stop()
    except Exception as e:
        print(f"❌ Fatal error in embedding worker: {e}")
        consumer.stop()

def start_rag_service():
    """Start the FastAPI RAG service"""
    print("🚀 Starting RAG Chat Service...")
    try:
        from rag_service import app
        # Use PORT environment variable for Render compatibility, default to 8001
        port = int(os.getenv('PORT', 8001))
        uvicorn.run(app, host="0.0.0.0", port=port)
    except Exception as e:
        print(f"❌ Fatal error in RAG service: {e}")

def main():
    """Main entry point - runs both embedding worker and RAG service"""
    print("🚀 Starting AI Processor with RAG Service...")
    
    # Start embedding worker in background thread
    worker_thread = threading.Thread(target=start_embedding_worker, daemon=True)
    worker_thread.start()
    
    # Start RAG service in main thread (blocking)
    try:
        start_rag_service()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down gracefully...")
        # Worker thread will be stopped as daemon thread
    except Exception as e:
        print(f"❌ Fatal error: {e}")

if __name__ == '__main__':
    main()