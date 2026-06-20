import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchBookingById, clearSelected, updateSelected } from '../features/bookings/bookingsSlice';
import { api } from '../lib/api';
import type { Payment, BookingStatus, BookingVehicle, BookingCustomer } from '../types';

const CANCELLABLE: BookingStatus[] = ['pending', 'confirmed', 'preparing', 'ready'];

function statusBadgeClass(status: string) {
  switch (status) {
    case 'confirmed': return 'badge badge-confirmed';
    case 'active': return 'badge badge-active';
    case 'completed': return 'badge badge-completed';
    case 'cancelled':
    case 'rejected': return 'badge badge-cancelled';
    case 'pending': return 'badge badge-pending';
    default: return 'badge';
  }
}

function paymentBadgeClass(status: string) {
  switch (status) {
    case 'paid': return 'badge badge-available';
    case 'refunded': return 'badge badge-confirmed';
    case 'failed': return 'badge badge-cancelled';
    default: return 'badge badge-pending';
  }
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const booking = useAppSelector((s) => s.bookings.selected);
  const loadStatus = useAppSelector((s) => s.bookings.selectedStatus);

  const [payment, setPayment] = useState<Payment | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [otpCode, setOtpCode] = useState<string | null>(null);
  const [otpLabel, setOtpLabel] = useState<string>('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  useEffect(() => {
    if (!id) return;
    dispatch(fetchBookingById(id));
    api.get('/payments').then(({ data }) => {
      const payments: Payment[] = data.data;
      const match = payments.find((p) => {
        const bid = typeof p.bookingId === 'string' ? p.bookingId : p.bookingId._id;
        return bid === id;
      });
      setPayment(match ?? null);
    });
    return () => { dispatch(clearSelected()); };
  }, [id, dispatch]);

  async function patchStatus(status: BookingStatus) {
    if (!booking) return;
    setActionError(null);
    setActionLoading(true);
    try {
      const { data } = await api.patch(`/bookings/${booking._id}/status`, { status });
      dispatch(updateSelected(data.data));
      setOtpCode(null);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Action failed';
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  }

  async function generateOtp(type: 'access-otp' | 'return-otp', label: string) {
    if (!booking) return;
    setActionError(null);
    setActionLoading(true);
    setOtpCode(null);
    try {
      const { data } = await api.post(`/bookings/${booking._id}/${type}`);
      setOtpCode(data.data.code);
      setOtpLabel(label);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Action failed';
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  }

  async function cancelBooking() {
    if (!booking) return;
    setActionError(null);
    setActionLoading(true);
    try {
      const { data } = await api.post(`/bookings/${booking._id}/cancel`, { reason: cancelReason || undefined });
      dispatch(updateSelected(data.data));
      setOtpCode(null);
      setShowCancelPrompt(false);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Cancel failed';
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  }

  if (loadStatus === 'loading') return <p>Loading…</p>;
  if (loadStatus === 'failed' || (!booking && loadStatus === 'idle')) {
    return (
      <div>
        <button className="btn-ghost" onClick={() => navigate('/bookings')}>← Back</button>
        <p className="error">Booking not found.</p>
      </div>
    );
  }
  if (!booking) return null;

  const vehicle = typeof booking.vehicleId === 'string' ? null : (booking.vehicleId as BookingVehicle | undefined);
  const customer = typeof booking.userId === 'string' ? null : (booking.userId as BookingCustomer | undefined);
  const status = booking.status;
  const pricing = booking.pricing;

  return (
    <div className="booking-detail">
      <div className="booking-detail-header">
        <button className="btn-ghost" onClick={() => navigate('/bookings')}>← Bookings</button>
        <h2>Booking #{booking._id.slice(-8).toUpperCase()}</h2>
        <span className={statusBadgeClass(status)}>{status}</span>
      </div>

      <div className="booking-detail-grid">
        <div className="card">
          <h3 className="section-title">Vehicle</h3>
          {vehicle ? (
            <>
              <p className="detail-label">Name</p>
              <p className="detail-value">{vehicle.name}</p>
              <p className="detail-label">Daily rate</p>
              <p className="detail-value">{pricing.currency} {vehicle.pricing.daily}/day</p>
            </>
          ) : (
            <p className="muted">{typeof booking.vehicleId === 'string' ? booking.vehicleId : '—'}</p>
          )}
        </div>

        <div className="card">
          <h3 className="section-title">Customer</h3>
          {customer ? (
            <>
              <p className="detail-label">Name</p>
              <p className="detail-value">{customer.name}</p>
              <p className="detail-label">Email</p>
              <p className="detail-value">{customer.email}</p>
            </>
          ) : (
            <p className="muted">—</p>
          )}
        </div>

        <div className="card">
          <h3 className="section-title">Dates &amp; Plan</h3>
          <p className="detail-label">Plan</p>
          <p className="detail-value">{booking.plan}</p>
          <p className="detail-label">Start</p>
          <p className="detail-value">{new Date(booking.startDate).toLocaleDateString()}</p>
          <p className="detail-label">End</p>
          <p className="detail-value">{new Date(booking.endDate).toLocaleDateString()}</p>
        </div>

        <div className="card">
          <h3 className="section-title">Payment</h3>
          {payment ? (
            <>
              <p className="detail-label">Method</p>
              <p className="detail-value">{payment.method}</p>
              <p className="detail-label">Status</p>
              <span className={paymentBadgeClass(payment.status)}>{payment.status}</span>
            </>
          ) : (
            <p className="muted">No payment record</p>
          )}
        </div>
      </div>

      <div className="card pricing-card">
        <h3 className="section-title">Pricing Breakdown</h3>
        <div className="pricing-rows">
          <div className="pricing-row">
            <span>Base</span>
            <span>{pricing.currency} {pricing.base}</span>
          </div>
          <div className="pricing-row">
            <span>Extras</span>
            <span>{pricing.currency} {pricing.extras}</span>
          </div>
          <div className="pricing-row">
            <span>Discount</span>
            <span className="discount">− {pricing.currency} {pricing.discount}</span>
          </div>
          <div className="pricing-row">
            <span>Tax</span>
            <span>{pricing.currency} {pricing.tax}</span>
          </div>
          {pricing.lateFee > 0 && (
            <div className="pricing-row">
              <span>Late fee</span>
              <span>{pricing.currency} {pricing.lateFee}</span>
            </div>
          )}
          <div className="pricing-row pricing-total">
            <span>Total</span>
            <span>{pricing.currency} {pricing.total}</span>
          </div>
        </div>
      </div>

      <div className="card actions-card">
        <h3 className="section-title">Actions</h3>
        {actionError && <p className="error">{actionError}</p>}

        <div className="actions-row">
          {status === 'pending' && (
            <>
              <button disabled={actionLoading} onClick={() => patchStatus('confirmed')}>Accept</button>
              <button disabled={actionLoading} className="btn-danger" onClick={() => patchStatus('rejected')}>Reject</button>
            </>
          )}
          {status === 'confirmed' && (
            <button disabled={actionLoading} onClick={() => patchStatus('preparing')}>Mark Preparing</button>
          )}
          {status === 'preparing' && (
            <button disabled={actionLoading} onClick={() => patchStatus('ready')}>Mark Ready</button>
          )}
          {status === 'ready' && (
            <button disabled={actionLoading} onClick={() => generateOtp('access-otp', 'Pickup Code')}>
              Generate pickup code
            </button>
          )}
          {status === 'active' && (
            <button disabled={actionLoading} onClick={() => generateOtp('return-otp', 'Return Code')}>
              Generate return code
            </button>
          )}
          {CANCELLABLE.includes(status) && (
            <button
              disabled={actionLoading}
              className="btn-danger"
              onClick={() => setShowCancelPrompt(true)}
            >
              Cancel booking
            </button>
          )}
          {status !== 'pending' &&
            status !== 'confirmed' &&
            status !== 'preparing' &&
            status !== 'ready' &&
            status !== 'active' &&
            status !== 'cancelled' &&
            status !== 'rejected' && (
              <p className="muted">No actions available</p>
            )}
          {(status === 'completed' || status === 'cancelled' || status === 'rejected') && (
            <p className="muted">No further actions available.</p>
          )}
        </div>

        {showCancelPrompt && (
          <div className="cancel-prompt">
            <label htmlFor="cancel-reason" style={{ color: 'var(--muted)', fontSize: 13 }}>
              Reason (optional)
            </label>
            <input
              id="cancel-reason"
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation"
            />
            <div className="actions-row">
              <button disabled={actionLoading} className="btn-danger" onClick={cancelBooking}>
                Confirm cancel
              </button>
              <button
                disabled={actionLoading}
                className="btn-ghost"
                onClick={() => setShowCancelPrompt(false)}
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {otpCode && (
          <div className="otp-display">
            <p className="otp-label">{otpLabel}</p>
            <p className="otp-code">{otpCode}</p>
            <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              Read this code to the customer. It expires shortly.
            </p>
          </div>
        )}
      </div>

      {booking.notes && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 className="section-title">Notes</h3>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>{booking.notes}</p>
        </div>
      )}
    </div>
  );
}
