import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { ApiError } from '../utils/ApiError';

/** Current user's notifications (most recent first). */
export async function listNotifications(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const items = await Notification.find({ userId }).sort('-createdAt').limit(50);
  const unread = await Notification.countDocuments({ userId, read: false });
  res.json({ success: true, data: items, meta: { unread } });
}

export async function markNotificationRead(req: Request, res: Response): Promise<void> {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.id },
    { read: true },
    { new: true },
  );
  if (!notification) throw ApiError.notFound('Notification not found');
  res.json({ success: true, data: notification });
}

export async function markAllNotificationsRead(req: Request, res: Response): Promise<void> {
  await Notification.updateMany({ userId: req.user!.id, read: false }, { read: true });
  res.json({ success: true, message: 'All notifications marked read' });
}
