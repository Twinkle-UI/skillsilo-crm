import express from 'express';
import Setting from '../models/Setting.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/universities - header ke University-switcher dropdown ke liye.
// Jaanbujh ke checkSettingPermission('view') nahi lagaya - ye "Settings >
// University" management page ki permission se alag hai. Har logged-in
// role (admin ho ya na ho) ko apna active data-context switch karne ka
// access milna chahiye, isliye sirf login (protect) required hai.
router.get('/', protect, async (req, res) => {
  try {
    const universities = await Setting.find({ type: 'university', isActive: true })
      .select('name')
      .sort({ name: 1 })
      .lean();

    res.json({ success: true, data: universities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;