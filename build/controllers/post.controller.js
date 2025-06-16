"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePost = exports.listPosts = exports.getPostById = exports.deletePost = exports.publishPost = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const cloudinary_1 = require("../utils/cloudinary");
const publishPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title } = req.body;
        const file = req.file;
        // console.log(req.file);
        if (!title || !file) {
            return res
                .status(400)
                .json({ message: "Title and content or media are required." });
        }
        const user = req.user;
        if (!(user === null || user === void 0 ? void 0 : user.id)) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const contentfilePath = file.path;
        // console.log(contentfilePath);
        if (!contentfilePath) {
            return res.status(400).json({ message: "file is required." });
        }
        const contentFile = yield (0, cloudinary_1.uploadOnCloudinary)(String(contentfilePath));
        if (!(contentFile === null || contentFile === void 0 ? void 0 : contentFile.url)) {
            return res.status(500).json({ message: "Cloudinary upload failed" });
        }
        const newPost = yield prisma.post.create({
            data: {
                title,
                content: contentFile === null || contentFile === void 0 ? void 0 : contentFile.url, // fallback if only file is uploaded
                published: true,
                authorId: user.id,
            },
        });
        return res.status(201).json({
            message: "Post published successfully",
            post: newPost,
        });
    }
    catch (error) {
        console.error("Error publishing post:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.publishPost = publishPost;
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const postId = parseInt(req.params.id);
    // console.log(postId)
    const loggedInUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // assuming user id is attached via middleware
    // console.log(loggedInUserId);
    if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
    }
    if (!loggedInUserId) {
        return res.status(401).json({ message: "Unauthorized: No user ID found" });
    }
    try {
        const post = yield prisma.post.findUnique({
            where: { id: postId },
        });
        // console.log(post)
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.authorId !== loggedInUserId) {
            return res
                .status(403)
                .json({ message: "Forbidden: You can only delete your own posts" });
        }
        const deletedPost = yield prisma.post.delete({
            where: { id: postId },
        });
        // console.log(deletedPost)
        return res
            .status(200)
            .json({ deletedPost, message: "Post deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting post:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.deletePost = deletePost;
const getPostById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
    }
    try {
        const post = yield prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                comments: true, // include comments if needed
            },
        });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        return res.status(200).json(post);
    }
    catch (error) {
        console.error("Error fetching post:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.getPostById = getPostById;
const listPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { authorId, published } = req.query;
    try {
        const filters = {};
        if (authorId) {
            filters.authorId = parseInt(authorId);
        }
        if (published !== undefined) {
            filters.published = published === "true";
        }
        const posts = yield prisma.post.findMany({
            where: filters,
            include: {
                author: {
                    select: { id: true, name: true, email: true },
                },
                comments: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return res.status(200).json(posts);
    }
    catch (error) {
        console.error("Error fetching posts:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.listPosts = listPosts;
const updatePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const postId = parseInt(req.params.id);
    const loggedInUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const file = req.file;
    const { title, published } = req.body;
    if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
    }
    if (!loggedInUserId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const postFileLocalPath = file === null || file === void 0 ? void 0 : file.path;
    if (!title && !published && !postFileLocalPath) {
        return res.status(400).json({
            message: "At least one field (title, published or content file) is required to update.",
        });
    }
    try {
        const post = yield prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.authorId !== loggedInUserId) {
            return res.status(403).json({
                message: "Forbidden: You can only update your own posts",
            });
        }
        let newContentUrl = post.content;
        if (postFileLocalPath) {
            const uploadedFile = yield (0, cloudinary_1.uploadOnCloudinary)(String(postFileLocalPath));
            if (!(uploadedFile === null || uploadedFile === void 0 ? void 0 : uploadedFile.url)) {
                console.error(`[UpdatePost] Cloudinary upload failed for path: ${postFileLocalPath}`);
                return res.status(500).json({ message: "Failed to upload file" });
            }
            newContentUrl = uploadedFile.url;
        }
        const updatedPost = yield prisma.post.update({
            where: { id: postId },
            data: {
                title: title || post.title,
                content: newContentUrl,
                published: published !== undefined ? published === "true" : post.published,
            },
        });
        return res.status(200).json(updatedPost);
    }
    catch (error) {
        console.error("Error updating post:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.updatePost = updatePost;
