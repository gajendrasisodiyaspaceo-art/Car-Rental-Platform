import { randomInt } from 'crypto';
import { Otp } from '../models/Otp';
import { OtpPurpose } from '../types';
import { env } from '../config/env';
import { Types } from 'mongoose';

function randomCode(): string {
  return String(randomInt(100000, 1000000));
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
  // NOTE: integrate Twilio/FCM/email delivery here. Until then, surface the code
  // on the server log in non-production only — never in an API response.
  if (env.nodeEnv !== 'production') {
    const target = opts.destination ?? opts.userId ?? opts.bookingId ?? 'unknown';
    console.log(`[otp] ${opts.purpose} code for ${String(target)}: ${code}`);
  }
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
