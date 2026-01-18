import { Request, Response } from "express";
import { PostMediaType, PostVisibility, ReactionType } from "@prisma/client";
import { PostMediaInput, PostService } from "../services/post";

const parseTags = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean).map((t) => String(t));
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed.filter(Boolean).map((t) => String(t));
        } catch (e) {
            // fall through to comma split
        }
        return value
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
    }
    return [];
};

const parseMedia = (value: any): PostMediaInput[] => {
    if (!value) return [];

    let raw: any[] = [];
    if (Array.isArray(value)) {
        raw = value;
    } else if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) raw = parsed;
        } catch (e) {
            raw = [];
        }
    }

    return raw
        .filter((item) => item && item.url)
        .map((item) => ({
            url: item.url,
            thumbnail: item.thumbnail ?? null,
            metadata: item.metadata,
            type: Object.values(PostMediaType).includes(item.type) ? item.type : PostMediaType.IMAGE,
        }));
};

const parseMediaFromFiles = (files?: Express.Multer.File[]): PostMediaInput[] => {
    if (!files || files.length === 0) return [];
    return files.map((file) => {
        const mime = file.mimetype || "";
        const type = mime.startsWith("video/")
            ? PostMediaType.VIDEO
            : mime.startsWith("image/")
                ? PostMediaType.IMAGE
                : PostMediaType.FILE;
        return { url: file.path, type, thumbnail: null, metadata: { originalname: file.originalname, mimetype: file.mimetype, size: file.size } };
    });
};

export class PostController {
    public async listPosts(_req: Request, res: Response): Promise<void> {
        try {
            const { posts } = await PostService.listPosts();
            res.status(200).json({ message: "Get posts successful", data: posts });
        } catch (error) {
            res.status(500).json({ message: `Error fetching posts: ${error}` });
            console.error("Error fetching posts:", error);
        }
    }

    public async getPost(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { post } = await PostService.getPostById(id);

            if (!post) {
                res.status(404).json({ message: "Post not found" });
                return;
            }

            res.status(200).json({ message: "Get post successful", data: post });
        } catch (error) {
            res.status(500).json({ message: `Error fetching post: ${error}` });
            console.error("Error fetching post:", error);
        }
    }

    public async createPost(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            if (!user?.id) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            const { content, visibility } = req.body;
            const tags = parseTags(req.body.tags);
            const bodyMedia = parseMedia(req.body.media);
            const fileMedia = parseMediaFromFiles(req.files as Express.Multer.File[] | undefined);
            const media = [...bodyMedia, ...fileMedia];

            const visibilityValue = Object.values(PostVisibility).includes(visibility)
                ? (visibility as PostVisibility)
                : PostVisibility.PUBLIC;

            const { post } = await PostService.createPost({
                authorId: user.id,
                content,
                visibility: visibilityValue,
                tags,
                media,
            });

            res.status(201).json({ message: "Post created successfully", data: post });
        } catch (error) {
            res.status(500).json({ message: `Error creating post: ${error}` });
            console.error("Error creating post:", error);
        }
    }

    public async reactToPost(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            if (!user?.id) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            const { id: postId } = req.params;
            const { type } = req.body;

            const reactionType = Object.values(ReactionType).includes(type)
                ? (type as ReactionType)
                : ReactionType.LIKE;

            const { action, reaction } = await PostService.toggleReaction(postId, user.id, reactionType);
            res.status(200).json({ message: `Reaction ${action}`, action, reaction });
        } catch (error) {
            res.status(500).json({ message: `Error reacting to post: ${error}` });
            console.error("Error reacting to post:", error);
        }
    }

    public async deleteReaction(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            if (!user?.id) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            const { id: postId } = req.params;
            const { deleted } = await PostService.deleteReaction(postId, user.id);
            res.status(200).json({ message: deleted ? "Reaction removed" : "No reaction to remove" });
        } catch (error) {
            res.status(500).json({ message: `Error deleting reaction: ${error}` });
            console.error("Error deleting reaction:", error);
        }
    }

    public async commentOnPost(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            if (!user?.id) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            const { id: postId } = req.params;
            const { content, parentCommentId } = req.body;

            if (!content) {
                res.status(400).json({ message: "Content is required" });
                return;
            }

            const { comment } = await PostService.addComment(postId, user.id, content, parentCommentId);
            res.status(201).json({ message: "Comment added successfully", data: comment });
        } catch (error) {
            res.status(500).json({ message: `Error commenting on post: ${error}` });
            console.error("Error commenting on post:", error);
        }
    }

    public async updateComment(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            if (!user?.id) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            const { commentId } = req.params as { commentId: string };
            const { content } = req.body;
            if (!content) {
                res.status(400).json({ message: "Content is required" });
                return;
            }

            const { comment } = await PostService.updateComment(commentId, user.id, content);
            res.status(200).json({ message: "Comment updated successfully", data: comment });
        } catch (error) {
            const message = String(error);
            const status = message.includes("Forbidden") ? 403 : 500;
            res.status(status).json({ message: `Error updating comment: ${error}` });
            console.error("Error updating comment:", error);
        }
    }

    public async deleteComment(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            if (!user?.id) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            const { id: postId, commentId } = req.params as { id: string; commentId: string };

            // Ensure post exists
            const { post } = await PostService.getPostById(postId);
            if (!post) {
                res.status(404).json({ message: "Post not found" });
                return;
            }

            const isAdmin = (req as any).user?.user_type === "ADMIN";
            const { deletedCount } = await PostService.deleteComment(commentId, isAdmin, user.id);
            res.status(200).json({ message: "Comment deleted successfully", deletedCount });
        } catch (error) {
            const message = String(error);
            const status = message.includes("Forbidden") ? 403 : 500;
            res.status(status).json({ message: `Error deleting comment: ${error}` });
            console.error("Error deleting comment:", error);
        }
    }

    public async updatePost(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            if (!user?.id) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            const { id } = req.params;
            const { post } = await PostService.getPostById(id);
            if (!post) {
                res.status(404).json({ message: "Post not found" });
                return;
            }

            const isAdmin = user.user_type === "ADMIN";
            if (!isAdmin && post.authorId !== user.id) {
                res.status(403).json({ message: "Forbidden: Access to own resources only" });
                return;
            }

            const { content, visibility } = req.body;
            const tags = req.body.tags ? parseTags(req.body.tags) : undefined;
            const bodyMedia = req.body.media ? parseMedia(req.body.media) : undefined;
            const fileMedia = parseMediaFromFiles(req.files as Express.Multer.File[] | undefined);
            const mergedMedia = bodyMedia !== undefined ? [...(bodyMedia || []), ...fileMedia] : fileMedia;

            const visibilityValue = visibility && Object.values(PostVisibility).includes(visibility)
                ? (visibility as PostVisibility)
                : undefined;

            const { post: updated } = await PostService.updatePost(id, {
                content,
                visibility: visibilityValue,
                tags,
                media: mergedMedia,
            });

            res.status(200).json({ message: "Post updated successfully", data: updated });
        } catch (error) {
            const message = String(error);
            const status = message.includes("Forbidden") ? 403 : 500;
            res.status(status).json({ message: `Error updating post: ${error}` });
            console.error("Error updating post:", error);
        }
    }

    public async deletePost(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            if (!user?.id) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            const { id } = req.params;
            const { post } = await PostService.getPostById(id);

            if (!post) {
                res.status(404).json({ message: "Post not found" });
                return;
            }

            const isAdmin = user.user_type === "ADMIN";
            if (!isAdmin && post.authorId !== user.id) {
                res.status(403).json({ message: "Forbidden: Access to own resources only" });
                return;
            }

            await PostService.deletePost(id);
            res.status(200).json({ message: "Post deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: `Error deleting post: ${error}` });
            console.error("Error deleting post:", error);
        }
    }
}
