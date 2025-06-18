import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import {
  deletePost,
  getPostById,
  listPosts,
  publishPost,
  updatePost,
  
} from "../controllers/post.controller";
const router: Router = Router();
router.route("/posts").get(verifyJWT,listPosts);
router.route("/publish").post(verifyJWT, upload.single("content"), publishPost);
router.route("/posts/:id").get(verifyJWT, getPostById).patch(verifyJWT,upload.single("content"), updatePost).delete(verifyJWT, deletePost);

export default router;
