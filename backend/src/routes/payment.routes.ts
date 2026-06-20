import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import { listPayments } from '../controllers/payment.controller';

const router = Router();

router.use(authenticate);
router.get('/', asyncHandler(listPayments));

export default router;
