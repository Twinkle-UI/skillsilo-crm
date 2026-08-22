import express from "express";
import {
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes (require login)
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);

export default router;