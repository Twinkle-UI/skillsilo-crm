import express from 'express';
import {
  getLeads,
  getFilterCounts,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  exportLeads,
  importLeads,
  bulkDeleteLeads,
  bulkAssignLeads,
  bulkChangeStage,
  bulkExportLeads,
   bulkChangeUniversity  // ← ye add karo
} from '../controllers/leadController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Specific routes pehle (dynamic se pehle)
router.post('/bulk/university', bulkChangeUniversity);  // ← ye add karo
router.get('/filters/counts', protect, getFilterCounts);
router.get('/export', protect, exportLeads);
router.post('/import', importLeads);

// Bulk operations
router.post('/bulk/delete', protect, adminOnly, bulkDeleteLeads);
router.post('/bulk/assign', bulkAssignLeads);
router.post('/bulk/stage', bulkChangeStage);
router.post('/bulk/export', bulkExportLeads);

// CRUD routes
router.route('/').get(protect, getLeads).post(createLead);
router.route('/:id').get(protect, getLeadById).put(updateLead).delete(protect, adminOnly, deleteLead);

export default router;