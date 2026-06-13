import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchVehicles } from '../features/vehicles/vehiclesSlice';

export default function VehiclesPage() {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((s) => s.vehicles);

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  return (
    <div>
      <h2>Fleet</h2>
      {status === 'loading' && <p>Loading…</p>}
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Transmission</th>
            <th>Fuel</th>
            <th>Daily</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((v) => (
            <tr key={v._id}>
              <td>{v.name}</td>
              <td>{v.transmission}</td>
              <td>{v.fuelType}</td>
              <td>
                {v.currency} {v.pricing.daily}
              </td>
              <td>
                <span className={`badge badge-${v.status}`}>{v.status}</span>
              </td>
            </tr>
          ))}
          {!items.length && status !== 'loading' && (
            <tr>
              <td colSpan={5}>No vehicles yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
