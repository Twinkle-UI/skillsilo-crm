import express from 'express';
import {
  verifyWebhook,
  receiveWebhook,
  receivePabblyWebhook
} from '../controllers/webhookController.js';

const router = express.Router();

// Meta direct webhook (for future use)
router.get('/meta-leads', verifyWebhook);
router.post('/meta-leads', receiveWebhook);

// Pabbly Connect webhook (RECOMMENDED for production)
router.post('/pabbly-leads', receivePabblyWebhook);

export default router;