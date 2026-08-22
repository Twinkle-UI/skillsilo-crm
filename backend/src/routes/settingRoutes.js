import express from 'express';
import {
  getSettings,
  createSetting,
  updateSetting,
  toggleSetting,
  deleteSetting
} from '../controllers/settingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkSettingPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.route('/:type')
  .get(protect, checkSettingPermission('view'), getSettings)
  .post(protect, checkSettingPermission('create'), createSetting);
router.route('/:type/:id')
  .put(protect, checkSettingPermission('update'), updateSetting)
  .delete(protect, checkSettingPermission('delete'), deleteSetting);
router.patch('/:type/:id/toggle', protect, checkSettingPermission('update'), toggleSetting);

export default router;