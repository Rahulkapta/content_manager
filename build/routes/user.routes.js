"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
router.route("/").get(auth_middleware_1.verifyJWT, user_controller_1.getAllUsers);
router
    .route("/:id")
    .get(auth_middleware_1.verifyJWT, user_controller_1.getUserById)
    .patch(auth_middleware_1.verifyJWT, user_controller_1.updateUser)
    .delete(auth_middleware_1.verifyJWT, user_controller_1.deleteUser);
router.route("/current-user").get(auth_middleware_1.verifyJWT, user_controller_1.getCurrentUser);
exports.default = router;
