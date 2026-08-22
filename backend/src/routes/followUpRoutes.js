import express from 'express';
import {
  getFollowUps,
  getFollowUpCounts,
  getFollowUpsByLead,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  exportFollowUps
} from '../controllers/followUpController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Note: frontend abhi Follow-Ups ko granular permission (view/create/update/
// delete) se gate nahi karta - koi bhi logged-in user sab kar sakta hai.
// Yahaan 'protect' laga ke sirf ye ensure kiya hai ki bina login ke koi
// access na kar sake. Agar aage granular control chahiye ho (jaisa Leads/
// Settings me hai), checkPermission('Follow-Ups', action) add kar dena.

// Specific routes pehle
router.get('/filters/counts', protect, getFollowUpCounts);
router.get('/lead/:leadId', protect, getFollowUpsByLead);
router.get('/export', protect, exportFollowUps);

// CRUD routes
router.route('/').get(protect, getFollowUps).post(protect, createFollowUp);
router.route('/:id').put(protect, updateFollowUp).delete(protect, deleteFollowUp);

export default router;