import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
    deleteUser,
  getAllUsers,
  getCurrentUser,
  getUserById,
  updateUser,
} from "../controllers/user.controller";

const router: Router = Router();

router.route("/").get(verifyJWT, getAllUsers);
router
  .route("/:id")
  .get(verifyJWT, getUserById)
  .patch(verifyJWT, updateUser)
  .delete(verifyJWT, deleteUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);

export default router;
