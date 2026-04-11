import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { formatDateDdMmmYy, formatPickupWindowWib } from '@/utils/date';
import ArrangementTabs from './Partials/ArrangementTabs';
import { useEffect, useRef, useState } from 'react';

export default function Index({ isManager, batches, myPickups, myPoints }) {
    const authUserId = usePage().props?.auth?.user?.id;
    const { post, delete: destroy, processing } = useForm();

    const [showPickupActionModal, setShowPickupActionModal] = useState(false);
    const [pickupAction, setPickupAction] = useState(null);
    const [selectedPickup, setSelectedPickup] = useState(null);

    const liveTimerRef = useRef(null);
    const liveInFlightRef = useRef(false);

    const showSweetWrong = (message) => {
        const text = message || 'Terjadi kendala saat memproses permintaan.';
        if (typeof window !== 'undefined' && window.Swal?.fire) {
            window.Swal.fire('Oops...', text, 'error');
            return;
        }
        if (typeof window !== 'undefined') window.alert(text);
    };

    const formatPickupStatusLabel = (pickup) => {
        if (pickup?.schedule?.status === 'Approved') return 'Approved';
        if (pickup?.status === 'Picked') return 'Picked Up';
        return pickup?.status ?? 'Picked Up';
    };

    const pickup = (scheduleId) => {
        post(route('arrangements.pickups.store', { schedule: scheduleId }, false), {
            preserveScroll: true,
            onError: (errs) => {
                const msg =
                    errs?.schedule ||
                    errs?.pickup_window ||
                    errs?.batch ||
                    'Tidak bisa melakukan Pick Up. Silakan cek kembali jadwal Anda.';
                showSweetWrong(String(msg));
            },
        });
    };

    const refreshLive = () => {
        if (liveInFlightRef.current) return;
        liveInFlightRef.current = true;

        router.reload({
            only: ['batches', 'myPickups', 'myPoints'],
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
                liveInFlightRef.current = false;
            },
        });
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const scheduleNext = () => {
            if (liveTimerRef.current) window.clearTimeout(liveTimerRef.current);
            const jitterMs = Math.floor(Math.random() * 500);
            liveTimerRef.current = window.setTimeout(() => {
                if (document.visibilityState === 'visible' && !processing && !showPickupActionModal) {
                    refreshLive();
                }
                scheduleNext();
            }, 5000 + jitterMs);
        };

        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                refreshLive();
            }
        };

        const onFocus = () => refreshLive();

        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('focus', onFocus);

        scheduleNext();

        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('focus', onFocus);
            if (liveTimerRef.current) window.clearTimeout(liveTimerRef.current);
        };
    }, [processing, showPickupActionModal]);

    const openPickupAction = (action, pickup) => {
        setPickupAction(action);
        setSelectedPickup(pickup);
        setShowPickupActionModal(true);
    };

    const closePickupAction = () => {
        if (processing) return;
        setShowPickupActionModal(false);
        setPickupAction(null);
        setSelectedPickup(null);
    };

    const confirmPickupAction = () => {
        if (!selectedPickup?.id || !pickupAction) return;
        const id = selectedPickup.id;

        if (pickupAction === 'cancel') {
            destroy(route('arrangements.pickups.destroy', { pickup: id }, false), { preserveScroll: true, onFinish: closePickupAction });
            return;
        }

        if (pickupAction === 'release') {
            post(route('arrangements.pickups.release', { pickup: id }, false), { preserveScroll: true, onFinish: closePickupAction });
            return;
        }

        if (pickupAction === 'reopen') {
            post(route('arrangements.pickups.reopen', { pickup: id }, false), { preserveScroll: true, onFinish: closePickupAction });
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Open':
                return 'bg-primary';
            case 'Batched':
                return 'bg-info';
            case 'Picked Up':
                return 'bg-warning';
            case 'Approved':
                return 'bg-success';
            default:
                return 'bg-secondary';
        }
    };

    const parseDateValue = (value) => {
        if (!value) return null;
        const raw = String(value).trim();
        const normalized = raw.replace(/([+-]\d{2}):(\d{2})$/, '$1$2').replace(/\+00:00$/, 'Z');
        const d = new Date(normalized);
        if (Number.isNaN(d.getTime())) return null;
        return d;
    };

    const getPickupWindow = (batch) => {
        const start = parseDateValue(batch?.pickup_start_at);
        const end = parseDateValue(batch?.pickup_end_at);
        if (!start || !end) return null;
        return { start, end };
    };

    const isWithinPickupWindow = (batch) => {
        const w = getPickupWindow(batch);
        if (!w) return true;
        const now = new Date();
        return now >= w.start && now <= w.end;
    };

    const renderPickedBy = (pickups, limit = 3) => {
        const rows = pickups ?? [];
        if (!rows.length) return <span className="text-muted">Available</span>;

        const visible = rows.slice(0, limit);
        const remaining = rows.length - visible.length;

        return (
            <div className="d-flex flex-wrap gap-2">
                {visible.map((p) => (
                    <span key={p.id ?? `${p.user_id}`} className="badge bg-secondary">
                        {p.user?.name ?? 'User'}
                    </span>
                ))}
                {remaining > 0 ? <span className="badge bg-dark">+{remaining}</span> : null}
            </div>
        );
    };

    const parseDateOnly = (value) => {
        if (!value) return null;
        const text = String(value).trim();
        const m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) return null;
        const year = Number(m[1]);
        const month = Number(m[2]);
        const day = Number(m[3]);
        if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
        return new Date(Date.UTC(year, month - 1, day));
    };

    const hasOverlapWithMyPickups = (schedule) => {
        const start = parseDateOnly(schedule?.start_date);
        const end = parseDateOnly(schedule?.end_date);
        if (!start || !end) return false;

        return (myPickups ?? []).some((p) => {
            if (!p?.schedule) return false;
            const isActive = p.status === 'Picked' || p.status === 'Released' || p.schedule?.status === 'Approved';
            if (!isActive) return false;
            const ps = parseDateOnly(p.schedule.start_date);
            const pe = parseDateOnly(p.schedule.end_date);
            if (!ps || !pe) return false;
            return ps <= end && pe >= start;
        });
    };

    const showOverlapNotice = () => {
        showSweetWrong('Jadwal bentrok dengan jadwal Anda pada periode yang sama. Silakan pilih schedule lain atau cancel schedule yang bentrok.');
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Arrangement</h2>}
        >
            <Head title="Arrangement" />

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex flex-wrap align-items-center justify-content-between pb-2">
                            <div className="d-flex align-items-center flex-grow-1">
                                <ArrangementTabs isManager={isManager} />
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                <div>
                                    <h4 className="card-title mb-0 d-none d-sm-block">War Schedules</h4>
                                    <div className="text-muted fs-12 text-end">Point: {myPoints}</div>
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                {(batches ?? []).length ? (
                                    batches.map((b) => {
                                        const schedules = b.schedules ?? [];
                                        const totalSlots = schedules.reduce((acc, s) => acc + (s.count ?? 0), 0);
                                        const totalPicked = schedules.reduce((acc, s) => acc + ((s.pickups ?? []).length || 0), 0);
                                        const batchPoints = schedules.reduce(
                                            (acc, s) => acc + (s.pickups ?? []).reduce((a, p) => a + (p.points ?? 0), 0),
                                            0
                                        );
                                        const minPoints = b.min_requirement_points ?? 0;
                                        const maxPoints = b.max_requirement_points || b.requirement_points || 0;
                                        const pct = maxPoints ? Math.min(100, Math.round((batchPoints / maxPoints) * 100)) : 0;
                                        const inWindow = isWithinPickupWindow(b);

                                        return (
                                            <div key={b.id} className="col-12 col-xl-6">
                                                <div className="card border">
                                                    <div className="card-header d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <div className="fw-semibold">{b.name}</div>
                                                            <div className="text-muted fs-12">
                                                                Points: {batchPoints} / {maxPoints} (Min: {minPoints}) • Picked: {totalPicked} / {totalSlots}
                                                            </div>
                                                            {b.pickup_start_at && b.pickup_end_at ? (
                                                                <div className={`fs-12 ${inWindow ? 'text-muted' : 'text-danger'}`}>
                                                                    {formatPickupWindowWib(b.pickup_start_at, b.pickup_end_at)} WIB
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                        <div className="text-end">
                                                            <div className="fw-semibold">{pct}%</div>
                                                        </div>
                                                    </div>
                                                    <div className="card-body">
                                                        <div className="progress mb-3" style={{ height: 8 }}>
                                                            <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${pct}%` }} />
                                                        </div>
                                                        <div className="table-responsive">
                                                            <table className="table table-sm mb-0">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Schedule</th>
                                                                        <th>Range</th>
                                                                        <th>Picked By</th>
                                                                        <th>Status</th>
                                                                        <th className="text-end">Action</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {schedules.length ? (
                                                                        schedules.map((s) => {
                                                                            const picked = (s.pickups ?? []).length;
                                                                            const full = picked >= (s.count ?? 0);
                                                                            const alreadyPicked = (s.pickups ?? []).some((p) => p.user_id === authUserId);
                                                                            const overlap = hasOverlapWithMyPickups(s);
                                                                            const canPick =
                                                                                (b.status ?? 'Open') === 'Approved' && inWindow && s.status === 'Batched' && !full && !alreadyPicked;

                                                                            return (
                                                                                <tr key={s.id}>
                                                                                    <td>
                                                                                        <div className="fw-semibold">{s.schedule_type}</div>
                                                                                        <div className="text-muted fs-12">{s.note || '-'}</div>
                                                                                    </td>
                                                                                    <td className="white-space-nowrap">
                                                                                        {formatDateDdMmmYy(s.start_date)} – {formatDateDdMmmYy(s.end_date)}
                                                                                    </td>
                                                                                    <td>{renderPickedBy(s.pickups)}</td>
                                                                                    <td>
                                                                                        <span className={`badge ${getStatusVariant(s.status)}`}>{s.status}</span>
                                                                                    </td>
                                                                                    <td className="text-end">
                                                                                        <button
                                                                                            type="button"
                                                                                            className={`btn btn-sm ${overlap ? 'btn-outline-warning' : 'btn-primary'}`}
                                                                                            onClick={() => {
                                                                                                if (!canPick) return;
                                                                                                if (overlap) {
                                                                                                    showOverlapNotice();
                                                                                                    return;
                                                                                                }
                                                                                                pickup(s.id);
                                                                                            }}
                                                                                            disabled={processing || !canPick}
                                                                                            title={
                                                                                                (b.status ?? 'Open') !== 'Approved'
                                                                                                    ? 'Batch belum Approved'
                                                                                                    : overlap
                                                                                                      ? 'Jadwal bentrok dengan jadwal Anda'
                                                                                                    : !inWindow
                                                                                                      ? 'Di luar Pick Up Window batch'
                                                                                                      : undefined
                                                                                            }
                                                                                        >
                                                                                            Pick Up
                                                                                        </button>
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })
                                                                    ) : (
                                                                        <tr>
                                                                            <td colSpan={5} className="text-center text-muted py-4">
                                                                                No schedules in this batch.
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-12">
                                        <div className="text-center text-muted py-4">No batches.</div>
                                    </div>
                                )}
                            </div>

                            <hr className="my-4" />

                            <h4 className="card-title mb-3">My Pickups</h4>
                            <div className="table-responsive">
                                <table className="table table-responsive-md mb-0">
                                    <thead>
                                        <tr>
                                            <th>Schedule</th>
                                            <th>Range</th>
                                            <th>Batch</th>
                                            <th>Status</th>
                                            <th>Points</th>
                                            <th className="text-end">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(myPickups ?? []).length ? (
                                            myPickups.map((p) => (
                                                <tr key={p.id}>
                                                    <td>{p.schedule?.schedule_type ?? '-'}</td>
                                                    <td>
                                                        {p.schedule?.start_date ? formatDateDdMmmYy(p.schedule.start_date) : '-'} –{' '}
                                                        {p.schedule?.end_date ? formatDateDdMmmYy(p.schedule.end_date) : '-'}
                                                    </td>
                                                    <td>{p.schedule?.batch ? `${p.schedule.batch.name} (${p.schedule.batch.requirement_points})` : '-'}</td>
                                                    <td>
                                                        <span
                                                            className={`badge ${
                                                                p.schedule?.status === 'Approved'
                                                                    ? 'bg-success'
                                                                    : p.status === 'Released'
                                                                      ? 'bg-warning'
                                                                      : 'bg-info'
                                                            }`}
                                                        >
                                                            {formatPickupStatusLabel(p)}
                                                        </span>
                                                    </td>
                                                    <td>{p.points}</td>
                                                    <td className="text-end">
                                                        {p.schedule?.status === 'Approved' ? (
                                                            <span className="text-muted">-</span>
                                                        ) : p.status === 'Released' ? (
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-warning"
                                                                onClick={() => openPickupAction('reopen', p)}
                                                                disabled={processing}
                                                            >
                                                                Reopen
                                                            </button>
                                                        ) : (
                                                            <div className="d-inline-flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => openPickupAction('cancel', p)}
                                                                    disabled={processing}
                                                                >
                                                                    Cancel Pick Up
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-warning"
                                                                    onClick={() => openPickupAction('release', p)}
                                                                    disabled={processing}
                                                                >
                                                                    Release
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="text-center text-muted py-4">
                                                    No pickups.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showPickupActionModal ? (
                <>
                    <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content border-0 shadow-lg overflow-hidden">
                                <div
                                    className="modal-header text-white"
                                    style={{
                                        background:
                                            pickupAction === 'cancel'
                                                ? 'linear-gradient(90deg, var(--danger) 0%, var(--primary) 65%, var(--danger) 100%)'
                                                : pickupAction === 'release'
                                                  ? 'linear-gradient(90deg, var(--warning) 0%, var(--primary) 65%, var(--warning) 100%)'
                                                  : 'linear-gradient(90deg, var(--info) 0%, var(--primary) 65%, var(--info) 100%)',
                                    }}
                                >
                                    <div>
                                        <h5 className="modal-title mb-0">
                                            {pickupAction === 'cancel' ? 'Cancel Pick Up' : pickupAction === 'release' ? 'Release Pick Up' : 'Reopen Pick Up'}
                                        </h5>
                                        <small style={{ opacity: 0.9 }}>
                                            {pickupAction === 'cancel'
                                                ? 'Schedule akan kembali available untuk di Pick Up.'
                                                : pickupAction === 'release'
                                                  ? 'Pick Up akan di-lock sampai di Reopen.'
                                                  : 'Membatalkan Release dan kembali ke Picked.'}
                                        </small>
                                    </div>
                                    <button type="button" className="btn-close btn-close-white" onClick={closePickupAction} disabled={processing} />
                                </div>
                                <div className="modal-body" style={{ background: 'var(--body-bg)' }}>
                                    <div className="fw-semibold">{selectedPickup?.schedule?.schedule_type ?? '-'}</div>
                                    <div className="text-muted">
                                        {selectedPickup?.schedule?.start_date ? formatDateDdMmmYy(selectedPickup.schedule.start_date) : '-'} –{' '}
                                        {selectedPickup?.schedule?.end_date ? formatDateDdMmmYy(selectedPickup.schedule.end_date) : '-'}
                                    </div>
                                </div>
                                <div className="modal-footer" style={{ background: 'var(--card)' }}>
                                    <button
                                        type="button"
                                        className={`btn ${
                                            pickupAction === 'cancel' ? 'btn-danger' : pickupAction === 'release' ? 'btn-warning' : 'btn-info'
                                        }`}
                                        onClick={confirmPickupAction}
                                        disabled={processing}
                                    >
                                        {pickupAction === 'cancel' ? 'Cancel Pick Up' : pickupAction === 'release' ? 'Release' : 'Reopen'}
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary" onClick={closePickupAction} disabled={processing}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" onClick={closePickupAction} />
                </>
            ) : null}
        </AuthenticatedLayout>
    );
}
