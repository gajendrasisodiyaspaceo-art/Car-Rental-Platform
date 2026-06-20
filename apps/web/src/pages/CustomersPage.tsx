import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { ReportCustomer } from '../types';

function buildCsv(customers: ReportCustomer[]): string {
  const header = ['Name', 'Email', 'Bookings', 'Total Spent', 'Last Booking'];
  const rows = customers.map((c) => [
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.email.replace(/"/g, '""')}"`,
    String(c.bookings),
    c.totalSpent.toFixed(2),
    c.lastBooking ? new Date(c.lastBooking).toLocaleDateString() : '',
  ]);
  return [header, ...rows].map((r) => r.join(',')).join('\r\n');
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<ReportCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    api
      .get('/reports/customers')
      .then((res) => {
        if (!cancelledRef.current) {
          setCustomers(res.data.data as ReportCustomer[]);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelledRef.current) setLoading(false);
      });

    return () => {
      cancelledRef.current = true;
    };
  }, []);

  function handleExportCsv() {
    const csv = buildCsv(customers);
    downloadCsv(csv, `customers-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      <div className="page-header">
        <h2>Customers</h2>
        <div className="actions-row" style={{ marginTop: 0, marginLeft: 'auto' }}>
          <button
            className="btn-ghost"
            onClick={handleExportCsv}
            disabled={loading || customers.length === 0}
          >
            Export CSV
          </button>
          <button className="btn-ghost" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>

      {loading && <p className="muted">Loading…</p>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Bookings</th>
            <th>Total spent</th>
            <th>Last booking</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.customerId}>
              <td>{c.name}</td>
              <td>{c.email}</td>
              <td>{c.bookings}</td>
              <td>
                {c.totalSpent.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td>{c.lastBooking ? new Date(c.lastBooking).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
          {!customers.length && !loading && (
            <tr>
              <td colSpan={5} className="muted">
                No customer data yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
