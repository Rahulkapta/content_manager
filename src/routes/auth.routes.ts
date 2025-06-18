import { Router } from "express";
import { loginUser, registerUser, verifyOTP } from "../controllers/auth.controller";

const router:Router = Router();


router.route("/register").post(registerUser);
router.route("/verifyOTP").post(verifyOTP);
router.route("/login").post(loginUser);



export default router;

