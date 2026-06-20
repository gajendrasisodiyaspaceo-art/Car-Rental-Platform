import { useEffect, useState, type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  fetchBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../features/branches/branchesSlice';
import type { Branch } from '../types';

interface BranchForm {
  name: string;
  address: string;
  city: string;
  country: string;
  operatingHours: string;
  lat: string;
  lng: string;
  isActive: boolean;
}

const emptyForm: BranchForm = {
  name: '',
  address: '',
  city: '',
  country: '',
  operatingHours: '',
  lat: '',
  lng: '',
  isActive: true,
};

export default function BranchesPage() {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((s) => s.branches);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BranchForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchBranches());
  }, [dispatch]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  }

  function openEdit(branch: Branch) {
    setEditingId(branch._id);
    setForm({
      name: branch.name,
      address: branch.address,
      city: branch.city ?? '',
      country: branch.country ?? '',
      operatingHours: branch.operatingHours ?? '',
      lat: branch.location ? String(branch.location.lat) : '',
      lng: branch.location ? String(branch.location.lng) : '',
      isActive: branch.isActive,
    });
    setError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function set(field: keyof BranchForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const body: Record<string, unknown> = {
      name: form.name,
      address: form.address,
      isActive: form.isActive,
    };
    if (form.city) body.city = form.city;
    if (form.country) body.country = form.country;
    if (form.operatingHours) body.operatingHours = form.operatingHours;
    if (form.lat && form.lng) {
      const lat = parseFloat(form.lat);
      const lng = parseFloat(form.lng);
      if (!isNaN(lat) && !isNaN(lng)) body.location = { lat, lng };
    }

    setSaving(true);
    try {
      if (editingId) {
        await dispatch(updateBranch({ id: editingId, body })).unwrap();
      } else {
        await dispatch(createBranch(body)).unwrap();
      }
      cancelForm();
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(branch: Branch) {
    if (!confirm(`Delete branch "${branch.name}"? This cannot be undone.`)) return;
    dispatch(deleteBranch(branch._id));
  }

  return (
    <div>
      <div className="page-header">
        <h2>Branches</h2>
        <button onClick={openCreate}>+ Add branch</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24, maxWidth: 600 }}>
          <h3 className="section-title">{editingId ? 'Edit branch' : 'New branch'}</h3>
          <form onSubmit={handleSubmit}>
            {error && <p className="error">{error}</p>}
            <div className="form-grid">
              <label className="form-field">
                Name *
                <input
                  required
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Downtown Office"
                />
              </label>

              <label className="form-field">
                Address *
                <input
                  required
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="e.g. 123 Main St"
                />
              </label>

              <label className="form-field">
                City
                <input
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="e.g. New York"
                />
              </label>

              <label className="form-field">
                Country
                <input
                  value={form.country}
                  onChange={(e) => set('country', e.target.value)}
                  placeholder="e.g. US"
                />
              </label>

              <label className="form-field">
                Operating hours
                <input
                  value={form.operatingHours}
                  onChange={(e) => set('operatingHours', e.target.value)}
                  placeholder="e.g. Mon-Fri 8am-6pm"
                />
              </label>

              <label className="form-field">
                Latitude
                <input
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={(e) => set('lat', e.target.value)}
                  placeholder="e.g. 40.7128"
                />
              </label>

              <label className="form-field">
                Longitude
                <input
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={(e) => set('lng', e.target.value)}
                  placeholder="e.g. -74.0060"
                />
              </label>

              <label
                className="form-field"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => set('isActive', e.target.checked)}
                  style={{ width: 'auto' }}
                />
                Active
              </label>
            </div>

            <div className="actions-row">
              <button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create'}
              </button>
              <button type="button" className="btn-ghost" onClick={cancelForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {status === 'loading' && <p>Loading…</p>}
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>City</th>
            <th>Country</th>
            <th>Hours</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((branch) => (
            <tr key={branch._id}>
              <td>{branch.name}</td>
              <td>{branch.address}</td>
              <td>{branch.city ?? '—'}</td>
              <td>{branch.country ?? '—'}</td>
              <td>{branch.operatingHours ?? '—'}</td>
              <td>
                <span
                  className={`badge ${branch.isActive ? 'badge-available' : 'badge-completed'}`}
                >
                  {branch.isActive ? 'active' : 'inactive'}
                </span>
              </td>
              <td>
                <div className="actions-row" style={{ marginTop: 0 }}>
                  <button className="btn-ghost" onClick={() => openEdit(branch)}>
                    Edit
                  </button>
                  <button className="btn-danger" onClick={() => handleDelete(branch)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!items.length && status !== 'loading' && (
            <tr>
              <td colSpan={7}>No branches yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
