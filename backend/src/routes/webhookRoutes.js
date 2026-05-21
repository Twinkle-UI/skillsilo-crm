import express from 'express';
import {
  verifyWebhook,
  receiveWebhook
} from '../controllers/webhookController.js';

const router = express.Router();

// Meta Lead Ads webhook
// GET = Verification (one-time on subscription)
// POST = Receive leads (every new lead)
router.get('/meta-leads', verifyWebhook);
router.post('/meta-leads', receiveWebhook);

export default router;