import express from 'express';
import {
  getSettings,
  createSetting,
  updateSetting,
  toggleSetting,
  deleteSetting
} from '../controllers/settingController.js';

const router = express.Router();

router.route('/:type').get(getSettings).post(createSetting);
router.route('/:type/:id').put(updateSetting).delete(deleteSetting);
router.patch('/:type/:id/toggle', toggleSetting);

export default router;