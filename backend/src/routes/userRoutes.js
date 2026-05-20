import express from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  toggleUser,
  deleteUser
} from '../controllers/userController.js';

const router = express.Router();

router.route('/').get(getUsers).post(createUser);
router.route('/:id').put(updateUser).delete(deleteUser);
router.patch('/:id/toggle', toggleUser);

export default router;