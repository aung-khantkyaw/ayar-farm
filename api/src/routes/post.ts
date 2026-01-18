import { Router } from "express";
import { PostController } from "../controllers/post";
import { authenticate } from "../middlewares";
import { uploadResource } from "../middlewares/upload";

const post = Router();
const postController = new PostController();

post.get("/", (_req, res) => res.json({ ok: true, message: "Post API is running" }));
post.get("/posts", (req, res) => postController.listPosts(req, res));
post.get("/posts/:id", (req, res) => postController.getPost(req, res));

post.post("/posts", authenticate, uploadResource.array("media"), (req, res) => postController.createPost(req, res));
post.post("/posts/:id/react", authenticate, (req, res) => postController.reactToPost(req, res));
post.post("/posts/:id/comments", authenticate, (req, res) => postController.commentOnPost(req, res));

post.put("/posts/:id", authenticate, uploadResource.array("media"), (req, res) => postController.updatePost(req, res));
post.put("/posts/:id/comments/:commentId", authenticate, (req, res) => postController.updateComment(req, res));

post.delete("/posts/:id/react", authenticate, (req, res) => postController.deleteReaction(req, res));
post.delete("/posts/:id/comments/:commentId", authenticate, (req, res) => postController.deleteComment(req, res));
post.delete("/posts/:id", authenticate, (req, res) => postController.deletePost(req, res));

export default post;
