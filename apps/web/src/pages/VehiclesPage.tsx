import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchVehicles, deleteVehicle } from '../features/vehicles/vehiclesSlice';
import { fetchMe } from '../features/auth/authSlice';
import VehicleCard from '../components/VehicleCard';

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

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete vehicle "${name}"? This cannot be undone.`)) return;
    dispatch(deleteVehicle(id));
  }

  return (
    <div>
      <div className="page-header">
        <h2>Fleet</h2>
        <button onClick={() => navigate('/vehicles/new')}>+ Add vehicle</button>
      </div>

      {status === 'loading' && (
        <div className="v-fleet-loading">
          <div className="v-loading-spinner" />
          <p>Loading fleet…</p>
        </div>
      )}

      {status !== 'loading' && items.length === 0 && (
        <div className="v-fleet-empty">
          <p className="muted">No vehicles yet. Add your first vehicle to get started.</p>
          <button onClick={() => navigate('/vehicles/new')}>+ Add vehicle</button>
        </div>
      )}

      {items.length > 0 && (
        <div className="vehicle-grid">
          {items.map((v, i) => (
            <div
              key={v._id}
              className="reveal-item"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <VehicleCard
                vehicle={v}
                onEdit={(id) => navigate(`/vehicles/${id}/edit`)}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
