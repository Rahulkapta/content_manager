import { Router } from "express";
import { getCurrentUser, login, loginUser, registerUser } from "../controllers/auth.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router:Router = Router();


// router.route("/login").get(login);
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);



export default router;

