import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  fetchDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from '../features/discounts/discountsSlice';
import type { Discount, DiscountType } from '../types';

interface FormState {
  code: string;
  type: DiscountType;
  value: string;
  isActive: boolean;
  expiresAt: string;
  maxRedemptions: string;
}

const emptyForm: FormState = {
  code: '',
  type: 'percent',
  value: '',
  isActive: true,
  expiresAt: '',
  maxRedemptions: '',
};

export default function DiscountsPage() {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((s) => s.discounts);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    dispatch(fetchDiscounts());
  }, [dispatch]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setShowForm(true);
  }

  function openEdit(d: Discount) {
    setEditingId(d._id);
    setForm({
      code: d.code,
      type: d.type,
      value: String(d.value),
      isActive: d.isActive,
      expiresAt: d.expiresAt ? d.expiresAt.slice(0, 10) : '',
      maxRedemptions: d.maxRedemptions != null ? String(d.maxRedemptions) : '',
    });
    setFormError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
  }

  function buildBody() {
    const body: Record<string, unknown> = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      isActive: form.isActive,
    };
    if (form.expiresAt) body.expiresAt = form.expiresAt;
    if (form.maxRedemptions !== '') body.maxRedemptions = Number(form.maxRedemptions);
    return body;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim()) {
      setFormError('Code is required.');
      return;
    }
    if (!form.value || isNaN(Number(form.value)) || Number(form.value) <= 0) {
      setFormError('Value must be a positive number.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editingId) {
        await dispatch(updateDiscount({ id: editingId, body: buildBody() })).unwrap();
      } else {
        await dispatch(createDiscount(buildBody())).unwrap();
      }
      closeForm();
    } catch {
      setFormError('Failed to save. Check the values and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, code: string) {
    if (!confirm(`Delete discount "${code}"? This cannot be undone.`)) return;
    dispatch(deleteDiscount(id));
  }

  return (
    <div>
      <div className="page-header">
        <h2>Discounts</h2>
        <button onClick={openCreate}>+ New discount</button>
      </div>

      {showForm && (
        <div className="card discount-form-card">
          <h3 className="section-title">{editingId ? 'Edit discount' : 'New discount'}</h3>
          <form onSubmit={handleSubmit} className="vehicle-form" style={{ marginTop: 0 }}>
            <div className="form-grid">
              <label className="form-field">
                Code
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="SUMMER20"
                  disabled={saving}
                />
              </label>
              <label className="form-field">
                Type
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as DiscountType }))}
                  disabled={saving}
                >
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat amount</option>
                </select>
              </label>
              <label className="form-field">
                Value
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  placeholder={form.type === 'percent' ? '20' : '10.00'}
                  disabled={saving}
                />
              </label>
              <label className="form-field">
                Expires on (optional)
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  disabled={saving}
                />
              </label>
              <label className="form-field">
                Max redemptions (optional)
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.maxRedemptions}
                  onChange={(e) => setForm((f) => ({ ...f, maxRedemptions: e.target.value }))}
                  placeholder="100"
                  disabled={saving}
                />
              </label>
              <label className="form-field" style={{ justifyContent: 'flex-end' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    disabled={saving}
                    style={{ width: 16, height: 16, padding: 0 }}
                  />
                  Active
                </span>
              </label>
            </div>
            {formError && <p className="error">{formError}</p>}
            <div className="actions-row">
              <button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create discount'}
              </button>
              <button type="button" className="btn-ghost" onClick={closeForm} disabled={saving}>
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
            <th>Code</th>
            <th>Type</th>
            <th>Value</th>
            <th>Redeemed</th>
            <th>Max</th>
            <th>Expires</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d._id}>
              <td style={{ fontWeight: 600, letterSpacing: '0.04em' }}>{d.code}</td>
              <td>{d.type === 'percent' ? 'Percent' : 'Flat'}</td>
              <td>{d.type === 'percent' ? `${d.value}%` : d.value}</td>
              <td>{d.timesRedeemed}</td>
              <td>{d.maxRedemptions ?? '—'}</td>
              <td>
                {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : '—'}
              </td>
              <td>
                <span className={`badge ${d.isActive ? 'badge-active' : 'badge-inactive'}`}>
                  {d.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <div className="actions-row" style={{ marginTop: 0 }}>
                  <button className="btn-ghost" onClick={() => openEdit(d)}>
                    Edit
                  </button>
                  <button className="btn-danger" onClick={() => handleDelete(d._id, d.code)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!items.length && status !== 'loading' && (
            <tr>
              <td colSpan={8}>No discounts yet. Create one to get started.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
