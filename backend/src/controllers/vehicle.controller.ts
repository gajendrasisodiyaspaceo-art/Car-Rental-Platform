import { Request, Response } from 'express';
import { z } from 'zod';
import { Vehicle } from '../models/Vehicle';
import { ApiError } from '../utils/ApiError';
import { providerScope } from '../utils/scope';
import { hasBookingConflict } from '../utils/availability';
import { FUEL_TYPES, TRANSMISSIONS, VEHICLE_STATUSES } from '../types';

const vehicleFields = z.object({
  categoryId: z.string(),
  branchId: z.string().optional(),
  name: z.string().min(1),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().optional(),
  plateNumber: z.string().optional(),
  seats: z.number().int().optional(),
  transmission: z.enum(TRANSMISSIONS).optional(),
  fuelType: z.enum(FUEL_TYPES).optional(),
  images: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  pricing: z.object({
    daily: z.number().positive(),
    weekly: z.number().positive().optional(),
    monthly: z.number().positive().optional(),
  }),
  currency: z.string().optional(),
  status: z.enum(VEHICLE_STATUSES).optional(),
  rentalTerms: z.string().optional(),
});

export const vehicleBodySchema = z.object({
  body: vehicleFields.strict(),
});

export const vehicleUpdateSchema = z.object({
  body: vehicleFields.partial().strict(),
});

/** Public browse + search with filters. */
export async function listVehicles(req: Request, res: Response): Promise<void> {
  const { q, categoryId, transmission, fuelType, minPrice, maxPrice, status, provider } = req.query;
  const filter: Record<string, unknown> = {};

  if (provider) filter.providerId = provider;
  if (categoryId) filter.categoryId = categoryId;
  if (transmission) filter.transmission = transmission;
  if (fuelType) filter.fuelType = fuelType;
  filter.status = status ?? 'available';
  if (q) filter.$text = { $search: String(q) };
  if (minPrice || maxPrice) {
    filter['pricing.daily'] = {
      ...(minPrice ? { $gte: Number(minPrice) } : {}),
      ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
    };
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);

  const [items, total] = await Promise.all([
    Vehicle.find(filter)
      .populate('categoryId', 'name')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort('-createdAt'),
    Vehicle.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, meta: { page, limit, total } });
}

export async function getVehicle(req: Request, res: Response): Promise<void> {
  const vehicle = await Vehicle.findById(req.params.id).populate('categoryId', 'name');
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  res.json({ success: true, data: vehicle });
}

/** Public availability check for a date range. */
export async function checkAvailability(req: Request, res: Response): Promise<void> {
  const from = new Date(String(req.query.from));
  const to = new Date(String(req.query.to));
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
    throw ApiError.badRequest('Provide valid from/to query dates (to must be after from)');
  }

  const vehicle = await Vehicle.findById(req.params.id).select('status');
  if (!vehicle) throw ApiError.notFound('Vehicle not found');

  const available =
    vehicle.status === 'available' && !(await hasBookingConflict(req.params.id, from, to));
  res.json({ success: true, data: { available } });
}

export async function createVehicle(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const vehicle = await Vehicle.create({ ...req.body, providerId });
  res.status(201).json({ success: true, data: vehicle });
}

export async function updateVehicle(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: req.params.id, providerId },
    req.body,
    { new: true },
  );
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  res.json({ success: true, data: vehicle });
}

export async function deleteVehicle(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const result = await Vehicle.findOneAndDelete({ _id: req.params.id, providerId });
  if (!result) throw ApiError.notFound('Vehicle not found');
  res.json({ success: true, message: 'Vehicle deleted' });
}
