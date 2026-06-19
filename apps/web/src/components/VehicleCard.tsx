import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Vehicle } from '../types';
import Tilt3D from './Tilt3D';

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

export default function VehicleCard({ vehicle: v, onEdit, onDelete }: VehicleCardProps) {
  const navigate = useNavigate();
  const fallback = `https://picsum.photos/seed/${encodeURIComponent(v._id)}/600/400`;
  const [imgSrc, setImgSrc] = useState<string>(v.images[0] ?? fallback);

  return (
    <Tilt3D className="vehicle-card-tilt">
      <article
        className="vehicle-card"
        onClick={() => navigate(`/vehicles/${v._id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') navigate(`/vehicles/${v._id}`);
        }}
        aria-label={`View details for ${v.name}`}
      >
        <div className="vc-image-wrap">
          <img
            src={imgSrc}
            alt={v.name}
            className="vc-image"
            onError={() => setImgSrc(fallback)}
          />
          <span className={`badge badge-${v.status} vc-status-badge`}>{v.status}</span>
        </div>

        <div className="vc-body">
          <h3 className="vc-name">{v.name}</h3>
          {(v.make || v.model || v.year) && (
            <p className="vc-meta">
              {[v.make, v.model, v.year].filter(Boolean).join(' · ')}
            </p>
          )}

          <div className="vc-specs">
            {v.transmission && <span className="vc-spec">{v.transmission}</span>}
            {v.fuelType && <span className="vc-spec">{v.fuelType}</span>}
            {v.seats && <span className="vc-spec">{v.seats} seats</span>}
          </div>

          <div className="vc-footer-row">
            <div className="vc-price">
              <span className="vc-currency">{v.currency}</span>
              <span className="vc-amount">{v.pricing.daily}</span>
              <span className="vc-per-day">/day</span>
            </div>

            {v.rating && v.rating.count > 0 && (
              <div className="vc-rating">
                <span className="vc-star">★</span>
                <span className="vc-rating-avg">{v.rating.average.toFixed(1)}</span>
                <span className="vc-rating-count">({v.rating.count})</span>
              </div>
            )}
          </div>
        </div>

        <div className="vc-actions">
          <button
            className="btn-ghost vc-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(v._id);
            }}
            aria-label={`Edit ${v.name}`}
          >
            Edit
          </button>
          <button
            className="btn-danger vc-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(v._id, v.name);
            }}
            aria-label={`Delete ${v.name}`}
          >
            Delete
          </button>
        </div>

        <div className="vc-glare" aria-hidden="true" />
      </article>
    </Tilt3D>
  );
}
