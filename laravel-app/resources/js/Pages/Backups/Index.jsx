import React, { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';

export default function Index({ root, items = [], cron = {} }) {
  const roles = usePage().props?.auth?.roles || [];
  const canRunBackup = roles.includes('Administrator');
  const [isRunning, setIsRunning] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [runId, setRunId] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressError, setProgressError] = useState('');
  const [isDone, setIsDone] = useState(false);
  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = (nextRunId) => {
    if (typeof window === 'undefined') return;
    if (!nextRunId) return;

    stopPolling();
    setRunId(nextRunId);
    try {
      window.localStorage.setItem('manualBackupRunId', nextRunId);
    } catch (_e) {
    }

    const tick = async () => {
      try {
        const r = await axios.get(route('backups.status', { runId: nextRunId }), {
          headers: { Accept: 'application/json' },
        });
        const p = Number(r?.data?.progress ?? 0);
        const done = Boolean(r?.data?.done);
        const msg = String(r?.data?.message ?? '');
        const err = String(r?.data?.error ?? '');

        setProgress(Number.isFinite(p) ? Math.max(0, Math.min(100, p)) : 0);
        setProgressMessage(msg);
        setProgressError(err);
        setIsDone(done);

        if (done) {
          stopPolling();
          try {
            window.localStorage.removeItem('manualBackupRunId');
          } catch (_e) {
          }

          if (window.Swal?.fire) {
            window.Swal.fire({
              title: err ? 'Backup gagal' : 'Backup selesai',
              text: err ? err : 'Backup selesai. Refresh untuk melihat file terbaru.',
              icon: err ? 'error' : 'success',
              confirmButtonText: 'OK',
              confirmButtonColor: err ? '#dc3545' : '#0d6efd',
            });
          }

          setStatusText(err ? 'Backup gagal. Cek backup.log untuk detail.' : 'Backup selesai. Refresh untuk melihat file terbaru.');
        }
      } catch (_e) {
      }
    };

    tick();
    pollRef.current = window.setInterval(tick, 1000);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem('manualBackupRunId') || '';
      if (saved) startPolling(saved);
    } catch (_e) {
    }

    return () => stopPolling();
  }, []);

  const runBackupNow = async () => {
    if (!canRunBackup) return;
    if (isRunning) return;
    if (typeof window === 'undefined') return;

    const Swal = window.Swal;
    if (Swal?.fire) {
      const result = await Swal.fire({
        title: 'Backup manual?',
        html: `
          <div style="text-align:left">
            <div style="font-weight:600; margin-bottom:6px">Aksi:</div>
            <ul style="margin:0; padding-left:18px">
              <li>Backup database</li>
              <li>Backup storage</li>
              <li>Sync ke Google Drive</li>
            </ul>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Jalankan Backup',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#0d6efd',
        cancelButtonColor: '#6c757d',
        reverseButtons: false,
        focusCancel: true,
      });
      if (!result.isConfirmed) return;
    } else {
      const ok = window.confirm('Jalankan backup manual sekarang dan sync ke Google Drive?');
      if (!ok) return;
    }

    setIsRunning(true);
    setStatusText('');
    setProgress(0);
    setProgressMessage('Memulai...');
    setProgressError('');
    setIsDone(false);

    try {
      const resp = await axios.post(route('backups.run'), {}, {
        headers: { Accept: 'application/json' },
      });
      const nextRunId = String(resp?.data?.runId ?? '');
      const alreadyRunning = Boolean(resp?.data?.alreadyRunning);
      if (!nextRunId) throw new Error('RUN_ID_MISSING');

      startPolling(nextRunId);
      setStatusText(alreadyRunning ? 'Backup sedang berjalan. Menampilkan progres yang aktif.' : 'Backup dimulai. Progres ditampilkan di header.');
    } catch (e) {
      const status = e?.response?.status;
      const apiError = e?.response?.data?.error;
      const msg =
        apiError ? String(apiError) :
        status === 401 ? 'Session habis. Silakan login ulang.' :
        status === 403 ? 'Tidak punya akses untuk menjalankan backup.' :
        status === 419 ? 'Session/CSRF tidak valid. Refresh halaman lalu coba lagi.' :
        status === 409 ? 'Backup sebelumnya tidak valid. Refresh halaman lalu coba lagi.' :
        'Gagal memulai backup. Coba ulang.';

      setStatusText(msg);
      if (typeof window !== 'undefined' && window.Swal?.fire) {
        await window.Swal.fire({
          title: 'Gagal memulai backup',
          text: msg,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545',
        });
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <>
      <Head title="Backups" />
      <div className="row">
        <div className="col-12 col-lg-8">
          <div className="card">
            <div className="card-header">
              <div className="d-flex align-items-center justify-content-between w-100">
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <h5 className="mb-0">Backup Files</h5>
                  {runId && !isDone ? (
                    <div style={{ minWidth: 220 }}>
                      <div className="progress" style={{ height: 10, borderRadius: 999 }}>
                        <div
                          className={`progress-bar${progressError ? ' bg-danger' : ' bg-primary'}`}
                          role="progressbar"
                          style={{ width: `${progress}%`, borderRadius: 999 }}
                          aria-valuenow={progress}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        />
                      </div>
                      <div className="small text-muted mt-1" style={{ lineHeight: 1.1 }}>
                        {progressError ? progressError : (progressMessage || `${progress}%`)}
                      </div>
                    </div>
                  ) : null}
                </div>
                {canRunBackup ? (
                  <button type="button" className="btn btn-primary btn-sm" onClick={runBackupNow} disabled={isRunning}>
                    {isRunning ? 'Running...' : 'Backup'}
                  </button>
                ) : null}
              </div>
            </div>
            <div className="card-body">
              <p className="mb-2">Root: <code>{root || '-'}</code></p>
              {statusText ? (
                <div className="alert alert-info" role="alert">
                  {statusText}
                </div>
              ) : null}
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
    </>
  );
}

Index.layout = (page) => <AuthenticatedLayout header="Backups">{page}</AuthenticatedLayout>;
