import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import DatePickerInput from '@/Components/DatePickerInput';
import { formatDateDdMmmYy, parseDateDdMmmYyToIso } from '@/utils/date';
import { useMemo, useState } from 'react';
import ArrangementTabs from './Partials/ArrangementTabs';

export default function Schedules({ schedules, batches, scheduleTypes, statusOptions }) {
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { data, setData, post, put, processing, clearErrors } = useForm({
        batch_id: '',
        schedule_type: scheduleTypes?.[0] ?? 'Middle',
        note: '',
        start_date: '',
        end_date: '',
        count: 1,
        status: statusOptions?.[0] ?? 'Open',
    });

    const batchOptions = useMemo(() => [{ id: '', name: '(No Batch)' }, ...(batches ?? [])], [batches]);

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

    const reopen = (id) => {
        post(route('arrangements.schedules.reopen', { schedule: id }, false), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Arrangement — Schedules</h2>}>
            <Head title="Arrangement Schedules" />

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body py-2">
                            <ArrangementTabs isManager />
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <h4 className="card-title mb-0">Schedules</h4>
                            <button type="button" className="btn btn-primary" onClick={openNew}>
                                New
                            </button>
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
                                                <td>{s.status}</td>
                                                <td className="text-end">
                                                    <div className="d-flex gap-2 justify-content-end">
                                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openEdit(s)}>
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-success"
                                                            onClick={() => approve(s.id)}
                                                            disabled={processing || s.status !== 'Publish'}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => reopen(s.id)} disabled={processing}>
                                                            Reopen
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
                                                <select className="form-select" value={data.batch_id} onChange={(e) => setData('batch_id', e.target.value)}>
                                                    {batchOptions.map((b) => (
                                                        <option key={b.id} value={b.id}>
                                                            {b.name}
                                                        </option>
                                                    ))}
                                                </select>
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
                                                <select className="form-select" value={data.status} onChange={(e) => setData('status', e.target.value)}>
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
