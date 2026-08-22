import express from 'express';
import {
  getPermissionsByRole,
  getAllPermissions,
  savePermissions,
  resetPermissions
} from '../controllers/permissionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

// GET /api/permissions - saare roles ki permissions
router.get('/', protect, checkPermission('Permissions', 'view'), getAllPermissions);

// GET /api/permissions/:role - specific role
router.get('/:role', protect, checkPermission('Permissions', 'view'), getPermissionsByRole);

// PUT /api/permissions/:role - save/update
router.put('/:role', protect, checkPermission('Permissions', 'update'), savePermissions);

// DELETE /api/permissions/:role - reset to defaults
router.delete('/:role', protect, checkPermission('Permissions', 'delete'), resetPermissions);

export default router;