import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
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

    const [partnerLookupQuery, setPartnerLookupQuery] = useState('');
    const [showPartnerPicker, setShowPartnerPicker] = useState(false);
    const [projectLookupQuery, setProjectLookupQuery] = useState('');
    const [showProjectPicker, setShowProjectPicker] = useState(false);

    const [statusSegment, setStatusSegment] = useState(filters?.status ?? 'active');
    const [sortBy, setSortBy] = useState(filters?.sort_by ?? 'no');
    const [sortDir, setSortDir] = useState(filters?.sort_dir ?? 'asc');
    const [openMenu, setOpenMenu] = useState(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const [menuWidth, setMenuWidth] = useState(320);
    const menuRef = useRef(null);

    const [filterStatusesValue, setFilterStatusesValue] = useState(filters?.statuses ?? []);
    const [filterTypesValue, setFilterTypesValue] = useState(filters?.types ?? []);
    const [filterPrioritiesValue, setFilterPrioritiesValue] = useState(filters?.priorities ?? []);
    const [filterPartnerIdsValue, setFilterPartnerIdsValue] = useState((filters?.partner_ids ?? []).map(String));
    const [filterInfoFromValue, setFilterInfoFromValue] = useState(dateInputValue(filters?.date_from));
    const [filterInfoToValue, setFilterInfoToValue] = useState(dateInputValue(filters?.date_to));
    const [filterDueFromValue, setFilterDueFromValue] = useState(dateInputValue(filters?.due_from));
    const [filterDueToValue, setFilterDueToValue] = useState(dateInputValue(filters?.due_to));
    const [partnerFilterQuery, setPartnerFilterQuery] = useState('');
    const [typeFilterQuery, setTypeFilterQuery] = useState('');
    const [priorityFilterQuery, setPriorityFilterQuery] = useState('');
    const [optionsCache, setOptionsCache] = useState({});
    const [optionsLoading, setOptionsLoading] = useState(false);

    useEffect(() => {
        setStatusSegment(filters?.status ?? 'active');
        setSortBy(filters?.sort_by ?? 'no');
        setSortDir(filters?.sort_dir ?? 'asc');
        setFilterStatusesValue(filters?.statuses ?? []);
        setFilterTypesValue(filters?.types ?? []);
        setFilterPrioritiesValue(filters?.priorities ?? []);
        setFilterPartnerIdsValue((filters?.partner_ids ?? []).map(String));
        setFilterInfoFromValue(dateInputValue(filters?.date_from));
        setFilterInfoToValue(dateInputValue(filters?.date_to));
        setFilterDueFromValue(dateInputValue(filters?.due_from));
        setFilterDueToValue(dateInputValue(filters?.due_to));
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

    const rows = items?.data ?? [];

    const editingItem = useMemo(() => {
        if (!editingId) return null;
        return rows.find((t) => t.id === editingId) ?? null;
    }, [editingId, rows]);

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

    useEffect(() => {
        if (!showPartnerPicker) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setShowPartnerPicker(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showPartnerPicker]);

    useEffect(() => {
        if (!showProjectPicker) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setShowProjectPicker(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showProjectPicker]);

    const selectedPartner = useMemo(() => {
        const id = data.partner_id ? Number(data.partner_id) : null;
        if (!id) return null;
        return (partners ?? []).find((p) => p.id === id) ?? null;
    }, [data.partner_id, partners]);

    const partnerLookup = useMemo(() => {
        const selectedId = data.partner_id ? Number(data.partner_id) : null;
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

    const selectedProject = useMemo(() => {
        const id = String(data.project_id ?? '');
        if (!id) return null;
        return (projects ?? []).find((p) => String(p.id) === id) ?? null;
    }, [data.project_id, projects]);

    const projectLookup = useMemo(() => {
        const selectedId = String(data.project_id ?? '');
        const selected = selectedId ? (projects ?? []).find((p) => String(p.id) === selectedId) ?? null : null;

        const tokens = String(projectLookupQuery ?? '')
            .toLowerCase()
            .trim()
            .split(/\s+/)
            .map((t) => t.trim())
            .filter(Boolean);

        const excluded = new Set(['Done', 'Rejected']);
        const allowedProjects = (projects ?? []).filter((p) => !excluded.has(String(p?.status ?? '')));

        const matches = (p) => {
            if (tokens.length === 0) return true;
            const hay = `${p?.cnc_id ?? ''} ${p?.project_name ?? ''}`.toLowerCase();
            return tokens.every((t) => hay.includes(t));
        };

        const items = allowedProjects
            .filter(matches)
            .sort((a, b) => {
                const ai = Number(a?.cnc_id);
                const bi = Number(b?.cnc_id);
                if (Number.isFinite(ai) && Number.isFinite(bi) && ai !== bi) return ai - bi;
                return String(a?.cnc_id ?? '').localeCompare(String(b?.cnc_id ?? '')) || String(a?.project_name ?? '').localeCompare(String(b?.project_name ?? ''));
            });

        const selectedAllowed = selected ? !excluded.has(String(selected?.status ?? '')) : false;
        return { selected, selectedAllowed, items };
    }, [data.project_id, projectLookupQuery, projects]);

    const openCreate = () => {
        setEditingId(null);
        clearErrors();
        reset();
        setPartnerLookupQuery('');
        setShowPartnerPicker(false);
        setProjectLookupQuery('');
        setShowProjectPicker(false);
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
        setPartnerLookupQuery('');
        setShowPartnerPicker(false);
        setProjectLookupQuery('');
        setShowProjectPicker(false);
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
        setPartnerLookupQuery('');
        setShowPartnerPicker(false);
        setProjectLookupQuery('');
        setShowProjectPicker(false);
        clearErrors();
    };

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

    const openProjectPicker = () => {
        setProjectLookupQuery('');
        setShowProjectPicker(true);
    };

    const selectProjectId = (id) => {
        setData('project_id', id ? String(id) : '');
        setShowProjectPicker(false);
        setProjectLookupQuery('');
    };

    const projectDisplayValue = useMemo(() => {
        if (!selectedProject) return '';
        const cnc = selectedProject?.cnc_id ?? '';
        const name = selectedProject?.project_name ?? '';
        const status = selectedProject?.status ?? '';
        if (status === 'Done' || status === 'Rejected') return `${cnc} - ${name} (${status})`;
        return `${cnc} - ${name}`;
    }, [selectedProject]);

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
            put(route('time-boxing.update', { timeBoxing: editingId }, false), {
                preserveScroll: true,
                data: payload,
                onSuccess: () => closeModal(),
            });
            return;
        }

        post(route('time-boxing.store', {}, false), {
            preserveScroll: true,
            data: payload,
            onSuccess: () => closeModal(),
        });
    };

    const doDelete = (t) => {
        if (!window.confirm(`Delete Time Boxing #${t.no}?`)) return;
        destroy(route('time-boxing.destroy', { timeBoxing: t.id }, false), {
            preserveScroll: true,
        });
    };

    const statusSegments = useMemo(() => {
        return [
            { key: 'all', label: 'All Status' },
            { key: 'active', label: 'Active Status' },
            { key: 'Completed', label: 'Completed' },
        ];
    }, []);

    const sortHrefFor = (key) => {
        const params = {};
        if (statusSegment !== 'active') params.status = statusSegment;
        const nextDir = sortBy === key ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc';
        params.sort_by = key;
        params.sort_dir = nextDir;
        return route('time-boxing.index', params, false);
    };

    const sortLabel = (label, key) => {
        if (sortBy !== key) return label;
        return `${label} ${sortDir === 'asc' ? '↑' : '↓'}`;
    };

    const buildParams = (overrides = {}) => {
        const params = {
            status: statusSegment,
            sort_by: sortBy,
            sort_dir: sortDir,
            statuses: filterStatusesValue,
            types: filterTypesValue,
            priorities: filterPrioritiesValue,
            partner_ids: filterPartnerIdsValue.map((v) => Number(v)),
            date_from: parseDateDdMmmYyToIso(filterInfoFromValue) || '',
            date_to: parseDateDdMmmYyToIso(filterInfoToValue) || '',
            due_from: parseDateDdMmmYyToIso(filterDueFromValue) || '',
            due_to: parseDateDdMmmYyToIso(filterDueToValue) || '',
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
                if (k === 'status' && s === 'active') return;
                if (k === 'sort_by' && s === 'no') return;
                if (k === 'sort_dir') {
                    const sb = String(params.sort_by ?? 'no');
                    if (sb === 'no') return;
                    if (s === 'asc') return;
                }
            }
            if (k === 'status' && String(v) === 'active') return;
            if (k === 'sort_by' && String(v) === 'no') return;
            clean[k] = v;
        });
        return clean;
    };

    const gotoWith = (overrides = {}) => {
        const params = buildParams(overrides);
        router.get(route('time-boxing.index', params, false), {}, { preserveScroll: true, preserveState: true, replace: true });
    };

    const ensureOptions = async (statusKey) => {
        const k = statusKey || 'active';
        if (optionsCache[k]) return optionsCache[k];
        setOptionsLoading(true);
        try {
            const url = route('time-boxing.options', k === 'active' ? {} : { status: k }, false);
            const res = await fetch(url, { headers: { Accept: 'application/json' } });
            const json = await res.json();
            setOptionsCache((prev) => ({ ...prev, [k]: json }));
            return json;
        } finally {
            setOptionsLoading(false);
        }
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
        setPriorityFilterQuery('');
        setOpenMenu(key);
        void ensureOptions(statusSegment);
    };

    const optionsForTab = optionsCache[statusSegment || 'active'] || null;
    const allTypes = (optionsForTab?.types ?? []).map((t) => String(t)).filter((v) => v !== '');
    const allPriorities = (optionsForTab?.priorities ?? []).map((p) => String(p)).filter((v) => v !== '');
    const allPartners = optionsForTab?.partners ?? [];

    const partnerFilterOptions = useMemo(() => {
        const q = String(partnerFilterQuery ?? '').toLowerCase().trim();
        const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
        const matches = (p) => {
            if (tokens.length === 0) return true;
            const hay = `${p?.cnc_id ?? ''} ${p?.name ?? ''}`.toLowerCase();
            return tokens.every((t) => hay.includes(t));
        };

        return (allPartners ?? partners ?? [])
            .filter(matches)
            .sort((a, b) => {
                const ai = Number(a?.cnc_id);
                const bi = Number(b?.cnc_id);
                if (Number.isFinite(ai) && Number.isFinite(bi) && ai !== bi) return ai - bi;
                return String(a?.cnc_id ?? '').localeCompare(String(b?.cnc_id ?? '')) || String(a?.name ?? '').localeCompare(String(b?.name ?? ''));
            })
            .slice(0, 30);
    }, [allPartners, partnerFilterQuery, partners]);

    const typeFilterOptions = useMemo(() => {
        const base = (allTypes.length ? allTypes : optionObjects(typeOptions).map((o) => String(o?.name ?? '').trim()).filter((v) => v !== '')).slice();
        base.sort((a, b) => a.localeCompare(b));

        const q = String(typeFilterQuery ?? '').toLowerCase().trim();
        if (!q) return base;
        const tokens = q.split(/\s+/).filter(Boolean);
        return base.filter((t) => tokens.every((x) => t.toLowerCase().includes(x)));
    }, [allTypes, typeFilterQuery, typeOptions]);

    const priorityFilterOptions = useMemo(() => {
        const base = (allPriorities.length ? allPriorities : (priorityOptions ?? [])).map((p) => String(p)).filter((v) => v !== '');
        const q = String(priorityFilterQuery ?? '').toLowerCase().trim();
        if (!q) return base;
        const tokens = q.split(/\s+/).filter(Boolean);
        return base.filter((p) => tokens.every((x) => p.toLowerCase().includes(x)));
    }, [allPriorities, priorityFilterQuery, priorityOptions]);

    const filterSummary = useMemo(() => {
        const parts = [];

        const statusLabel = statusSegment === 'active' ? 'Active Status' : statusSegment === 'all' ? 'All Status' : String(statusSegment);
        if ((filterStatusesValue ?? []).length) {
            parts.push(`Status: ${(filterStatusesValue ?? []).join(', ')}`);
        } else if (statusLabel !== 'Active Status') {
            parts.push(`Status: ${statusLabel}`);
        }

        if (filterInfoFromValue || filterInfoToValue) {
            const from = filterInfoFromValue || '-';
            const to = filterInfoToValue || '-';
            parts.push(`Information Date: ${from} s/d ${to}`);
        }

        if (filterDueFromValue || filterDueToValue) {
            const from = filterDueFromValue || '-';
            const to = filterDueToValue || '-';
            parts.push(`Due Date: ${from} s/d ${to}`);
        }

        if ((filterTypesValue ?? []).length) parts.push(`Type: ${(filterTypesValue ?? []).join(', ')}`);
        if ((filterPrioritiesValue ?? []).length) parts.push(`Priority: ${(filterPrioritiesValue ?? []).join(', ')}`);

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

        return parts.join(' | ');
    }, [filterDueFromValue, filterDueToValue, filterInfoFromValue, filterInfoToValue, filterPartnerIdsValue, filterPrioritiesValue, filterStatusesValue, filterTypesValue, partners, statusSegment]);

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
                                <button type="button" className="btn btn-success" onClick={openCreate}>
                                    New
                                </button>
                            </div>
                        </div>

                        <div className="card-body">
                            <div className="row mb-3">
                                <div className="col-12 d-flex gap-2 align-items-center">
                                    <div className="btn-group" role="group" aria-label="Status filter">
                                        {statusSegments.map((s) => {
                                            const href = route('time-boxing.index', buildParams({ status: s.key }), false);
                                            const active = statusSegment === s.key;
                                            return (
                                                <Link
                                                    key={s.key}
                                                    href={href}
                                                    className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                    onClick={() => {
                                                        setStatusSegment(s.key);
                                                        void ensureOptions(s.key);
                                                    }}
                                                >
                                                    {s.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                    <small className="text-muted ms-2">Default tampilan: Active Status</small>
                                </div>
                            </div>

                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div className="text-muted d-flex flex-wrap gap-2 align-items-center">
                                    <span>On this page: {clientFilteredRows.length}</span>
                                    {filterSummary ? <span>| {filterSummary}</span> : null}
                                </div>
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
                                            <th style={{ width: 80 }}>
                                                <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={(e) => openHeaderMenu('no', e)}>
                                                    {sortLabel('ID', 'no')}
                                                </button>
                                            </th>
                                            <th style={{ minWidth: 170 }}>
                                                <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={(e) => openHeaderMenu('information_date', e)}>
                                                    {sortLabel('Information Date', 'information_date')}
                                                </button>
                                            </th>
                                            <th style={{ minWidth: 160 }}>
                                                <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={(e) => openHeaderMenu('type', e)}>
                                                    {sortLabel('Type', 'type')}
                                                </button>
                                            </th>
                                            <th style={{ width: 120 }}>
                                                <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={(e) => openHeaderMenu('priority', e)}>
                                                    {sortLabel('Priority', 'priority')}
                                                </button>
                                            </th>
                                            <th style={{ minWidth: 200 }}>User &amp; Position</th>
                                            <th style={{ minWidth: 240 }}>
                                                <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={(e) => openHeaderMenu('partner', e)}>
                                                    {sortLabel('Partner', 'partner')}
                                                </button>
                                            </th>
                                            <th style={{ minWidth: 320 }}>Descriptions</th>
                                            <th style={{ minWidth: 340 }}>Action / Solution</th>
                                            <th style={{ width: 140 }}>
                                                <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={(e) => openHeaderMenu('status', e)}>
                                                    {sortLabel('Status', 'status')}
                                                </button>
                                            </th>
                                            <th style={{ minWidth: 140 }}>
                                                <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={(e) => openHeaderMenu('due_date', e)}>
                                                    {sortLabel('Due Date', 'due_date')}
                                                </button>
                                            </th>
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
                                                <td style={{ whiteSpace: 'pre-wrap' }}>{t.description ?? '-'}</td>
                                                <td style={{ whiteSpace: 'pre-wrap' }}>{t.action_solution ?? '-'}</td>
                                                <td>
                                                    <span className={`badge ${statusBadgeClass[t.status] ?? 'bg-secondary'}`}>{t.status ?? '-'}</span>
                                                </td>
                                                <td>{t.due_date ? formatDateDdMmmYy(t.due_date) : '-'}</td>
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

                                        {openMenu === 'information_date' ? (
                                            <>
                                                <div className="fw-semibold mb-2">Filter</div>
                                                {optionsLoading ? <div className="text-muted mb-2">Loading...</div> : null}
                                                <div className="text-muted mb-2">Pilih Start Date dan End Date, lalu klik Apply.</div>
                                                <div className="row g-2 mb-2">
                                                    <div className="col-6">
                                                        <DatePickerInput value={filterInfoFromValue} onChange={setFilterInfoFromValue} className="form-control" />
                                                    </div>
                                                    <div className="col-6">
                                                        <DatePickerInput value={filterInfoToValue} onChange={setFilterInfoToValue} className="form-control" />
                                                    </div>
                                                </div>
                                                <div className="d-flex gap-2 mb-3">
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
                                                            setFilterInfoFromValue('');
                                                            setFilterInfoToValue('');
                                                            gotoWith({ date_from: '', date_to: '' });
                                                            setOpenMenu(null);
                                                        }}
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </>
                                        ) : null}

                                        {openMenu === 'due_date' ? (
                                            <>
                                                <div className="fw-semibold mb-2">Filter</div>
                                                {optionsLoading ? <div className="text-muted mb-2">Loading...</div> : null}
                                                <div className="text-muted mb-2">Pilih Start Date dan End Date, lalu klik Apply.</div>
                                                <div className="row g-2 mb-2">
                                                    <div className="col-6">
                                                        <DatePickerInput value={filterDueFromValue} onChange={setFilterDueFromValue} className="form-control" />
                                                    </div>
                                                    <div className="col-6">
                                                        <DatePickerInput value={filterDueToValue} onChange={setFilterDueToValue} className="form-control" />
                                                    </div>
                                                </div>
                                                <div className="d-flex gap-2 mb-3">
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
                                                            setFilterDueFromValue('');
                                                            setFilterDueToValue('');
                                                            gotoWith({ due_from: '', due_to: '' });
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
                                                {optionsLoading ? <div className="text-muted mb-2">Loading...</div> : null}
                                                <input
                                                    className="form-control mb-2"
                                                    placeholder="Search type..."
                                                    value={typeFilterQuery}
                                                    onChange={(e) => setTypeFilterQuery(e.target.value)}
                                                />
                                                <div className="list-group mb-3" style={{ maxHeight: 240, overflow: 'auto' }}>
                                                    {typeFilterOptions.map((t) => {
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

                                        {openMenu === 'priority' ? (
                                            <>
                                                <div className="fw-semibold mb-2">Filter</div>
                                                {optionsLoading ? <div className="text-muted mb-2">Loading...</div> : null}
                                                <input
                                                    className="form-control mb-2"
                                                    placeholder="Search priority..."
                                                    value={priorityFilterQuery}
                                                    onChange={(e) => setPriorityFilterQuery(e.target.value)}
                                                />
                                                <div className="list-group mb-3" style={{ maxHeight: 240, overflow: 'auto' }}>
                                                    {priorityFilterOptions.map((p) => {
                                                        const checked = (filterPrioritiesValue ?? []).includes(p);
                                                        return (
                                                            <label key={p} className="list-group-item d-flex align-items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={(e) => {
                                                                        const next = e.target.checked
                                                                            ? Array.from(new Set([...(filterPrioritiesValue ?? []), p]))
                                                                            : (filterPrioritiesValue ?? []).filter((x) => x !== p);
                                                                        setFilterPrioritiesValue(next);
                                                                    }}
                                                                />
                                                                <span>{p}</span>
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
                                                            setFilterPrioritiesValue([]);
                                                            gotoWith({ priorities: [] });
                                                            setOpenMenu(null);
                                                        }}
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </>
                                        ) : null}

                                        {openMenu === 'partner' ? (
                                            <>
                                                <div className="fw-semibold mb-2">Filter</div>
                                                {optionsLoading ? <div className="text-muted mb-2">Loading...</div> : null}
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

                                        {openMenu === 'status' ? (
                                            <>
                                                <div className="fw-semibold mb-2">Filter</div>
                                                <div className="text-muted mb-2">Pilih satu atau lebih status, lalu klik Apply.</div>
                                                <div className="list-group mb-3" style={{ maxHeight: 240, overflow: 'auto' }}>
                                                    {(statusOptions ?? []).map((s) => {
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
                                                <div className="input-group">
                                                    <input
                                                        className={`form-control ${errors.project_id ? 'is-invalid' : ''}`}
                                                        placeholder="Search project (not Done/Rejected)..."
                                                        value={projectDisplayValue}
                                                        readOnly
                                                        onClick={openProjectPicker}
                                                    />
                                                    <button type="button" className="btn btn-outline-secondary" onClick={() => selectProjectId('')} disabled={!data.project_id}>
                                                        Clear
                                                    </button>
                                                </div>
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

            {showModal && showProjectPicker ? (
                <>
                    <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Select Project</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowProjectPicker(false)} />
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <input
                                            className="form-control"
                                            placeholder="Search by CNC ID or Project Name..."
                                            value={projectLookupQuery}
                                            onChange={(e) => setProjectLookupQuery(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="form-text">Hanya menampilkan project dengan status selain Done dan Rejected.</div>
                                    </div>

                                    <div className="list-group" style={{ maxHeight: 420, overflow: 'auto' }}>
                                        <button type="button" className="list-group-item list-group-item-action" onClick={() => selectProjectId('')}>
                                            -
                                        </button>

                                        {projectLookup.selected && !projectLookup.selectedAllowed ? (
                                            <div className="list-group-item text-muted">
                                                Selected: {projectLookup.selected.cnc_id} - {projectLookup.selected.project_name} ({projectLookup.selected.status ?? '-'})
                                            </div>
                                        ) : null}

                                        {projectLookup.items.map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                className="list-group-item list-group-item-action"
                                                onClick={() => selectProjectId(p.id)}
                                            >
                                                {p.cnc_id} - {p.project_name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowProjectPicker(false)}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" onClick={() => setShowProjectPicker(false)} />
                </>
            ) : null}
        </>
    );
}

TimeBoxingIndex.layout = (page) => <AuthenticatedLayout header="Time Boxing">{page}</AuthenticatedLayout>;
