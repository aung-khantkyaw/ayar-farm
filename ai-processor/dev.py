import os
import threading
from config.settings import settings
from services.api_key_manager import api_key_manager
from services.qdrant_client import qdrant_service
from worker.consumer import TaskConsumer


def start_embedding_worker():
    """Start the embedding worker in a background thread"""
    print("Starting AI Processor Worker...")
    try:
        settings.validate()
    except ValueError as e:
        print(f"Configuration error: {e}")
        return

    api_key_manager.initialize()
    qdrant_service.initialize()
    # Re-provision Qdrant collections automatically when the active API key changes
    api_key_manager.register_update_callback(qdrant_service.ensure_collections)
    consumer = TaskConsumer()

    try:
        consumer.start()
    except KeyboardInterrupt:
        consumer.stop()
    except Exception as e:
        print(f"Fatal error in worker: {e}")
        consumer.stop()


if __name__ == '__main__':
    print("Starting AI Processor (dev mode with hot-reload)...")

    worker_thread = threading.Thread(target=start_embedding_worker, daemon=True)
    worker_thread.start()

    import uvicorn
    port = int(os.getenv('PORT', 8001))
    print(f"RAG service starting on http://0.0.0.0:{port} with --reload")

    uvicorn.run(
        "rag_service:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info",
    )
