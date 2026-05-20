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

const router = express.Router();

// Specific routes pehle
router.get('/filters/counts', getFollowUpCounts);
router.get('/lead/:leadId', getFollowUpsByLead);
router.get('/export', exportFollowUps);

// CRUD routes
router.route('/').get(getFollowUps).post(createFollowUp);
router.route('/:id').put(updateFollowUp).delete(deleteFollowUp);

export default router;