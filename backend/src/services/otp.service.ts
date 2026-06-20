import { randomInt } from 'crypto';
import { Otp } from '../models/Otp';
import { OtpPurpose } from '../types';
import { env } from '../config/env';
import { Types } from 'mongoose';

/** Wrong guesses allowed against a single issued OTP before it is burned. */
export const MAX_OTP_ATTEMPTS = 5;

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

  // Invalidate any still-active OTP for the same target + purpose so only the
  // latest code is valid and stale codes can't be brute-forced in parallel.
  await Otp.updateMany(
    {
      purpose: opts.purpose,
      consumed: false,
      ...(opts.userId ? { userId: opts.userId } : {}),
      ...(opts.bookingId ? { bookingId: opts.bookingId } : {}),
    },
    { $set: { consumed: true } },
  );

  await Otp.create({ ...opts, code, expiresAt, consumed: false, attempts: 0 });
  // NOTE: integrate Twilio/FCM/email delivery here. Until then, surface the code
  // on the server log in non-production only — never in an API response.
  if (env.nodeEnv !== 'production') {
    const target = opts.destination ?? opts.userId ?? opts.bookingId ?? 'unknown';
    console.log(`[otp] ${opts.purpose} code for ${String(target)}: ${code}`);
  }
  return code;
}

/**
 * Pure decision for a single verify attempt against a known OTP record.
 * Side-effect free so it is unit-testable without a database.
 */
export function evaluateOtpAttempt(
  otp: { code: string; attempts: number },
  code: string,
  maxAttempts: number = MAX_OTP_ATTEMPTS,
): { matched: boolean; consume: boolean; attempts: number } {
  if (otp.code === code) {
    return { matched: true, consume: true, attempts: otp.attempts };
  }
  const attempts = otp.attempts + 1;
  // Burn the code once the wrong-guess cap is reached, regardless of source IP.
  return { matched: false, consume: attempts >= maxAttempts, attempts };
}

export async function verifyOtp(
  code: string,
  purpose: OtpPurpose,
  match: { userId?: string; bookingId?: string },
): Promise<boolean> {
  // Look up the active OTP by target (not by code) so a wrong guess still maps
  // to a record we can charge an attempt against and eventually lock out.
  const otp = await Otp.findOne({
    purpose,
    consumed: false,
    expiresAt: { $gt: new Date() },
    ...(match.userId ? { userId: match.userId } : {}),
    ...(match.bookingId ? { bookingId: match.bookingId } : {}),
  }).sort('-createdAt');
  if (!otp) return false;

  const result = evaluateOtpAttempt(otp, code);
  otp.attempts = result.attempts;
  if (result.consume) otp.consumed = true;
  await otp.save();
  return result.matched;
}
