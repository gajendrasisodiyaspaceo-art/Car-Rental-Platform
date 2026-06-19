import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Notification } from '../types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get('/notifications').then((res) => {
      if (!cancelled) {
        setNotifications((res.data.data as Notification[]) ?? []);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  function handleMarkOne(id: string) {
    const notif = notifications.find((n) => n._id === id);
    if (!notif || notif.read) return;
    api.patch(`/notifications/${id}/read`).then((res) => {
      const updated = res.data.data as Notification;
      setNotifications((prev) => prev.map((n) => (n._id === id ? updated : n)));
    }).catch(() => {});
  }

  function handleMarkAll() {
    setMarkingAll(true);
    api.patch('/notifications/read-all').then(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }).catch(() => {}).finally(() => {
      setMarkingAll(false);
    });
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <div className="page-header">
        <h2>
          Notifications
          {unreadCount > 0 && (
            <span className="notif-badge-count">{unreadCount} unread</span>
          )}
        </h2>
        <button
          className="btn-ghost"
          onClick={handleMarkAll}
          disabled={markingAll || unreadCount === 0}
          style={{ marginLeft: 'auto' }}
        >
          {markingAll ? 'Marking…' : 'Mark all read'}
        </button>
      </div>

      {loading && <p>Loading…</p>}

      {!loading && notifications.length === 0 && (
        <div className="card" style={{ marginTop: 16, color: 'var(--muted)', fontSize: 14 }}>
          No notifications yet.
        </div>
      )}

      <div className="notif-list">
        {notifications.map((n) => (
          <div
            key={n._id}
            className={`notif-item${n.read ? ' notif-read' : ' notif-unread'}`}
            onClick={() => handleMarkOne(n._id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleMarkOne(n._id)}
          >
            <div className="notif-top">
              <span className={`badge badge-notif-${n.type}`}>{n.type}</span>
              <span className="notif-time">
                {new Date(n.createdAt).toLocaleString()}
              </span>
              {!n.read && <span className="notif-dot" aria-label="Unread" />}
            </div>
            <p className="notif-title">{n.title}</p>
            {n.body && <p className="notif-body">{n.body}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
