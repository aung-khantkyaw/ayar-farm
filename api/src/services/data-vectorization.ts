import { prisma } from "../prisma/client";
import { redisClient, STREAM_NAMES } from "../config/redis";

export interface PendingItem {
  id: string;
  type: 'post' | 'document' | 'knowledgeBase';
  title: string;
  content?: string;
  author?: string;
  user_type?: string;
  file_urls?: string[];
  embeddingStatus?: string; // set by getAllItemsWithRecords; absent in raw base items
  created_at: Date;

  // Per-API-key record fields (populated when a key context is applied).
  // Missing record for (key, target) = never attempted -> shown as PENDING.
  apiKeyId?: string;
  embeddingModelName?: string;
  collectionName?: string;
  vectorCount?: number;
  attempts?: number;
  lastError?: string;
  hasRecord?: boolean;
}

export interface KeyEmbeddingSummary {
  id: string;
  provider: string;
  llmModelName: string;
  embeddingModelName: string;
  vectorSize: number;
  active: boolean;
  counts: { PENDING: number; PROCESSING: number; COMPLETED: number; FAILED: number };
}

export class DataVectorizationService {

    public static async getAllItems(): Promise<{ items: PendingItem[] }> {
        try {
            const items: PendingItem[] = [];

            // Fetch all posts
            const posts = await prisma.post.findMany({
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    author: {
                        select: {
                            name: true,
                            user_type: true,
                        }
                    }
                }
            });

            posts.forEach(post => {
                items.push({
                    id: post.id,
                    type: 'post',
                    title: post.content?.substring(0, 100) || 'No content',
                    content: post.content || undefined,
                    author: post.author?.name || undefined,
                    user_type: post.author?.user_type ? String(post.author.user_type) : undefined,
                    created_at: post.createdAt,
                });
            });

            // Fetch all documents
            const documents = await prisma.documents.findMany({
                select: {
                    id: true,
                    title: true,
                    author: true,
                    file_urls: true,
                    created_at: true,
                }
            });

            documents.forEach(doc => {
                items.push({
                    id: doc.id,
                    type: 'document',
                    title: doc.title,
                    author: doc.author,
                    file_urls: doc.file_urls,
                    created_at: doc.created_at,
                });
            });

            // Fetch all knowledge base items
            const knowledgeBase = await prisma.knowledgeBase.findMany({
                select: {
                    id: true,
                    title: true,
                    author: true,
                    file_urls: true,
                    created_at: true,
                }
            });

            knowledgeBase.forEach(kb => {
                items.push({
                    id: kb.id,
                    type: 'knowledgeBase',
                    title: kb.title,
                    author: kb.author,
                    file_urls: kb.file_urls,
                    created_at: kb.created_at,
                });
            });

            // Sort by created_at descending
            items.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

            return { items };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    private static async getActiveApiKey() {
        return prisma.apiKey.findFirst({
            where: { active: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * All content items with per-API-key status merged from EmbeddingRecord.
     * - apiKeyId given  -> use that key (must exist)
     * - no apiKeyId     -> use the ACTIVE key
     * - no key at all   -> every item reported as PENDING (nothing tracked)
     * Missing record for (key, target) => status 'PENDING' (never attempted).
     */
    public static async getAllItemsWithRecords(
        apiKeyId?: string
    ): Promise<{ items: PendingItem[]; apiKeyId?: string }> {
        let key: any = null;

        if (apiKeyId) {
            key = await prisma.apiKey.findUnique({ where: { id: apiKeyId } });
            if (!key) throw new Error('ApiKey not found');
        } else {
            key = await this.getActiveApiKey();
        }

        const base = await this.getAllItems();
        if (!key) return { items: base.items };

        const records = await prisma.embeddingRecord.findMany({
            where: { apiKeyId: key.id },
        });
        const byTarget = new Map(
            records.map(r => [`${r.targetType}:${r.targetId}`, r])
        );
        const typeMap: Record<string, string> = {
            post: 'POST',
            document: 'DOCUMENT',
            knowledgeBase: 'KNOWLEDGE_BASE',
        };

        const items = base.items.map(item => {
            const rec = byTarget.get(`${typeMap[item.type]}:${item.id}`);
            if (!rec) {
                return {
                    ...item,
                    apiKeyId: key.id,
                    embeddingModelName: key.embeddingModelName,
                    hasRecord: false,
                    embeddingStatus: 'PENDING', // never attempted for this key
                };
            }
            return {
                ...item,
                embeddingStatus: rec.status,
                apiKeyId: key.id,
                embeddingModelName: key.embeddingModelName,
                collectionName: rec.collectionName ?? undefined,
                vectorCount: rec.vectorCount ?? undefined,
                attempts: rec.attempts,
                lastError: rec.lastError ?? undefined,
                hasRecord: true,
            };
        });

        return { items, apiKeyId: key.id };
    }

    /** Per-API-key vectorization progress across all content. */
    public static async getKeySummary(): Promise<{ keys: KeyEmbeddingSummary[] }> {
        const keys = await prisma.apiKey.findMany({
            orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
        });
        const grouped = await prisma.embeddingRecord.groupBy({
            by: ['apiKeyId', 'status'],
            _count: { _all: true },
        });

        return {
            keys: keys.map(k => {
                const counts = { PENDING: 0, PROCESSING: 0, COMPLETED: 0, FAILED: 0 };
                for (const g of grouped) {
                    if (g.apiKeyId !== k.id) continue;
                    const n = g._count?._all ?? 0;
                    if (g.status in counts) counts[g.status as keyof typeof counts] = n;
                }
                return {
                    id: k.id,
                    provider: k.provider,
                    llmModelName: k.llmModelName,
                    embeddingModelName: k.embeddingModelName,
                    vectorSize: k.vectorSize,
                    active: k.active,
                    counts,
                };
            }),
        };
    }

    public static async updateEmbeddingStatus(
        type: 'post' | 'document' | 'knowledgeBase',
        id: string,
        status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
        apiKeyId?: string
    ): Promise<void> {
        try {
            // Existence check + fetch fields needed for the task payload.
            // (Legacy embeddingStatus columns are gone — EmbeddingRecord is
            // the source of truth; the worker updates it.)
            let record: any = null;
            if (type === 'post') {
                record = await prisma.post.findUnique({
                    where: { id },
                    select: { id: true, content: true, authorId: true },
                });
            } else if (type === 'document') {
                record = await prisma.documents.findUnique({
                    where: { id },
                    select: { id: true, title: true, author: true, file_urls: true },
                });
            } else if (type === 'knowledgeBase') {
                record = await prisma.knowledgeBase.findUnique({
                    where: { id },
                    select: { id: true, title: true, author: true, file_urls: true },
                });
            }

            if (!record) {
                throw new Error(`${type} not found: ${id}`);
            }

            if (status === 'PROCESSING') {
                let payload: any = {
                    id: record.id,
                    type: type,
                };

                // Attribute (and later embed with) a specific api key.
                // Falls back to the ACTIVE key inside the worker when absent.
                if (apiKeyId) {
                    payload.api_key_id = apiKeyId;
                }

                if (type === 'post') {
                    payload.content = record.content || null;
                    payload.author_id = record.authorId || null;
                } else if (type === 'document') {
                    payload.title = record.title || null;
                    payload.author = record.author || null;
                    payload.file_url = record.file_urls && record.file_urls.length > 0 ? record.file_urls[0] : null;
                } else if (type === 'knowledgeBase') {
                    payload.title = record.title || null;
                    payload.author = record.author || null;
                    payload.file_url = record.file_urls && record.file_urls.length > 0 ? record.file_urls[0] : null;
                }

                const streamArgs: string[] = [];
                for (const [key, value] of Object.entries(payload)) {
                    if (value !== null && value !== undefined) {
                        streamArgs.push(key, String(value));
                    }
                }

                const streamId = await redisClient.xadd(
                    STREAM_NAMES.VECTOR_TASK_STREAM,
                    'MAXLEN', '~', 500,
                    '*',
                    ...streamArgs
                ) as string;

                console.log(`✅ [Redis Stream] Enqueued ${type} (ID: ${id}) to Python Worker. Stream ID: ${streamId}`);
            }

        } catch (error) {
            throw new Error(`Database query or Redis push failed: ${String(error)}`);
        }
    }

    public static async bulkUpdateEmbeddingStatus(
        updates: Array<{ type: 'post' | 'document' | 'knowledgeBase'; id: string; status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'; apiKeyId?: string }>,
        apiKeyId?: string
    ): Promise<void> {
        try {

            for (const update of updates) {
                await this.updateEmbeddingStatus(update.type, update.id, update.status, apiKeyId ?? update.apiKeyId);
            }
        } catch (error) {
            throw new Error(`Bulk Database query failed: ${String(error)}`);
        }
    }
}
