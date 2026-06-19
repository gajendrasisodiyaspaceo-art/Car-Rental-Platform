import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAppDispatch } from '../app/hooks';
import { deleteVehicle } from '../features/vehicles/vehiclesSlice';
import Tilt3D from '../components/Tilt3D';
import type { Vehicle } from '../types';

function resolveName(field: { _id: string; name: string } | string | undefined): string {
  if (!field) return '—';
  if (typeof field === 'string') return field;
  return field.name;
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  type FetchState =
    | { phase: 'loading' }
    | { phase: 'error'; message: string }
    | { phase: 'done'; vehicle: Vehicle };

  const [fetchState, setFetchState] = useState<FetchState>({ phase: 'loading' });
  const [activeIdx, setActiveIdx] = useState(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    api
      .get(`/vehicles/${id}`)
      .then((res) => {
        if (cancelledRef.current) return;
        setFetchState({ phase: 'done', vehicle: res.data.data as Vehicle });
      })
      .catch((err: unknown) => {
        if (cancelledRef.current) return;
        const serverMsg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined;
        setFetchState({ phase: 'error', message: serverMsg ?? 'Failed to load vehicle' });
      });

    return () => {
      cancelledRef.current = true;
    };
  }, [id]);

  async function handleDelete(vehicle: Vehicle) {
    if (!confirm(`Delete "${vehicle.name}"? This cannot be undone.`)) return;
    await dispatch(deleteVehicle(vehicle._id));
    navigate('/vehicles');
  }

  if (fetchState.phase === 'loading') {
    return (
      <div className="v-detail-loading">
        <div className="v-loading-spinner" />
        <p>Loading vehicle…</p>
      </div>
    );
  }

  if (fetchState.phase === 'error') {
    return (
      <div className="v-detail-error">
        <p className="error">{fetchState.message}</p>
        <button className="btn-ghost" onClick={() => navigate('/vehicles')}>
          Back to fleet
        </button>
      </div>
    );
  }

  const vehicle = fetchState.vehicle;
  const fallback = `https://picsum.photos/seed/${encodeURIComponent(vehicle._id)}/800/500`;
  const allImages = vehicle.images.length > 0 ? vehicle.images : [fallback];

  const specs = [
    { label: 'Make', value: vehicle.make },
    { label: 'Model', value: vehicle.model },
    { label: 'Year', value: vehicle.year },
    { label: 'Seats', value: vehicle.seats },
    { label: 'Transmission', value: vehicle.transmission },
    { label: 'Fuel', value: vehicle.fuelType },
    { label: 'Plate', value: vehicle.plateNumber },
    { label: 'Currency', value: vehicle.currency },
    { label: 'Category', value: resolveName(vehicle.categoryId) },
    { label: 'Branch', value: resolveName(vehicle.branchId) },
  ].filter((s) => s.value !== undefined && s.value !== null && s.value !== '');

  return (
    <div className="v-detail reveal-root">
      <div className="page-header">
        <button className="btn-ghost" onClick={() => navigate('/vehicles')}>
          ← Fleet
        </button>
        <span className={`badge badge-${vehicle.status}`}>{vehicle.status}</span>
      </div>

      <div className="v-detail-layout">
        {/* Gallery */}
        <section className="v-gallery reveal-item" style={{ animationDelay: '0ms' }}>
          <Tilt3D className="v-main-img-wrap">
            <MainImage key={allImages[activeIdx]} src={allImages[activeIdx]} fallback={fallback} alt={vehicle.name} />
          </Tilt3D>

          {allImages.length > 1 && (
            <div className="v-thumbs">
              {allImages.map((src, i) => (
                <ThumbImage
                  key={i}
                  src={src}
                  fallback={fallback}
                  alt={`${vehicle.name} view ${i + 1}`}
                  active={i === activeIdx}
                  onClick={() => setActiveIdx(i)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Right panel */}
        <div className="v-detail-right">
          <div className="reveal-item" style={{ animationDelay: '80ms' }}>
            <h1 className="v-title">{vehicle.name}</h1>
            {(vehicle.make || vehicle.model || vehicle.year) && (
              <p className="v-subtitle">
                {[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' · ')}
              </p>
            )}
            {vehicle.rating && vehicle.rating.count > 0 && (
              <div className="v-rating">
                <span className="v-star">★</span>
                <strong>{vehicle.rating.average.toFixed(1)}</strong>
                <span className="v-rating-count"> ({vehicle.rating.count} reviews)</span>
              </div>
            )}
          </div>

          {/* Price panel */}
          <div
            className="card v-price-panel reveal-item"
            style={{ animationDelay: '160ms' }}
          >
            <p className="section-title">Pricing</p>
            <div className="v-price-row">
              <span className="v-price-label">Daily</span>
              <span className="v-price-value">
                {vehicle.currency} {vehicle.pricing.daily}
              </span>
            </div>
            {vehicle.pricing.weekly && (
              <div className="v-price-row">
                <span className="v-price-label">Weekly</span>
                <span className="v-price-value">
                  {vehicle.currency} {vehicle.pricing.weekly}
                </span>
              </div>
            )}
            {vehicle.pricing.monthly && (
              <div className="v-price-row">
                <span className="v-price-label">Monthly</span>
                <span className="v-price-value">
                  {vehicle.currency} {vehicle.pricing.monthly}
                </span>
              </div>
            )}
          </div>

          {/* Spec grid */}
          <div
            className="card v-spec-section reveal-item"
            style={{ animationDelay: '240ms' }}
          >
            <p className="section-title">Specifications</p>
            <div className="v-spec-grid">
              {specs.map((s) => (
                <div key={s.label} className="v-spec-item">
                  <span className="v-spec-label">{s.label}</span>
                  <span className="v-spec-value">{String(s.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          {vehicle.features.length > 0 && (
            <div
              className="card v-features-section reveal-item"
              style={{ animationDelay: '320ms' }}
            >
              <p className="section-title">Features</p>
              <ul className="v-features">
                {vehicle.features.map((f) => (
                  <li key={f} className="v-feature-item">
                    <span className="v-feature-check" aria-hidden="true">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rental terms */}
          {vehicle.rentalTerms && (
            <div
              className="card reveal-item"
              style={{ animationDelay: '400ms' }}
            >
              <p className="section-title">Rental Terms</p>
              <p className="v-rental-terms">{vehicle.rentalTerms}</p>
            </div>
          )}

          {/* Actions */}
          <div
            className="actions-row reveal-item"
            style={{ animationDelay: '480ms' }}
          >
            <button
              className="btn-ghost"
              onClick={() => navigate(`/vehicles/${vehicle._id}/edit`)}
            >
              Edit vehicle
            </button>
            <button className="btn-danger" onClick={() => handleDelete(vehicle)}>
              Delete vehicle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainImage({ src, fallback, alt }: { src: string; fallback: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className="v-main-img"
      onError={() => setImgSrc(fallback)}
    />
  );
}

function ThumbImage({
  src,
  fallback,
  alt,
  active,
  onClick,
}: {
  src: string;
  fallback: string;
  alt: string;
  active: boolean;
  onClick: () => void;
}) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <button
      className={`v-thumb${active ? ' v-thumb-active' : ''}`}
      onClick={onClick}
      aria-label={alt}
      aria-pressed={active}
    >
      <img src={imgSrc} alt={alt} onError={() => setImgSrc(fallback)} />
    </button>
  );
}
