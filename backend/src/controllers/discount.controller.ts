import { Request, Response } from 'express';
import { z } from 'zod';
import { Discount } from '../models/Discount';
import { ApiError } from '../utils/ApiError';
import { providerScope } from '../utils/scope';
import { DISCOUNT_TYPES } from '../types';

const discountFields = z.object({
  code: z.string().min(2).max(32),
  type: z.enum(DISCOUNT_TYPES),
  value: z.number().min(0),
  isActive: z.boolean().optional(),
  expiresAt: z.coerce.date().optional(),
  maxRedemptions: z.number().int().positive().optional(),
});

export const discountBodySchema = z.object({ body: discountFields.strict() });
export const discountUpdateSchema = z.object({ body: discountFields.partial().strict() });

/** Provider lists their own discount codes. */
export async function listDiscounts(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const items = await Discount.find({ providerId }).sort('-createdAt');
  res.json({ success: true, data: items });
}

/** Public: active, non-expired promo codes for a provider (for the customer app). */
export async function listActiveDiscounts(req: Request, res: Response): Promise<void> {
  const { provider } = req.query;
  const filter: Record<string, unknown> = {
    isActive: true,
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
  };
  if (provider) filter.providerId = provider;
  const items = await Discount.find(filter).select('code type value expiresAt').sort('-createdAt');
  res.json({ success: true, data: items });
}

export async function createDiscount(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const code = String(req.body.code).toUpperCase();
  const exists = await Discount.findOne({ providerId, code });
  if (exists) throw ApiError.badRequest('A discount with this code already exists');
  const discount = await Discount.create({ ...req.body, code, providerId });
  res.status(201).json({ success: true, data: discount });
}

export async function updateDiscount(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const update = { ...req.body };
  if (update.code) update.code = String(update.code).toUpperCase();
  const discount = await Discount.findOneAndUpdate(
    { _id: req.params.id, providerId },
    update,
    { new: true },
  );
  if (!discount) throw ApiError.notFound('Discount not found');
  res.json({ success: true, data: discount });
}

export async function deleteDiscount(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const result = await Discount.findOneAndDelete({ _id: req.params.id, providerId });
  if (!result) throw ApiError.notFound('Discount not found');
  res.json({ success: true, message: 'Discount deleted' });
}
