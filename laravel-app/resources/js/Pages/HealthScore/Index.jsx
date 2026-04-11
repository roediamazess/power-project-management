import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const pickLabel = (p) => {
    if (!p) return '';
    if (p.cnc_id) return `${p.cnc_id} - ${p.name}`;
    return p.name ?? String(p.id);
};

const pickProjectLabel = (p) => {
    if (!p) return '';
    if (p.cnc_id) return `${p.cnc_id} - ${p.project_name}`;
    return p.project_name ?? String(p.id);
};

export default function HealthScoreIndex({ partners, projects, years, quarters, surveys }) {
    const nowYear = new Date().getFullYear();
    const nowQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

    const [partnerId, setPartnerId] = useState('');
    const [projectId, setProjectId] = useState('');
    const [year, setYear] = useState(String(years?.includes(nowYear) ? nowYear : (years?.[0] ?? nowYear)));
    const [quarter, setQuarter] = useState(String(quarters?.includes(nowQuarter) ? nowQuarter : (quarters?.[0] ?? 1)));
    const [createError, setCreateError] = useState('');
    const [creating, setCreating] = useState(false);

    const createSurvey = () => {
        setCreateError('');
        setCreating(true);
        router.get('/health-score/create', {
            partner_id: partnerId ? Number(partnerId) : null,
            project_id: projectId ? String(projectId) : null,
            year: Number(year),
            quarter: Number(quarter),
        }, {
            preserveScroll: true,
            onError: (errors) => {
                const msg = Object.values(errors ?? {}).filter(Boolean).join('\n');
                setCreateError(msg || 'Gagal membuat survey. Cek field mandatory atau refresh halaman.');
            },
            onFinish: () => setCreating(false),
        });
    };

    const partnerById = useMemo(() => {
        const m = new Map();
        for (const p of (partners ?? [])) m.set(p.id, p);
        return m;
    }, [partners]);

    const projectById = useMemo(() => {
        const m = new Map();
        for (const p of (projects ?? [])) m.set(p.id, p);
        return m;
    }, [projects]);

    return (
        <>
            <Head title="Health Score" />

            <div className="row align-items-center mb-3">
                <div className="col-lg-8">
                    <h3 className="mb-1">Health Score</h3>
                    <div className="text-muted">Create survey lalu gunakan link untuk mengisi (Draft → Submit).</div>
                </div>
            </div>

            <div className="card mb-3">
                <div className="card-header">
                    <h4 className="card-title mb-0">Create</h4>
                </div>
                <div className="card-body">
                    {createError ? <div className="alert alert-warning">{createError}</div> : null}
                    <div className="row g-3 align-items-end">
                        <div className="col-xl-4 col-md-6">
                            <label className="form-label required">Partner Name</label>
                            <select className="form-control" value={partnerId} onChange={(e) => setPartnerId(e.target.value)} disabled={creating}>
                                <option value="">-- Select Partner --</option>
                                {(partners ?? []).map((p) => (
                                    <option key={`partner||${p.id}`} value={String(p.id)}>
                                        {pickLabel(p)}{p.status && p.status !== 'Active' ? ` (${p.status})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-xl-4 col-md-6">
                            <label className="form-label">Project Name</label>
                            <select className="form-control" value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={creating}>
                                <option value="">-- Optional --</option>
                                {(projects ?? []).map((p) => (
                                    <option key={`project||${p.id}`} value={String(p.id)}>
                                        {pickProjectLabel(p)}{p.status && p.status !== 'Active' ? ` (${p.status})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-xl-2 col-md-6">
                            <label className="form-label required">Year</label>
                            <select className="form-control" value={year} onChange={(e) => setYear(e.target.value)} disabled={creating}>
                                {(years ?? []).map((y) => (
                                    <option key={`year||${y}`} value={String(y)}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-xl-2 col-md-6">
                            <label className="form-label required">Quarter</label>
                            <select className="form-control" value={quarter} onChange={(e) => setQuarter(e.target.value)} disabled={creating}>
                                {(quarters ?? []).map((q) => (
                                    <option key={`q||${q}`} value={String(q)}>Q{q}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="d-flex flex-wrap gap-2 mt-3">
                        <button type="button" className="btn btn-primary" onClick={createSurvey} disabled={creating || !partnerId}>
                            Create
                        </button>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h4 className="card-title mb-0">Recent Surveys</h4>
                </div>
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-striped table-responsive-md">
                            <thead>
                                <tr>
                                    <th style={{ width: 140 }}>Period</th>
                                    <th>Partner</th>
                                    <th>Project</th>
                                    <th style={{ width: 120 }}>Status</th>
                                    <th style={{ width: 120 }} className="text-end">Score</th>
                                    <th style={{ width: 120 }} />
                                </tr>
                            </thead>
                            <tbody>
                                {(surveys ?? []).length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center text-muted">No data</td>
                                    </tr>
                                ) : null}
                                {(surveys ?? []).map((s) => {
                                    const partner = partnerById.get(s.partner_id);
                                    const project = s.project_id ? projectById.get(s.project_id) : null;
                                    return (
                                        <tr key={s.id}>
                                            <td className="fw-semibold">{s.year} Q{s.quarter}</td>
                                            <td>{partner ? pickLabel(partner) : '-'}</td>
                                            <td>{project ? pickProjectLabel(project) : '-'}</td>
                                            <td>
                                                <span className={`badge ${s.status === 'Submitted' ? 'badge-success' : 'badge-warning'}`}>{s.status}</span>
                                            </td>
                                            <td className="text-end">{s.score_total != null ? s.score_total : '-'}</td>
                                            <td className="text-end">
                                                <Link className="btn btn-sm btn-outline-primary" href={route('health-score.show', { survey: s.id }, false)}>
                                                    Open
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

HealthScoreIndex.layout = (page) => <AuthenticatedLayout header="Health Score">{page}</AuthenticatedLayout>;
