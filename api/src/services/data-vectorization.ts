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
  embeddingStatus: string;
  created_at: Date;
}

export class DataVectorizationService {
    public static async getPendingItems(): Promise<{ items: PendingItem[] }> {
        try {
            const items: PendingItem[] = [];

            // Fetch pending posts
            const posts = await prisma.post.findMany({
                where: { embeddingStatus: 'PENDING' },
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    embeddingStatus: true,
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
                    embeddingStatus: post.embeddingStatus,
                    created_at: post.createdAt,
                });
            });

            // Fetch pending documents
            const documents = await prisma.documents.findMany({
                where: { embeddingStatus: 'PENDING' },
                select: {
                    id: true,
                    title: true,
                    author: true,
                    file_urls: true,
                    embeddingStatus: true,
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
                    embeddingStatus: doc.embeddingStatus,
                    created_at: doc.created_at,
                });
            });

            // Fetch pending knowledge base items
            const knowledgeBase = await prisma.knowledgeBase.findMany({
                where: { embeddingStatus: 'PENDING' },
                select: {
                    id: true,
                    title: true,
                    author: true,
                    file_urls: true,
                    embeddingStatus: true,
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
                    embeddingStatus: kb.embeddingStatus,
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

    public static async getAllItems(): Promise<{ items: PendingItem[] }> {
        try {
            const items: PendingItem[] = [];

            // Fetch all posts
            const posts = await prisma.post.findMany({
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    embeddingStatus: true,
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
                    embeddingStatus: post.embeddingStatus,
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
                    embeddingStatus: true,
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
                    embeddingStatus: doc.embeddingStatus,
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
                    embeddingStatus: true,
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
                    embeddingStatus: kb.embeddingStatus,
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

    public static async updateEmbeddingStatus(
        type: 'post' | 'document' | 'knowledgeBase',
        id: string,
        status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    ): Promise<void> {
        try {
            let updatedRecord: any = null;
            if (type === 'post') {
                updatedRecord = await prisma.post.update({
                    where: { id },
                    data: { embeddingStatus: status }
                });
            } else if (type === 'document') {
                updatedRecord = await prisma.documents.update({
                    where: { id },
                    data: { embeddingStatus: status }
                });
            } else if (type === 'knowledgeBase') {
                updatedRecord = await prisma.knowledgeBase.update({
                    where: { id },
                    data: { embeddingStatus: status }
                });
            }

            if (status === 'PROCESSING' && updatedRecord) {
                let payload: any = {
                    id: updatedRecord.id,
                    type: type,
                };

                if (type === 'post') {
                    payload.content = updatedRecord.content || null;
                    payload.author_id = updatedRecord.authorId || null;
                } else if (type === 'document') {
                    payload.title = updatedRecord.title || null;
                    payload.author = updatedRecord.author || null;
                    payload.file_url = updatedRecord.file_urls && updatedRecord.file_urls.length > 0 ? updatedRecord.file_urls[0] : null;
                } else if (type === 'knowledgeBase') {
                    payload.title = updatedRecord.title || null;
                    payload.author = updatedRecord.author || null;
                    payload.file_url = updatedRecord.file_urls && updatedRecord.file_urls.length > 0 ? updatedRecord.file_urls[0] : null;
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
        updates: Array<{ type: 'post' | 'document' | 'knowledgeBase'; id: string; status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' }>
    ): Promise<void> {
        try {

            for (const update of updates) {
                await this.updateEmbeddingStatus(update.type, update.id, update.status);
            }
        } catch (error) {
            throw new Error(`Bulk Database query failed: ${String(error)}`);
        }
    }
}
