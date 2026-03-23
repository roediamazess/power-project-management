import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { filterByQuery } from '@/utils/smartSearch';
import { formatDateDdMmmYy, formatDateTimeDdMmmYyDayHms, parseDateDdMmmYyToIso } from '@/utils/date';
import DatePickerInput from '@/Components/DatePickerInput';

const statusBadgeClass = {
    'Brain Dump': 'bg-secondary',
    'Priority List': 'bg-warning',
    'Time Boxing': 'bg-primary',
    Completed: 'bg-success',
};

const priorityBadgeClass = {
    Normal: 'bg-secondary',
    High: 'bg-warning',
    Urgent: 'bg-danger',
};

const optionObjects = (items) => (items ?? []).map((o) => (typeof o === 'string' ? { name: o, status: 'Active' } : o));

const dateInputValue = (iso) => {
    if (!iso) return '';
    const v = formatDateDdMmmYy(iso);
    return v === '-' ? '' : v;
};

export default function TimeBoxingIndex({ items, filters, typeOptions, priorityOptions, statusOptions, partners, projects, pageSearchQuery }) {
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [filterStatus, setFilterStatus] = useState(filters?.status ?? 'all');
    const [filterPriority, setFilterPriority] = useState(filters?.priority ?? 'all');
    const [filterType, setFilterType] = useState(filters?.type ?? '');
    const [filterPartnerId, setFilterPartnerId] = useState(filters?.partner_id ? String(filters.partner_id) : '');
    const [filterProjectId, setFilterProjectId] = useState(filters?.project_id ? String(filters.project_id) : '');
    const [filterDateFrom, setFilterDateFrom] = useState(dateInputValue(filters?.date_from));
    const [filterDateTo, setFilterDateTo] = useState(dateInputValue(filters?.date_to));

    useEffect(() => {
        setFilterStatus(filters?.status ?? 'all');
        setFilterPriority(filters?.priority ?? 'all');
        setFilterType(filters?.type ?? '');
        setFilterPartnerId(filters?.partner_id ? String(filters.partner_id) : '');
        setFilterProjectId(filters?.project_id ? String(filters.project_id) : '');
        setFilterDateFrom(dateInputValue(filters?.date_from));
        setFilterDateTo(dateInputValue(filters?.date_to));
    }, [filters]);

    const rows = items?.data ?? [];

    const editingItem = useMemo(() => {
        if (!editingId) return null;
        return rows.find((t) => t.id === editingId) ?? null;
    }, [editingId, rows]);

    const typeFilterOptions = useMemo(() => {
        const fromSetup = optionObjects(typeOptions)
            .map((o) => String(o?.name ?? '').trim())
            .filter((v) => v !== '');

        const extra = filterType && !fromSetup.includes(filterType) ? [filterType] : [];
        return Array.from(new Set([...fromSetup, ...extra])).sort((a, b) => a.localeCompare(b));
    }, [filterType, typeOptions]);

    const clientFilteredRows = useMemo(() => {
        return filterByQuery(rows, pageSearchQuery, (t) => [
            t.id,
            t.no,
            t.type,
            t.priority,
            t.user_position,
            t.partner?.cnc_id,
            t.partner?.name,
            t.project?.cnc_id,
            t.project?.project_name,
            t.status,
            t.description,
            t.action_solution,
        ]);
    }, [rows, pageSearchQuery]);

    const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        information_date: formatDateDdMmmYy(todayIso),
        type: '',
        priority: (priorityOptions ?? [])[0] ?? 'Normal',
        user_position: '',
        partner_id: '',
        description: '',
        action_solution: '',
        status: (statusOptions ?? [])[0] ?? 'Brain Dump',
        due_date: '',
        project_id: '',
    });

    useEffect(() => {
        if (!showModal) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') closeModal();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showModal]);

    const selectedPartner = useMemo(() => {
        const id = data.partner_id ? Number(data.partner_id) : null;
        if (!id) return null;
        return (partners ?? []).find((p) => p.id === id) ?? null;
    }, [data.partner_id, partners]);

    const selectedProject = useMemo(() => {
        const id = String(data.project_id ?? '');
        if (!id) return null;
        return (projects ?? []).find((p) => String(p.id) === id) ?? null;
    }, [data.project_id, projects]);

    const openCreate = () => {
        setEditingId(null);
        clearErrors();
        reset();
        setData({
            information_date: formatDateDdMmmYy(todayIso),
            type: '',
            priority: (priorityOptions ?? [])[0] ?? 'Normal',
            user_position: '',
            partner_id: '',
            description: '',
            action_solution: '',
            status: (statusOptions ?? [])[0] ?? 'Brain Dump',
            due_date: '',
            project_id: '',
        });
        setShowModal(true);
    };

    const openEdit = (t) => {
        setEditingId(t.id);
        clearErrors();
        setData({
            information_date: t.information_date ? formatDateDdMmmYy(t.information_date) : formatDateDdMmmYy(todayIso),
            type: t.type ?? '',
            priority: t.priority ?? ((priorityOptions ?? [])[0] ?? 'Normal'),
            user_position: t.user_position ?? '',
            partner_id: t.partner_id ?? '',
            description: t.description ?? '',
            action_solution: t.action_solution ?? '',
            status: t.status ?? ((statusOptions ?? [])[0] ?? 'Brain Dump'),
            due_date: t.due_date ? formatDateDdMmmYy(t.due_date) : '',
            project_id: t.project_id ?? '',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        clearErrors();
    };

    const renderTypeOptions = (selectedValue) => {
        const opts = optionObjects(typeOptions);
        const selected = String(selectedValue ?? '');

        return (
            <>
                <option value="">-</option>
                {opts
                    .map((o) => ({ name: String(o?.name ?? ''), status: String(o?.status ?? 'Active') }))
                    .filter((o) => o.name !== '')
                    .map((o) => {
                        const isActive = o.status === 'Active';
                        const isSelected = o.name === selected;
                        if (!isActive && !isSelected) return null;

                        const label = !isActive ? `${o.name} (Inactive)` : o.name;
                        return (
                            <option key={`type||${o.name}||${o.status}`} value={o.name} disabled={!isActive}>
                                {label}
                            </option>
                        );
                    })}
            </>
        );
    };

    const submit = (e) => {
        e.preventDefault();

        const payload = {
            ...data,
            information_date: parseDateDdMmmYyToIso(data.information_date),
            due_date: data.due_date ? parseDateDdMmmYyToIso(data.due_date) : null,
            partner_id: data.partner_id === '' ? null : Number(data.partner_id),
            project_id: data.project_id === '' ? null : String(data.project_id),
        };

        if (editingId) {
            put(route('tables.time-boxing.update', { timeBoxing: editingId }), {
                preserveScroll: true,
                data: payload,
                onSuccess: () => closeModal(),
            });
            return;
        }

        post(route('tables.time-boxing.store'), {
            preserveScroll: true,
            data: payload,
            onSuccess: () => closeModal(),
        });
    };

    const doDelete = (t) => {
        if (!window.confirm(`Delete Time Boxing #${t.no}?`)) return;
        destroy(route('tables.time-boxing.destroy', { timeBoxing: t.id }), {
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setFilterStatus('all');
        setFilterPriority('all');
        setFilterType('');
        setFilterPartnerId('');
        setFilterProjectId('');
        setFilterDateFrom('');
        setFilterDateTo('');
    };

    const applyHref = useMemo(() => {
        const params = {};

        if (filterStatus && filterStatus !== 'all') params.status = filterStatus;
        if (filterPriority && filterPriority !== 'all') params.priority = filterPriority;
        if (filterType && filterType.trim()) params.type = filterType.trim();
        if (filterPartnerId) params.partner_id = Number(filterPartnerId);
        if (filterProjectId) params.project_id = String(filterProjectId);

        const fromIso = parseDateDdMmmYyToIso(filterDateFrom);
        const toIso = parseDateDdMmmYyToIso(filterDateTo);
        if (fromIso) params.date_from = fromIso;
        if (toIso) params.date_to = toIso;

        return route('tables.time-boxing.index', params);
    }, [filterDateFrom, filterDateTo, filterPartnerId, filterPriority, filterProjectId, filterStatus, filterType]);

    const resetHref = route('tables.time-boxing.index');

    return (
        <>
            <Head title="Time Boxing" />

            <div className="row">
                <div className="col-xl-12">
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <h4 className="card-title mb-0">Time Boxing</h4>
                                <p className="mb-0 text-muted">
                                    Showing {items?.from ?? 0}-{items?.to ?? 0} of {items?.total ?? 0}
                                </p>
                            </div>
                            <div className="d-flex flex-wrap gap-2">
                                <Link href={applyHref} className="btn btn-primary">
                                    Apply
                                </Link>
                                <Link href={resetHref} className="btn btn-outline-secondary">
                                    Reset
                                </Link>
                                <button type="button" className="btn btn-success" onClick={openCreate}>
                                    New
                                </button>
                            </div>
                        </div>

                        <div className="card-body">
                            <div className="row mb-3">
                                <div className="col-xl-2 col-lg-3 col-md-6 mb-2">
                                    <label className="text-black font-w600 form-label">Status</label>
                                    <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                        <option value="all">All</option>
                                        {(statusOptions ?? []).map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-xl-2 col-lg-3 col-md-6 mb-2">
                                    <label className="text-black font-w600 form-label">Priority</label>
                                    <select className="form-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                                        <option value="all">All</option>
                                        {(priorityOptions ?? []).map((p) => (
                                            <option key={p} value={p}>
                                                {p}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-xl-2 col-lg-3 col-md-6 mb-2">
                                    <label className="text-black font-w600 form-label">Type</label>
                                    <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                        <option value="">All</option>
                                        {typeFilterOptions.map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-xl-3 col-lg-3 col-md-6 mb-2">
                                    <label className="text-black font-w600 form-label">Partner</label>
                                    <select className="form-select" value={filterPartnerId} onChange={(e) => setFilterPartnerId(e.target.value)}>
                                        <option value="">All</option>
                                        {(partners ?? []).map((p) => (
                                            <option key={p.id} value={String(p.id)}>
                                                {p.cnc_id} - {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-xl-3 col-lg-3 col-md-6 mb-2">
                                    <label className="text-black font-w600 form-label">Project</label>
                                    <select className="form-select" value={filterProjectId} onChange={(e) => setFilterProjectId(e.target.value)}>
                                        <option value="">All</option>
                                        {(projects ?? []).map((p) => (
                                            <option key={p.id} value={String(p.id)}>
                                                {p.cnc_id} - {p.project_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-xl-2 col-lg-3 col-md-6 mb-2">
                                    <label className="text-black font-w600 form-label">Info Date From</label>
                                    <DatePickerInput value={filterDateFrom} onChange={setFilterDateFrom} className="form-control" />
                                </div>

                                <div className="col-xl-2 col-lg-3 col-md-6 mb-2">
                                    <label className="text-black font-w600 form-label">Info Date To</label>
                                    <DatePickerInput value={filterDateTo} onChange={setFilterDateTo} className="form-control" />
                                </div>

                                <div className="col-xl-2 col-lg-3 col-md-6 mb-2 d-flex align-items-end">
                                    <button type="button" className="btn btn-outline-secondary w-100" onClick={resetFilters}>
                                        Clear Filters
                                    </button>
                                </div>
                            </div>

                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div className="text-muted">On this page: {clientFilteredRows.length}</div>
                                <div className="d-flex gap-2">
                                    <Link href={items?.prev_page_url ?? '#'} className={`btn btn-sm btn-outline-secondary ${items?.prev_page_url ? '' : 'disabled'}`}>
                                        Prev
                                    </Link>
                                    <Link href={items?.next_page_url ?? '#'} className={`btn btn-sm btn-outline-secondary ${items?.next_page_url ? '' : 'disabled'}`}>
                                        Next
                                    </Link>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="table table-striped table-responsive-md">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 80 }}>ID</th>
                                            <th style={{ minWidth: 140 }}>Info Date</th>
                                            <th style={{ minWidth: 160 }}>Type</th>
                                            <th style={{ width: 120 }}>Priority</th>
                                            <th style={{ minWidth: 200 }}>User &amp; Position</th>
                                            <th style={{ minWidth: 240 }}>Partner</th>
                                            <th style={{ minWidth: 240 }}>Project</th>
                                            <th style={{ width: 140 }}>Status</th>
                                            <th style={{ minWidth: 140 }}>Due Date</th>
                                            <th style={{ minWidth: 220 }}>Completed Date</th>
                                            <th style={{ width: 180 }} />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clientFilteredRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={11} className="text-center text-muted">
                                                    No time boxing found
                                                </td>
                                            </tr>
                                        ) : null}

                                        {clientFilteredRows.map((t) => (
                                            <tr key={t.id}>
                                                <td title={t.id}>{t.no}</td>
                                                <td>{formatDateDdMmmYy(t.information_date)}</td>
                                                <td>{t.type ?? '-'}</td>
                                                <td>
                                                    <span className={`badge ${priorityBadgeClass[t.priority] ?? 'bg-secondary'}`}>{t.priority ?? '-'}</span>
                                                </td>
                                                <td>{t.user_position ?? '-'}</td>
                                                <td>
                                                    {t.partner ? (
                                                        <>
                                                            <div>{t.partner.cnc_id}</div>
                                                            <div className="text-muted">{t.partner.name}</div>
                                                        </>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td>
                                                    {t.project ? (
                                                        <>
                                                            <div>{t.project.cnc_id}</div>
                                                            <div className="text-muted">{t.project.project_name}</div>
                                                        </>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`badge ${statusBadgeClass[t.status] ?? 'bg-secondary'}`}>{t.status ?? '-'}</span>
                                                </td>
                                                <td>{formatDateDdMmmYy(t.due_date)}</td>
                                                <td>{t.completed_at ? formatDateTimeDdMmmYyDayHms(t.completed_at) : '-'}</td>
                                                <td className="text-end">
                                                    <div className="d-flex gap-2 justify-content-end">
                                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openEdit(t)}>
                                                            Edit
                                                        </button>
                                                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => doDelete(t)} disabled={processing}>
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
                        <div className="modal-dialog modal-dialog-centered modal-xl" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{editingId ? `Edit Time Boxing #${editingItem?.no ?? ''}` : 'New Time Boxing'}</h5>
                                    <button type="button" className="btn-close" onClick={closeModal} />
                                </div>

                                <form onSubmit={submit}>
                                    <div className="modal-body">
                                        <div className="row">
                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label required">Information Date</label>
                                                <DatePickerInput value={data.information_date} onChange={(v) => setData('information_date', v)} className="form-control" invalid={Boolean(errors.information_date)} />
                                                {errors.information_date ? <div className="invalid-feedback">{errors.information_date}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label required">Type</label>
                                                <select className={`form-select ${errors.type ? 'is-invalid' : ''}`} value={data.type} onChange={(e) => setData('type', e.target.value)}>
                                                    {renderTypeOptions(data.type)}
                                                </select>
                                                {errors.type ? <div className="invalid-feedback">{errors.type}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label required">Priority</label>
                                                <select className={`form-select ${errors.priority ? 'is-invalid' : ''}`} value={data.priority} onChange={(e) => setData('priority', e.target.value)}>
                                                    {(priorityOptions ?? []).map((p) => (
                                                        <option key={p} value={p}>
                                                            {p}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.priority ? <div className="invalid-feedback">{errors.priority}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label required">Status</label>
                                                <select className={`form-select ${errors.status ? 'is-invalid' : ''}`} value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                                    {(statusOptions ?? []).map((s) => (
                                                        <option key={s} value={s}>
                                                            {s}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.status ? <div className="invalid-feedback">{errors.status}</div> : null}
                                            </div>

                                            <div className="col-lg-6 mb-3">
                                                <label className="text-black font-w600 form-label">User &amp; Position</label>
                                                <input className={`form-control ${errors.user_position ? 'is-invalid' : ''}`} value={data.user_position} onChange={(e) => setData('user_position', e.target.value)} />
                                                {errors.user_position ? <div className="invalid-feedback">{errors.user_position}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">Partner ID</label>
                                                <select className={`form-select ${errors.partner_id ? 'is-invalid' : ''}`} value={data.partner_id} onChange={(e) => setData('partner_id', e.target.value)}>
                                                    <option value="">-</option>
                                                    {(partners ?? []).map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.cnc_id} - {p.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.partner_id ? <div className="invalid-feedback">{errors.partner_id}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">Partner Name</label>
                                                <input className="form-control" value={selectedPartner?.name ?? ''} disabled />
                                            </div>

                                            <div className="col-lg-9 mb-3">
                                                <label className="text-black font-w600 form-label">Description</label>
                                                <textarea className={`form-control ${errors.description ? 'is-invalid' : ''}`} rows={4} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                                                {errors.description ? <div className="invalid-feedback">{errors.description}</div> : null}
                                            </div>

                                            <div className="col-lg-9 mb-3">
                                                <label className="text-black font-w600 form-label">Action / Solution</label>
                                                <textarea className={`form-control ${errors.action_solution ? 'is-invalid' : ''}`} rows={4} value={data.action_solution} onChange={(e) => setData('action_solution', e.target.value)} />
                                                {errors.action_solution ? <div className="invalid-feedback">{errors.action_solution}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">Due Date</label>
                                                <DatePickerInput value={data.due_date} onChange={(v) => setData('due_date', v)} className="form-control" invalid={Boolean(errors.due_date)} />
                                                {errors.due_date ? <div className="invalid-feedback">{errors.due_date}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">Project ID</label>
                                                <select className={`form-select ${errors.project_id ? 'is-invalid' : ''}`} value={data.project_id} onChange={(e) => setData('project_id', e.target.value)}>
                                                    <option value="">-</option>
                                                    {(projects ?? []).map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.cnc_id} - {p.project_name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.project_id ? <div className="invalid-feedback">{errors.project_id}</div> : null}
                                            </div>

                                            <div className="col-lg-9 mb-3">
                                                <label className="text-black font-w600 form-label">Project Name</label>
                                                <input className="form-control" value={selectedProject?.project_name ?? ''} disabled />
                                            </div>

                                            <div className="col-lg-12">
                                                <div className="text-muted">Completed Date: {editingItem?.completed_at ? formatDateTimeDdMmmYyDayHms(editingItem.completed_at) : '-'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button type="submit" className="btn btn-primary" disabled={processing}>
                                            {editingId ? 'Update' : 'Create'}
                                        </button>
                                        <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={processing}>
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
        </>
    );
}

TimeBoxingIndex.layout = (page) => <AuthenticatedLayout header="Time Boxing">{page}</AuthenticatedLayout>;
