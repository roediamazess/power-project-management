import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { useMemo, useState } from 'react';
import { parseDateDdMmmYyToIso } from '@/utils/date';

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
    const [module, setModule] = useState(filters?.module ?? 'all');
    const [action, setAction] = useState(filters?.action ?? 'all');
    const [q, setQ] = useState(filters?.q ?? '');
    const [dateFrom, setDateFrom] = useState(filters?.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters?.date_to ?? '');

    const [showModal, setShowModal] = useState(false);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const hrefParams = useMemo(() => {
        const params = {};
        if (module && module !== 'all') params.module = module;
        if (action && action !== 'all') params.action = action;
        if (q && q.trim()) params.q = q.trim();

        const fromIso = parseDateDdMmmYyToIso(dateFrom);
        const toIso = parseDateDdMmmYyToIso(dateTo);
        if (fromIso) params.date_from = fromIso;
        if (toIso) params.date_to = toIso;

        return params;
    }, [action, dateFrom, dateTo, module, q]);

    const resetHref = route('tables.audit-logs.index');
    const applyHref = route('tables.audit-logs.index', hrefParams);

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
            const res = await axios.get(route('tables.audit-logs.show', { auditLog: row.id }));
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
                            <div className="d-flex flex-wrap gap-2">
                                <Link href={applyHref} className="btn btn-primary">
                                    Apply
                                </Link>
                                <Link href={resetHref} className="btn btn-outline-secondary">
                                    Reset
                                </Link>
                            </div>
                        </div>

                        <div className="card-body">
                            <div className="row mb-3">
                                <div className="col-lg-3 mb-2">
                                    <label className="text-black font-w600 form-label">Module</label>
                                    <select className="form-select" value={module} onChange={(e) => setModule(e.target.value)}>
                                        {(modules ?? []).map((m) => (
                                            <option key={m.key} value={m.key}>
                                                {m.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-lg-3 mb-2">
                                    <label className="text-black font-w600 form-label">Action</label>
                                    <select className="form-select" value={action} onChange={(e) => setAction(e.target.value)}>
                                        {(actions ?? []).map((a) => (
                                            <option key={a.key} value={a.key}>
                                                {a.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-lg-3 mb-2">
                                    <label className="text-black font-w600 form-label">Date From</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="dd Mmm yy"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                </div>

                                <div className="col-lg-3 mb-2">
                                    <label className="text-black font-w600 form-label">Date To</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="dd Mmm yy"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>

                                <div className="col-12 mt-2">
                                    <label className="text-black font-w600 form-label">Search</label>
                                    <input type="text" className="form-control" value={q} onChange={(e) => setQ(e.target.value)} placeholder="model id, setup category, url, json..." />
                                    <small className="text-muted">Search ini memfilter via server saat klik Apply. Search di header sidebar tetap memfilter tabel yang sedang tampil.</small>
                                </div>
                            </div>

                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div className="text-muted">
                                    Showing {logs?.from ?? 0}-{logs?.to ?? 0} of {logs?.total ?? 0}
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
                                            <th style={{ width: 160 }}>Time</th>
                                            <th style={{ width: 120 }}>Module</th>
                                            <th style={{ width: 110 }}>Action</th>
                                            <th style={{ minWidth: 160 }}>Model</th>
                                            <th style={{ minWidth: 220 }}>Model ID</th>
                                            <th style={{ minWidth: 200 }}>Actor</th>
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
                                                <div className="text-muted">Meta</div>
                                                <pre className="bg-light p-3" style={{ maxHeight: 220, overflow: 'auto' }}>
                                                    {jsonPretty(detail.meta)}
                                                </pre>
                                            </div>

                                            <div className="col-lg-6 mb-3">
                                                <div className="text-muted">Before</div>
                                                <pre className="bg-light p-3" style={{ maxHeight: 360, overflow: 'auto' }}>
                                                    {jsonPretty(detail.before)}
                                                </pre>
                                            </div>

                                            <div className="col-lg-6 mb-3">
                                                <div className="text-muted">After</div>
                                                <pre className="bg-light p-3" style={{ maxHeight: 360, overflow: 'auto' }}>
                                                    {jsonPretty(detail.after)}
                                                </pre>
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
