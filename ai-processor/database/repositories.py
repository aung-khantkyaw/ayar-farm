from database.connection import db_conn, check_and_reconnect
from typing import Optional, Dict, Any
from config.constants import STATUS_COMPLETED, STATUS_FAILED

class ApiKeyRepository:
    @staticmethod
    def get_active_api_key() -> Optional[Dict[str, Any]]:
        """Get the currently active API key from database"""
        global db_conn
        db_conn = check_and_reconnect(db_conn)
        cursor = db_conn.cursor()
        try:
            cursor.execute(
                'SELECT id, "apiKey", provider, "llmModelName", "embeddingModelName", "vectorSize", "baseUrl", "used", "limit", active FROM "ApiKey" WHERE active = true LIMIT 1'
            )
            row = cursor.fetchone()
            if row:
                columns = [desc[0] for desc in cursor.description]
                return dict(zip(columns, row))
            return None
        finally:
            cursor.close()

class EmbeddingStatusRepository:
    @staticmethod
    def update_status(task_type: str, record_id: str, status: str) -> bool:
        """Update embedding status for a record"""
        global db_conn
        db_conn = check_and_reconnect(db_conn)
        cursor = db_conn.cursor()
        try:
            table_map = {
                'POST': 'Post',
                'DOCUMENT': 'Documents',
                'KNOWLEDGEBASE': 'KnowledgeBase'
            }
            
            table_name = table_map.get(task_type.upper())
            if not table_name:
                print(f"❌ Unknown task type: {task_type}")
                return False
            
            cursor.execute(
                f'UPDATE "{table_name}" SET "embeddingStatus" = %s WHERE id = %s',
                (status, record_id)
            )
            db_conn.commit()
            return True
        except Exception as e:
            print(f"❌ Failed to update status: {e}")
            db_conn.rollback()
            return False
        finally:
            cursor.close()

    @staticmethod
    def get_record_data(task_type: str, record_id: str) -> Optional[Dict[str, Any]]:
        """Get record data for processing"""
        global db_conn
        db_conn = check_and_reconnect(db_conn)
        cursor = db_conn.cursor()
        try:
            table_map = {
                'POST': 'Post',
                'DOCUMENT': 'Documents',
                'KNOWLEDGEBASE': 'KnowledgeBase'
            }
            
            table_name = table_map.get(task_type.upper())
            if not table_name:
                return None
            
            # For Post, join with Users to get author name
            if task_type.upper() == 'POST':
                cursor.execute(
                    '''SELECT p.*, u.name as author_name 
                       FROM "Post" p 
                       LEFT JOIN "Users" u ON p."authorId" = u.id 
                       WHERE p.id = %s''',
                    (record_id,)
                )
            else:
                cursor.execute(
                    f'SELECT * FROM "{table_name}" WHERE id = %s',
                    (record_id,)
                )
            
            row = cursor.fetchone()
            if row:
                columns = [desc[0] for desc in cursor.description]
                return dict(zip(columns, row))
            return None
        except Exception as e:
            print(f"❌ Failed to get record data: {e}")
            return None
        finally:
            cursor.close()
