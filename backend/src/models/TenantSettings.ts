import { Schema, model, Document, Types } from 'mongoose';

export interface ITenantSettings extends Document {
  providerId: Types.ObjectId;
  appName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  currency: string;
  supportedLanguages: string[];
  defaultLanguage: string;
  supportEmail?: string;
  supportPhone?: string;
  cancellationPolicy?: string;
  termsAndConditions?: string;
}

const tenantSettingsSchema = new Schema<ITenantSettings>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    appName: { type: String, default: 'Car Rental' },
    logoUrl: String,
    primaryColor: { type: String, default: '#4f46e5' },
    secondaryColor: String,
    currency: { type: String, default: 'USD' },
    // white-label i18n: which UI languages this tenant exposes
    supportedLanguages: { type: [String], default: ['en'] },
    defaultLanguage: { type: String, default: 'en' },
    supportEmail: String,
    supportPhone: String,
    cancellationPolicy: String,
    termsAndConditions: String,
  },
  { timestamps: true },
);

export const TenantSettings = model<ITenantSettings>('TenantSettings', tenantSettingsSchema);
