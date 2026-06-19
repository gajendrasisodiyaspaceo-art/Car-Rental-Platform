import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  listVehicles,
  getVehicle,
  checkAvailability,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  vehicleBodySchema,
} from '../controllers/vehicle.controller';
import { listVehicleReviews } from '../controllers/review.controller';

const router = Router();

// Public browse + details
router.get('/', asyncHandler(listVehicles));
router.get('/:id', asyncHandler(getVehicle));
router.get('/:id/availability', asyncHandler(checkAvailability));
router.get('/:id/reviews', asyncHandler(listVehicleReviews));

// Provider-managed
router.post(
  '/',
  authenticate,
  authorize('provider', 'staff'),
  validate(vehicleBodySchema),
  asyncHandler(createVehicle),
);
router.put('/:id', authenticate, authorize('provider', 'staff'), asyncHandler(updateVehicle));
router.delete('/:id', authenticate, authorize('provider', 'staff'), asyncHandler(deleteVehicle));

export default router;
