import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { AdminStats, User, Role, UserStatus } from '../types';
import { useT } from '../i18n/useT';

function fmtCurrency(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AdminPage() {
  const { t } = useT();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/admin/stats')
      .then((res) => {
        if (!cancelled) setStats(res.data.data as AdminStats);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load platform stats.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const params: Record<string, string> = {};
    if (roleFilter !== 'all') params.role = roleFilter;
    if (statusFilter !== 'all') params.status = statusFilter;

    api
      .get('/admin/users', { params })
      .then((res) => {
        if (!cancelled) {
          setUsers(res.data.data as User[]);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load users.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [roleFilter, statusFilter]);

  async function patchUser(id: string, patch: Partial<Pick<User, 'status' | 'approved' | 'role' | 'isVerified'>>) {
    setActionError(null);
    try {
      const res = await api.patch(`/admin/users/${id}`, patch);
      const updated = res.data.data as User;
      setUsers((prev) =>
        prev.map((u) => {
          const uid = u.id ?? u._id;
          const updatedId = updated.id ?? updated._id;
          return uid === updatedId ? { ...u, ...updated } : u;
        }),
      );
    } catch {
      setActionError('Action failed. Please try again.');
    }
  }

  const statCards = stats
    ? [
        { label: t('admin_stats_providers'), value: stats.providers },
        { label: t('admin_stats_customers'), value: stats.customers },
        { label: t('admin_stats_staff'), value: stats.staff },
        { label: t('admin_stats_bookings'), value: stats.bookings },
        { label: t('admin_stats_revenue'), value: fmtCurrency(stats.platformRevenue) },
      ]
    : [];

  return (
    <div>
      <h2>{t('admin_title')}</h2>

      {error && <p className="error">{error}</p>}

      {stats === null && !error && <p className="muted">{t('loading')}</p>}

      {stats !== null && (
        <div className="stat-grid">
          {statCards.map((c) => (
            <div key={c.label} className="card stat">
              <span className="stat-value">{c.value}</span>
              <span className="stat-label">{c.label}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <div className="page-header">
          <h3 style={{ margin: 0 }}>{t('admin_users_title')}</h3>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <select
              className="status-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as Role | 'all')}
            >
              <option value="all">{t('admin_filter_all_roles')}</option>
              <option value="customer">customer</option>
              <option value="provider">provider</option>
              <option value="staff">staff</option>
              <option value="admin">admin</option>
            </select>
            <select
              className="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
            >
              <option value="all">{t('admin_filter_all_statuses')}</option>
              <option value="active">active</option>
              <option value="suspended">suspended</option>
            </select>
          </div>
        </div>

        {actionError && <p className="error" style={{ marginTop: 8 }}>{actionError}</p>}

        {loading && <p className="muted">{t('loading')}</p>}

        <table className="data-table">
          <thead>
            <tr>
              <th>{t('admin_col_name')}</th>
              <th>{t('admin_col_email')}</th>
              <th>{t('admin_col_role')}</th>
              <th>{t('admin_col_status')}</th>
              <th>{t('admin_col_verified')}</th>
              <th>{t('admin_col_approved')}</th>
              <th>{t('admin_col_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const uid = (u.id ?? u._id) as string;
              return (
                <tr key={uid}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className="badge">{u.role}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${u.status ?? 'active'}`}>
                      {u.status ?? 'active'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.isVerified ? 'badge-active' : 'badge-inactive'}`}>
                      {u.isVerified ? t('yes') : t('no')}
                    </span>
                  </td>
                  <td>
                    {u.role === 'provider' ? (
                      <span className={`badge ${u.approved ? 'badge-active' : 'badge-pending'}`}>
                        {u.approved ? t('yes') : t('no')}
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <div className="actions-row" style={{ marginTop: 0 }}>
                      {u.status === 'suspended' ? (
                        <button
                          className="btn-ghost"
                          onClick={() => patchUser(uid, { status: 'active' })}
                        >
                          {t('admin_action_activate')}
                        </button>
                      ) : (
                        <button
                          className="btn-danger"
                          onClick={() => patchUser(uid, { status: 'suspended' })}
                        >
                          {t('admin_action_suspend')}
                        </button>
                      )}
                      {u.role === 'provider' && !u.approved && (
                        <button
                          className="btn-ghost"
                          onClick={() => patchUser(uid, { approved: true })}
                        >
                          {t('admin_action_approve')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  {t('no_data')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
