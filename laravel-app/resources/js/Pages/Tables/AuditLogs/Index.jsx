import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import { parseDateDdMmmYyToIso } from '@/utils/date';
import DatePickerInput from '@/Components/DatePickerInput';

const actionBadgeClass = {
    create: 'bg-success',
    update: 'bg-warning',
    delete: 'bg-danger',
};

const formatTs = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dd = String(d.getDate()).padStart(2, '0');
    const mmm = months[d.getMonth()] ?? '';
    const yy = String(d.getFullYear()).slice(-2);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');

    return `${dd} ${mmm} ${yy} ${hh}:${mm}`;
};

const jsonPretty = (v) => {
    if (v === null || v === undefined) return '';
    try {
        return JSON.stringify(v, null, 2);
    } catch (_e) {
        return String(v);
    }
};

export default function AuditLogsIndex({ logs, filters, modules, actions, pageSearchQuery }) {
    const [openMenu, setOpenMenu] = useState(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const [menuWidth, setMenuWidth] = useState(320);
    const menuRef = useRef(null);

    const [sortBy, setSortBy] = useState(filters?.sort_by ?? null);
    const [sortDir, setSortDir] = useState(filters?.sort_dir ?? 'desc');
    const [filterModulesValue, setFilterModulesValue] = useState(filters?.modules ?? []);
    const [filterActionsValue, setFilterActionsValue] = useState(filters?.actions ?? []);
    const [filterActorIdsValue, setFilterActorIdsValue] = useState((filters?.actor_ids ?? []).map(String));
    const [filterDateFromValue, setFilterDateFromValue] = useState(displayDateValue(filters?.date_from));
    const [filterDateToValue, setFilterDateToValue] = useState(displayDateValue(filters?.date_to));

    const [showModal, setShowModal] = useState(false);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        setSortBy(filters?.sort_by ?? null);
        setSortDir(filters?.sort_dir ?? 'desc');
        setFilterModulesValue(filters?.modules ?? []);
        setFilterActionsValue(filters?.actions ?? []);
        setFilterActorIdsValue((filters?.actor_ids ?? []).map(String));
        setFilterDateFromValue(displayDateValue(filters?.date_from));
        setFilterDateToValue(displayDateValue(filters?.date_to));
    }, [filters]);

    const data = logs?.data ?? [];
    const filteredRows = useMemo(() => {
        const search = String(pageSearchQuery ?? '').trim().toLowerCase();
        if (!search) return data;

        return data.filter((r) => {
            const blob = [
                r.id,
                r.action,
                r.module,
                r.model_type,
                r.model_type_short,
                r.model_id,
                r.actor?.name,
                r.actor?.email,
                r.meta?.setup_category,
                r.meta?.url,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return blob.includes(search);
        });
    }, [data, pageSearchQuery]);

    const openDetail = async (row) => {
        setShowModal(true);
        setDetailLoading(true);
        setDetail(null);

        try {
            const res = await axios.get(route('audit-logs.show', { auditLog: row.id }, false));
            setDetail(res.data);
        } catch (_e) {
            setDetail({ error: 'Gagal load detail audit log.' });
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetail = () => {
        setShowModal(false);
        setDetail(null);
        setDetailLoading(false);
    };

    const diffRows = useMemo(() => computeDiffRows(detail?.before, detail?.after), [detail]);

    const buildParams = (overrides = {}) => {
        const params = {
            sort_by: sortBy || '',
            sort_dir: sortDir || 'desc',
            modules: filterModulesValue,
            actions: filterActionsValue,
            actor_ids: filterActorIdsValue.map((v) => Number(v)),
            date_from: parseDateDdMmmYyToIso(filterDateFromValue) || '',
            date_to: parseDateDdMmmYyToIso(filterDateToValue) || '',
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
                if (k === 'sort_dir') {
                    const sb = String(params.sort_by ?? '');
                    if (!sb) return;
                    if (s === 'desc') return;
                }
            }
            if (k === 'sort_by' && String(v) === '') return;
            clean[k] = v;
        });
        return clean;
    };

    const gotoWith = (overrides = {}) => {
        const params = buildParams(overrides);
        router.get(route('audit-logs.index', params, false), {}, { preserveScroll: true, preserveState: true, replace: true });
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
        setOpenMenu(key);
    };

    const sortLabel = (label, key) => {
        if (sortBy !== key) return label;
        return `${label} ${sortDir === 'asc' ? '↑' : '↓'}`;
    };

    const actorOptions = useMemo(() => {
        const byId = new Map();
        (logs?.data ?? []).forEach((r) => {
            if (r.actor?.id) byId.set(String(r.actor.id), r.actor);
        });
        return Array.from(byId.values()).sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
    }, [logs]);

    const filterSummary = useMemo(() => {
        const parts = [];

        if (filterDateFromValue || filterDateToValue) {
            const from = filterDateFromValue || '-';
            const to = filterDateToValue || '-';
            parts.push(`Time: ${from} s/d ${to}`);
        }

        if (filterModulesValue?.length) {
            const labelMap = new Map((modules ?? []).map((m) => [m.key, m.label]));
            const labels = filterModulesValue.map((k) => labelMap.get(k) ?? k);
            if (labels.length) parts.push(`Module: ${labels.join(', ')}`);
        }

        if (filterActionsValue?.length) {
            const labelMap = new Map((actions ?? []).map((a) => [a.key, a.label]));
            const labels = filterActionsValue.map((k) => labelMap.get(k) ?? k);
            if (labels.length) parts.push(`Action: ${labels.join(', ')}`);
        }

        if (filterActorIdsValue?.length) {
            const byId = new Map(actorOptions.map((a) => [String(a.id), a]));
            const labels = filterActorIdsValue
                .map((id) => {
                    const a = byId.get(String(id));
                    if (!a) return String(id);
                    return a.name ?? a.email ?? String(id);
                })
                .filter(Boolean);
            if (labels.length) parts.push(`Actor: ${labels.join(', ')}`);
        }

        return parts.join(' | ');
    }, [filterModulesValue, filterActionsValue, filterActorIdsValue, filterDateFromValue, filterDateToValue, modules, actions, actorOptions]);

    return (
        <>
            <Head title="Audit Logs" />

            <div className="row">
                <div className="col-xl-12">
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <h4 className="card-title mb-0">Tables &gt; Audit Logs</h4>
                                <p className="mb-0 text-muted">Total: {logs?.total ?? filteredRows.length}</p>
                            </div>
                            <div />
                        </div>

                        <div className="card-body">

                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div className="text-muted d-flex flex-wrap gap-2 align-items-center">
                                    <span>Showing {logs?.from ?? 0}-{logs?.to ?? 0} of {logs?.total ?? 0}</span>
                                    {filterSummary ? <span>| {filterSummary}</span> : null}
                                </div>
                                <div className="d-flex gap-2">
                                    <Link href={logs?.prev_page_url ?? '#'} className={`btn btn-sm btn-outline-secondary ${logs?.prev_page_url ? '' : 'disabled'}`}>
                                        Prev
                                    </Link>
                                    <Link href={logs?.next_page_url ?? '#'} className={`btn btn-sm btn-outline-secondary ${logs?.next_page_url ? '' : 'disabled'}`}>
                                        Next
                                    </Link>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="table table-striped table-responsive-md">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 80 }}>ID</th>
                                            <th style={{ width: 160 }}>
                                                <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={(e) => openHeaderMenu('time', e)}>
                                                    {sortLabel('Time', 'time')}
                                                </button>
                                            </th>
                                            <th style={{ width: 120 }}>
                                                <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={(e) => openHeaderMenu('module', e)}>
                                                    {sortLabel('Module', 'module')}
                                                </button>
                                            </th>
                                            <th style={{ width: 110 }}>
                                                <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={(e) => openHeaderMenu('action', e)}>
                                                    {sortLabel('Action', 'action')}
                                                </button>
                                            </th>
                                            <th style={{ minWidth: 160 }}>Model</th>
                                            <th style={{ minWidth: 220 }}>Model ID</th>
                                            <th style={{ minWidth: 200 }}>
                                                <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={(e) => openHeaderMenu('actor', e)}>
                                                    {sortLabel('Actor', 'actor')}
                                                </button>
                                            </th>
                                            <th style={{ minWidth: 160 }}>Setup Category</th>
                                            <th style={{ minWidth: 260 }}>URL</th>
                                            <th style={{ width: 110 }} />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={10} className="text-center text-muted">
                                                    No audit logs found
                                                </td>
                                            </tr>
                                        ) : null}

                                        {filteredRows.map((r) => (
                                            <tr key={r.id}>
                                                <td>{r.id}</td>
                                                <td>{formatTs(r.created_at)}</td>
                                                <td>{r.module}</td>
                                                <td>
                                                    <span className={`badge ${actionBadgeClass[r.action] ?? 'bg-secondary'}`}>{r.action}</span>
                                                </td>
                                                <td>{r.model_type_short ?? r.model_type}</td>
                                                <td>{r.model_id ?? '-'}</td>
                                                <td>
                                                    {r.actor ? (
                                                        <>
                                                            <div>{r.actor.name}</div>
                                                            <div className="text-muted">{r.actor.email}</div>
                                                        </>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                <td>{r.meta?.setup_category ?? '-'}</td>
                                                <td style={{ maxWidth: 340, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.meta?.url ?? '-'}</td>
                                                <td className="text-end">
                                                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openDetail(r)}>
                                                        View
                                                    </button>
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

                                        {openMenu === 'time' ? (
                                            <>
                                                <div className="fw-semibold mb-2">Filter</div>
                                                <div className="text-muted mb-2">Pilih Start Date dan Ending Date, lalu klik Apply.</div>
                                                <div className="row g-2 mb-3">
                                                    <div className="col-6">
                                                        <DatePickerInput value={filterDateFromValue} onChange={setFilterDateFromValue} className="form-control" />
                                                    </div>
                                                    <div className="col-6">
                                                        <DatePickerInput value={filterDateToValue} onChange={setFilterDateToValue} className="form-control" />
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
                                                            setFilterDateFromValue('');
                                                            setFilterDateToValue('');
                                                            gotoWith({ date_from: '', date_to: '' });
                                                            setOpenMenu(null);
                                                        }}
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </>
                                        ) : null}

                                        {openMenu === 'module' ? (
                                            <>
                                                <div className="fw-semibold mb-2">Filter</div>
                                                <div className="list-group mb-3" style={{ maxHeight: 240, overflow: 'auto' }}>
                                                    {(modules ?? []).filter((m) => m.key !== 'all').map((m) => {
                                                        const checked = (filterModulesValue ?? []).includes(m.key);
                                                        return (
                                                            <label key={m.key} className="list-group-item d-flex align-items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={(e) => {
                                                                        const next = e.target.checked
                                                                            ? Array.from(new Set([...(filterModulesValue ?? []), m.key]))
                                                                            : (filterModulesValue ?? []).filter((x) => x !== m.key);
                                                                        setFilterModulesValue(next);
                                                                    }}
                                                                />
                                                                <span>{m.label}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <button type="button" className="btn btn-sm btn-primary" onClick={() => { gotoWith({}); setOpenMenu(null); }}>
                                                        Apply
                                                    </button>
                                                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setFilterModulesValue([]); gotoWith({ modules: [] }); setOpenMenu(null); }}>
                                                        Clear
                                                    </button>
                                                </div>
                                            </>
                                        ) : null}

                                        {openMenu === 'action' ? (
                                            <>
                                                <div className="fw-semibold mb-2">Filter</div>
                                                <div className="list-group mb-3" style={{ maxHeight: 240, overflow: 'auto' }}>
                                                    {(actions ?? []).filter((a) => a.key !== 'all').map((a) => {
                                                        const checked = (filterActionsValue ?? []).includes(a.key);
                                                        return (
                                                            <label key={a.key} className="list-group-item d-flex align-items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={(e) => {
                                                                        const next = e.target.checked
                                                                            ? Array.from(new Set([...(filterActionsValue ?? []), a.key]))
                                                                            : (filterActionsValue ?? []).filter((x) => x !== a.key);
                                                                        setFilterActionsValue(next);
                                                                    }}
                                                                />
                                                                <span>{a.label}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <button type="button" className="btn btn-sm btn-primary" onClick={() => { gotoWith({}); setOpenMenu(null); }}>
                                                        Apply
                                                    </button>
                                                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setFilterActionsValue([]); gotoWith({ actions: [] }); setOpenMenu(null); }}>
                                                        Clear
                                                    </button>
                                                </div>
                                            </>
                                        ) : null}

                                        {openMenu === 'actor' ? (
                                            <>
                                                <div className="fw-semibold mb-2">Filter</div>
                                                <div className="list-group mb-3" style={{ maxHeight: 240, overflow: 'auto' }}>
                                                    {actorOptions.map((a) => {
                                                        const id = String(a.id);
                                                        const checked = (filterActorIdsValue ?? []).includes(id);
                                                        return (
                                                            <label key={id} className="list-group-item d-flex align-items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={(e) => {
                                                                        const next = e.target.checked
                                                                            ? Array.from(new Set([...(filterActorIdsValue ?? []), id]))
                                                                            : (filterActorIdsValue ?? []).filter((x) => x !== id);
                                                                        setFilterActorIdsValue(next);
                                                                    }}
                                                                />
                                                                <span>{a.name} <span className="text-muted">({a.email})</span></span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <button type="button" className="btn btn-sm btn-primary" onClick={() => { gotoWith({}); setOpenMenu(null); }}>
                                                        Apply
                                                    </button>
                                                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setFilterActorIdsValue([]); gotoWith({ actor_ids: [] }); setOpenMenu(null); }}>
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
                                    <h5 className="modal-title">Audit Log Detail</h5>
                                    <button type="button" className="btn-close" onClick={closeDetail} />
                                </div>

                                <div className="modal-body">
                                    {detailLoading ? <div className="text-muted">Loading...</div> : null}

                                    {detail?.error ? <div className="alert alert-danger">{detail.error}</div> : null}

                                    {!detailLoading && detail && !detail.error ? (
                                        <div className="row">
                                            <div className="col-lg-4 mb-3">
                                                <div className="text-muted">ID</div>
                                                <div>{detail.id}</div>
                                            </div>
                                            <div className="col-lg-4 mb-3">
                                                <div className="text-muted">Time</div>
                                                <div>{formatTs(detail.created_at)}</div>
                                            </div>
                                            <div className="col-lg-4 mb-3">
                                                <div className="text-muted">Action</div>
                                                <div>{detail.action}</div>
                                            </div>

                                            <div className="col-lg-6 mb-3">
                                                <div className="text-muted">Model</div>
                                                <div>{detail.model_type}</div>
                                            </div>
                                            <div className="col-lg-6 mb-3">
                                                <div className="text-muted">Model ID</div>
                                                <div>{detail.model_id ?? '-'}</div>
                                            </div>

                                            <div className="col-12 mb-3">
                                                <div className="text-muted">Changed Fields</div>
                                                <div className="table-responsive">
                                                    <table className="table table-sm table-striped">
                                                        <thead>
                                                            <tr>
                                                                <th style={{ width: 260 }}>Field</th>
                                                                <th>Before</th>
                                                                <th>After</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {diffRows.length ? (
                                                                diffRows.map((row) => (
                                                                    <tr key={row.key}>
                                                                        <td>{row.key}</td>
                                                                        <td style={{ whiteSpace: 'pre-wrap' }}>{row.before}</td>
                                                                        <td style={{ whiteSpace: 'pre-wrap' }}>{row.after}</td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={3} className="text-muted">
                                                                        Tidak ada perbedaan field.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline-secondary" onClick={closeDetail}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-backdrop fade show" onClick={closeDetail} />
                </>
            ) : null}
        </>
    );
}

AuditLogsIndex.layout = (page) => <AuthenticatedLayout header="Audit Logs">{page}</AuthenticatedLayout>;

function computeDiffRows(before, after) {
    const rows = [];

    const simpleString = (v) => {
        if (v === null || v === undefined) return '';
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
        try {
            return JSON.stringify(v, null, 2);
        } catch (_e) {
            return String(v);
        }
    };

    const tryParse = (v) => {
        if (v && typeof v === 'string') {
            try {
                return JSON.parse(v);
            } catch (_e) {
                return v;
            }
        }
        return v;
    };

    const shouldIgnoreKey = (k) => {
        const s = String(k ?? '').toLowerCase();
        return s.includes('attachment') || s.includes('file') || s.includes('photo') || s.includes('avatar');
    };

    const push = (key, b, a) => {
        if (shouldIgnoreKey(key)) return;
        const sb = simpleString(b);
        const sa = simpleString(a);
        if (sb === sa) return;
        rows.push({ key, before: sb, after: sa });
    };

    const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

    let b0 = tryParse(before);
    let a0 = tryParse(after);

    if (!isObj(b0) && isObj(a0)) b0 = {};
    if (isObj(b0) && !isObj(a0)) a0 = {};

    if (isObj(b0) && isObj(a0)) {
        const keys = Array.from(new Set([...Object.keys(b0), ...Object.keys(a0)]));
        for (const k of keys) {
            if (shouldIgnoreKey(k)) continue;
            const b = b0[k];
            const a = a0[k];
            if (k === 'pic_assignments' && (Array.isArray(b) || Array.isArray(a))) {
                const byId = new Map();
                (Array.isArray(b) ? b : []).forEach((it) => byId.set(String(it?.id ?? `b-${rows.length}`), { side: 'b', v: it }));
                const seen = new Set();
                (Array.isArray(a) ? a : []).forEach((it) => {
                    const id = String(it?.id ?? `a-${rows.length}`);
                    const pair = byId.get(id);
                    if (pair) {
                        // compare selected fields
                        const fields = ['pic_user_id', 'pic_name', 'pic_email', 'start_date', 'end_date'];
                        fields.forEach((f) => push(`pic_assignments[id=${id}].${f}`, pair.v?.[f], it?.[f]));
                        seen.add(id);
                    } else {
                        push(`pic_assignments[added id=${id}]`, null, it);
                    }
                });
                (Array.isArray(b) ? b : []).forEach((it) => {
                    const id = String(it?.id ?? `b-${rows.length}`);
                    if (!seen.has(id)) push(`pic_assignments[removed id=${id}]`, it, null);
                });
                continue;
            }

            if (isObj(b) && isObj(a)) {
                // shallow compare object
                const inner = Array.from(new Set([...Object.keys(b), ...Object.keys(a)]));
                inner.forEach((kk) => push(`${k}.${kk}`, b[kk], a[kk]));
            } else {
                push(k, b, a);
            }
        }
    } else {
        push('value', b0, a0);
    }

    return rows;
}

function displayDateValue(value) {
    if (!value) return '';
    const text = String(value).trim();
    if (!text) return '';
    const m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return text;

    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    const d = new Date(Date.UTC(year, month - 1, day));
    if (Number.isNaN(d.getTime())) return text;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mmm = months[d.getUTCMonth()] ?? '';
    const yy = String(d.getUTCFullYear()).slice(-2);
    return `${dd} ${mmm} ${yy}`;
}
