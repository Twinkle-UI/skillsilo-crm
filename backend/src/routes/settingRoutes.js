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

// GET yahaan jaanbujh ke checkSettingPermission se gated NAHI hai - Stage/
// Reason/Category/Source/etc. jaisi lists sirf "Settings" management page
// ke liye nahi hain, ye Leads/Follow-Ups forms (dropdowns) me bhi chahiye
// hoti hain. Har logged-in role ko ye padhne ka access chahiye, chahe
// unke paas Settings-page ka permission ho ya na ho. Sirf login required.
router.route('/:type')
  .get(protect, getSettings)
  .post(protect, checkSettingPermission('create'), createSetting);
router.route('/:type/:id')
  .put(protect, checkSettingPermission('update'), updateSetting)
  .delete(protect, checkSettingPermission('delete'), deleteSetting);
router.patch('/:type/:id/toggle', protect, checkSettingPermission('update'), toggleSetting);

export default router;