import express from 'express';
import {
  getPermissionsByRole,
  getAllPermissions,
  savePermissions,
  resetPermissions
} from '../controllers/permissionController.js';

const router = express.Router();

// GET /api/permissions - saare roles ki permissions
router.get('/', getAllPermissions);

// GET /api/permissions/:role - specific role
router.get('/:role', getPermissionsByRole);

// PUT /api/permissions/:role - save/update
router.put('/:role', savePermissions);

// DELETE /api/permissions/:role - reset to defaults
router.delete('/:role', resetPermissions);

export default router;