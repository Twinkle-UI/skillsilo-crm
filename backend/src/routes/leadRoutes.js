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
  bulkExportLeads
} from '../controllers/leadController.js';

const router = express.Router();

// Specific routes pehle (dynamic se pehle)
router.get('/filters/counts', getFilterCounts);
router.get('/export', exportLeads);
router.post('/import', importLeads);

// Bulk operations
router.post('/bulk/delete', bulkDeleteLeads);
router.post('/bulk/assign', bulkAssignLeads);
router.post('/bulk/stage', bulkChangeStage);
router.post('/bulk/export', bulkExportLeads);

// CRUD routes
router.route('/').get(getLeads).post(createLead);
router.route('/:id').get(getLeadById).put(updateLead).delete(deleteLead);

export default router;