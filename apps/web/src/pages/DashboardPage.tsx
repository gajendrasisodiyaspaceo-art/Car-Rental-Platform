import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchVehicles } from '../features/vehicles/vehiclesSlice';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const vehicles = useAppSelector((s) => s.vehicles.items);

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  const available = vehicles.filter((v) => v.status === 'available').length;

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="stat-grid">
        <div className="card stat">
          <span className="stat-value">{vehicles.length}</span>
          <span className="stat-label">Total vehicles</span>
        </div>
        <div className="card stat">
          <span className="stat-value">{available}</span>
          <span className="stat-label">Available now</span>
        </div>
        <div className="card stat">
          <span className="stat-value">{vehicles.length - available}</span>
          <span className="stat-label">In use / maintenance</span>
        </div>
      </div>
    </div>
  );
}
