import express from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  toggleUser,
  deleteUser
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

// Sab routes login required, aur role ke 'Users' page permissions ke hisaab se
router.route('/')
  .get(protect, checkPermission('Users', 'view'), getUsers)
  .post(protect, checkPermission('Users', 'create'), createUser);
router.route('/:id')
  .put(protect, checkPermission('Users', 'update'), updateUser)
  .delete(protect, checkPermission('Users', 'delete'), deleteUser);
router.patch('/:id/toggle', protect, checkPermission('Users', 'update'), toggleUser);

export default router;