import psycopg2
from config.settings import settings
import time

def get_db_connection():
    """Get a new database connection with retry logic"""
    max_retries = 5
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            conn = psycopg2.connect(settings.DATABASE_URL)
            print(f"✅ Database connected (attempt {attempt + 1})")
            return conn
        except Exception as e:
            print(f"❌ Database connection failed (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                raise Exception("Failed to connect to database after multiple attempts")

def check_and_reconnect(conn):
    """Check if connection is alive, reconnect if needed"""
    try:
        # Test connection
        conn.cursor().execute('SELECT 1')
        return conn
    except:
        # Connection is closed, create new one
        print("🔄 Database connection closed, reconnecting...")
        return get_db_connection()

# Global connection
db_conn = get_db_connection()
