import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { ReportSummary, RevenuePoint, PopularVehicle } from '../types';

type GroupBy = 'day' | 'month';

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function fmtCurrency(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function RevenueChart({
  data,
  groupBy,
  onToggle,
  chartLoading,
}: {
  data: RevenuePoint[];
  groupBy: GroupBy;
  onToggle: () => void;
  chartLoading: boolean;
}) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const BAR_W = 28;
  const GAP = 8;
  const H = 140;
  const LABEL_H = 30;
  const AXIS_W = 52;
  const count = data.length;
  const totalW = Math.max(count * (BAR_W + GAP) - GAP, 1);
  const svgW = AXIS_W + totalW + 16;
  const svgH = H + LABEL_H;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    val: Math.round(max * f),
    y: H - Math.round(H * f),
  }));

  function barX(i: number) {
    return AXIS_W + i * (BAR_W + GAP);
  }

  function barH(revenue: number) {
    return Math.max(Math.round((revenue / max) * H), 2);
  }

  return (
    <div className="chart-card card">
      <div className="chart-header">
        <span className="section-title" style={{ marginBottom: 0 }}>
          Revenue
        </span>
        <button className="btn-ghost chart-toggle" onClick={onToggle}>
          View by {groupBy === 'day' ? 'Month' : 'Day'}
        </button>
      </div>
      {chartLoading && (
        <p className="muted" style={{ marginTop: 8 }}>
          Loading chart…
        </p>
      )}
      {!chartLoading && data.length === 0 && (
        <p className="muted" style={{ marginTop: 8 }}>
          No data for this period.
        </p>
      )}
      {!chartLoading && data.length > 0 && (
        <div className="chart-scroll">
          <svg width={svgW} height={svgH} style={{ display: 'block', overflow: 'visible' }}>
            {yTicks.map((t) => (
              <g key={t.y}>
                <line
                  x1={AXIS_W - 4}
                  x2={svgW}
                  y1={t.y}
                  y2={t.y}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <text
                  x={AXIS_W - 8}
                  y={t.y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="var(--muted)"
                >
                  {t.val >= 1000 ? `${Math.round(t.val / 1000)}k` : t.val}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const bh = barH(d.revenue);
              const x = barX(i);
              const y = H - bh;
              return (
                <g key={d.period}>
                  <rect
                    x={x}
                    y={y}
                    width={BAR_W}
                    height={bh}
                    rx={4}
                    fill="var(--accent)"
                    opacity={0.85}
                  />
                  <title>
                    {d.period}: {fmtCurrency(d.revenue)} ({d.bookings} bookings)
                  </title>
                  <text
                    x={x + BAR_W / 2}
                    y={H + LABEL_H - 6}
                    textAnchor="middle"
                    fontSize={10}
                    fill="var(--muted)"
                  >
                    {groupBy === 'day'
                      ? d.period.slice(5)
                      : d.period.length === 7
                        ? d.period.slice(5)
                        : d.period}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [revenue, setRevenue] = useState<RevenuePoint[] | null>(null);
  const [popular, setPopular] = useState<PopularVehicle[]>([]);
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/reports/summary')
      .then((res) => {
        if (!cancelled) setSummary(res.data.data as ReportSummary);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load dashboard data.');
      });

    api
      .get('/reports/popular-vehicles')
      .then((res) => {
        if (!cancelled) setPopular(res.data.data as PopularVehicle[]);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const now = new Date();
    const from =
      groupBy === 'day'
        ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        : new Date(now.getFullYear(), 0, 1).toISOString();
    const to = now.toISOString();

    api
      .get('/reports/revenue', { params: { groupBy, from, to } })
      .then((res) => {
        if (!cancelled) {
          setRevenue(res.data.data as RevenuePoint[]);
        }
      })
      .catch(() => {
        if (!cancelled) setRevenue([]);
      });

    return () => {
      cancelled = true;
    };
  }, [groupBy]);

  function handleToggleGroupBy() {
    setRevenue(null);
    setGroupBy((g) => (g === 'day' ? 'month' : 'day'));
  }

  const kpiCards = summary
    ? [
        { label: 'Fleet size', value: fmt(summary.fleetSize) },
        { label: 'Available', value: fmt(summary.available) },
        { label: 'Active bookings', value: fmt(summary.activeBookings) },
        { label: 'Total revenue', value: fmtCurrency(summary.totalRevenue) },
        { label: 'Utilization', value: `${Math.round(summary.utilizationRate)}%` },
      ]
    : [];

  return (
    <div>
      <h2>Dashboard</h2>

      {error ? (
        <p className="error">{error}</p>
      ) : summary === null ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="stat-grid">
          {kpiCards.map((k) => (
            <div key={k.label} className="card stat">
              <span className="stat-value">{k.value}</span>
              <span className="stat-label">{k.label}</span>
            </div>
          ))}
        </div>
      )}

      <RevenueChart
        data={revenue ?? []}
        groupBy={groupBy}
        onToggle={handleToggleGroupBy}
        chartLoading={revenue === null}
      />

      <div className="card" style={{ marginTop: 24 }}>
        <p className="section-title">Popular vehicles</p>
        <table className="data-table" style={{ marginTop: 0 }}>
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Bookings</th>
              <th>Revenue</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {popular.map((v) => (
              <tr key={v.vehicleId}>
                <td>{v.name}</td>
                <td>{v.bookings}</td>
                <td>{fmtCurrency(v.revenue)}</td>
                <td>
                  {v.rating.average > 0
                    ? `${v.rating.average.toFixed(1)} (${v.rating.count})`
                    : '—'}
                </td>
              </tr>
            ))}
            {popular.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  No data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
