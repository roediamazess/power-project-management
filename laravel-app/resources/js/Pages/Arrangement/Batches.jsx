import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { formatDateDdMmmYy } from '@/utils/date';
import { useMemo, useState } from 'react';
import ArrangementTabs from './Partials/ArrangementTabs';

export default function Batches({ batches, publishSchedules }) {
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { data, setData, post, put, processing, clearErrors } = useForm({
        name: '',
        requirement_points: 0,
        schedule_ids: [],
    });

    const publishList = useMemo(() => publishSchedules ?? [], [publishSchedules]);

    const openNew = () => {
        setEditingId(null);
        clearErrors();
        setData({ name: '', requirement_points: 0, schedule_ids: [] });
        setShowModal(true);
    };

    const openEdit = (b) => {
        setEditingId(b.id);
        clearErrors();
        setData({
            name: b.name ?? '',
            requirement_points: b.requirement_points ?? 0,
            schedule_ids: publishList.filter((s) => s.batch_id === b.id).map((s) => s.id),
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        clearErrors();
    };

    const toggleSchedule = (id) => {
        setData('schedule_ids', data.schedule_ids.includes(id) ? data.schedule_ids.filter((x) => x !== id) : [...data.schedule_ids, id]);
    };

    const submit = (e) => {
        e.preventDefault();
        const payload = { ...data, requirement_points: Number(data.requirement_points) };

        if (editingId) {
            put(route('arrangements.batches.update', { batch: editingId }, false), { preserveScroll: true, data: payload, onSuccess: closeModal });
            return;
        }

        post(route('arrangements.batches.store', {}, false), { preserveScroll: true, data: payload, onSuccess: closeModal });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Arrangement — Batches</h2>}>
            <Head title="Arrangement Batches" />

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body py-2">
                            <ArrangementTabs isManager />
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <h4 className="card-title mb-0">Batches</h4>
                            <button type="button" className="btn btn-primary" onClick={openNew}>
                                New
                            </button>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-responsive-md">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Requirement Points</th>
                                            <th>Schedules</th>
                                            <th className="text-end">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(batches?.data ?? []).map((b) => (
                                            <tr key={b.id}>
                                                <td className="fw-semibold">{b.name}</td>
                                                <td>{b.requirement_points}</td>
                                                <td>{b.schedules_count ?? 0}</td>
                                                <td className="text-end">
                                                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openEdit(b)}>
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h4 className="card-title mb-0">Publish Schedules</h4>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-responsive-md">
                                    <thead>
                                        <tr>
                                            <th>Schedule</th>
                                            <th>Range</th>
                                            <th>Count</th>
                                            <th>Batch</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {publishList.length ? (
                                            publishList.map((s) => (
                                                <tr key={s.id}>
                                                    <td>{s.schedule_type}</td>
                                                    <td>
                                                        {formatDateDdMmmYy(s.start_date)} – {formatDateDdMmmYy(s.end_date)}
                                                    </td>
                                                    <td>{s.count}</td>
                                                    <td>{s.batch_id ?? '-'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="text-center text-muted">
                                                    No publish schedules.
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

            {showModal ? (
                <>
                    <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{editingId ? 'Edit Batch' : 'New Batch'}</h5>
                                    <button type="button" className="btn-close" onClick={closeModal} aria-label="Close" />
                                </div>
                                <form onSubmit={submit}>
                                    <div className="modal-body">
                                        <div className="row g-3">
                                            <div className="col-md-8">
                                                <label className="form-label">Batch Name</label>
                                                <input type="text" className="form-control" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Requirement Point</label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    className="form-control"
                                                    value={data.requirement_points}
                                                    onChange={(e) => setData('requirement_points', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label">Schedules (Publish)</label>
                                                <div className="list-group">
                                                    {publishList.map((s) => {
                                                        const checked = data.schedule_ids.includes(s.id);
                                                        return (
                                                            <label key={s.id} className="list-group-item d-flex align-items-center gap-2">
                                                                <input type="checkbox" checked={checked} onChange={() => toggleSchedule(s.id)} />
                                                                <span className="flex-grow-1">
                                                                    {s.schedule_type} — {formatDateDdMmmYy(s.start_date)} – {formatDateDdMmmYy(s.end_date)} (Count:{' '}
                                                                    {s.count})
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary" disabled={processing}>
                                            Save
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" onClick={closeModal} />
                </>
            ) : null}
        </AuthenticatedLayout>
    );
}
