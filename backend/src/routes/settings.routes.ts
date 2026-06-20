import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  getSettings,
  updateSettings,
  getPublicSettings,
  settingsSchema,
} from '../controllers/settings.controller';

const router = Router();

// Public branding for white-label theming on the customer app.
router.get('/public', asyncHandler(getPublicSettings));

// Provider-managed branding/settings.
router.use(authenticate, authorize('provider', 'staff'));
router.get('/', asyncHandler(getSettings));
router.put('/', validate(settingsSchema), asyncHandler(updateSettings));

export default router;
