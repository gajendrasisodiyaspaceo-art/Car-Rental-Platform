import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchBookings } from '../features/bookings/bookingsSlice';
import type { BookingStatus } from '../types';

const ALL_STATUSES: BookingStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'active',
  'completed',
  'cancelled',
  'rejected',
];

export default function BookingsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const bookings = useAppSelector((s) => s.bookings.items);
  const loading = useAppSelector((s) => s.bookings.status === 'loading');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');

  useEffect(() => {
    dispatch(fetchBookings());
  }, [dispatch]);

  const filtered = statusFilter === 'all' ? bookings : bookings.filter((b) => b.status === statusFilter);

  return (
    <div>
      <div className="page-header">
        <h2>Bookings</h2>
        <select
          className="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'all')}
        >
          <option value="all">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {loading && <p>Loading…</p>}
      <table className="data-table">
        <thead>
          <tr>
            <th>Booking</th>
            <th>Vehicle</th>
            <th>Plan</th>
            <th>Dates</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((b) => {
            const vehicleName =
              b.vehicleId && typeof b.vehicleId !== 'string' ? b.vehicleId.name : '—';
            return (
              <tr
                key={b._id}
                className="clickable-row"
                onClick={() => navigate(`/bookings/${b._id}`)}
              >
                <td>#{b._id.slice(-8).toUpperCase()}</td>
                <td>{vehicleName}</td>
                <td>{b.plan}</td>
                <td>
                  {new Date(b.startDate).toLocaleDateString()} –{' '}
                  {new Date(b.endDate).toLocaleDateString()}
                </td>
                <td>
                  {b.pricing.currency} {b.pricing.total}
                </td>
                <td>
                  <span className={`badge badge-${b.status}`}>{b.status}</span>
                </td>
              </tr>
            );
          })}
          {!filtered.length && !loading && (
            <tr>
              <td colSpan={6}>No bookings found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
