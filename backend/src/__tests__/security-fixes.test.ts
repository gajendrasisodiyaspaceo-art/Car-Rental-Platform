/**
 * Regression tests for the high-severity security fixes (SEC-008, SEC-017, SEC-003).
 * Self-contained — run with: npx ts-node --transpile-only src/__tests__/security-fixes.test.ts
 * No test framework yet in this repo; this is a runnable assert-based harness.
 */
import assert from 'assert';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { sanitizeMongo, stripOperators } from '../middleware/sanitize';
import { evaluateOtpAttempt, MAX_OTP_ATTEMPTS } from '../services/otp.service';
import { rateLimit } from '../middleware/rateLimit';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/User';
import { vehicleUpdateSchema } from '../controllers/vehicle.controller';
import { toErrorResponse } from '../middleware/error';

let passed = 0;
function test(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${(err as Error).message}`);
    process.exitCode = 1;
  }
}

console.log('SEC-008 — strip Mongo operator keys');
test('removes $-prefixed operators (top level and nested)', () => {
  const out = stripOperators({ status: { $ne: 'x' }, provider: { $gt: '' } });
  assert.deepStrictEqual(out, { status: {}, provider: {} });
});
test('removes dotted keys', () => {
  const out = stripOperators({ 'a.b': 1, ok: 2 });
  assert.deepStrictEqual(out, { ok: 2 });
});
test('preserves plain scalar filters', () => {
  const out = stripOperators({ status: 'available', categoryId: 'abc' });
  assert.deepStrictEqual(out, { status: 'available', categoryId: 'abc' });
});
test('sanitizes inside arrays', () => {
  const out = stripOperators({ list: [{ $where: 'evil' }, { ok: 1 }] });
  assert.deepStrictEqual(out, { list: [{}, { ok: 1 }] });
});
test('middleware mutates req.query / body / params in place', () => {
  const req = {
    query: { status: { $ne: 'x' } },
    body: { name: 'ok', $set: { role: 'admin' } },
    params: {},
  } as unknown as Request;
  let nexted = false;
  sanitizeMongo(req, {} as Response, () => {
    nexted = true;
  });
  assert.strictEqual(nexted, true);
  assert.deepStrictEqual(req.query, { status: {} });
  assert.deepStrictEqual(req.body, { name: 'ok' });
});

console.log('SEC-017 — OTP attempt cap');
test('correct code matches and consumes', () => {
  const r = evaluateOtpAttempt({ code: '123456', attempts: 0 }, '123456', MAX_OTP_ATTEMPTS);
  assert.strictEqual(r.matched, true);
  assert.strictEqual(r.consume, true);
});
test('wrong code below cap: no match, not burned, attempts incremented', () => {
  const r = evaluateOtpAttempt({ code: '123456', attempts: 0 }, '000000', MAX_OTP_ATTEMPTS);
  assert.strictEqual(r.matched, false);
  assert.strictEqual(r.consume, false);
  assert.strictEqual(r.attempts, 1);
});
test('wrong code reaching cap burns the code', () => {
  const r = evaluateOtpAttempt(
    { code: '123456', attempts: MAX_OTP_ATTEMPTS - 1 },
    '000000',
    MAX_OTP_ATTEMPTS,
  );
  assert.strictEqual(r.matched, false);
  assert.strictEqual(r.consume, true);
});

console.log('SEC-003 — per-key rate limiting');
function fakeRes(): Response & { headers: Record<string, string> } {
  const headers: Record<string, string> = {};
  return {
    headers,
    setHeader(k: string, v: string | number) {
      headers[String(k).toLowerCase()] = String(v);
    },
  } as unknown as Response & { headers: Record<string, string> };
}
test('different keys are limited independently', () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 2, keyGenerator: (req) => (req.body as { k: string }).k });
  const run = (k: string) => {
    const req = { ip: '1.1.1.1', body: { k } } as unknown as Request;
    limiter(req, fakeRes(), () => {});
  };
  run('a'); run('a');                 // 2 allowed for key a
  run('b'); run('b');                 // key b independent — still allowed
  assert.throws(() => run('a'), (e) => e instanceof ApiError && (e as ApiError).statusCode === 429);
});
test('sets Retry-After header when throttled', () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 1 });
  const req = { ip: '9.9.9.9', body: {} } as unknown as Request;
  limiter(req, fakeRes(), () => {});
  const res = fakeRes();
  try {
    limiter(req, res, () => {});
    assert.fail('expected 429');
  } catch (e) {
    assert.ok(e instanceof ApiError && e.statusCode === 429);
    assert.ok(Number(res.headers['retry-after']) > 0, 'Retry-After must be a positive number');
  }
});

console.log('SEC-006 — user serialization never leaks the password hash');
test('User.toJSON strips password and __v', () => {
  const u = new User({ name: 'A', email: 'a@b.com', password: 'secret123', role: 'customer' });
  const json = u.toJSON() as Record<string, unknown>;
  assert.ok(!('password' in json), 'password must not serialize');
  assert.ok(!('__v' in json), '__v must not serialize');
  assert.strictEqual(json.name, 'A');
});

console.log('SEC-009 — strict update schemas block mass assignment');
test('rejects fields outside the schema (e.g. providerId)', () => {
  assert.throws(() => vehicleUpdateSchema.parse({ body: { providerId: 'x', status: 'available' } }));
});
test('accepts a partial set of known fields', () => {
  const r = vehicleUpdateSchema.parse({ body: { status: 'available' } });
  assert.deepStrictEqual(r.body, { status: 'available' });
});

console.log('SEC-013 — error responses are sanitized');
test('ApiError passes through with its status and message', () => {
  const r = toErrorResponse(ApiError.badRequest('nope'));
  assert.strictEqual(r.statusCode, 400);
  assert.strictEqual(r.body.message, 'nope');
});
test('unknown Error collapses to a generic 500 (no raw message leak)', () => {
  const r = toErrorResponse(new Error('E11000 duplicate key db.users index email_1'));
  assert.strictEqual(r.statusCode, 500);
  assert.strictEqual(r.body.message, 'Internal server error');
});
test('duplicate-key (11000) maps to a generic 409', () => {
  const r = toErrorResponse({ code: 11000, message: 'leaky mongo text' });
  assert.strictEqual(r.statusCode, 409);
  assert.strictEqual(r.body.message, 'Duplicate value');
});
test('Mongoose CastError maps to a sanitized 400', () => {
  const r = toErrorResponse(new mongoose.Error.CastError('ObjectId', 'abc', '_id'));
  assert.strictEqual(r.statusCode, 400);
  assert.strictEqual(r.body.message, 'Invalid identifier');
});

console.log(`\n${passed} assertions passed`);
if (process.exitCode) console.error('\nFAILED');
else console.log('ALL GREEN');
