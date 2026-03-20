import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { filterByQuery } from '@/utils/smartSearch';
import { formatDateDdMmmYy, parseDateDdMmmYyToIso } from '@/utils/date';

const displayDateValue = (v) => {
    if (!v) return '';
    const s = String(v);
    const d = s.length >= 10 ? s.slice(0, 10) : s;
    const out = formatDateDdMmmYy(d);
    return out === '-' ? '' : out;
};

export default function ProjectsIndex({ projects, partners, users, setupOptions, assignmentOptions, projectInformationOptions, picAssignmentOptions, pageSearchQuery }) {
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const editingProject = useMemo(() => {
        if (!editingId) return null;
        return (projects ?? []).find((p) => p.id === editingId) ?? null;
    }, [editingId, projects]);

    const filteredProjects = useMemo(() => {
        return filterByQuery(projects ?? [], pageSearchQuery, (p) => [
            p.id,
            p.cnc_id,
            p.pic_name,
            p.pic_email,
            p.pic_summary,
            p.partner_name,
            p.project_name,
            p.assignment,
            p.project_information,
            p.pic_assignment,
            p.type,
            p.start_date,
            p.end_date,
            p.total_days,
            p.status,
            p.handover_official_report,
            p.handover_days,
            p.kpi2_pic,
            p.check_official_report,
            p.check_days,
            p.kpi2_officer,
            p.point_ach,
            p.point_req,
            p.percentage_of_point,
            p.validation_date,
            p.validation_days,
            p.kpi2_okr,
            p.spreadsheet_id,
            p.spreadsheet_url,
            p.s1_estimation_date,
            p.s1_over_days,
            p.s1_count_emails_sent,
            p.s2_email_sent,
            p.s3_email_sent,
        ]);
    }, [projects, pageSearchQuery]);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        cnc_id: '',
        pic_assignments: [{ pic_user_id: '', start_date: '', end_date: '' }],
        partner_id: '',
        project_name: '',
        assignment: '',
        project_information: projectInformationOptions?.[1] ?? 'Submission',
        pic_assignment: picAssignmentOptions?.[1] ?? 'Request',
        type: '',
        start_date: '',
        end_date: '',
        status: '',
        handover_official_report: '',
        kpi2_pic: '',
        check_official_report: '',
        check_days: '',
        kpi2_officer: '',
        point_ach: '',
        point_req: '',
        validation_date: '',
        kpi2_okr: '',
        spreadsheet_id: '',
        spreadsheet_url: '',
        activity_sent: '',
        s1_estimation_date: '',
        s1_over_days: '',
        s1_count_emails_sent: '',
        s2_email_sent: '',
        s3_email_sent: '',
    });

    useEffect(() => {
        if (!showModal) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') closeModal();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showModal]);

    const optionList = (key) => (setupOptions?.[key] ?? []).map((o) => (typeof o === 'string' ? { name: o, status: 'Active' } : o));

    const renderSetupOptions = (key, selectedValue) => {
        const items = optionList(key);
        const selected = String(selectedValue ?? '');

        return (
            <>
                <option value="">-</option>
                {items
                    .map((o) => ({ name: String(o?.name ?? ''), status: String(o?.status ?? 'Active') }))
                    .filter((o) => o.name !== '')
                    .map((o) => {
                        const isActive = o.status === 'Active';
                        const isSelected = o.name === selected;
                        if (!isActive && !isSelected) return null;

                        const label = !isActive ? `${o.name} (Inactive)` : o.name;
                        return (
                            <option key={`${key}||${o.name}||${o.status}`} value={o.name} disabled={!isActive}>
                                {label}
                            </option>
                        );
                    })}
            </>
        );
    };

    const addPicRow = () => {
        setData('pic_assignments', [...(data.pic_assignments ?? []), { pic_user_id: '', start_date: '', end_date: '' }]);
    };

    const updatePicRow = (index, key, value) => {
        const next = [...(data.pic_assignments ?? [])];
        next[index] = { ...next[index], [key]: value };
        setData('pic_assignments', next);
    };

    const removePicRow = (index) => {
        const next = [...(data.pic_assignments ?? [])];
        next.splice(index, 1);
        setData('pic_assignments', next.length ? next : [{ pic_user_id: '', start_date: '', end_date: '' }]);
    };

    const selectedPartner = useMemo(() => {
        const pid = data.partner_id === '' ? null : Number(data.partner_id);
        if (!pid) return null;
        return (partners ?? []).find((p) => p.id === pid) ?? null;
    }, [data.partner_id, partners]);

    const computed = useMemo(() => {
        const start = data.start_date ? new Date(data.start_date + 'T00:00:00') : null;
        const end = data.end_date ? new Date(data.end_date + 'T00:00:00') : null;
        const handover = data.handover_official_report ? new Date(data.handover_official_report + 'T00:00:00') : null;
        const validation = data.validation_date ? new Date(data.validation_date + 'T00:00:00') : null;

        const totalDays = start && end ? Math.floor((end - start) / (24 * 3600 * 1000)) + 1 : null;
        const handoverDays = end && handover ? Math.floor((handover - end) / (24 * 3600 * 1000)) : null;
        const validationDays = end && validation ? Math.floor((validation - end) / (24 * 3600 * 1000)) : null;

        const pointAch = data.point_ach === '' ? null : Number(data.point_ach);
        const pointReq = data.point_req === '' ? null : Number(data.point_req);
        const percentage = pointAch !== null && pointReq !== null && pointReq > 0 ? Math.round((pointAch / pointReq) * 10000) / 100 : null;

        return { totalDays, handoverDays, validationDays, percentage };
    }, [data.start_date, data.end_date, data.handover_official_report, data.validation_date, data.point_ach, data.point_req]);

    const openCreate = () => {
        setEditingId(null);
        clearErrors();
        reset();
        setData({
            cnc_id: '',
            pic_assignments: [{ pic_user_id: '', start_date: '', end_date: '' }],
            partner_id: '',
            project_name: '',
            assignment: '',
            project_information: projectInformationOptions?.[1] ?? 'Submission',
            pic_assignment: picAssignmentOptions?.[1] ?? 'Request',
            type: '',
            start_date: '',
            end_date: '',
            status: '',
            handover_official_report: '',
            kpi2_pic: '',
            check_official_report: '',
            check_days: '',
            kpi2_officer: '',
            point_ach: '',
            point_req: '',
            validation_date: '',
            kpi2_okr: '',
            spreadsheet_id: '',
            spreadsheet_url: '',
            activity_sent: '',
            s1_estimation_date: '',
            s1_over_days: '',
            s1_count_emails_sent: '',
            s2_email_sent: '',
            s3_email_sent: '',
        });
        setShowModal(true);
    };

    const openEdit = (p) => {
        setEditingId(p.id);
        clearErrors();
        setData({
            cnc_id: p.cnc_id ?? '',
            pic_assignments: (p.pic_assignments && p.pic_assignments.length ? p.pic_assignments.map((r) => ({ pic_user_id: r.pic_user_id ?? '', start_date: r.start_date ? displayDateValue(r.start_date) : '', end_date: r.end_date ? displayDateValue(r.end_date) : '' })) : (p.pic_user_id ? [{ pic_user_id: p.pic_user_id, start_date: p.start_date ? displayDateValue(p.start_date) : '', end_date: p.end_date ? displayDateValue(p.end_date) : '' }] : [{ pic_user_id: '', start_date: '', end_date: '' }])),
            partner_id: p.partner_id ?? '',
            project_name: p.project_name ?? '',
            assignment: p.assignment ?? '',
            project_information: p.project_information ?? (projectInformationOptions?.[1] ?? 'Submission'),
            pic_assignment: p.pic_assignment ?? (picAssignmentOptions?.[1] ?? 'Request'),
            type: p.type ?? '',
            start_date: p.start_date ? displayDateValue(p.start_date) : '',
            end_date: p.end_date ? displayDateValue(p.end_date) : '',
            status: p.status ?? '',
            handover_official_report: p.handover_official_report ? displayDateValue(p.handover_official_report) : '',
            kpi2_pic: p.kpi2_pic ?? '',
            check_official_report: p.check_official_report ? displayDateValue(p.check_official_report) : '',
            check_days: p.check_days ?? '',
            kpi2_officer: p.kpi2_officer ?? '',
            point_ach: p.point_ach ?? '',
            point_req: p.point_req ?? '',
            validation_date: p.validation_date ? displayDateValue(p.validation_date) : '',
            kpi2_okr: p.kpi2_okr ?? '',
            spreadsheet_id: p.spreadsheet_id ?? '',
            spreadsheet_url: p.spreadsheet_url ?? '',
            activity_sent: p.activity_sent ? displayDateValue(p.activity_sent) : '',
            s1_estimation_date: p.s1_estimation_date ? displayDateValue(p.s1_estimation_date) : '',
            s1_over_days: p.s1_over_days ?? '',
            s1_count_emails_sent: p.s1_count_emails_sent ?? '',
            s2_email_sent: p.s2_email_sent ?? '',
            s3_email_sent: p.s3_email_sent ?? '',
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
            pic_assignments: (data.pic_assignments ?? []).map((r) => ({
                pic_user_id: r.pic_user_id === '' ? null : Number(r.pic_user_id),
                start_date: (parseDateDdMmmYyToIso(r.start_date) || null),
                end_date: (parseDateDdMmmYyToIso(r.end_date) || null),
            })),
            partner_id: data.partner_id === '' ? null : Number(data.partner_id),
            point_ach: data.point_ach === '' ? null : Number(data.point_ach),
            point_req: data.point_req === '' ? null : Number(data.point_req),
            assignment: data.assignment === '' ? null : data.assignment,
            type: data.type === '' ? null : data.type,
            status: data.status === '' ? null : data.status,
            start_date: parseDateDdMmmYyToIso(data.start_date) || null,
            end_date: parseDateDdMmmYyToIso(data.end_date) || null,
            handover_official_report: parseDateDdMmmYyToIso(data.handover_official_report) || null,
            check_official_report: parseDateDdMmmYyToIso(data.check_official_report) || null,
            validation_date: parseDateDdMmmYyToIso(data.validation_date) || null,
            activity_sent: parseDateDdMmmYyToIso(data.activity_sent) || null,
            s1_estimation_date: parseDateDdMmmYyToIso(data.s1_estimation_date) || null,

        };

        if (editingId) {
            put(route('tables.projects.update', { project: editingId }), {
                preserveScroll: true,
                data: payload,
                onSuccess: () => closeModal(),
            });
            return;
        }

        post(route('tables.projects.store'), {
            preserveScroll: true,
            data: payload,
            onSuccess: () => closeModal(),
        });
    };

    const doDelete = (p) => {
        if (!window.confirm(`Delete project: ${p.project_name || p.id}?`)) return;
        destroy(route('tables.projects.destroy', { project: p.id }), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Projects" />

            <div className="row">
                <div className="col-xl-12">
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <h4 className="card-title mb-0">Tables &gt; Projects</h4>
                                <p className="mb-0 text-muted">Total projects: {filteredProjects.length}</p>
                            </div>
                            <div className="d-flex gap-2">
                                <button type="button" className="btn btn-primary" onClick={openCreate}>
                                    New
                                </button>
                            </div>
                        </div>

                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-striped table-responsive-md">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 80 }}>ID</th>
                                            <th style={{ width: 110 }}>CNC ID</th>
                                            <th>Project</th>
                                            <th style={{ width: 220 }}>Partner</th>
                                            <th style={{ width: 220 }}>PIC</th>
                                            <th style={{ width: 140 }}>Type</th>
                                            <th style={{ width: 160 }}>Start</th>
                                            <th style={{ width: 160 }}>End</th>
                                            <th style={{ width: 120 }}>Status</th>
                                            <th style={{ width: 160 }} />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProjects.length === 0 ? (
                                            <tr>
                                                <td colSpan={10} className="text-center text-muted">
                                                    No projects found
                                                </td>
                                            </tr>
                                        ) : null}
                                        {filteredProjects.map((p) => (
                                            <tr key={p.id}>
                                                <td title={p.id}>{p.no ?? '-'}</td>
                                                <td>{p.cnc_id ?? '-'}</td>
                                                <td className="text-truncate" style={{ maxWidth: 320 }} title={p.project_name ?? ''}>
                                                    {p.project_name ?? '-'}
                                                </td>
                                                <td className="text-truncate" style={{ maxWidth: 240 }} title={p.partner_name ?? ''}>
                                                    {p.partner_name ?? '-'}
                                                </td>
                                                <td className="text-truncate" style={{ maxWidth: 240 }} title={p.pic_name ?? ''}>
                                                    {p.pic_summary || p.pic_name || '-'}
                                                </td>
                                                <td>{p.type ?? '-'}</td>
                                                <td>{p.start_date ? formatDateDdMmmYy(p.start_date) : '-'}</td>
                                                <td>{p.end_date ? formatDateDdMmmYy(p.end_date) : '-'}</td>
                                                <td>{p.status ?? '-'}</td>
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
                                    <h5 className="modal-title">{editingId ? 'Edit Project' : 'New Project'}</h5>
                                    <button type="button" className="btn-close" onClick={closeModal} />
                                </div>

                                <form onSubmit={submit}>
                                    <div className="modal-body">
                                        <div className="row">
                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">CNC ID</label>
                                                <input className={`form-control ${errors.cnc_id ? 'is-invalid' : ''}`} value={data.cnc_id} onChange={(e) => setData('cnc_id', e.target.value)} />
                                                {errors.cnc_id ? <div className="invalid-feedback">{errors.cnc_id}</div> : null}
                                            </div>

                                            <div className="col-lg-4 mb-3">
                                                <label className="text-black font-w600 form-label">Partner</label>
                                                <select className={`form-select ${errors.partner_id ? 'is-invalid' : ''}`} value={data.partner_id} onChange={(e) => setData('partner_id', e.target.value)}>
                                                    <option value="">-</option>
                                                    {(partners ?? []).map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.partner_id ? <div className="invalid-feedback">{errors.partner_id}</div> : null}
                                                {selectedPartner ? <div className="form-text">Partner Name: {selectedPartner.name}</div> : null}
                                            </div>
                                            <div className="col-lg-12 mb-3">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <label className="text-black font-w600 form-label">PIC (Periode)</label>
                                                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={addPicRow}>
                                                        Add PIC
                                                    </button>
                                                </div>

                                                <div className="table-responsive">
                                                    <table className="table table-sm">
                                                        <thead>
                                                            <tr>
                                                                <th>PIC</th>
                                                                <th style={{ width: 160 }}>Start</th>
                                                                <th style={{ width: 160 }}>End</th>
                                                                <th style={{ width: 90 }} />
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(data.pic_assignments ?? []).map((row, index) => {
                                                                const errUser = errors[`pic_assignments.${index}.pic_user_id`];
                                                                const errStart = errors[`pic_assignments.${index}.start_date`];
                                                                const errEnd = errors[`pic_assignments.${index}.end_date`];

                                                                return (
                                                                    <tr key={index}>
                                                                        <td>
                                                                            <select
                                                                                className={`form-select form-select-sm ${errUser ? 'is-invalid' : ''}`}
                                                                                value={row.pic_user_id ?? ''}
                                                                                onChange={(e) => updatePicRow(index, 'pic_user_id', e.target.value)}
                                                                            >
                                                                                <option value="">-</option>
                                                                                {(users ?? []).map((u) => (
                                                                                    <option key={u.id} value={u.id}>
                                                                                        {(u.full_name || u.name) + (u.email ? ` (${u.email})` : '')}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                            {errUser ? <div className="invalid-feedback">{errUser}</div> : null}
                                                                        </td>
                                                                        <td>
                                                                            <input
                                                                                type="text" placeholder="dd Mmm yy"
                                                                                className={`form-control form-control-sm ${errStart ? 'is-invalid' : ''}`}
                                                                                value={row.start_date ?? ''}
                                                                                onChange={(e) => updatePicRow(index, 'start_date', e.target.value)}
                                                                            />
                                                                            {errStart ? <div className="invalid-feedback">{errStart}</div> : null}
                                                                        </td>
                                                                        <td>
                                                                            <input
                                                                                type="text" placeholder="dd Mmm yy"
                                                                                className={`form-control form-control-sm ${errEnd ? 'is-invalid' : ''}`}
                                                                                value={row.end_date ?? ''}
                                                                                onChange={(e) => updatePicRow(index, 'end_date', e.target.value)}
                                                                            />
                                                                            {errEnd ? <div className="invalid-feedback">{errEnd}</div> : null}
                                                                        </td>
                                                                        <td className="text-end">
                                                                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removePicRow(index)}>
                                                                                Remove
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            <div className="col-lg-12 mb-3">
                                                <label className="text-black font-w600 form-label">Project Name</label>
                                                <input className={`form-control ${errors.project_name ? 'is-invalid' : ''}`} value={data.project_name} onChange={(e) => setData('project_name', e.target.value)} />
                                                {errors.project_name ? <div className="invalid-feedback">{errors.project_name}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">Assignment</label>
                                                <select className={`form-select ${errors.assignment ? 'is-invalid' : ''}`} value={data.assignment} onChange={(e) => setData('assignment', e.target.value)}>
                                                    {(assignmentOptions ?? ['', 'Leader', 'Assist']).map((o) => (
                                                        <option key={o || 'empty'} value={o}>
                                                            {o === '' ? '-' : o}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.assignment ? <div className="invalid-feedback">{errors.assignment}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label required">Project Information</label>
                                                <select className={`form-select ${errors.project_information ? 'is-invalid' : ''}`} value={data.project_information} onChange={(e) => setData('project_information', e.target.value)}>
                                                    {(projectInformationOptions ?? ['Request', 'Submission']).map((o) => (
                                                        <option key={o} value={o}>
                                                            {o}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.project_information ? <div className="invalid-feedback">{errors.project_information}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label required">PIC Assignment</label>
                                                <select className={`form-select ${errors.pic_assignment ? 'is-invalid' : ''}`} value={data.pic_assignment} onChange={(e) => setData('pic_assignment', e.target.value)}>
                                                    {(picAssignmentOptions ?? ['Assignment', 'Request']).map((o) => (
                                                        <option key={o} value={o}>
                                                            {o}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.pic_assignment ? <div className="invalid-feedback">{errors.pic_assignment}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">Type</label>
                                                <select className={`form-select ${errors.type ? 'is-invalid' : ''}`} value={data.type} onChange={(e) => setData('type', e.target.value)}>
                                                    {renderSetupOptions('type', data.type)}
                                                </select>
                                                {errors.type ? <div className="invalid-feedback">{errors.type}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">Start Date</label>
                                                <input type="text" placeholder="dd Mmm yy" className={`form-control ${errors.start_date ? 'is-invalid' : ''}`} value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} />
                                                {errors.start_date ? <div className="invalid-feedback">{errors.start_date}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">End Date</label>
                                                <input type="text" placeholder="dd Mmm yy" className={`form-control ${errors.end_date ? 'is-invalid' : ''}`} value={data.end_date} onChange={(e) => setData('end_date', e.target.value)} />
                                                {errors.end_date ? <div className="invalid-feedback">{errors.end_date}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">Status</label>
                                                <select className={`form-select ${errors.status ? 'is-invalid' : ''}`} value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                                    {renderSetupOptions('status', data.status)}
                                                </select>
                                                {errors.status ? <div className="invalid-feedback">{errors.status}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">Handover Official Report</label>
                                                <input type="text" placeholder="dd Mmm yy" className={`form-control ${errors.handover_official_report ? 'is-invalid' : ''}`} value={data.handover_official_report} onChange={(e) => setData('handover_official_report', e.target.value)} />
                                                {errors.handover_official_report ? <div className="invalid-feedback">{errors.handover_official_report}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">KPI 2 - PIC</label>
                                                <input className={`form-control ${errors.kpi2_pic ? 'is-invalid' : ''}`} value={data.kpi2_pic} onChange={(e) => setData('kpi2_pic', e.target.value)} />
                                                {errors.kpi2_pic ? <div className="invalid-feedback">{errors.kpi2_pic}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">Check Official Report</label>
                                                <input type="text" placeholder="dd Mmm yy" className={`form-control ${errors.check_official_report ? 'is-invalid' : ''}`} value={data.check_official_report} onChange={(e) => setData('check_official_report', e.target.value)} />
                                                {errors.check_official_report ? <div className="invalid-feedback">{errors.check_official_report}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">Check Day(s)</label>
                                                <input className={`form-control ${errors.check_days ? 'is-invalid' : ''}`} value={data.check_days} onChange={(e) => setData('check_days', e.target.value)} />
                                                {errors.check_days ? <div className="invalid-feedback">{errors.check_days}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">KPI 2 - Officer</label>
                                                <input className={`form-control ${errors.kpi2_officer ? 'is-invalid' : ''}`} value={data.kpi2_officer} onChange={(e) => setData('kpi2_officer', e.target.value)} />
                                                {errors.kpi2_officer ? <div className="invalid-feedback">{errors.kpi2_officer}</div> : null}
                                            </div>

                                            <div className="col-lg-2 mb-3">
                                                <label className="text-black font-w600 form-label">Point Ach</label>
                                                <input type="number" className={`form-control ${errors.point_ach ? 'is-invalid' : ''}`} value={data.point_ach} onChange={(e) => setData('point_ach', e.target.value)} />
                                                {errors.point_ach ? <div className="invalid-feedback">{errors.point_ach}</div> : null}
                                            </div>

                                            <div className="col-lg-2 mb-3">
                                                <label className="text-black font-w600 form-label">Point Req</label>
                                                <input type="number" className={`form-control ${errors.point_req ? 'is-invalid' : ''}`} value={data.point_req} onChange={(e) => setData('point_req', e.target.value)} />
                                                {errors.point_req ? <div className="invalid-feedback">{errors.point_req}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">Validation Date</label>
                                                <input type="text" placeholder="dd Mmm yy" className={`form-control ${errors.validation_date ? 'is-invalid' : ''}`} value={data.validation_date} onChange={(e) => setData('validation_date', e.target.value)} />
                                                {errors.validation_date ? <div className="invalid-feedback">{errors.validation_date}</div> : null}
                                            </div>

                                            <div className="col-lg-5 mb-3">
                                                <label className="text-black font-w600 form-label">KPI 2 - OKR</label>
                                                <input className={`form-control ${errors.kpi2_okr ? 'is-invalid' : ''}`} value={data.kpi2_okr} onChange={(e) => setData('kpi2_okr', e.target.value)} />
                                                {errors.kpi2_okr ? <div className="invalid-feedback">{errors.kpi2_okr}</div> : null}
                                            </div>

                                            <div className="col-lg-4 mb-3">
                                                <label className="text-black font-w600 form-label">Spreadsheet ID</label>
                                                <input className={`form-control ${errors.spreadsheet_id ? 'is-invalid' : ''}`} value={data.spreadsheet_id} onChange={(e) => setData('spreadsheet_id', e.target.value)} />
                                                {errors.spreadsheet_id ? <div className="invalid-feedback">{errors.spreadsheet_id}</div> : null}
                                            </div>

                                            <div className="col-lg-8 mb-3">
                                                <label className="text-black font-w600 form-label">Spreadsheet URL</label>
                                                <input className={`form-control ${errors.spreadsheet_url ? 'is-invalid' : ''}`} value={data.spreadsheet_url} onChange={(e) => setData('spreadsheet_url', e.target.value)} />
                                                {errors.spreadsheet_url ? <div className="invalid-feedback">{errors.spreadsheet_url}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">S1 Estimation Date</label>
                                                <input type="text" placeholder="dd Mmm yy" className={`form-control ${errors.s1_estimation_date ? 'is-invalid' : ''}`} value={data.s1_estimation_date} onChange={(e) => setData('s1_estimation_date', e.target.value)} />
                                                {errors.s1_estimation_date ? <div className="invalid-feedback">{errors.s1_estimation_date}</div> : null}
                                            </div>

                                            <div className="col-lg-2 mb-3">
                                                <label className="text-black font-w600 form-label">S1 Over Day(s)</label>
                                                <input className={`form-control ${errors.s1_over_days ? 'is-invalid' : ''}`} value={data.s1_over_days} onChange={(e) => setData('s1_over_days', e.target.value)} />
                                                {errors.s1_over_days ? <div className="invalid-feedback">{errors.s1_over_days}</div> : null}
                                            </div>

                                            <div className="col-lg-2 mb-3">
                                                <label className="text-black font-w600 form-label">S1 Count Email(s) Sent</label>
                                                <input className={`form-control ${errors.s1_count_emails_sent ? 'is-invalid' : ''}`} value={data.s1_count_emails_sent} onChange={(e) => setData('s1_count_emails_sent', e.target.value)} />
                                                {errors.s1_count_emails_sent ? <div className="invalid-feedback">{errors.s1_count_emails_sent}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">S2 Email Sent</label>
                                                <input className={`form-control ${errors.s2_email_sent ? 'is-invalid' : ''}`} value={data.s2_email_sent} onChange={(e) => setData('s2_email_sent', e.target.value)} />
                                                {errors.s2_email_sent ? <div className="invalid-feedback">{errors.s2_email_sent}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">S3 Email Sent</label>
                                                <input className={`form-control ${errors.s3_email_sent ? 'is-invalid' : ''}`} value={data.s3_email_sent} onChange={(e) => setData('s3_email_sent', e.target.value)} />
                                                {errors.s3_email_sent ? <div className="invalid-feedback">{errors.s3_email_sent}</div> : null}
                                            </div>
                                        </div>

                                        <div className="mt-2">
                                            <div className="d-flex flex-wrap gap-3">
                                                <div className="text-muted">Total Day(s): {computed.totalDays ?? '-'}</div>
                                                <div className="text-muted">Handover Day(s): {computed.handoverDays ?? '-'}</div>
                                                <div className="text-muted">Validation Day(s): {computed.validationDays ?? '-'}</div>
                                                <div className="text-muted">Percentage of Point: {computed.percentage ?? '-'}</div>
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

ProjectsIndex.layout = (page) => <AuthenticatedLayout header="Projects">{page}</AuthenticatedLayout>;
