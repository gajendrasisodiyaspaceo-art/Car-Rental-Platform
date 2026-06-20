import { Request, Response } from 'express';
import { z } from 'zod';
import { Branch } from '../models/Branch';
import { ApiError } from '../utils/ApiError';
import { providerScope } from '../utils/scope';

const branchFields = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().optional(),
  country: z.string().optional(),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
  operatingHours: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const branchBodySchema = z.object({ body: branchFields.strict() });
export const branchUpdateSchema = z.object({ body: branchFields.partial().strict() });

export async function listBranches(req: Request, res: Response): Promise<void> {
  const filter: Record<string, unknown> = {};
  if (req.query.provider) filter.providerId = req.query.provider;
  else if (req.user) filter.providerId = providerScope(req.user);
  const items = await Branch.find(filter).sort('name');
  res.json({ success: true, data: items });
}

export async function createBranch(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const branch = await Branch.create({ ...req.body, providerId });
  res.status(201).json({ success: true, data: branch });
}

export async function updateBranch(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const branch = await Branch.findOneAndUpdate(
    { _id: req.params.id, providerId },
    req.body,
    { new: true },
  );
  if (!branch) throw ApiError.notFound('Branch not found');
  res.json({ success: true, data: branch });
}

export async function deleteBranch(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const result = await Branch.findOneAndDelete({ _id: req.params.id, providerId });
  if (!result) throw ApiError.notFound('Branch not found');
  res.json({ success: true, message: 'Branch deleted' });
}
