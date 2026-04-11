import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DatePickerInput from '@/Components/DatePickerInput';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { formatDateDdMmmYy, parseDateDdMmmYyToIso } from '@/utils/date';

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

export default function DashboardHealthScore({ template, partners, projects, filters, years, quarters, survey, answersByQuestion }) {
    const [partnerId, setPartnerId] = useState(filters?.partner_id ?? '');
    const [projectId, setProjectId] = useState(filters?.project_id ?? '');
    const [year, setYear] = useState(filters?.year ?? new Date().getFullYear());
    const [quarter, setQuarter] = useState(filters?.quarter ?? 1);

    useEffect(() => {
        setPartnerId(filters?.partner_id ?? '');
        setProjectId(filters?.project_id ?? '');
        setYear(filters?.year ?? new Date().getFullYear());
        setQuarter(filters?.quarter ?? 1);
    }, [filters?.partner_id, filters?.project_id, filters?.year, filters?.quarter]);

    const sections = template?.sections ?? [];

    const initialAnswers = useMemo(() => {
        const out = {};
        for (const s of sections) {
            for (const q of (s.questions ?? [])) {
                const a = answersByQuestion?.[q.id] ?? {};
                out[q.id] = {
                    selected_option_id: a.selected_option_id ?? '',
                    value_date: a.value_date ? formatDateDdMmmYy(a.value_date) : '',
                    value_text: a.value_text ?? '',
                    note: a.note ?? '',
                };
            }
        }
        return out;
    }, [sections, answersByQuestion]);

    const { data, setData, post, processing } = useForm({
        partner_id: partnerId,
        project_id: projectId,
        year,
        quarter,
        answers: initialAnswers,
    });

    useEffect(() => {
        setData('partner_id', partnerId);
        setData('project_id', projectId);
        setData('year', year);
        setData('quarter', quarter);
    }, [partnerId, projectId, year, quarter]);

    useEffect(() => {
        setData('answers', initialAnswers);
    }, [initialAnswers]);

    const isSubmitted = survey?.status === 'Submitted';

    const applyFilters = (next) => {
        router.get(route('dashboard.health-score', {}, false), next, { preserveState: false, preserveScroll: true });
    };

    const buildPayload = () => {
        const payloadAnswers = {};
        for (const s of sections) {
            for (const q of (s.questions ?? [])) {
                const a = data.answers?.[q.id] ?? {};
                payloadAnswers[q.id] = {
                    selected_option_id: a.selected_option_id || null,
                    value_date: a.value_date ? parseDateDdMmmYyToIso(a.value_date) : null,
                    value_text: a.value_text || null,
                    note: a.note || null,
                };
            }
        }
        return {
            partner_id: data.partner_id ? Number(data.partner_id) : null,
            project_id: data.project_id ? Number(data.project_id) : null,
            year: Number(data.year),
            quarter: Number(data.quarter),
            answers: payloadAnswers,
        };
    };

    const saveDraft = () => {
        post(route('dashboard.health-score.store', {}, false), {
            preserveScroll: true,
            data: buildPayload(),
        });
    };

    const submit = () => {
        post(route('dashboard.health-score.submit', {}, false), {
            preserveScroll: true,
            data: buildPayload(),
        });
    };

    return (
        <>
            <Head title="Health Score" />

            <div className="row align-items-center mb-3">
                <div className="col-lg-8">
                    <h3 className="mb-1">Health Score</h3>
                    <div className="text-muted">
                        {template?.name} (v{template?.version})
                    </div>
                </div>
                <div className="col-lg-4 text-lg-end mt-2 mt-lg-0">
                    {survey?.status ? (
                        <span className={`badge ${isSubmitted ? 'badge-success' : 'badge-warning'} me-2`}>
                            {survey.status}
                        </span>
                    ) : null}
                    {survey?.score_total != null ? (
                        <span className="badge badge-primary">
                            Score: {survey.score_total}
                        </span>
                    ) : null}
                </div>
            </div>

            <div className="card mb-3">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        <div className="col-xl-4 col-md-6">
                            <label className="form-label required">Partner Name</label>
                            <select
                                className="form-control"
                                value={String(partnerId ?? '')}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setPartnerId(v ? Number(v) : '');
                                    applyFilters({ partner_id: v || undefined, project_id: projectId || undefined, year, quarter });
                                }}
                                disabled={processing}
                            >
                                <option value="">-- Select Partner --</option>
                                {(partners ?? []).map((p) => (
                                    <option key={`partner||${p.id}`} value={String(p.id)}>
                                        {pickLabel(p)}{p.status && p.status !== 'Active' ? ` (${p.status})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-xl-4 col-md-6">
                            <label className="form-label required">Project Name</label>
                            <select
                                className="form-control"
                                value={String(projectId ?? '')}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setProjectId(v ? Number(v) : '');
                                    applyFilters({ partner_id: partnerId || undefined, project_id: v || undefined, year, quarter });
                                }}
                                disabled={processing}
                            >
                                <option value="">-- Select Project --</option>
                                {(projects ?? []).map((p) => (
                                    <option key={`project||${p.id}`} value={String(p.id)}>
                                        {pickProjectLabel(p)}{p.status && p.status !== 'Active' ? ` (${p.status})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-xl-2 col-md-6">
                            <label className="form-label required">Year</label>
                            <select
                                className="form-control"
                                value={String(year)}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    setYear(v);
                                    applyFilters({ partner_id: partnerId || undefined, project_id: projectId || undefined, year: v, quarter });
                                }}
                                disabled={processing}
                            >
                                {(years ?? []).map((y) => (
                                    <option key={`year||${y}`} value={String(y)}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-xl-2 col-md-6">
                            <label className="form-label required">Quarter</label>
                            <select
                                className="form-control"
                                value={String(quarter)}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    setQuarter(v);
                                    applyFilters({ partner_id: partnerId || undefined, project_id: projectId || undefined, year, quarter: v });
                                }}
                                disabled={processing}
                            >
                                {(quarters ?? []).map((q) => (
                                    <option key={`q||${q}`} value={String(q)}>Q{q}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="d-flex flex-wrap gap-2 mt-3">
                        <button type="button" className="btn btn-outline-primary" onClick={saveDraft} disabled={processing || isSubmitted || !partnerId || !projectId}>
                            Save Draft
                        </button>
                        <button type="button" className="btn btn-primary" onClick={submit} disabled={processing || isSubmitted || !partnerId || !projectId}>
                            Submit
                        </button>
                        {isSubmitted ? <div className="text-muted d-flex align-items-center ms-2">Survey terkunci setelah submit.</div> : null}
                    </div>
                </div>
            </div>

            {(sections ?? []).map((section) => (
                <div className="card mb-3" key={section.id}>
                    <div className="card-header">
                        <h4 className="card-title mb-0">{section.name}</h4>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-striped table-responsive-md">
                                <thead>
                                    <tr>
                                        <th style={{ width: '34%' }}>Parameter</th>
                                        <th style={{ width: '20%' }}>Status</th>
                                        <th style={{ width: '20%' }}>Note</th>
                                        <th>Note Instruction</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(section.questions ?? []).map((q) => {
                                        const a = data.answers?.[q.id] ?? {};
                                        return (
                                            <tr key={q.id}>
                                                <td className="fw-semibold">
                                                    {q.question_text}
                                                </td>
                                                <td>
                                                    {q.answer_type === 'single_select' ? (
                                                        <select
                                                            className="form-control"
                                                            value={String(a.selected_option_id ?? '')}
                                                            onChange={(e) => setData('answers', { ...data.answers, [q.id]: { ...a, selected_option_id: e.target.value } })}
                                                            disabled={processing || isSubmitted}
                                                        >
                                                            <option value="">-- Select --</option>
                                                            {(q.options ?? []).map((o) => (
                                                                <option key={`opt||${o.id}`} value={String(o.id)}>{o.label}</option>
                                                            ))}
                                                        </select>
                                                    ) : null}

                                                    {q.answer_type === 'date' ? (
                                                        <DatePickerInput
                                                            value={a.value_date ?? ''}
                                                            onChange={(v) => setData('answers', { ...data.answers, [q.id]: { ...a, value_date: v } })}
                                                            className="form-control"
                                                            disabled={processing || isSubmitted}
                                                        />
                                                    ) : null}
                                                </td>
                                                <td>
                                                    <textarea
                                                        className="form-control"
                                                        rows={2}
                                                        value={a.note ?? ''}
                                                        onChange={(e) => setData('answers', { ...data.answers, [q.id]: { ...a, note: e.target.value } })}
                                                        disabled={processing || isSubmitted}
                                                    />
                                                </td>
                                                <td>
                                                    {q.note_instruction ? (
                                                        <div className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                                                            {q.note_instruction}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}

DashboardHealthScore.layout = (page) => <AuthenticatedLayout header="Health Score">{page}</AuthenticatedLayout>;
