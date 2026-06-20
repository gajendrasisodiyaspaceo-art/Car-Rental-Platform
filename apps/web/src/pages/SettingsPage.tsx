import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { TenantSettings } from '../types';
import { useT } from '../i18n/useT';

type FormData = Omit<TenantSettings, 'providerId' | 'supportedLanguages'> & {
  supportedLanguages: string;
};

export default function SettingsPage() {
  const { t } = useT();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<FormData>({
    appName: '',
    logoUrl: '',
    primaryColor: '#6366f1',
    secondaryColor: '',
    currency: 'USD',
    supportedLanguages: 'en',
    defaultLanguage: 'en',
    supportEmail: '',
    supportPhone: '',
    cancellationPolicy: '',
    termsAndConditions: '',
  });

  useEffect(() => {
    let cancelled = false;

    api
      .get('/settings')
      .then((res) => {
        if (!cancelled) {
          const s = res.data.data as TenantSettings;
          setForm({
            appName: s.appName ?? '',
            logoUrl: s.logoUrl ?? '',
            primaryColor: s.primaryColor ?? '#6366f1',
            secondaryColor: s.secondaryColor ?? '',
            currency: s.currency ?? 'USD',
            supportedLanguages: Array.isArray(s.supportedLanguages)
              ? s.supportedLanguages.join(', ')
              : '',
            defaultLanguage: s.defaultLanguage ?? 'en',
            supportEmail: s.supportEmail ?? '',
            supportPhone: s.supportPhone ?? '',
            cancellationPolicy: s.cancellationPolicy ?? '',
            termsAndConditions: s.termsAndConditions ?? '',
          });
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const payload: Partial<TenantSettings> = {
      appName: form.appName,
      logoUrl: form.logoUrl || undefined,
      primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor || undefined,
      currency: form.currency,
      supportedLanguages: form.supportedLanguages
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      defaultLanguage: form.defaultLanguage,
      supportEmail: form.supportEmail || undefined,
      supportPhone: form.supportPhone || undefined,
      cancellationPolicy: form.cancellationPolicy || undefined,
      termsAndConditions: form.termsAndConditions || undefined,
    };

    try {
      await api.put('/settings', payload);
      setSuccess(true);
    } catch {
      setError('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="muted">{t('loading')}</p>;

  return (
    <div>
      <h2>{t('settings_title')}</h2>

      <form onSubmit={handleSubmit} className="vehicle-form">
        <div className="form-grid">
          <label className="form-field">
            {t('settings_app_name')}
            <input name="appName" value={form.appName} onChange={handleChange} required />
          </label>

          <label className="form-field">
            {t('settings_logo_url')}
            <input name="logoUrl" value={form.logoUrl ?? ''} onChange={handleChange} />
          </label>

          <label className="form-field">
            {t('settings_primary_color')}
            <input
              name="primaryColor"
              type="color"
              value={form.primaryColor}
              onChange={handleChange}
              style={{ height: 42, padding: 4 }}
            />
          </label>

          <label className="form-field">
            {t('settings_secondary_color')}
            <input
              name="secondaryColor"
              type="color"
              value={form.secondaryColor || '#94a3b8'}
              onChange={handleChange}
              style={{ height: 42, padding: 4 }}
            />
          </label>

          <label className="form-field">
            {t('settings_currency')}
            <input name="currency" value={form.currency} onChange={handleChange} required />
          </label>

          <label className="form-field">
            {t('settings_supported_langs')}
            <input
              name="supportedLanguages"
              value={form.supportedLanguages}
              onChange={handleChange}
              placeholder="en, ar"
            />
          </label>

          <label className="form-field">
            {t('settings_default_lang')}
            <input
              name="defaultLanguage"
              value={form.defaultLanguage}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-field">
            {t('settings_support_email')}
            <input
              name="supportEmail"
              type="email"
              value={form.supportEmail ?? ''}
              onChange={handleChange}
            />
          </label>

          <label className="form-field">
            {t('settings_support_phone')}
            <input
              name="supportPhone"
              value={form.supportPhone ?? ''}
              onChange={handleChange}
            />
          </label>
        </div>

        <label className="form-field form-field-wide">
          {t('settings_cancellation_policy')}
          <textarea
            name="cancellationPolicy"
            value={form.cancellationPolicy ?? ''}
            onChange={handleChange}
            rows={4}
          />
        </label>

        <label className="form-field form-field-wide">
          {t('settings_terms')}
          <textarea
            name="termsAndConditions"
            value={form.termsAndConditions ?? ''}
            onChange={handleChange}
            rows={6}
          />
        </label>

        {error && <p className="error">{error}</p>}
        {success && (
          <p style={{ color: '#86efac', fontSize: 14, margin: 0 }}>{t('settings_saved')}</p>
        )}

        <div>
          <button type="submit" disabled={saving}>
            {saving ? t('loading') : t('settings_save')}
          </button>
        </div>
      </form>
    </div>
  );
}
