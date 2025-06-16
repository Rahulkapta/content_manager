import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import path from "path";
import { log } from "console";
import { uploadOnCloudinary } from "../utils/cloudinary";

export const publishPost = async (req: Request, res: Response) => {
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
    if (!user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const contentfilePath = file.path;
    // console.log(contentfilePath);
    if (!contentfilePath) {
      return res.status(400).json({ message: "file is required." });
    }
    const contentFile = await uploadOnCloudinary(String(contentfilePath));
    if (!contentFile?.url) {
      return res.status(500).json({ message: "Cloudinary upload failed" });
    }

    const newPost = await prisma.post.create({
      data: {
        title,
        content: contentFile?.url, // fallback if only file is uploaded
        published: true,
        authorId: user.id,
      },
    });

    return res.status(201).json({
      message: "Post published successfully",
      post: newPost,
    });
  } catch (error) {
    console.error("Error publishing post:", error);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
};

export const deletePost = async (req: Request, res: Response) => {
  const postId = parseInt(req.params.id);
  // console.log(postId)
  const loggedInUserId = (req as any).user?.id; // assuming user id is attached via middleware
  // console.log(loggedInUserId);

  if (isNaN(postId)) {
    return res.status(400).json({ message: "Invalid post ID" });
  }

  if (!loggedInUserId) {
    return res.status(401).json({ message: "Unauthorized: No user ID found" });
  }

  try {
    const post = await prisma.post.findUnique({
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

    const deletedPost = await prisma.post.delete({
      where: { id: postId },
    });
    // console.log(deletedPost)

    return res
      .status(200)
      .json({ deletedPost, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  const postId = parseInt(req.params.id);

  if (isNaN(postId)) {
    return res.status(400).json({ message: "Invalid post ID" });
  }

  try {
    const post = await prisma.post.findUnique({
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
  } catch (error) {
    console.error("Error fetching post:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const listPosts = async (req: Request, res: Response) => {
  const { authorId, published } = req.query;

  try {
    const filters: any = {};

    if (authorId) {
      filters.authorId = parseInt(authorId as string);
    }

    if (published !== undefined) {
      filters.published = published === "true";
    }

    const posts = await prisma.post.findMany({
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
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updatePost = async (req: Request, res: Response) => {
  const postId = parseInt(req.params.id);
  const loggedInUserId = (req as any).user?.id;
  const file = req.file;
  const { title, published } = req.body;

  if (isNaN(postId)) {
    return res.status(400).json({ message: "Invalid post ID" });
  }

  if (!loggedInUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const postFileLocalPath = file?.path;

  if (!title && !published && !postFileLocalPath) {
    return res.status(400).json({
      message:
        "At least one field (title, published or content file) is required to update.",
    });
  }

  try {
    const post = await prisma.post.findUnique({
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
      const uploadedFile = await uploadOnCloudinary(String(postFileLocalPath));
      if (!uploadedFile?.url) {
        console.error(
          `[UpdatePost] Cloudinary upload failed for path: ${postFileLocalPath}`
        );
        return res.status(500).json({ message: "Failed to upload file" });
      }
      newContentUrl = uploadedFile.url;
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title: title || post.title,
        content: newContentUrl,
        published:
          published !== undefined ? published === "true" : post.published,
      },
    });

    return res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
