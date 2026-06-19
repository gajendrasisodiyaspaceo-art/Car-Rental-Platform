import { useEffect, useState, type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../features/categories/categoriesSlice';
import { fetchMe } from '../features/auth/authSlice';
import type { Category } from '../types';

interface CategoryForm {
  name: string;
  description: string;
  parentId: string;
  isActive: boolean;
}

const emptyForm: CategoryForm = { name: '', description: '', parentId: '', isActive: true };

export default function CategoriesPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { items, status } = useAppSelector((s) => s.categories);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        const action = await dispatch(fetchMe());
        if (fetchMe.fulfilled.match(action)) {
          dispatch(fetchCategories(action.payload.id));
        }
      } else {
        dispatch(fetchCategories(user.id));
      }
    };
    load();
  }, [dispatch, user]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditingId(cat._id);
    setForm({
      name: cat.name,
      description: cat.description ?? '',
      parentId:
        cat.parent && typeof cat.parent !== 'string' ? cat.parent._id : (cat.parent as string) ?? '',
      isActive: cat.isActive,
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

  function set(field: keyof CategoryForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const body: Record<string, unknown> = {
      name: form.name,
      isActive: form.isActive,
    };
    if (form.description) body.description = form.description;
    if (form.parentId) body.parent = form.parentId;

    setSaving(true);
    try {
      if (editingId) {
        await dispatch(updateCategory({ id: editingId, body })).unwrap();
      } else {
        await dispatch(createCategory(body)).unwrap();
      }
      if (user) dispatch(fetchCategories(user.id));
      cancelForm();
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    dispatch(deleteCategory(cat._id));
  }

  const parentOptions = items.filter((c) => c._id !== editingId);

  return (
    <div>
      <div className="page-header">
        <h2>Categories</h2>
        <button onClick={openCreate}>+ Add category</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24, maxWidth: 520 }}>
          <h3 className="section-title">{editingId ? 'Edit category' : 'New category'}</h3>
          <form onSubmit={handleSubmit}>
            {error && <p className="error">{error}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="form-field">
                Name *
                <input
                  required
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. SUV"
                />
              </label>

              <label className="form-field">
                Description
                <input
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Optional description"
                />
              </label>

              <label className="form-field">
                Parent category
                <select value={form.parentId} onChange={(e) => set('parentId', e.target.value)}>
                  <option value="">— none —</option>
                  {parentOptions.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => set('isActive', e.target.checked)}
                  style={{ width: 'auto' }}
                />
                Active
              </label>

              <div className="actions-row">
                <button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create'}
                </button>
                <button type="button" className="btn-ghost" onClick={cancelForm}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {status === 'loading' && <p>Loading…</p>}
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Parent</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((cat) => {
            const parentName =
              cat.parent && typeof cat.parent !== 'string' ? cat.parent.name : null;
            return (
              <tr key={cat._id}>
                <td>{cat.name}</td>
                <td>{cat.description ?? '—'}</td>
                <td>{parentName ?? '—'}</td>
                <td>
                  <span className={`badge ${cat.isActive ? 'badge-available' : 'badge-completed'}`}>
                    {cat.isActive ? 'active' : 'inactive'}
                  </span>
                </td>
                <td>
                  <div className="actions-row" style={{ marginTop: 0 }}>
                    <button className="btn-ghost" onClick={() => openEdit(cat)}>
                      Edit
                    </button>
                    <button className="btn-danger" onClick={() => handleDelete(cat)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {!items.length && status !== 'loading' && (
            <tr>
              <td colSpan={5}>No categories yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
