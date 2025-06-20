import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import {
  createUserDetails,
  getUserDetails,
  updateProfilePicture,
} from "../controllers/userDetails.controller";

const router: Router = Router();

router
  .route("/update-picture")
  .post(verifyJWT, upload.single("profilePicture"), updateProfilePicture);
router.route("/update-UserDetails").post(verifyJWT, createUserDetails);
router.route("/UserDetails").get(verifyJWT, getUserDetails);

export default router;
