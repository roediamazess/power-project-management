import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import DatePickerInput from '@/Components/DatePickerInput';
import { formatDateDdMmmYy, parseDateDdMmmYyToIso } from '@/utils/date';
import { useEffect, useMemo, useRef, useState } from 'react';
import ArrangementTabs from './Partials/ArrangementTabs';

export default function Schedules({ schedules, batches, scheduleTypes, statusOptions }) {
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingSchedule, setDeletingSchedule] = useState(null);
    const { data, setData, post, put, delete: destroy, processing, clearErrors } = useForm({
        batch_id: '',
        schedule_type: scheduleTypes?.[0] ?? 'Middle',
        note: '',
        start_date: '',
        end_date: '',
        count: 1,
        status: statusOptions?.[0] ?? 'Open',
    });

    const liveTimerRef = useRef(null);
    const liveInFlightRef = useRef(false);

    const batchOptions = useMemo(() => [{ id: '', name: '(No Batch)' }, ...(batches ?? [])], [batches]);

    const refreshLive = () => {
        if (liveInFlightRef.current) return;
        liveInFlightRef.current = true;

        router.reload({
            only: ['schedules'],
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
                if (document.visibilityState === 'visible' && !processing && !showModal && !showDeleteModal) {
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
    }, [processing, showModal, showDeleteModal]);

    const openNew = () => {
        setEditingId(null);
        clearErrors();
        setData({
            batch_id: '',
            schedule_type: scheduleTypes?.[0] ?? 'Middle',
            note: '',
            start_date: '',
            end_date: '',
            count: 1,
            status: statusOptions?.[0] ?? 'Open',
        });
        setShowModal(true);
    };

    const openEdit = (s) => {
        setEditingId(s.id);
        clearErrors();
        setData({
            batch_id: s.batch_id ?? '',
            schedule_type: s.schedule_type ?? (scheduleTypes?.[0] ?? 'Middle'),
            note: s.note ?? '',
            start_date: s.start_date ? formatDateDdMmmYy(s.start_date) : '',
            end_date: s.end_date ? formatDateDdMmmYy(s.end_date) : '',
            count: 1,
            status: s.status ?? (statusOptions?.[0] ?? 'Open'),
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        clearErrors();
    };

    const submit = (e) => {
        e.preventDefault();
        const payload = {
            ...data,
            start_date: parseDateDdMmmYyToIso(data.start_date),
            end_date: parseDateDdMmmYyToIso(data.end_date),
            count: Number(data.count),
        };

        if (editingId) {
            put(route('arrangements.schedules.update', { schedule: editingId }, false), { preserveScroll: true, data: payload, onSuccess: closeModal });
            return;
        }

        post(route('arrangements.schedules.store', {}, false), { preserveScroll: true, data: payload, onSuccess: closeModal });
    };

    const approve = (id) => {
        post(route('arrangements.schedules.approve', { schedule: id }, false), { preserveScroll: true });
    };

    const cancelApproved = (id) => {
        post(route('arrangements.schedules.reopen', { schedule: id }, false), { preserveScroll: true });
    };

    const openDelete = (s) => {
        setDeletingSchedule(s);
        setShowDeleteModal(true);
    };

    const closeDelete = () => {
        if (processing) return;
        setShowDeleteModal(false);
        setDeletingSchedule(null);
    };

    const confirmDelete = () => {
        if (!deletingSchedule?.id) return;
        destroy(route('arrangements.schedules.destroy', { schedule: deletingSchedule.id }, false), {
            preserveScroll: true,
            onFinish: () => {
                setShowDeleteModal(false);
                setDeletingSchedule(null);
            },
        });
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Open':
                return 'bg-primary';
            case 'Batched':
                return 'bg-info';
            case 'Picked Up':
                return 'bg-warning';
            case 'Released':
                return 'bg-warning';
            case 'Approved':
                return 'bg-success';
            default:
                return 'bg-secondary';
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Arrangement — Schedules</h2>}>
            <Head title="Arrangement Schedules" />

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex flex-wrap align-items-center justify-content-between pb-2">
                            <div className="d-flex align-items-center flex-grow-1">
                                <ArrangementTabs isManager />
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                <h4 className="card-title mb-0 d-none d-sm-block">Schedules</h4>
                                <button type="button" className="btn btn-primary" onClick={openNew}>
                                    New
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-responsive-md">
                                    <thead>
                                        <tr>
                                            <th>Schedule</th>
                                            <th>Range</th>
                                            <th>Count</th>
                                            <th>Picked</th>
                                            <th>Batch</th>
                                            <th>Status</th>
                                            <th className="text-end">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(schedules?.data ?? []).map((s) => (
                                            <tr key={s.id}>
                                                <td>
                                                    <div className="fw-semibold">{s.schedule_type}</div>
                                                    <div className="text-muted fs-12">{s.note || '-'}</div>
                                                </td>
                                                <td>
                                                    {formatDateDdMmmYy(s.start_date)} – {formatDateDdMmmYy(s.end_date)}
                                                </td>
                                                <td>{s.count}</td>
                                                <td>{s.pickups_count ?? 0}</td>
                                                <td>{s.batch ? `${s.batch.name} (${s.batch.requirement_points})` : '-'}</td>
                                                <td>
                                                   <span className={`badge ${getStatusVariant(s.status)}`}>{s.status}</span>
                                                </td>
                                                <td className="text-end">
                                                    <div className="d-flex gap-2 justify-content-end">
                                                        {s.status === 'Approved' ? (
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => cancelApproved(s.id)}
                                                                disabled={processing}
                                                            >
                                                                Cancel Approved
                                                            </button>
                                                        ) : null}
                                            {s.status === 'Released' &&
                                            (s.pickups_count ?? 0) >= (s.count ?? 0) &&
                                            (s.pickups_count ?? 0) > 0 &&
                                            (s.released_pickups_count ?? 0) === (s.pickups_count ?? 0) ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-success"
                                                    onClick={() => approve(s.id)}
                                                    disabled={processing}
                                                >
                                                    Approve
                                                </button>
                                            ) : null}
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => openEdit(s)}
                                                            disabled={processing || s.status !== 'Open'}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => openDelete(s)}
                                                            disabled={processing || s.status !== 'Open'}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showModal ? (
                <>
                    <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{editingId ? 'Edit Schedule' : 'New Schedule'}</h5>
                                    <button type="button" className="btn-close" onClick={closeModal} aria-label="Close" />
                                </div>
                                <form onSubmit={submit}>
                                    <div className="modal-body">
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label">Schedule</label>
                                                <select className="form-select" value={data.schedule_type} onChange={(e) => setData('schedule_type', e.target.value)}>
                                                    {(scheduleTypes ?? []).map((t) => (
                                                        <option key={t} value={t}>
                                                            {t}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Batch</label>
                                                <select className="form-select" value={data.batch_id} disabled>
                                                    {batchOptions.map((b) => (
                                                        <option key={b.id} value={b.id}>
                                                            {b.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <small className="text-muted d-block mt-1">Batch diisi otomatis saat proses batching.</small>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Start Date</label>
                                                <DatePickerInput className="form-control" value={data.start_date} onChange={(v) => setData('start_date', v)} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">End Date</label>
                                                <DatePickerInput className="form-control" value={data.end_date} onChange={(v) => setData('end_date', v)} />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">{editingId ? 'Count' : 'Duplicate Count'}</label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={20}
                                                    className="form-control"
                                                    value={data.count}
                                                    onChange={(e) => setData('count', e.target.value)}
                                                    disabled={!!editingId}
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Status</label>
                                                <select className="form-select" value={data.status} disabled>
                                                    {(statusOptions ?? []).map((t) => (
                                                        <option key={t} value={t}>
                                                            {t}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label">Note</label>
                                                <textarea className="form-control" rows={3} value={data.note} onChange={(e) => setData('note', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="submit" className="btn btn-primary" disabled={processing}>
                                            {editingId ? 'Update' : 'Save'}
                                        </button>
                                        <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" onClick={closeModal} />
                </>
            ) : null}

            {showDeleteModal ? (
                <>
                    <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content border-0 shadow-lg overflow-hidden">
                                <div
                                    className="modal-header text-white"
                                    style={{ background: 'linear-gradient(90deg, var(--danger) 0%, var(--primary) 65%, var(--danger) 100%)' }}
                                >
                                    <div>
                                        <h5 className="modal-title mb-0">Delete Schedule</h5>
                                        <small style={{ opacity: 0.9 }}>Tindakan ini tidak bisa dibatalkan.</small>
                                    </div>
                                    <button type="button" className="btn-close btn-close-white" onClick={closeDelete} disabled={processing} />
                                </div>
                                <div className="modal-body" style={{ background: 'var(--body-bg)' }}>
                                    <div className="mb-2">
                                        <div className="fw-semibold">{deletingSchedule?.schedule_type ?? '-'}</div>
                                        <div className="text-muted">
                                            {deletingSchedule?.start_date ? formatDateDdMmmYy(deletingSchedule.start_date) : '-'} –{' '}
                                            {deletingSchedule?.end_date ? formatDateDdMmmYy(deletingSchedule.end_date) : '-'}
                                        </div>
                                    </div>
                                    <div className="alert alert-warning mb-0">
                                        Apakah Anda yakin ingin menghapus schedule ini?
                                    </div>
                                </div>
                                <div className="modal-footer" style={{ background: 'var(--card)' }}>
                                    <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={processing}>
                                        Delete
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary" onClick={closeDelete} disabled={processing}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" onClick={closeDelete} />
                </>
            ) : null}
        </AuthenticatedLayout>
    );
}
