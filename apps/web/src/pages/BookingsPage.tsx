import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Booking } from '../types';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/bookings')
      .then(({ data }) => setBookings(data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>Bookings</h2>
      {loading && <p>Loading…</p>}
      <table className="data-table">
        <thead>
          <tr>
            <th>Booking</th>
            <th>Plan</th>
            <th>Dates</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b._id}>
              <td>{b._id.slice(-6)}</td>
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
          ))}
          {!bookings.length && !loading && (
            <tr>
              <td colSpan={5}>No bookings yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
