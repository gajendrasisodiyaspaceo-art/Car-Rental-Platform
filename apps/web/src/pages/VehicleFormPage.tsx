import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { createVehicle, updateVehicle, fetchVehicles } from '../features/vehicles/vehiclesSlice';
import { fetchCategories } from '../features/categories/categoriesSlice';
import { fetchBranches } from '../features/branches/branchesSlice';
import { fetchMe } from '../features/auth/authSlice';
import { api } from '../lib/api';
import type { VehicleFormData, VehicleTransmission, VehicleFuelType, VehicleStatus } from '../types';

const TRANSMISSIONS: VehicleTransmission[] = ['automatic', 'manual'];
const FUEL_TYPES: VehicleFuelType[] = ['petrol', 'diesel', 'electric', 'hybrid'];
const STATUSES: VehicleStatus[] = ['available', 'rented', 'maintenance', 'inactive'];

const emptyForm: VehicleFormData = {
  name: '',
  make: '',
  model: '',
  year: '',
  plateNumber: '',
  seats: '',
  categoryId: '',
  branchId: '',
  transmission: '',
  fuelType: '',
  dailyPrice: '',
  weeklyPrice: '',
  monthlyPrice: '',
  currency: 'USD',
  status: 'available',
  features: '',
  images: '',
  rentalTerms: '',
};

export default function VehicleFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const user = useAppSelector((s) => s.auth.user);
  const categories = useAppSelector((s) => s.categories.items);
  const branches = useAppSelector((s) => s.branches.items);

  const [form, setForm] = useState<VehicleFormData>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      if (!user) {
        const action = await dispatch(fetchMe());
        if (fetchMe.fulfilled.match(action)) {
          dispatch(fetchCategories(action.payload.id));
        }
      } else {
        dispatch(fetchCategories(user.id));
      }
    };
    loadUser();
    dispatch(fetchBranches());
  }, [dispatch, user]);

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    api.get(`/vehicles/${id}`).then(({ data }) => {
      if (cancelled) return;
      const v = data.data;
      const catId =
        v.categoryId && typeof v.categoryId !== 'string' ? v.categoryId._id : v.categoryId ?? '';
      const brId =
        v.branchId && typeof v.branchId !== 'string' ? v.branchId._id : v.branchId ?? '';
      setForm({
        name: v.name,
        make: v.make ?? '',
        model: v.model ?? '',
        year: v.year ? String(v.year) : '',
        plateNumber: v.plateNumber ?? '',
        seats: v.seats ? String(v.seats) : '',
        categoryId: catId,
        branchId: brId,
        transmission: v.transmission ?? '',
        fuelType: v.fuelType ?? '',
        dailyPrice: String(v.pricing.daily),
        weeklyPrice: v.pricing.weekly ? String(v.pricing.weekly) : '',
        monthlyPrice: v.pricing.monthly ? String(v.pricing.monthly) : '',
        currency: v.currency ?? 'USD',
        status: v.status ?? 'available',
        features: (v.features ?? []).join(', '),
        images: (v.images ?? []).join(', '),
        rentalTerms: v.rentalTerms ?? '',
      });
    });
    return () => {
      cancelled = true;
    };
  }, [isEdit, id]);

  function set(field: keyof VehicleFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const daily = parseFloat(form.dailyPrice);
    if (!form.dailyPrice || isNaN(daily) || daily <= 0) {
      setError('Daily price must be a positive number.');
      return;
    }

    const body: Record<string, unknown> = {
      name: form.name,
      pricing: {
        daily,
        ...(form.weeklyPrice ? { weekly: parseFloat(form.weeklyPrice) } : {}),
        ...(form.monthlyPrice ? { monthly: parseFloat(form.monthlyPrice) } : {}),
      },
    };
    if (form.make) body.make = form.make;
    if (form.model) body.model = form.model;
    if (form.year) body.year = parseInt(form.year, 10);
    if (form.plateNumber) body.plateNumber = form.plateNumber;
    if (form.seats) body.seats = parseInt(form.seats, 10);
    if (form.categoryId) body.categoryId = form.categoryId;
    if (form.branchId) body.branchId = form.branchId;
    if (form.transmission) body.transmission = form.transmission;
    if (form.fuelType) body.fuelType = form.fuelType;
    if (form.currency) body.currency = form.currency;
    if (form.status) body.status = form.status;
    if (form.rentalTerms) body.rentalTerms = form.rentalTerms;
    body.features = form.features
      ? form.features.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    body.images = form.images
      ? form.images.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    setSaving(true);
    try {
      if (isEdit && id) {
        await dispatch(updateVehicle({ id, body })).unwrap();
      } else {
        await dispatch(createVehicle(body)).unwrap();
      }
      if (user) dispatch(fetchVehicles(user.id));
      navigate('/vehicles');
    } catch (e: unknown) {
      const msg =
        (e as { message?: string })?.message ?? 'Save failed. Please try again.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <button className="btn-ghost" onClick={() => navigate('/vehicles')}>
          ← Fleet
        </button>
        <h2>{isEdit ? 'Edit vehicle' : 'Add vehicle'}</h2>
      </div>

      <form className="vehicle-form" onSubmit={handleSubmit}>
        {error && <p className="error">{error}</p>}

        <div className="form-grid">
          <label className="form-field">
            Name *
            <input
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Toyota Corolla 2023"
            />
          </label>

          <label className="form-field">
            Make
            <input
              value={form.make}
              onChange={(e) => set('make', e.target.value)}
              placeholder="e.g. Toyota"
            />
          </label>

          <label className="form-field">
            Model
            <input
              value={form.model}
              onChange={(e) => set('model', e.target.value)}
              placeholder="e.g. Corolla"
            />
          </label>

          <label className="form-field">
            Year
            <input
              type="number"
              min="1900"
              max="2100"
              value={form.year}
              onChange={(e) => set('year', e.target.value)}
              placeholder="e.g. 2023"
            />
          </label>

          <label className="form-field">
            Plate number
            <input
              value={form.plateNumber}
              onChange={(e) => set('plateNumber', e.target.value)}
              placeholder="e.g. ABC-1234"
            />
          </label>

          <label className="form-field">
            Seats
            <input
              type="number"
              min="1"
              value={form.seats}
              onChange={(e) => set('seats', e.target.value)}
              placeholder="e.g. 5"
            />
          </label>

          <label className="form-field">
            Category
            <select
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
            >
              <option value="">— select category —</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            Branch
            <select
              value={form.branchId}
              onChange={(e) => set('branchId', e.target.value)}
            >
              <option value="">— select branch —</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            Transmission
            <select
              value={form.transmission}
              onChange={(e) => set('transmission', e.target.value)}
            >
              <option value="">— select —</option>
              {TRANSMISSIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            Fuel type
            <select
              value={form.fuelType}
              onChange={(e) => set('fuelType', e.target.value)}
            >
              <option value="">— select —</option>
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            Daily price *
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.dailyPrice}
              onChange={(e) => set('dailyPrice', e.target.value)}
              placeholder="e.g. 50"
            />
          </label>

          <label className="form-field">
            Weekly price
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.weeklyPrice}
              onChange={(e) => set('weeklyPrice', e.target.value)}
              placeholder="e.g. 300"
            />
          </label>

          <label className="form-field">
            Monthly price
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.monthlyPrice}
              onChange={(e) => set('monthlyPrice', e.target.value)}
              placeholder="e.g. 1100"
            />
          </label>

          <label className="form-field">
            Currency
            <input
              value={form.currency}
              onChange={(e) => set('currency', e.target.value)}
              placeholder="USD"
            />
          </label>

          <label className="form-field">
            Status
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              <option value="">— select —</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="form-field form-field-wide">
          Features (comma-separated)
          <input
            value={form.features}
            onChange={(e) => set('features', e.target.value)}
            placeholder="e.g. GPS, Bluetooth, Sunroof"
          />
        </label>

        <label className="form-field form-field-wide">
          Images (comma-separated URLs)
          <input
            value={form.images}
            onChange={(e) => set('images', e.target.value)}
            placeholder="e.g. https://example.com/car1.jpg, https://example.com/car2.jpg"
          />
        </label>

        <label className="form-field form-field-wide">
          Rental terms
          <textarea
            value={form.rentalTerms}
            onChange={(e) => set('rentalTerms', e.target.value)}
            rows={3}
            placeholder="Optional rental terms and conditions"
          />
        </label>

        <div className="actions-row">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create vehicle'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate('/vehicles')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
