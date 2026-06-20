import { Router } from 'express';
import authRoutes from './auth.routes';
import vehicleRoutes from './vehicle.routes';
import categoryRoutes from './category.routes';
import branchRoutes from './branch.routes';
import bookingRoutes from './booking.routes';
import paymentRoutes from './payment.routes';
import discountRoutes from './discount.routes';
import notificationRoutes from './notification.routes';
import reportRoutes from './report.routes';
import adminRoutes from './admin.routes';
import staffRoutes from './staff.routes';
import settingsRoutes from './settings.routes';
import reviewRoutes from './review.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/categories', categoryRoutes);
router.use('/branches', branchRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/discounts', discountRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);
router.use('/staff', staffRoutes);
router.use('/settings', settingsRoutes);
router.use('/reviews', reviewRoutes);

export default router;
