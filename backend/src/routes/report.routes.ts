import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  reportSummary,
  reportRevenue,
  reportPopularVehicles,
  reportCustomers,
  revenueQuerySchema,
} from '../controllers/report.controller';

const router = Router();

router.use(authenticate, authorize('provider', 'staff', 'admin'));

router.get('/summary', asyncHandler(reportSummary));
router.get('/revenue', validate(revenueQuerySchema), asyncHandler(reportRevenue));
router.get('/popular-vehicles', asyncHandler(reportPopularVehicles));
router.get('/customers', asyncHandler(reportCustomers));

export default router;
