import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  vehicleBodySchema,
} from '../controllers/vehicle.controller';

const router = Router();

// Public browse + details
router.get('/', asyncHandler(listVehicles));
router.get('/:id', asyncHandler(getVehicle));

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
