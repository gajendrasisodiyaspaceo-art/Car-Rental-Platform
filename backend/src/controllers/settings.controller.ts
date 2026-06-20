import { Request, Response } from 'express';
import { z } from 'zod';
import { TenantSettings } from '../models/TenantSettings';
import { ApiError } from '../utils/ApiError';
import { providerScope } from '../utils/scope';

export const settingsSchema = z.object({
  body: z
    .object({
      appName: z.string().min(1).optional(),
      logoUrl: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      currency: z.string().optional(),
      supportedLanguages: z.array(z.string()).optional(),
      defaultLanguage: z.string().optional(),
      supportEmail: z.string().optional(),
      supportPhone: z.string().optional(),
      cancellationPolicy: z.string().optional(),
      termsAndConditions: z.string().optional(),
    })
    .strict(),
});

const PUBLIC_FIELDS =
  'appName logoUrl primaryColor secondaryColor currency supportedLanguages defaultLanguage supportEmail supportPhone';

/** Provider reads their branding/settings (auto-creates defaults on first read). */
export async function getSettings(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  let settings = await TenantSettings.findOne({ providerId });
  if (!settings) settings = await TenantSettings.create({ providerId });
  res.json({ success: true, data: settings });
}

/** Provider updates their white-label branding. */
export async function updateSettings(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const settings = await TenantSettings.findOneAndUpdate(
    { providerId },
    { $set: req.body },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  res.json({ success: true, data: settings });
}

/** Public branding for white-label theming on the customer app. */
export async function getPublicSettings(req: Request, res: Response): Promise<void> {
  const { provider } = req.query;
  if (!provider) throw ApiError.badRequest('provider query param is required');
  const settings = await TenantSettings.findOne({ providerId: provider }).select(PUBLIC_FIELDS);
  if (!settings) throw ApiError.notFound('Settings not found');
  res.json({ success: true, data: settings });
}
