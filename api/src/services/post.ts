import { PostMediaType, PostVisibility, ReactionType } from "@prisma/client";
import { prisma } from "../prisma/client";

export type PostMediaInput = {
    type?: PostMediaType;
    url: string;
    thumbnail?: string | null;
    metadata?: any;
};

export class PostService {
    public static async listPosts(filter?: { authorId?: string; tag?: string }) {
        const where: any = {};
        if (filter?.authorId) {
            where.authorId = filter.authorId;
        }
        if (filter?.tag) {
            where.tags = { has: filter.tag };
        }

        const posts = await prisma.post.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                media: true,
                author: {
                    select: { id: true, name: true, profile_picture: true },
                },
                _count: { select: { reactions: true, comments: true } },
            },
        });

        return { posts };
    }

    public static async getPostById(id: string) {
        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                media: true,
                reactions: true,
                author: {
                    select: { id: true, name: true, profile_picture: true },
                },
                comments: {
                    where: { parentCommentId: null },
                    orderBy: { createdAt: "desc" },
                    include: {
                        author: {
                            select: { id: true, name: true, profile_picture: true },
                        },
                        replies: {
                            orderBy: { createdAt: "asc" },
                            include: {
                                author: {
                                    select: { id: true, name: true, profile_picture: true },
                                },
                            },
                        },
                    },
                },
                _count: { select: { reactions: true, comments: true } },
            },
        });

        return { post };
    }

    public static async getPostByUserId(id: string) {
        const posts = await prisma.post.findMany({
            where: { authorId: id },
            include: {
                media: true,
                reactions: true,
                author: {
                    select: { id: true, name: true, profile_picture: true },
                },
                comments: {
                    where: { parentCommentId: null },
                    orderBy: { createdAt: "desc" },
                    include: {
                        author: {
                            select: { id: true, name: true, profile_picture: true },
                        },
                        replies: {
                            orderBy: { createdAt: "asc" },
                            include: {
                                author: {
                                    select: { id: true, name: true, profile_picture: true },
                                },
                            },
                        },
                    },
                },
                _count: { select: { reactions: true, comments: true } },
            },
        });

        return { posts };
    }

    public static async createPost(params: {
        authorId: string;
        content?: string;
        visibility?: PostVisibility;
        tags?: string[];
        media?: PostMediaInput[];
    }) {
        const { authorId, content, visibility, tags = [], media = [] } = params;

        return await prisma.$transaction(async (tx) => {
            const post = await tx.post.create({
                data: {
                    authorId,
                    content,
                    visibility: visibility || PostVisibility.PUBLIC,
                    tags,
                },
            });

            const normalizedMedia = media
                .filter((item) => item && item.url)
                .map((item) => ({
                    postId: post.id,
                    url: item.url,
                    thumbnail: item.thumbnail ?? null,
                    metadata: item.metadata,
                    type: item.type || PostMediaType.IMAGE,
                }));

            if (normalizedMedia.length > 0) {
                await tx.postMedia.createMany({ data: normalizedMedia });
            }

            const postWithRelations = await tx.post.findUnique({
                where: { id: post.id },
                include: { media: true, author: { select: { id: true, name: true, profile_picture: true } }, _count: { select: { reactions: true, comments: true } } },
            });

            return { post: postWithRelations };
        });
    }

    public static async updatePost(id: string, params: {
        content?: string;
        visibility?: PostVisibility;
        tags?: string[];
        media?: PostMediaInput[];
    }) {
        const { content, visibility, tags, media } = params;

        return await prisma.$transaction(async (tx) => {
            const existing = await tx.post.findUnique({ where: { id } });
            if (!existing) throw new Error("Post not found");

            await tx.post.update({
                where: { id },
                data: {
                    content: content ?? existing.content,
                    visibility: visibility ?? existing.visibility,
                    tags: tags ?? existing.tags,
                },
            });

            if (media) {
                await tx.postMedia.deleteMany({ where: { postId: id } });

                const normalizedMedia = media
                    .filter((item) => item && item.url)
                    .map((item) => ({
                        postId: id,
                        url: item.url,
                        thumbnail: item.thumbnail ?? null,
                        metadata: item.metadata,
                        type: item.type || PostMediaType.IMAGE,
                    }));

                if (normalizedMedia.length > 0) {
                    await tx.postMedia.createMany({ data: normalizedMedia });
                }
            }

            const postWithRelations = await tx.post.findUnique({
                where: { id },
                include: { media: true, author: { select: { id: true, name: true, profile_picture: true } }, _count: { select: { reactions: true, comments: true } } },
            });

            return { post: postWithRelations };
        });
    }

    public static async toggleReaction(postId: string, userId: string, type: ReactionType) {
        return await prisma.$transaction(async (tx) => {
            const existingPost = await tx.post.findUnique({ where: { id: postId } });
            if (!existingPost) {
                throw new Error("Post not found");
            }

            const existingReaction = await tx.postReaction.findUnique({
                where: { postId_userId: { postId, userId } },
            });

            if (existingReaction) {
                if (existingReaction.type === type) {
                    await tx.postReaction.delete({ where: { postId_userId: { postId, userId } } });
                    await tx.post.update({
                        where: { id: postId },
                        data: { reactionCount: { decrement: 1 } },
                    });
                    return { action: "removed" as const, reaction: null };
                }

                const reaction = await tx.postReaction.update({
                    where: { postId_userId: { postId, userId } },
                    data: { type },
                });

                return { action: "updated" as const, reaction };
            }

            const reaction = await tx.postReaction.create({ data: { postId, userId, type } });
            await tx.post.update({
                where: { id: postId },
                data: { reactionCount: { increment: 1 } },
            });

            return { action: "added" as const, reaction };
        });
    }

    public static async deleteReaction(postId: string, userId: string) {
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.postReaction.findUnique({ where: { postId_userId: { postId, userId } } });
            if (!existing) return { deleted: false };

            await tx.postReaction.delete({ where: { postId_userId: { postId, userId } } });
            await tx.post.update({ where: { id: postId }, data: { reactionCount: { decrement: 1 } } });
            return { deleted: true };
        });
    }

    public static async addComment(postId: string, userId: string, content: string, parentCommentId?: string) {
        return await prisma.$transaction(async (tx) => {
            const post = await tx.post.findUnique({ where: { id: postId } });
            if (!post) {
                throw new Error("Post not found");
            }

            const comment = await tx.postComment.create({
                data: {
                    postId,
                    userId,
                    content,
                    parentCommentId: parentCommentId || null,
                },
                include: {
                    author: { select: { id: true, name: true, profile_picture: true } },
                    replies: true,
                },
            });

            await tx.post.update({
                where: { id: postId },
                data: { commentCount: { increment: 1 } },
            });

            return { comment };
        });
    }

    public static async updateComment(commentId: string, userId: string, content: string) {
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.postComment.findUnique({ where: { id: commentId } });
            if (!existing) throw new Error("Comment not found");
            if (existing.userId !== userId) throw new Error("Forbidden");

            const comment = await tx.postComment.update({ where: { id: commentId }, data: { content, isEdited: true } });
            return { comment };
        });
    }

    public static async deleteComment(commentId: string, allowAnyUser = false, userId?: string) {
        return await prisma.$transaction(async (tx) => {
            const comment = await tx.postComment.findUnique({ where: { id: commentId } });
            if (!comment) throw new Error("Comment not found");
            if (!allowAnyUser && userId && comment.userId !== userId) throw new Error("Forbidden");

            const toDelete = await tx.postComment.findMany({
                where: {
                    OR: [{ id: commentId }, { parentCommentId: commentId }],
                },
                select: { id: true },
            });

            const deletedCount = toDelete.length;

            await tx.postComment.deleteMany({
                where: {
                    OR: [{ id: commentId }, { parentCommentId: commentId }],
                },
            });

            await tx.post.update({
                where: { id: comment.postId },
                data: { commentCount: { decrement: deletedCount } },
            });

            return { deletedCount };
        });
    }

    public static async deletePost(postId: string) {
        await prisma.$transaction(async (tx) => {
            await tx.postReaction.deleteMany({ where: { postId } });
            await tx.postComment.deleteMany({ where: { postId } });
            await tx.postMedia.deleteMany({ where: { postId } });
            await tx.post.delete({ where: { id: postId } });
        });
    }
}
