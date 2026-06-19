import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchVehicles, deleteVehicle } from '../features/vehicles/vehiclesSlice';
import { fetchMe } from '../features/auth/authSlice';

export default function VehiclesPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const { items, status } = useAppSelector((s) => s.vehicles);

  useEffect(() => {
    if (!user) {
      dispatch(fetchMe()).then((action) => {
        if (fetchMe.fulfilled.match(action)) {
          dispatch(fetchVehicles(action.payload.id));
        }
      });
    } else {
      dispatch(fetchVehicles(user.id));
    }
  }, [dispatch, user]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete vehicle "${name}"? This cannot be undone.`)) return;
    dispatch(deleteVehicle(id));
  }

  return (
    <div>
      <div className="page-header">
        <h2>Fleet</h2>
        <button onClick={() => navigate('/vehicles/new')}>+ Add vehicle</button>
      </div>
      {status === 'loading' && <p>Loading…</p>}
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Plate</th>
            <th>Transmission</th>
            <th>Fuel</th>
            <th>Daily</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((v) => (
            <tr key={v._id}>
              <td>{v.name}</td>
              <td>{v.plateNumber ?? '—'}</td>
              <td>{v.transmission}</td>
              <td>{v.fuelType}</td>
              <td>
                {v.currency} {v.pricing.daily}
              </td>
              <td>
                <span className={`badge badge-${v.status}`}>{v.status}</span>
              </td>
              <td>
                <div className="actions-row" style={{ marginTop: 0 }}>
                  <button
                    className="btn-ghost"
                    onClick={() => navigate(`/vehicles/${v._id}/edit`)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(v._id, v.name)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!items.length && status !== 'loading' && (
            <tr>
              <td colSpan={7}>No vehicles yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
