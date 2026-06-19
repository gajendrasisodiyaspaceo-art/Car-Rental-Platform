import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { User, UserStatus } from '../types';
import { useT } from '../i18n/useT';

interface StaffFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  status: UserStatus;
}

const emptyForm: StaffFormData = {
  name: '',
  email: '',
  password: '',
  phone: '',
  status: 'active',
};

export default function StaffPage() {
  const { t } = useT();
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/staff')
      .then((res) => {
        if (!cancelled) {
          setStaff(res.data.data as User[]);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load staff list.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(member: User) {
    const uid = (member.id ?? member._id) as string;
    setEditingId(uid);
    setForm({
      name: member.name,
      email: member.email,
      password: '',
      phone: '',
      status: member.status ?? 'active',
    });
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      if (editingId) {
        const patch: Partial<{ name: string; phone: string; status: UserStatus }> = {
          name: form.name,
          status: form.status,
        };
        if (form.phone) patch.phone = form.phone;
        const res = await api.patch(`/staff/${editingId}`, patch);
        const updated = res.data.data as User;
        setStaff((prev) =>
          prev.map((m) => {
            const mid = m.id ?? m._id;
            const updatedId = updated.id ?? updated._id;
            return mid === updatedId ? { ...m, ...updated } : m;
          }),
        );
      } else {
        const body: Record<string, string> = {
          name: form.name,
          email: form.email,
          password: form.password,
        };
        if (form.phone) body.phone = form.phone;
        const res = await api.post('/staff', body);
        const created = res.data.data as User;
        // POST /staff response omits phone — keep the submitted value for display.
        setStaff((prev) => [...prev, { ...created, phone: form.phone || undefined } as User]);
      }
      closeForm();
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data
          ? String((err.response.data as { message: string }).message)
          : 'Save failed. Please check the form and try again.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(member: User) {
    const uid = (member.id ?? member._id) as string;
    if (!confirm(`Remove ${member.name} from staff? This cannot be undone.`)) return;
    try {
      await api.delete(`/staff/${uid}`);
      setStaff((prev) => prev.filter((m) => (m.id ?? m._id) !== uid));
    } catch {
      setError('Delete failed.');
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>{t('staff_title')}</h2>
        <button onClick={openAdd}>{t('staff_add')}</button>
      </div>

      {error && <p className="error">{error}</p>}

      {showForm && (
        <div className="card" style={{ maxWidth: 480, marginBottom: 24 }}>
          <p className="section-title" style={{ marginBottom: 16 }}>
            {editingId ? t('staff_form_edit_title') : t('staff_form_add_title')}
          </p>
          <form onSubmit={handleSubmit} className="vehicle-form" style={{ marginTop: 0 }}>
            <div className="form-grid">
              <label className="form-field">
                {t('staff_form_name')}
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </label>
              {!editingId && (
                <label className="form-field">
                  {t('staff_form_email')}
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </label>
              )}
              {!editingId && (
                <label className="form-field">
                  {t('staff_form_password')}
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                  />
                  <small className="muted">{t('staff_form_password_hint')}</small>
                </label>
              )}
              <label className="form-field">
                {t('staff_form_phone')}
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
              </label>
              {editingId && (
                <label className="form-field">
                  {t('staff_form_status')}
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="active">active</option>
                    <option value="suspended">suspended</option>
                  </select>
                </label>
              )}
            </div>
            {formError && <p className="error">{formError}</p>}
            <div className="actions-row" style={{ marginTop: 8 }}>
              <button type="submit" disabled={saving}>
                {saving ? t('loading') : t('staff_form_save')}
              </button>
              <button type="button" className="btn-ghost" onClick={closeForm}>
                {t('staff_form_cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="muted">{t('loading')}</p>}

      <table className="data-table">
        <thead>
          <tr>
            <th>{t('staff_col_name')}</th>
            <th>{t('staff_col_email')}</th>
            <th>{t('staff_col_phone')}</th>
            <th>{t('staff_col_status')}</th>
            <th>{t('staff_col_actions')}</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((m) => {
            const uid = (m.id ?? m._id) as string;
            return (
              <tr key={uid}>
                <td>{m.name}</td>
                <td>{m.email}</td>
                <td>{(m as User & { phone?: string }).phone ?? '—'}</td>
                <td>
                  <span className={`badge badge-${m.status ?? 'active'}`}>
                    {m.status ?? 'active'}
                  </span>
                </td>
                <td>
                  <div className="actions-row" style={{ marginTop: 0 }}>
                    <button className="btn-ghost" onClick={() => openEdit(m)}>
                      {t('staff_action_edit')}
                    </button>
                    <button className="btn-danger" onClick={() => handleDelete(m)}>
                      {t('staff_action_delete')}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {!loading && staff.length === 0 && (
            <tr>
              <td colSpan={5} className="muted">
                {t('no_data')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
