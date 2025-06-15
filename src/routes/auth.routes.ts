import { Router } from "express";
import { loginUser, registerUser } from "../controllers/auth.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router:Router = Router();


// router.route("/login").get(login);
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);



export default router;

