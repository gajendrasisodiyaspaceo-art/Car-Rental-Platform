import { Schema, model, Document, Types } from 'mongoose';
import { NOTIFICATION_TYPES, NotificationType } from '../types';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  body?: string;
  bookingId?: Types.ObjectId;
  read: boolean;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    body: String,
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

export const Notification = model<INotification>('Notification', notificationSchema);
