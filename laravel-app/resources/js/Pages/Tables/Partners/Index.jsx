import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { filterByQuery } from '@/utils/smartSearch';
import { formatDateDdMmmYy, parseDateDdMmmYyToIso } from '@/utils/date';
import DatePickerInput from '@/Components/DatePickerInput';

const STATUS_BADGE = {
    Active: 'bg-success',
    Inactive: 'bg-secondary',
    Freeze: 'bg-warning',
};

export default function PartnersIndex({ partners, filters, starOptions, statusOptions, setupOptions, pageSearchQuery }) {
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'Active');

    const rows = partners?.data ?? [];

    const editingPartner = useMemo(() => {
        if (!editingId) return null;
        return (rows ?? []).find((p) => p.id === editingId) ?? null;
    }, [editingId, rows]);

    const filteredPartners = useMemo(() => {
        return filterByQuery(rows ?? [], pageSearchQuery, (p) => [
            p.id,
            p.cnc_id,
            p.name,
            p.star,
            p.room,
            p.outlet,
            p.status,
            p.system_live,
            p.implementation_type,
            p.system_version,
            p.type,
            p.group,
            p.address,
            p.area,
            p.sub_area,
            p.gm_email,
            p.fc_email,
            p.ca_email,
            p.cc_email,
            p.ia_email,
            p.it_email,
            p.hrd_email,
            p.fom_email,
            p.dos_email,
            p.ehk_email,
            p.fbm_email,
            p.last_visit,
            p.last_visit_type,
            p.last_project,
            p.last_project_type,
        ]);
    }, [rows, pageSearchQuery]);

    useEffect(() => {
        setStatusFilter(filters?.status ?? 'Active');
    }, [filters?.status]);

    useEffect(() => {
        const q = String(pageSearchQuery ?? '').trim();
        const currentQ = String(filters?.q ?? '').trim();
        const currentStatus = String(filters?.status ?? 'Active');
        const nextStatus = String(statusFilter ?? 'Active');

        if (q === currentQ && nextStatus === currentStatus) return;

        const t = setTimeout(() => {
            const params = {};
            if (q) params.q = q;
            if (nextStatus && nextStatus !== 'Active') params.status = nextStatus;
            router.get(route('tables.partners.index', params), {}, { preserveScroll: true, preserveState: true, replace: true });
        }, 350);

        return () => clearTimeout(t);
    }, [filters?.q, filters?.status, pageSearchQuery, statusFilter]);


    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        cnc_id: '',
        name: '',
        star: '',
        room: '',
        outlet: '',
        status: statusOptions?.[0] ?? 'Active',
        system_live: '',
        implementation_type: '',
        system_version: '',
        type: '',
        group: '',
        address: '',
        area: '',
        sub_area: '',
        gm_email: '',
        fc_email: '',
        ca_email: '',
        cc_email: '',
        ia_email: '',
        it_email: '',
        hrd_email: '',
        fom_email: '',
        dos_email: '',
        ehk_email: '',
        fbm_email: '',
        last_visit: '',
        last_visit_type: '',
        last_project: '',
        last_project_type: '',
    });

    useEffect(() => {
        if (!showModal) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showModal]);

    const openCreate = () => {
        setEditingId(null);
        clearErrors();
        reset();
        setData({
            cnc_id: '',
            name: '',
            star: '',
            room: '',
            outlet: '',
            status: statusOptions?.[0] ?? 'Active',
            system_live: '',
            implementation_type: '',
            system_version: '',
            type: '',
            group: '',
            address: '',
            area: '',
            sub_area: '',
            gm_email: '',
            fc_email: '',
            ca_email: '',
            cc_email: '',
            ia_email: '',
            it_email: '',
            hrd_email: '',
            fom_email: '',
            dos_email: '',
            ehk_email: '',
            fbm_email: '',
            last_visit: '',
            last_visit_type: '',
            last_project: '',
            last_project_type: '',
        });
        setShowModal(true);
    };

    const openEdit = (p) => {
        setEditingId(p.id);
        clearErrors();
        setData({
            cnc_id: p.cnc_id ?? '',
            name: p.name ?? '',
            star: p.star ?? '',
            room: p.room ?? '',
            outlet: p.outlet ?? '',
            status: p.status ?? (statusOptions?.[0] ?? 'Active'),
            system_live: p.system_live ? formatDateDdMmmYy(p.system_live) : '',
            implementation_type: p.implementation_type ?? '',
            system_version: p.system_version ?? '',
            type: p.type ?? '',
            group: p.group ?? '',
            address: p.address ?? '',
            area: p.area ?? '',
            sub_area: p.sub_area ?? '',
            gm_email: p.gm_email ?? '',
            fc_email: p.fc_email ?? '',
            ca_email: p.ca_email ?? '',
            cc_email: p.cc_email ?? '',
            ia_email: p.ia_email ?? '',
            it_email: p.it_email ?? '',
            hrd_email: p.hrd_email ?? '',
            fom_email: p.fom_email ?? '',
            dos_email: p.dos_email ?? '',
            ehk_email: p.ehk_email ?? '',
            fbm_email: p.fbm_email ?? '',
            last_visit: p.last_visit ? formatDateDdMmmYy(p.last_visit) : '',
            last_visit_type: p.last_visit_type ?? '',
            last_project: p.last_project ?? '',
            last_project_type: p.last_project_type ?? '',
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
            star: data.star === '' ? null : Number(data.star),
            system_live: parseDateDdMmmYyToIso(data.system_live),
            last_visit: parseDateDdMmmYyToIso(data.last_visit),
        };

        if (editingId) {
            put(route('tables.partners.update', { partner: editingId }), {
                preserveScroll: true,
                data: payload,
                onSuccess: () => closeModal(),
            });
            return;
        }

        post(route('tables.partners.store'), {
            preserveScroll: true,
            data: payload,
            onSuccess: () => closeModal(),
        });
    };

    const doDelete = (p) => {
        if (!window.confirm(`Delete partner: ${p.name} (${p.cnc_id})?`)) return;
        destroy(route('tables.partners.destroy', { partner: p.id }), {
            preserveScroll: true,
        });
    };

    const optionList = (key) => (setupOptions?.[key] ?? []).map((o) => (typeof o === 'string' ? { name: o, status: 'Active' } : o));

    const renderSetupOptions = (key, selectedValue) => {
        const items = optionList(key);
        const selected = String(selectedValue ?? '');

        return (
            <>
                <option value="">-</option>
                {items
                    .map((o) => ({
                        name: String(o?.name ?? ''),
                        status: String(o?.status ?? 'Active'),
                        parent_name: o?.parent_name ?? null,
                    }))
                    .filter((o) => o.name !== '')
                    .map((o) => {
                        const isActive = o.status === 'Active';
                        const isSelected = o.name === selected;
                        if (!isActive && !isSelected) return null;

                        const label = !isActive ? `${o.name} (Inactive)` : o.name;
                        return (
                            <option key={`${key}||${o.parent_name ?? ''}||${o.name}||${o.status}`} value={o.name} disabled={!isActive}>
                                {label}
                            </option>
                        );
                    })}
            </>
        );
    };


    const renderSubAreaOptions = (areaValue, selectedValue) => {
        const area = String(areaValue ?? '');
        const selected = String(selectedValue ?? '');

        const items = optionList('sub_area')
            .map((o) => ({
                name: String(o?.name ?? ''),
                status: String(o?.status ?? 'Active'),
                parent_name: String(o?.parent_name ?? ''),
            }))
            .filter((o) => o.name !== '' && o.parent_name === area);

        const selectedItem = selected ? items.find((o) => o.name === selected) : null;
        const selectedMismatch = selected && !selectedItem;

        return (
            <>
                <option value="">-</option>
                {selectedMismatch ? (
                    <option key={`sub_area||mismatch||${selected}`} value={selected} disabled>
                        {selected} (Mismatch)
                    </option>
                ) : null}
                {items.map((o) => {
                    const isActive = o.status === 'Active';
                    const isSelected = o.name === selected;
                    if (!isActive && !isSelected) return null;

                    const label = !isActive ? `${o.name} (Inactive)` : o.name;
                    return (
                        <option key={`sub_area||${o.parent_name}||${o.name}||${o.status}`} value={o.name} disabled={!isActive}>
                            {label}
                        </option>
                    );
                })}
            </>
        );
    };

    return (
        <>
            <Head title="Partners" />

            <div className="row">
                <div className="col-xl-12">
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <h4 className="card-title mb-0">Tables &gt; Partners</h4>
                                <p className="mb-0 text-muted">Showing {partners?.from ?? 0}-{partners?.to ?? 0} of {partners?.total ?? 0} (On this page: {filteredPartners.length})</p>
                            </div>
                                <div className="d-flex flex-wrap gap-2">
                                    <button type="button" className="btn btn-success" onClick={openCreate}>
                                        New
                                    </button>
                                </div>
                        </div>

                        <div className="card-body">
                            <div className="row mb-3">
                                <div className="col-12 d-flex gap-2 align-items-center">
                                    <div className="btn-group" role="group" aria-label="Status filter">
                                        {['All','Active','Freeze','Inactive'].map((s) => {
                                            const params = {};
                                            if (pageSearchQuery && String(pageSearchQuery).trim()) params.q = String(pageSearchQuery).trim();
                                            if (s !== 'Active') params.status = s;
                                            const href = route('tables.partners.index', params);
                                            const active = statusFilter === s;
                                            return (
                                                <Link
                                                    key={s}
                                                    href={href}
                                                    className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                    onClick={() => setStatusFilter(s)}
                                                >
                                                    {s === 'All' ? 'All Status' : s}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                    <small className="text-muted ms-2">Default tampilan: Active</small>
                                </div>
                            </div>

                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div className="text-muted">
                                    Showing {partners?.from ?? 0}-{partners?.to ?? 0} of {partners?.total ?? 0}
                                </div>
                                <div className="d-flex gap-2">
                                    <Link href={partners?.prev_page_url ?? '#'} className={`btn btn-sm btn-outline-secondary ${partners?.prev_page_url ? '' : 'disabled'}`}>
                                        Prev
                                    </Link>
                                    <Link href={partners?.next_page_url ?? '#'} className={`btn btn-sm btn-outline-secondary ${partners?.next_page_url ? '' : 'disabled'}`}>
                                        Next
                                    </Link>
                                </div>
                            </div>


                            <div className="table-responsive">
                                <table className="table table-striped table-responsive-md">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 80 }}>ID</th>
                                            <th style={{ minWidth: 140 }}>CNC ID</th>
                                            <th style={{ minWidth: 220 }}>Name</th>
                                            <th style={{ width: 80 }}>Star</th>
                                            <th style={{ minWidth: 120 }}>Room</th>
                                            <th style={{ minWidth: 120 }}>Outlet</th>
                                            <th style={{ width: 110 }}>Status</th>
                                            <th style={{ minWidth: 120 }}>System Live</th>
                                            <th style={{ minWidth: 200 }}>Implementation Type</th>
                                            <th style={{ minWidth: 160 }}>System Version</th>
                                            <th style={{ minWidth: 140 }}>Type</th>
                                            <th style={{ minWidth: 140 }}>Group</th>
                                            <th style={{ minWidth: 220 }}>Area</th>
                                            <th style={{ minWidth: 220 }}>Sub Area</th>
                                            <th style={{ minWidth: 260 }}>GM Email</th>
                                            <th style={{ minWidth: 260 }}>IT Email</th>
                                            <th style={{ minWidth: 140 }}>Last Visit</th>
                                            <th style={{ minWidth: 180 }}>Last Visit Type</th>
                                            <th style={{ minWidth: 200 }}>Last Project</th>
                                            <th style={{ minWidth: 200 }}>Last Project Type</th>
                                            <th style={{ width: 160 }} />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPartners.length === 0 ? (
                                            <tr>
                                                <td colSpan={21} className="text-center text-muted">
                                                    No partners found
                                                </td>
                                            </tr>
                                        ) : null}
                                        {filteredPartners.map((p) => (
                                            <tr key={p.id}>
                                                <td>{p.id}</td>
                                                <td>{p.cnc_id}</td>
                                                <td>{p.name}</td>
                                                <td>{p.star ?? '-'}</td>
                                                <td>{p.room ?? '-'}</td>
                                                <td>{p.outlet ?? '-'}</td>
                                                <td>
                                                    <span className={`badge ${STATUS_BADGE[p.status] ?? 'bg-secondary'}`}>{p.status ?? '-'}</span>
                                                </td>
                                                <td>{formatDateDdMmmYy(p.system_live)}</td>
                                                <td>{p.implementation_type ?? '-'}</td>
                                                <td>{p.system_version ?? '-'}</td>
                                                <td>{p.type ?? '-'}</td>
                                                <td>{p.group ?? '-'}</td>
                                                <td>{p.area ?? '-'}</td>
                                                <td>{p.sub_area ?? '-'}</td>
                                                <td>{p.gm_email ?? '-'}</td>
                                                <td>{p.it_email ?? '-'}</td>
                                                <td>{formatDateDdMmmYy(p.last_visit)}</td>
                                                <td>{p.last_visit_type ?? '-'}</td>
                                                <td>{p.last_project ?? '-'}</td>
                                                <td>{p.last_project_type ?? '-'}</td>
                                                <td className="text-end">
                                                    <div className="d-flex gap-2 justify-content-end">
                                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openEdit(p)}>
                                                            Edit
                                                        </button>
                                                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => doDelete(p)} disabled={processing}>
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
                                    <div>
                                        <h5 className="modal-title">{editingId ? 'Edit Partner' : 'New Partner'}</h5>
                                        {editingPartner?.cnc_id ? <small className="text-muted">{editingPartner.cnc_id}</small> : null}
                                    </div>
                                    <button type="button" className="btn-close" onClick={closeModal} />
                                </div>

                                <form onSubmit={submit}>
                                    <div className="modal-body">
                                        <div className="row">
                                            <div className="col-lg-3">
                                                <div className="mb-3">
                                                    <label className="text-black font-w600 form-label required">CNC ID</label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${errors.cnc_id ? 'is-invalid' : ''}`}
                                                        value={data.cnc_id}
                                                        onChange={(e) => setData('cnc_id', e.target.value)}
                                                    />
                                                    {errors.cnc_id ? <div className="invalid-feedback">{errors.cnc_id}</div> : null}
                                                </div>
                                            </div>

                                            <div className="col-lg-5">
                                                <div className="mb-3">
                                                    <label className="text-black font-w600 form-label required">Name</label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                                        value={data.name}
                                                        onChange={(e) => setData('name', e.target.value)}
                                                    />
                                                    {errors.name ? <div className="invalid-feedback">{errors.name}</div> : null}
                                                </div>
                                            </div>

                                            <div className="col-lg-2">
                                                <div className="mb-3">
                                                    <label className="text-black font-w600 form-label">Star</label>
                                                    <select
                                                        className={`form-select ${errors.star ? 'is-invalid' : ''}`}
                                                        value={data.star}
                                                        onChange={(e) => setData('star', e.target.value)}
                                                    >
                                                        <option value="">-</option>
                                                        {(starOptions ?? []).map((s) => (
                                                            <option key={s} value={s}>
                                                                {s}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.star ? <div className="invalid-feedback">{errors.star}</div> : null}
                                                </div>
                                            </div>

                                            <div className="col-lg-2">
                                                <div className="mb-3">
                                                    <label className="text-black font-w600 form-label required">Status</label>
                                                    <select
                                                        className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                                                        value={data.status}
                                                        onChange={(e) => setData('status', e.target.value)}
                                                    >
                                                        {(statusOptions ?? []).map((s) => (
                                                            <option key={s} value={s}>
                                                                {s}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.status ? <div className="invalid-feedback">{errors.status}</div> : null}
                                                </div>
                                            </div>

                                            <div className="col-lg-3">
                                                <div className="mb-3">
                                                    <label className="text-black font-w600 form-label">Room</label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${errors.room ? 'is-invalid' : ''}`}
                                                        value={data.room}
                                                        onChange={(e) => setData('room', e.target.value)}
                                                    />
                                                    {errors.room ? <div className="invalid-feedback">{errors.room}</div> : null}
                                                </div>
                                            </div>

                                            <div className="col-lg-3">
                                                <div className="mb-3">
                                                    <label className="text-black font-w600 form-label">Outlet</label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${errors.outlet ? 'is-invalid' : ''}`}
                                                        value={data.outlet}
                                                        onChange={(e) => setData('outlet', e.target.value)}
                                                    />
                                                    {errors.outlet ? <div className="invalid-feedback">{errors.outlet}</div> : null}
                                                </div>
                                            </div>

                                            <div className="col-lg-3">
                                                <div className="mb-3">
                                                    <label className="text-black font-w600 form-label">System Live</label>
                                                    <DatePickerInput value={data.system_live} onChange={(v) => setData('system_live', v)} className="form-control" invalid={Boolean(errors.system_live)} />
                                                    {errors.system_live ? <div className="invalid-feedback">{errors.system_live}</div> : null}
                                                </div>
                                            </div>

                                            <div className="col-lg-3">
                                                <div className="mb-3">
                                                    <label className="text-black font-w600 form-label">Implementation Type</label>
                                                    <select
                                                        className={`form-select ${errors.implementation_type ? 'is-invalid' : ''}`}
                                                        value={data.implementation_type}
                                                        onChange={(e) => setData('implementation_type', e.target.value)}
                                                    >
                                                        {renderSetupOptions('implementation_type', data.implementation_type)}
                                                    </select>
                                                    {errors.implementation_type ? <div className="invalid-feedback">{errors.implementation_type}</div> : null}
                                                </div>
                                            </div>

                                            <div className="col-lg-3">
                                                <div className="mb-3">
                                                    <label className="text-black font-w600 form-label">System Version</label>
                                                    <select
                                                        className={`form-select ${errors.system_version ? 'is-invalid' : ''}`}
                                                        value={data.system_version}
                                                        onChange={(e) => setData('system_version', e.target.value)}
                                                    >
                                                        {renderSetupOptions('system_version', data.system_version)}
                                                    </select>
                                                    {errors.system_version ? <div className="invalid-feedback">{errors.system_version}</div> : null}
                                                </div>
                                            </div>

                                            <div className="col-lg-3">
                                                <div className="mb-3">
                                                    <label className="text-black font-w600 form-label">Type</label>
                                                    <select
                                                        className={`form-select ${errors.type ? 'is-invalid' : ''}`}
                                                        value={data.type}
                                                        onChange={(e) => setData('type', e.target.value)}
                                                    >
                                                        {renderSetupOptions('type', data.type)}
                                                    </select>
                                                    {errors.type ? <div className="invalid-feedback">{errors.type}</div> : null}
                                                </div>
                                            </div>

                                            <div className="col-lg-3">
                                                <div className="mb-3">
                                                    <label className="text-black font-w600 form-label">Group</label>
                                                    <select
                                                        className={`form-select ${errors.group ? 'is-invalid' : ''}`}
                                                        value={data.group}
                                                        onChange={(e) => setData('group', e.target.value)}
                                                    >
                                                        {renderSetupOptions('group', data.group)}
                                                    </select>
                                                    {errors.group ? <div className="invalid-feedback">{errors.group}</div> : null}
                                                </div>
                                            </div>

                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label className="text-black font-w600 form-label">Address</label>
                                                    <textarea
                                                        className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                                                        rows={3}
                                                        value={data.address}
                                                        onChange={(e) => setData('address', e.target.value)}
                                                    />
                                                    {errors.address ? <div className="invalid-feedback">{errors.address}</div> : null}
                                                </div>
                                            </div>

                                            <div className="col-lg-3">
                                                <div className="mb-3">
                                                    <label className="text-black font-w600 form-label">Area</label>
                                                    <select
                                                        className={`form-select ${errors.area ? 'is-invalid' : ''}`}
                                                        value={data.area}
                                                        onChange={(e) => { setData('area', e.target.value); setData('sub_area', ''); }}
                                                    >
                                                        {renderSetupOptions('area', data.area)}
                                                    </select>
                                                    {errors.area ? <div className="invalid-feedback">{errors.area}</div> : null}
                                                </div>
                                            </div>

                                            <div className="col-lg-3">
                                                <div className="mb-3">
                                                    <label className="text-black font-w600 form-label">Sub Area</label>
                                                    <select
                                                        className={`form-select ${errors.sub_area ? 'is-invalid' : ''}`}
                                                        value={data.sub_area}
                                                        onChange={(e) => setData('sub_area', e.target.value)}
                                                        disabled={!data.area}
                                                    >
                                                        {renderSubAreaOptions(data.area, data.sub_area)}
                                                    </select>
                                                    {errors.sub_area ? <div className="invalid-feedback">{errors.sub_area}</div> : null}
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <hr />
                                            </div>

                                            {["gm_email","fc_email","ca_email","cc_email","ia_email","it_email","hrd_email","fom_email","dos_email","ehk_email","fbm_email"].map((field) => {
                                                const label = field
                                                    .replace('_email', '')
                                                    .toUpperCase()
                                                    .replace('HRD', 'HRD')
                                                    .replace('EHK', 'EHK');
                                                return (
                                                    <div key={field} className="col-lg-4">
                                                        <div className="mb-3">
                                                            <label className="text-black font-w600 form-label">{label} Email</label>
                                                            <input
                                                                type="email"
                                                                className={`form-control ${errors[field] ? 'is-invalid' : ''}`}
                                                                value={data[field]}
                                                                onChange={(e) => setData(field, e.target.value)}
                                                            />
                                                            {errors[field] ? <div className="invalid-feedback">{errors[field]}</div> : null}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            <div className="col-12">
                                                <hr />
                                            </div>

                                            <div className="col-lg-3">
                                                <div className="mb-3">
                                                    <label className="text-black font-w600 form-label">Last Visit</label>
                                                    <DatePickerInput value={data.last_visit} onChange={(v) => setData('last_visit', v)} className="form-control" invalid={Boolean(errors.last_visit)} />
                                                {errors.last_visit ? <div className="invalid-feedback">{errors.last_visit}</div> : null}</div>
                                            </div>
                                            <div className="col-lg-3">
                                                <div className="mb-3">
                                                    <label className="text-black font-w600 form-label">Last Visit Type</label>
                                                    <input className="form-control" value={data.last_visit_type} onChange={(e) => setData('last_visit_type', e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="col-lg-3">
                                                <div className="mb-3">
                                                    <label className="text-black font-w600 form-label">Last Project</label>
                                                    <input className="form-control" value={data.last_project} onChange={(e) => setData('last_project', e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="col-lg-3">
                                                <div className="mb-3">
                                                    <label className="text-black font-w600 form-label">Last Project Type</label>
                                                    <input className="form-control" value={data.last_project_type} onChange={(e) => setData('last_project_type', e.target.value)} />
                                                </div>
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

PartnersIndex.layout = (page) => <AuthenticatedLayout header="Partners">{page}</AuthenticatedLayout>;
