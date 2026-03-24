import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { filterByQuery } from '@/utils/smartSearch';
import { formatDateDdMmmYy, parseDateDdMmmYyToIso } from '@/utils/date';
import DatePickerInput from '@/Components/DatePickerInput';

const displayDateValue = (v) => {
    if (!v) return '';
    const s = String(v);
    const d = s.length >= 10 ? s.slice(0, 10) : s;
    const out = formatDateDdMmmYy(d);
    return out === '-' ? '' : out;
};

export default function ProjectsIndex({ projects, filters, partners, users, setupOptions, assignmentOptions, projectInformationOptions, picAssignmentOptions, pageSearchQuery }) {
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [openMenu, setOpenMenu] = useState(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const [menuWidth, setMenuWidth] = useState(320);
    const menuRef = useRef(null);

    const [partnerLookupQuery, setPartnerLookupQuery] = useState('');
    const [showPartnerPicker, setShowPartnerPicker] = useState(false);
    const [picLookupQuery, setPicLookupQuery] = useState('');
    const [showPicPicker, setShowPicPicker] = useState(false);
    const [picPickerRowIndex, setPicPickerRowIndex] = useState(null);

    const [sortBy, setSortBy] = useState(filters?.sort_by ?? null);
    const [sortDir, setSortDir] = useState(filters?.sort_dir ?? 'asc');
    const [statusSegment, setStatusSegment] = useState(filters?.status_tab ?? 'running');
    const [filterPartnerIdsValue, setFilterPartnerIdsValue] = useState((filters?.partner_ids ?? []).map(String));
    const [filterTypesValue, setFilterTypesValue] = useState(filters?.types ?? []);
    const [filterStatusesValue, setFilterStatusesValue] = useState(filters?.statuses ?? []);
    const [filterStartFromValue, setFilterStartFromValue] = useState(displayDateValue(filters?.start_from));
    const [filterStartToValue, setFilterStartToValue] = useState(displayDateValue(filters?.start_to));
    const [partnerFilterQuery, setPartnerFilterQuery] = useState('');
    const [typeFilterQuery, setTypeFilterQuery] = useState('');
    const [statusFilterQuery, setStatusFilterQuery] = useState('');

    const rows = projects?.data ?? [];

    const editingProject = useMemo(() => {
        if (!editingId) return null;
        return (rows ?? []).find((p) => p.id === editingId) ?? null;
    }, [editingId, rows]);

    const filteredProjects = useMemo(() => {
        return filterByQuery(rows ?? [], pageSearchQuery, (p) => [
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
    }, [rows, pageSearchQuery]);

    useEffect(() => {
        setSortBy(filters?.sort_by ?? null);
        setSortDir(filters?.sort_dir ?? 'asc');
        setStatusSegment(filters?.status_tab ?? 'running');
        setFilterPartnerIdsValue((filters?.partner_ids ?? []).map(String));
        setFilterTypesValue(filters?.types ?? []);
        setFilterStatusesValue(filters?.statuses ?? []);
        setFilterStartFromValue(displayDateValue(filters?.start_from));
        setFilterStartToValue(displayDateValue(filters?.start_to));
    }, [filters]);

    useEffect(() => {
        if (!openMenu) return;
        const onDown = (e) => {
            if (menuRef.current && menuRef.current.contains(e.target)) return;
            const target = e.target;
            if (target && typeof target.closest === 'function') {
                if (target.closest('.datepicker') || target.closest('.datepicker-dropdown')) return;
            }
            setOpenMenu(null);
        };
        window.addEventListener('mousedown', onDown);
        return () => window.removeEventListener('mousedown', onDown);
    }, [openMenu]);

    const buildParams = (overrides = {}) => {
        const params = {
            status_tab: statusSegment || 'running',
            sort_by: sortBy || '',
            sort_dir: sortDir || 'asc',
            partner_ids: filterPartnerIdsValue.map((v) => Number(v)),
            types: filterTypesValue,
            statuses: filterStatusesValue,
            start_from: parseDateDdMmmYyToIso(filterStartFromValue) || '',
            start_to: parseDateDdMmmYyToIso(filterStartToValue) || '',
            ...overrides,
        };

        const clean = {};
        Object.entries(params).forEach(([k, v]) => {
            if (v === null || v === undefined) return;
            if (Array.isArray(v)) {
                if (v.length === 0) return;
            } else {
                const s = String(v);
                if (s === '') return;
                if (k === 'status_tab' && s === 'running') return;
                if (k === 'sort_dir') {
                    const sb = String(params.sort_by ?? '');
                    if (!sb) return;
                    if (s === 'asc') return;
                }
            }
            if (k === 'sort_by' && String(v) === '') return;
            clean[k] = v;
        });
        return clean;
    };

    const gotoWith = (overrides = {}) => {
        const params = buildParams(overrides);
        router.get(route('projects.index', params, false), {}, { preserveScroll: true, preserveState: true, replace: true });
    };

    const openHeaderMenu = (key, e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const padding = 24;
        const maxWidth = 360;
        const width = Math.min(maxWidth, Math.max(280, window.innerWidth - padding * 2));
        const viewportLeft = 0;
        const viewportRight = window.innerWidth;

        let left = rect.left;
        if (left + width > viewportRight - padding) {
            left = rect.right - width;
        }
        left = Math.max(viewportLeft + padding, Math.min(left, viewportRight - padding - width));

        setMenuWidth(width);
        setMenuPos({ top: rect.bottom + 6, left });
        setPartnerFilterQuery('');
        setTypeFilterQuery('');
        setStatusFilterQuery('');
        setOpenMenu(key);
    };

    const sortLabel = (label, key) => {
        if (sortBy !== key) return label;
        return `${label} ${sortDir === 'asc' ? '↑' : '↓'}`;
    };

    const partnerFilterOptions = useMemo(() => {
        const q = String(partnerFilterQuery ?? '').toLowerCase().trim();
        const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
        const matches = (p) => {
            if (tokens.length === 0) return true;
            const hay = `${p?.cnc_id ?? ''} ${p?.name ?? ''}`.toLowerCase();
            return tokens.every((t) => hay.includes(t));
        };
        return (partners ?? [])
            .filter(matches)
            .sort((a, b) => {
                const ai = Number(a?.cnc_id);
                const bi = Number(b?.cnc_id);
                if (Number.isFinite(ai) && Number.isFinite(bi) && ai !== bi) return ai - bi;
                return String(a?.cnc_id ?? '').localeCompare(String(b?.cnc_id ?? '')) || String(a?.name ?? '').localeCompare(String(b?.name ?? ''));
            })
            .slice(0, 30);
    }, [partnerFilterQuery, partners]);

    const typeOptionsList = useMemo(() => {
        const base = optionList('type')
            .map((o) => String(o?.name ?? '').trim())
            .filter((v) => v !== '');
        base.sort((a, b) => a.localeCompare(b));
        const q = String(typeFilterQuery ?? '').toLowerCase().trim();
        if (!q) return base;
        const tokens = q.split(/\s+/).filter(Boolean);
        return base.filter((t) => tokens.every((x) => t.toLowerCase().includes(x)));
    }, [setupOptions, typeFilterQuery]);

    const statusOptionsList = useMemo(() => {
        const base = optionList('status')
            .map((o) => String(o?.name ?? '').trim())
            .filter((v) => v !== '');
        base.sort((a, b) => a.localeCompare(b));
        const q = String(statusFilterQuery ?? '').toLowerCase().trim();
        if (!q) return base;
        const tokens = q.split(/\s+/).filter(Boolean);
        return base.filter((t) => tokens.every((x) => t.toLowerCase().includes(x)));
    }, [setupOptions, statusFilterQuery]);

    const filterSummary = useMemo(() => {
        const parts = [];

        if ((filterPartnerIdsValue ?? []).length) {
            const byId = new Map((partners ?? []).map((p) => [String(p.id), p]));
            const labels = (filterPartnerIdsValue ?? [])
                .map((id) => {
                    const p = byId.get(String(id));
                    if (!p) return String(id);
                    return p.cnc_id ? String(p.cnc_id) : String(id);
                })
                .filter(Boolean);
            if (labels.length) parts.push(`Partner: ${labels.join(', ')}`);
        }

        if ((filterTypesValue ?? []).length) parts.push(`Type: ${(filterTypesValue ?? []).join(', ')}`);

        if (filterStartFromValue || filterStartToValue) {
            const from = filterStartFromValue || '-';
            const to = filterStartToValue || '-';
            parts.push(`Start Date: ${from} s/d ${to}`);
        }

        if ((filterStatusesValue ?? []).length) parts.push(`Status: ${(filterStatusesValue ?? []).join(', ')}`);

        return parts.join(' | ');
    }, [filterPartnerIdsValue, filterStartFromValue, filterStartToValue, filterStatusesValue, filterTypesValue, partners]);


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

    useEffect(() => {
        if (!showPartnerPicker) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setShowPartnerPicker(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showPartnerPicker]);

    useEffect(() => {
        if (!showPicPicker) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setShowPicPicker(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showPicPicker]);

    function optionList(key) {
        return (setupOptions?.[key] ?? []).map((o) => (typeof o === 'string' ? { name: o, status: 'Active' } : o));
    }

    const renderSetupOptions = (key, selectedValue, allowBlank = true) => {
        const items = optionList(key);
        const selected = String(selectedValue ?? '');

        return (
            <>
                {allowBlank ? <option value="">-</option> : null}
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

    const partnerLookup = useMemo(() => {
        const selectedId = data.partner_id === '' ? null : Number(data.partner_id);
        const selected = selectedId ? (partners ?? []).find((p) => p.id === selectedId) ?? null : null;

        const tokens = String(partnerLookupQuery ?? '')
            .toLowerCase()
            .trim()
            .split(/\s+/)
            .map((t) => t.trim())
            .filter(Boolean);

        const activePartners = (partners ?? []).filter((p) => String(p?.status ?? 'Active') === 'Active');

        const matches = (p) => {
            if (tokens.length === 0) return true;
            const hay = `${p?.cnc_id ?? ''} ${p?.name ?? ''}`.toLowerCase();
            return tokens.every((t) => hay.includes(t));
        };

        const items = activePartners
            .filter(matches)
            .sort((a, b) => {
                const ai = Number(a?.cnc_id);
                const bi = Number(b?.cnc_id);
                if (Number.isFinite(ai) && Number.isFinite(bi) && ai !== bi) return ai - bi;
                return String(a?.cnc_id ?? '').localeCompare(String(b?.cnc_id ?? '')) || String(a?.name ?? '').localeCompare(String(b?.name ?? ''));
            });

        const selectedIsActive = selected ? String(selected?.status ?? 'Active') === 'Active' : false;
        return { selected, selectedIsActive, items };
    }, [data.partner_id, partnerLookupQuery, partners]);

    const openPartnerPicker = () => {
        setPartnerLookupQuery('');
        setShowPartnerPicker(true);
    };

    const selectPartnerId = (id) => {
        setData('partner_id', id ? String(id) : '');
        setShowPartnerPicker(false);
        setPartnerLookupQuery('');
    };

    const partnerDisplayValue = useMemo(() => {
        if (!selectedPartner) return '';
        const cnc = selectedPartner?.cnc_id ?? '';
        const name = selectedPartner?.name ?? '';
        const status = selectedPartner?.status ?? 'Active';
        return status === 'Active' ? `${cnc} - ${name}` : `${cnc} - ${name} (${status})`;
    }, [selectedPartner]);

    const picLookup = useMemo(() => {
        const row = typeof picPickerRowIndex === 'number' ? (data.pic_assignments ?? [])[picPickerRowIndex] : null;
        const selectedId = row?.pic_user_id ? String(row.pic_user_id) : '';
        const selected = selectedId ? (users ?? []).find((u) => String(u.id) === selectedId) ?? null : null;

        const tokens = String(picLookupQuery ?? '')
            .toLowerCase()
            .trim()
            .split(/\s+/)
            .map((t) => t.trim())
            .filter(Boolean);

        const activeUsers = (users ?? []).filter((u) => String(u?.status ?? 'Active') === 'Active');

        const matches = (u) => {
            if (tokens.length === 0) return true;
            const hay = `${u?.full_name ?? ''} ${u?.name ?? ''} ${u?.email ?? ''}`.toLowerCase();
            return tokens.every((t) => hay.includes(t));
        };

        const items = activeUsers
            .filter(matches)
            .sort((a, b) => String(a?.full_name ?? a?.name ?? '').localeCompare(String(b?.full_name ?? b?.name ?? '')));

        const selectedIsActive = selected ? String(selected?.status ?? 'Active') === 'Active' : false;
        return { selected, selectedIsActive, items };
    }, [data.pic_assignments, picLookupQuery, picPickerRowIndex, users]);

    const openPicPicker = (rowIndex) => {
        setPicLookupQuery('');
        setPicPickerRowIndex(rowIndex);
        setShowPicPicker(true);
    };

    const selectPicUserId = (id) => {
        if (typeof picPickerRowIndex !== 'number') return;
        updatePicRow(picPickerRowIndex, 'pic_user_id', id ? String(id) : '');
        setShowPicPicker(false);
        setPicLookupQuery('');
        setPicPickerRowIndex(null);
    };

    const computed = useMemo(() => {
        const startIso = parseDateDdMmmYyToIso(data.start_date);
        const endIso = parseDateDdMmmYyToIso(data.end_date);
        const handoverIso = parseDateDdMmmYyToIso(data.handover_official_report);
        const validationIso = parseDateDdMmmYyToIso(data.validation_date);

        const start = startIso ? new Date(startIso + 'T00:00:00') : null;
        const end = endIso ? new Date(endIso + 'T00:00:00') : null;
        const handover = handoverIso ? new Date(handoverIso + 'T00:00:00') : null;
        const validation = validationIso ? new Date(validationIso + 'T00:00:00') : null;

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
        setPartnerLookupQuery('');
        setShowPartnerPicker(false);
        setPicLookupQuery('');
        setShowPicPicker(false);
        setPicPickerRowIndex(null);
        setData({
            cnc_id: '',
            pic_assignments: [{ pic_user_id: '', start_date: '', end_date: '' }],
            partner_id: '',
            project_name: '',
            assignment: '',
            project_information: projectInformationOptions?.[1] ?? 'Submission',
            pic_assignment: picAssignmentOptions?.[1] ?? 'Request',
            type: 'Maintenance',
            start_date: '',
            end_date: '',
            status: 'Scheduled',
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
        setPartnerLookupQuery('');
        setShowPartnerPicker(false);
        setPicLookupQuery('');
        setShowPicPicker(false);
        setPicPickerRowIndex(null);
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
        setPartnerLookupQuery('');
        setShowPartnerPicker(false);
        setPicLookupQuery('');
        setShowPicPicker(false);
        setPicPickerRowIndex(null);
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
            put(route('projects.update', { project: editingId }, false), {
                preserveScroll: true,
                data: payload,
                onSuccess: () => closeModal(),
            });
            return;
        }

        post(route('projects.store', {}, false), {
            preserveScroll: true,
            data: payload,
            onSuccess: () => closeModal(),
        });
    };

    const doDelete = (p) => {
        if (!window.confirm(`Delete project: ${p.project_name || p.id}?`)) return;
        destroy(route('projects.destroy', { project: p.id }, false), {
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
                                <p className="mb-0 text-muted">Showing {projects?.from ?? 0}-{projects?.to ?? 0} of {projects?.total ?? 0}</p>
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
                                        {[
                                            { key: 'all', label: 'All Status' },
                                            { key: 'running', label: 'Running' },
                                            { key: 'planning', label: 'Planning' },
                                            { key: 'document', label: 'Document' },
                                            { key: 'document_check', label: 'Document Check' },
                                            { key: 'done', label: 'Done' },
                                            { key: 'rejected', label: 'Rejected' },
                                        ].map((s) => {
                                            const href = route('projects.index', buildParams({ status_tab: s.key }), false);
                                            const active = statusSegment === s.key;
                                            return (
                                                <Link key={s.key} href={href} className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setStatusSegment(s.key)}>
                                                    {s.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                    <small className="text-muted ms-2">Default tampilan: Running</small>
                                </div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div className="text-muted d-flex flex-wrap gap-2 align-items-center">
                                    <span>
                                        Showing {projects?.from ?? 0}-{projects?.to ?? 0} of {projects?.total ?? 0}
                                    </span>
                                    {filterSummary ? <span>| {filterSummary}</span> : null}
                                </div>
                                <div className="d-flex gap-2">
                                    <Link href={projects?.prev_page_url ?? '#'} className={`btn btn-sm btn-outline-secondary ${projects?.prev_page_url ? '' : 'disabled'}`}>
                                        Prev
                                    </Link>
                                    <Link href={projects?.next_page_url ?? '#'} className={`btn btn-sm btn-outline-secondary ${projects?.next_page_url ? '' : 'disabled'}`}>
                                        Next
                                    </Link>
                                </div>
                            </div>


                            <div className="table-responsive">
                                <table className="table table-striped table-responsive-md">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 80 }}>ID</th>
                                            <th style={{ width: 110 }}>CNC ID</th>
                                            <th>Project</th>
                                            <th style={{ width: 220 }}>
                                                <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={(e) => openHeaderMenu('partner', e)}>
                                                    {sortLabel('Partner', 'partner')}
                                                </button>
                                            </th>
                                            <th style={{ width: 220 }}>PIC</th>
                                            <th style={{ width: 140 }}>
                                                <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={(e) => openHeaderMenu('type', e)}>
                                                    {sortLabel('Type', 'type')}
                                                </button>
                                            </th>
                                            <th style={{ width: 160 }}>
                                                <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={(e) => openHeaderMenu('start_date', e)}>
                                                    {sortLabel('Start Date', 'start_date')}
                                                </button>
                                            </th>
                                            <th style={{ width: 160 }}>End Date</th>
                                            <th style={{ width: 120 }}>
                                                <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={(e) => openHeaderMenu('status', e)}>
                                                    {sortLabel('Status', 'status')}
                                                </button>
                                            </th>
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

                            {openMenu ? (
                                <div
                                    ref={menuRef}
                                    className="card shadow-sm"
                                    style={{
                                        position: 'fixed',
                                        top: menuPos.top,
                                        left: menuPos.left,
                                        zIndex: 1050,
                                        width: menuWidth,
                                    }}
                                >
                                    <div className="card-body p-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <div className="fw-semibold">Sort</div>
                                            <button type="button" className="btn-close" onClick={() => setOpenMenu(null)} />
                                        </div>

                                        <div className="d-flex gap-2 mb-3">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => {
                                                    setSortBy(openMenu);
                                                    setSortDir('asc');
                                                    gotoWith({ sort_by: openMenu, sort_dir: 'asc' });
                                                    setOpenMenu(null);
                                                }}
                                            >
                                                Asc
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => {
                                                    setSortBy(openMenu);
                                                    setSortDir('desc');
                                                    gotoWith({ sort_by: openMenu, sort_dir: 'desc' });
                                                    setOpenMenu(null);
                                                }}
                                            >
                                                Desc
                                            </button>
                                        </div>

                                        {openMenu === 'partner' ? (
                                            <>
                                                <div className="fw-semibold mb-2">Filter</div>
                                                <input
                                                    className="form-control mb-2"
                                                    placeholder="Search partner..."
                                                    value={partnerFilterQuery}
                                                    onChange={(e) => setPartnerFilterQuery(e.target.value)}
                                                />
                                                <div className="list-group mb-3" style={{ maxHeight: 240, overflow: 'auto' }}>
                                                    {partnerFilterOptions.map((p) => {
                                                        const id = String(p.id);
                                                        const checked = (filterPartnerIdsValue ?? []).includes(id);
                                                        return (
                                                            <label key={p.id} className="list-group-item d-flex align-items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={(e) => {
                                                                        const next = e.target.checked
                                                                            ? Array.from(new Set([...(filterPartnerIdsValue ?? []), id]))
                                                                            : (filterPartnerIdsValue ?? []).filter((x) => x !== id);
                                                                        setFilterPartnerIdsValue(next);
                                                                    }}
                                                                />
                                                                <span>
                                                                    {p.cnc_id} - {p.name}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => {
                                                            gotoWith({});
                                                            setOpenMenu(null);
                                                        }}
                                                    >
                                                        Apply
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() => {
                                                            setFilterPartnerIdsValue([]);
                                                            gotoWith({ partner_ids: [] });
                                                            setOpenMenu(null);
                                                        }}
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </>
                                        ) : null}

                                        {openMenu === 'type' ? (
                                            <>
                                                <div className="fw-semibold mb-2">Filter</div>
                                                <input
                                                    className="form-control mb-2"
                                                    placeholder="Search type..."
                                                    value={typeFilterQuery}
                                                    onChange={(e) => setTypeFilterQuery(e.target.value)}
                                                />
                                                <div className="list-group mb-3" style={{ maxHeight: 240, overflow: 'auto' }}>
                                                    {typeOptionsList.map((t) => {
                                                        const checked = (filterTypesValue ?? []).includes(t);
                                                        return (
                                                            <label key={t} className="list-group-item d-flex align-items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={(e) => {
                                                                        const next = e.target.checked
                                                                            ? Array.from(new Set([...(filterTypesValue ?? []), t]))
                                                                            : (filterTypesValue ?? []).filter((x) => x !== t);
                                                                        setFilterTypesValue(next);
                                                                    }}
                                                                />
                                                                <span>{t}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => {
                                                            gotoWith({});
                                                            setOpenMenu(null);
                                                        }}
                                                    >
                                                        Apply
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() => {
                                                            setFilterTypesValue([]);
                                                            gotoWith({ types: [] });
                                                            setOpenMenu(null);
                                                        }}
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </>
                                        ) : null}

                                        {openMenu === 'start_date' ? (
                                            <>
                                                <div className="fw-semibold mb-2">Filter</div>
                                                <div className="text-muted mb-2">Pilih Start Date From dan To, lalu klik Apply.</div>
                                                <div className="row g-2 mb-3">
                                                    <div className="col-6">
                                                        <DatePickerInput value={filterStartFromValue} onChange={setFilterStartFromValue} className="form-control" />
                                                    </div>
                                                    <div className="col-6">
                                                        <DatePickerInput value={filterStartToValue} onChange={setFilterStartToValue} className="form-control" />
                                                    </div>
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => {
                                                            gotoWith({});
                                                            setOpenMenu(null);
                                                        }}
                                                    >
                                                        Apply
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() => {
                                                            setFilterStartFromValue('');
                                                            setFilterStartToValue('');
                                                            gotoWith({ start_from: '', start_to: '' });
                                                            setOpenMenu(null);
                                                        }}
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </>
                                        ) : null}

                                        {openMenu === 'status' ? (
                                            <>
                                                <div className="fw-semibold mb-2">Filter</div>
                                                <input
                                                    className="form-control mb-2"
                                                    placeholder="Search status..."
                                                    value={statusFilterQuery}
                                                    onChange={(e) => setStatusFilterQuery(e.target.value)}
                                                />
                                                <div className="list-group mb-3" style={{ maxHeight: 240, overflow: 'auto' }}>
                                                    {statusOptionsList.map((s) => {
                                                        const checked = (filterStatusesValue ?? []).includes(s);
                                                        return (
                                                            <label key={s} className="list-group-item d-flex align-items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={(e) => {
                                                                        const next = e.target.checked
                                                                            ? Array.from(new Set([...(filterStatusesValue ?? []), s]))
                                                                            : (filterStatusesValue ?? []).filter((x) => x !== s);
                                                                        setFilterStatusesValue(next);
                                                                    }}
                                                                />
                                                                <span>{s}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => {
                                                            gotoWith({});
                                                            setOpenMenu(null);
                                                        }}
                                                    >
                                                        Apply
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() => {
                                                            setFilterStatusesValue([]);
                                                            gotoWith({ statuses: [] });
                                                            setOpenMenu(null);
                                                        }}
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}
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
                                                <div className="input-group">
                                                    <input
                                                        className={`form-control ${errors.partner_id ? 'is-invalid' : ''}`}
                                                        placeholder="Search partner (Active only)..."
                                                        value={partnerDisplayValue}
                                                        readOnly
                                                        onClick={openPartnerPicker}
                                                    />
                                                    <button type="button" className="btn btn-outline-secondary" onClick={() => selectPartnerId('')} disabled={!data.partner_id}>
                                                        Clear
                                                    </button>
                                                </div>
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
                                                                <th style={{ width: 160 }}>Start Date</th>
                                                                <th style={{ width: 160 }}>End Date</th>
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
                                                                            <div className="input-group input-group-sm">
                                                                                <input
                                                                                    className={`form-control ${errUser ? 'is-invalid' : ''}`}
                                                                                    placeholder="Select PIC (Active only)..."
                                                                                    value={(() => {
                                                                                        const uid = row.pic_user_id ? String(row.pic_user_id) : '';
                                                                                        if (!uid) return '';
                                                                                        const u = (users ?? []).find((x) => String(x.id) === uid);
                                                                                        if (!u) return uid;
                                                                                        const name = u.full_name || u.name || '';
                                                                                        const email = u.email ? ` (${u.email})` : '';
                                                                                        const status = u.status ?? 'Active';
                                                                                        return status === 'Active' ? `${name}${email}` : `${name}${email} (${status})`;
                                                                                    })()}
                                                                                    readOnly
                                                                                    onClick={() => openPicPicker(index)}
                                                                                />
                                                                                <button type="button" className="btn btn-outline-secondary" onClick={() => updatePicRow(index, 'pic_user_id', '')} disabled={!row.pic_user_id}>
                                                                                    Clear
                                                                                </button>
                                                                            </div>
                                                                            {errUser ? <div className="invalid-feedback">{errUser}</div> : null}
                                                                        </td>
                                                                        <td>
                                                                            <DatePickerInput
                                                                                value={row.start_date ?? ''}
                                                                                onChange={(v) => updatePicRow(index, 'start_date', v)}
                                                                                className="form-control form-control-sm"
                                                                                invalid={Boolean(errStart)}
                                                                            />
                                                                            {errStart ? <div className="invalid-feedback">{errStart}</div> : null}
                                                                        </td>
                                                                        <td>
                                                                            <DatePickerInput
                                                                                value={row.end_date ?? ''}
                                                                                onChange={(v) => updatePicRow(index, 'end_date', v)}
                                                                                className="form-control form-control-sm"
                                                                                invalid={Boolean(errEnd)}
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
                                                    {renderSetupOptions('type', data.type, false)}
                                                </select>
                                                {errors.type ? <div className="invalid-feedback">{errors.type}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">Start Date</label>
                                                <DatePickerInput value={data.start_date} onChange={(v) => setData('start_date', v)} className="form-control" invalid={Boolean(errors.start_date)} />
                                                {errors.start_date ? <div className="invalid-feedback">{errors.start_date}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">End Date</label>
                                                <DatePickerInput value={data.end_date} onChange={(v) => setData('end_date', v)} className="form-control" invalid={Boolean(errors.end_date)} />
                                                {errors.end_date ? <div className="invalid-feedback">{errors.end_date}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">Status</label>
                                                <select className={`form-select ${errors.status ? 'is-invalid' : ''}`} value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                                    {renderSetupOptions('status', data.status, false)}
                                                </select>
                                                {errors.status ? <div className="invalid-feedback">{errors.status}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">Handover Official Report</label>
                                                <DatePickerInput value={data.handover_official_report} onChange={(v) => setData('handover_official_report', v)} className="form-control" invalid={Boolean(errors.handover_official_report)} />
                                                {errors.handover_official_report ? <div className="invalid-feedback">{errors.handover_official_report}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">KPI 2 - PIC</label>
                                                <input className={`form-control ${errors.kpi2_pic ? 'is-invalid' : ''}`} value={data.kpi2_pic} onChange={(e) => setData('kpi2_pic', e.target.value)} />
                                                {errors.kpi2_pic ? <div className="invalid-feedback">{errors.kpi2_pic}</div> : null}
                                            </div>

                                            <div className="col-lg-3 mb-3">
                                                <label className="text-black font-w600 form-label">Check Official Report</label>
                                                <DatePickerInput value={data.check_official_report} onChange={(v) => setData('check_official_report', v)} className="form-control" invalid={Boolean(errors.check_official_report)} />
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
                                                <DatePickerInput value={data.validation_date} onChange={(v) => setData('validation_date', v)} className="form-control" invalid={Boolean(errors.validation_date)} />
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
                                                <DatePickerInput value={data.s1_estimation_date} onChange={(v) => setData('s1_estimation_date', v)} className="form-control" invalid={Boolean(errors.s1_estimation_date)} />
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

            {showModal && showPartnerPicker ? (
                <>
                    <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Select Partner (Active)</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowPartnerPicker(false)} />
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <input
                                            className="form-control"
                                            placeholder="Search by CNC ID or Name..."
                                            value={partnerLookupQuery}
                                            onChange={(e) => setPartnerLookupQuery(e.target.value)}
                                            autoFocus
                                        />
                                    </div>

                                    <div className="list-group" style={{ maxHeight: 420, overflow: 'auto' }}>
                                        <button type="button" className="list-group-item list-group-item-action" onClick={() => selectPartnerId('')}>
                                            -
                                        </button>

                                        {partnerLookup.selected && !partnerLookup.selectedIsActive ? (
                                            <div className="list-group-item text-muted">
                                                Selected: {partnerLookup.selected.cnc_id} - {partnerLookup.selected.name} ({partnerLookup.selected.status ?? 'Inactive'})
                                            </div>
                                        ) : null}

                                        {partnerLookup.items.map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                className="list-group-item list-group-item-action"
                                                onClick={() => selectPartnerId(p.id)}
                                            >
                                                {p.cnc_id} - {p.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPartnerPicker(false)}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" onClick={() => setShowPartnerPicker(false)} />
                </>
            ) : null}

            {showModal && showPicPicker ? (
                <>
                    <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Select PIC (Active)</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowPicPicker(false)} />
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <input
                                            className="form-control"
                                            placeholder="Search by Name or Email..."
                                            value={picLookupQuery}
                                            onChange={(e) => setPicLookupQuery(e.target.value)}
                                            autoFocus
                                        />
                                    </div>

                                    <div className="list-group" style={{ maxHeight: 420, overflow: 'auto' }}>
                                        <button type="button" className="list-group-item list-group-item-action" onClick={() => selectPicUserId('')}>
                                            -
                                        </button>

                                        {picLookup.selected && !picLookup.selectedIsActive ? (
                                            <div className="list-group-item text-muted">
                                                Selected: {(picLookup.selected.full_name || picLookup.selected.name) + (picLookup.selected.email ? ` (${picLookup.selected.email})` : '')} ({picLookup.selected.status ?? 'Inactive'})
                                            </div>
                                        ) : null}

                                        {picLookup.items.map((u) => (
                                            <button
                                                key={u.id}
                                                type="button"
                                                className="list-group-item list-group-item-action"
                                                onClick={() => selectPicUserId(u.id)}
                                            >
                                                {(u.full_name || u.name) + (u.email ? ` (${u.email})` : '')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPicPicker(false)}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" onClick={() => setShowPicPicker(false)} />
                </>
            ) : null}
        </>
    );
}

ProjectsIndex.layout = (page) => <AuthenticatedLayout header="Projects">{page}</AuthenticatedLayout>;
