import { Types } from 'mongoose';
import { Notification } from '../models/Notification';
import { NotificationType } from '../types';

interface NotifyPayload {
  type: NotificationType;
  title: string;
  body?: string;
  bookingId?: Types.ObjectId | string;
}

/**
 * Records an in-app notification. Real push/SMS/email delivery (FCM/Twilio) is a
 * later phase — this persists the notification so clients can poll GET /notifications.
 * Never throws: a notification failure must not break the originating action.
 */
export async function notify(
  userId: Types.ObjectId | string,
  payload: NotifyPayload,
): Promise<void> {
  try {
    await Notification.create({ userId, read: false, ...payload });
  } catch (err) {
    console.error('[notification] failed to record', err);
  }
}
