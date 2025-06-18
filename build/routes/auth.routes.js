"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
router.route("/register").post(auth_controller_1.registerUser);
router.route("/verifyOTP").post(auth_controller_1.verifyOTP);
router.route("/login").post(auth_controller_1.loginUser);
exports.default = router;
