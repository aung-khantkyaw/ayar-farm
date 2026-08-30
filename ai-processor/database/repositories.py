from database.connection import db_conn, check_and_reconnect
from typing import Optional, Dict, Any

class ApiKeyRepository:
    _KEY_COLUMNS = (
        'SELECT id, "apiKey", provider, "llmModelName", "embeddingModelName", '
        '"vectorSize", "baseUrl", used, "limit", active FROM "ApiKey"'
    )

    @staticmethod
    def get_active_api_key() -> Optional[Dict[str, Any]]:
        """Get the currently active API key from database"""
        global db_conn
        db_conn = check_and_reconnect(db_conn)
        cursor = db_conn.cursor()
        try:
            cursor.execute(ApiKeyRepository._KEY_COLUMNS + ' WHERE active = true LIMIT 1')
            row = cursor.fetchone()
            if row:
                columns = [desc[0] for desc in cursor.description]
                return dict(zip(columns, row))
            return None
        finally:
            cursor.close()

    @staticmethod
    def get_api_key_by_id(api_key_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a specific API key (used when tasks target a non-active key)"""
        global db_conn
        db_conn = check_and_reconnect(db_conn)
        cursor = db_conn.cursor()
        try:
            cursor.execute(
                ApiKeyRepository._KEY_COLUMNS + ' WHERE id = %s',
                (api_key_id,)
            )
            row = cursor.fetchone()
            if row:
                columns = [desc[0] for desc in cursor.description]
                return dict(zip(columns, row))
            return None
        finally:
            cursor.close()

class EmbeddingStatusRepository:
    """Fetches content rows destined for vectorization.

    (Status tracking now lives in EmbeddingRecordRepository — the legacy
    per-row embeddingStatus columns were removed in Phase 4.)
    """

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


class EmbeddingRecordRepository:
    """Per-API-key vectorization tracking (EmbeddingRecord table).

    Parallel to the legacy per-row embeddingStatus columns — Phase 1 writes
    both. Missing row for (apiKeyId, targetType, targetId) = never attempted.
    """

    @staticmethod
    def upsert(
        api_key_id: str,
        target_type: str,
        target_id: str,
        status: str,
        collection_name: Optional[str] = None,
        vector_count: Optional[int] = None,
        error: Optional[str] = None,
    ) -> bool:
        global db_conn
        db_conn = check_and_reconnect(db_conn)
        cursor = db_conn.cursor()
        try:
            cursor.execute(
                '''
                INSERT INTO "EmbeddingRecord"
                    (id, "apiKeyId", "targetType", "targetId", status,
                     "collectionName", "vectorCount", attempts, "lastError",
                     "completedAt", "createdAt", "updatedAt")
                VALUES (
                    gen_random_uuid(),
                    %(api_key_id)s, %(target_type)s, %(target_id)s, %(status)s,
                    %(collection_name)s, %(vector_count)s,
                    CASE WHEN %(status)s = 'PROCESSING' THEN 1 ELSE 0 END,
                    %(error)s,
                    CASE WHEN %(status)s = 'COMPLETED' THEN NOW() ELSE NULL END,
                    NOW(), NOW()
                )
                ON CONFLICT ("apiKeyId", "targetType", "targetId") DO UPDATE SET
                    status         = EXCLUDED.status,
                    "collectionName" = COALESCE(EXCLUDED."collectionName", "EmbeddingRecord"."collectionName"),
                    "vectorCount"  = COALESCE(EXCLUDED."vectorCount", "EmbeddingRecord"."vectorCount"),
                    attempts       = "EmbeddingRecord".attempts
                                     + CASE WHEN EXCLUDED.status = 'PROCESSING' THEN 1 ELSE 0 END,
                    "lastError"    = EXCLUDED."lastError",
                    "completedAt"  = COALESCE(EXCLUDED."completedAt", "EmbeddingRecord"."completedAt"),
                    "updatedAt"    = NOW()
                ''',
                {
                    'api_key_id': api_key_id,
                    'target_type': target_type.upper(),
                    'target_id': target_id,
                    'status': status.upper(),
                    'collection_name': collection_name,
                    'vector_count': vector_count,
                    'error': (error or '')[:500] or None,
                },
            )
            db_conn.commit()
            return True
        except Exception as e:
            print(f"❌ Failed to upsert embedding record: {e}")
            try:
                db_conn.rollback()
            except Exception:
                pass
            return False
        finally:
            cursor.close()
