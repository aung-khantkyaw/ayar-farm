from config.settings import settings
from services.api_key_manager import api_key_manager
from services.qdrant_client import qdrant_service
from worker.consumer import TaskConsumer

def main():
    """Main entry point for the AI processor worker"""
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
    
    # Start task consumer
    consumer = TaskConsumer()
    
    try:
        consumer.start()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down gracefully...")
        consumer.stop()
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        consumer.stop()

if __name__ == '__main__':
    main()