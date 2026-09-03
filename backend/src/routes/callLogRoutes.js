import express from 'express';
import { clearAllCallLogs } from '../controllers/callLogController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Sirf admin - saare Call Logs permanently delete karta hai
router.delete('/clear-all', protect, adminOnly, clearAllCallLogs);

export default router;