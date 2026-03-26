import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Index({ root, items = [], cron = {} }) {
  return (
    <AuthenticatedLayout header="Backups">
      <Head title="Backups" />
      <div className="row">
        <div className="col-12 col-lg-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Backup Files</h5>
            </div>
            <div className="card-body">
              <p className="mb-2">Root: <code>{root || '-'}</code></p>
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Name</th>
                      <th>Size</th>
                      <th>Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!items || items.length === 0) ? (
                      <tr><td colSpan="4">No backup files found</td></tr>
                    ) : items.map((it, idx) => (
                      <tr key={idx}>
                        <td>{it?.type || '-'}</td>
                        <td>{it?.name || '-'}</td>
                        <td>{it?.size ? (it.size/1024/1024).toFixed(2) : '0.00'} MB</td>
                        <td>{it?.mtime ? new Date(it.mtime).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="card">
            <div className="card-header"><h6 className="mb-0">Cron</h6></div>
            <div className="card-body">
              <p className="mb-1">Harian</p>
              <pre className="small" style={{ whiteSpace: 'pre-wrap' }}>{cron?.daily || '-'}</pre>
              <p className="mb-1">Mingguan</p>
              <pre className="small" style={{ whiteSpace: 'pre-wrap' }}>{cron?.weekly || '-'}</pre>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
