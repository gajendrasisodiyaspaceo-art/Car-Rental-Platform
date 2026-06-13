import { Otp } from '../models/Otp';
import { OtpPurpose } from '../types';
import { env } from '../config/env';
import { Types } from 'mongoose';

function randomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

interface IssueOptions {
  purpose: OtpPurpose;
  userId?: Types.ObjectId | string;
  bookingId?: Types.ObjectId | string;
  destination?: string;
}

export async function issueOtp(opts: IssueOptions): Promise<string> {
  const code = randomCode();
  const expiresAt = new Date(Date.now() + env.otpTtlMinutes * 60_000);
  await Otp.create({ ...opts, code, expiresAt, consumed: false });
  // NOTE: integrate Twilio/FCM/email delivery here. For now the code is returned
  // to the caller so it can be surfaced in dev / sent by the provider.
  return code;
}

export async function verifyOtp(
  code: string,
  purpose: OtpPurpose,
  match: { userId?: string; bookingId?: string },
): Promise<boolean> {
  const otp = await Otp.findOne({
    code,
    purpose,
    consumed: false,
    expiresAt: { $gt: new Date() },
    ...(match.userId ? { userId: match.userId } : {}),
    ...(match.bookingId ? { bookingId: match.bookingId } : {}),
  });
  if (!otp) return false;
  otp.consumed = true;
  await otp.save();
  return true;
}
