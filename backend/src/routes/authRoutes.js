import express from "express";
import { login, refreshToken, logout, registerWithInvite } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.post("/register", registerWithInvite);

export default router;
