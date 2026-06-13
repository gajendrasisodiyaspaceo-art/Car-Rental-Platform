import { Request, Response } from 'express';
import { z } from 'zod';
import { VehicleCategory } from '../models/VehicleCategory';
import { ApiError } from '../utils/ApiError';
import { providerScope } from '../utils/scope';

export const categoryBodySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    parent: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export async function listCategories(req: Request, res: Response): Promise<void> {
  const filter: Record<string, unknown> = {};
  if (req.query.provider) filter.providerId = req.query.provider;
  else if (req.user) filter.providerId = providerScope(req.user);
  const items = await VehicleCategory.find(filter).sort('name');
  res.json({ success: true, data: items });
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const category = await VehicleCategory.create({ ...req.body, providerId });
  res.status(201).json({ success: true, data: category });
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const category = await VehicleCategory.findOneAndUpdate(
    { _id: req.params.id, providerId },
    req.body,
    { new: true },
  );
  if (!category) throw ApiError.notFound('Category not found');
  res.json({ success: true, data: category });
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const result = await VehicleCategory.findOneAndDelete({ _id: req.params.id, providerId });
  if (!result) throw ApiError.notFound('Category not found');
  res.json({ success: true, message: 'Category deleted' });
}
