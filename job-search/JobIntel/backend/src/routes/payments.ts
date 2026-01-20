import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getPricing, createOrder, verifyPayment, razorpayWebhook } from '../controllers/paymentsController';

const router = Router();

router.get('/', getPricing);
router.post('/create-order', authenticateToken, createOrder);
router.post('/verify', authenticateToken, verifyPayment);
// webhook (no auth)
router.post('/webhook', razorpayWebhook);

export default router;
