import DatePickerInput from '@/Components/DatePickerInput';
import PublicSurveyLayout from '@/Layouts/PublicSurveyLayout';
import { Head, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { formatDateDdMmmYy, parseDateDdMmmYyToIso } from '@/utils/date';

const pickLabel = (p) => {
    if (!p) return '-';
    if (p.cnc_id) return `${p.cnc_id} - ${p.name}`;
    return p.name ?? String(p.id);
};

const pickProjectLabel = (p) => {
    if (!p) return '-';
    if (p.cnc_id) return `${p.cnc_id} - ${p.project_name}`;
    return p.project_name ?? String(p.id);
};

const toIsoDate = (v) => {
    const iso = parseDateDdMmmYyToIso(v);
    if (iso && /^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return String(iso);
    return null;
};

const daysDiff = (isoA, isoB) => {
    if (!isoA || !isoB) return null;
    const [y1, m1, d1] = String(isoA).split('-').map((x) => Number(x));
    const [y2, m2, d2] = String(isoB).split('-').map((x) => Number(x));
    if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return null;
    const t1 = Date.UTC(y1, m1 - 1, d1);
    const t2 = Date.UTC(y2, m2 - 1, d2);
    return Math.floor((t1 - t2) / 86400000);
};

const scoreDate = (valueIso, anchorIso) => {
    const diff = daysDiff(anchorIso, valueIso);
    if (diff == null) return null;
    const daysAgo = Math.max(0, diff);
    if (daysAgo <= 30) return 5;
    if (daysAgo <= 60) return 4;
    if (daysAgo <= 90) return 3;
    if (daysAgo <= 120) return 2;
    if (daysAgo <= 180) return 2;
    return 1;
};

const stars = (score) => {
    const s = Number(score);
    if (!Number.isFinite(s) || s < 0) return <span className="text-muted">-</span>;
    const rounded = Math.max(0, Math.min(5, Math.round(s * 2) / 2));
    const pct = (rounded / 5) * 100;
    return (
        <span style={{ position: 'relative', display: 'inline-block', lineHeight: 1, letterSpacing: 1 }}>
            <span style={{ color: '#D1D5DB' }}>☆☆☆☆☆</span>
            <span style={{ position: 'absolute', left: 0, top: 0, overflow: 'hidden', width: `${pct}%`, whiteSpace: 'nowrap', color: '#FBBF24' }}>
                ★★★★★
            </span>
        </span>
    );
};

const ratingFromPercent = (pct) => {
    const n = Number(pct);
    if (!Number.isFinite(n)) return null;
    if (n <= 0) return 0;
    return Math.max(1, Math.min(5, n / 20));
};

const fmt1 = (n) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return '-';
    return v.toFixed(1);
};

const deltaBadgeClass = (d) => {
    const v = Number(d);
    if (!Number.isFinite(v) || v === 0) return 'badge badge-light';
    return v > 0 ? 'badge badge-success' : 'badge badge-danger';
};

const fmtDelta = (d) => {
    const v = Number(d);
    if (!Number.isFinite(v) || v === 0) return null;
    return `${v > 0 ? '+' : ''}${v.toFixed(1)}`;
};

const healthLabel = (rating) => {
    const r = Number(rating);
    if (!Number.isFinite(r)) return { label: '-', className: 'badge badge-light' };
    if (r >= 4.5) return { label: 'Sistem Sehat (Excellent)', className: 'badge badge-success' };
    if (r >= 4.0) return { label: 'Sistem Sehat (Sangat Baik)', className: 'badge badge-success' };
    if (r >= 3.5) return { label: 'Cukup Sehat', className: 'badge badge-warning' };
    if (r >= 3.0) return { label: 'Perlu Perhatian', className: 'badge badge-warning' };
    return { label: 'Kritis', className: 'badge badge-danger' };
};

const categoryLabel = (value) => {
    const raw = String(value ?? '').trim();
    const base = raw.replace(/\s*Key\s*Check\s*$/i, '').trim();
    if (!base) return raw || '-';
    if (/^power\s*fo$/i.test(base) || /^powerfo$/i.test(base)) return 'Front Office';
    return base;
};

const categorySortIndex = (label) => {
    const l = String(label ?? '').toLowerCase();
    const order = [
        'database',
        'front office',
        'account receivable',
        'inventory control',
        'account payable',
        'general ledger',
    ];
    const idx = order.indexOf(l);
    return idx >= 0 ? idx : 999;
};

const normalizeLegacyModuleScoreMap = (scoreByCategory) => {
    const out = {};
    const sc = scoreByCategory && typeof scoreByCategory === 'object' ? scoreByCategory : {};
    for (const k of Object.keys(sc ?? {})) {
        const label = categoryLabel(k);
        out[label] = sc[k];
    }
    return out;
};

const orderItemsFromScores = (preferredOrder, scoreMap) => {
    const sc = scoreMap && typeof scoreMap === 'object' ? scoreMap : {};
    const fromData = Object.keys(sc ?? {});
    const preferred = Array.isArray(preferredOrder) ? preferredOrder : [];
    const order = preferred.concat(fromData.filter((k) => !preferred.includes(k)));
    return order.map((k) => ({ key: k, label: k }));
};

export default function HealthScorePublicShow({ template, survey, answersByQuestion, token, history }) {
    const sections = template?.sections ?? [];
    const isSubmitted = survey?.status === 'Submitted';
    const overallRating = useMemo(() => ratingFromPercent(survey?.score_total), [survey?.score_total]);
    const overallHealth = useMemo(() => healthLabel(overallRating), [overallRating]);
    const currentQuarter = Number.isFinite(Number(survey?.quarter)) ? Number(survey?.quarter) : null;
    const quarterHeaderLabel = (q) => `Q${q}${currentQuarter === q ? ' (Saat Ini)' : ''}`;
    const scopeScores = survey?.score_by_scope ?? null;
    const moduleScores = survey?.score_by_module ?? normalizeLegacyModuleScoreMap(survey?.score_by_category);
    const hasScopeData = scopeScores && Object.keys(scopeScores ?? {}).length > 0;
    const [scoreDimension, setScoreDimension] = useState(() => (hasScopeData ? 'scope' : 'module'));
    const scoreScopeOrder = ['Financial Integrity', 'Operational Continuity', 'Technical Resilience'];
    const scoreModuleOrder = ['Database', 'Front Office', 'Account Receivable', 'Inventory Control', 'Account Payable', 'General Ledger'];
    const scopeItems = useMemo(() => orderItemsFromScores(scoreScopeOrder, scopeScores ?? {}), [survey?.id, survey?.score_by_scope]);
    const moduleItems = useMemo(() => {
        const items = orderItemsFromScores(scoreModuleOrder, moduleScores ?? {});
        return items.sort((a, b) => categorySortIndex(a.label) - categorySortIndex(b.label));
    }, [survey?.id, survey?.score_by_module, survey?.score_by_category]);
    const dimensionScores = scoreDimension === 'scope' ? (scopeScores ?? {}) : (moduleScores ?? {});
    const dimensionItems = scoreDimension === 'scope' ? scopeItems : moduleItems;
    const historyRatings = useMemo(() => {
        return (history ?? []).slice(0, 4).map((h) => {
            const r = ratingFromPercent(h?.score_total);
            return r == null ? null : Number(r.toFixed(1));
        });
    }, [history]);

    const historyScopeRatings = useMemo(() => {
        const out = [];
        for (const h of (history ?? []).slice(0, 4)) {
            const m = {};
            const sc = h?.score_by_scope ?? {};
            for (const k of Object.keys(sc ?? {})) {
                const r = ratingFromPercent(sc?.[k]);
                m[k] = r == null ? null : Number(r.toFixed(1));
            }
            out.push({ quarter: h?.quarter, byKey: m });
        }
        return out;
    }, [history]);

    const historyModuleRatings = useMemo(() => {
        const out = [];
        for (const h of (history ?? []).slice(0, 4)) {
            const m = {};
            const sc = h?.score_by_module ?? normalizeLegacyModuleScoreMap(h?.score_by_category);
            for (const k of Object.keys(sc ?? {})) {
                const r = ratingFromPercent(sc?.[k]);
                m[k] = r == null ? null : Number(r.toFixed(1));
            }
            out.push({ quarter: h?.quarter, byKey: m });
        }
        return out;
    }, [history]);

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

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        answers: initialAnswers,
    });

    useEffect(() => {
        setData('answers', initialAnswers);
        clearErrors();
    }, [initialAnswers]);

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
        return { answers: payloadAnswers };
    };

    const submit = () => {
        post(`/health-score/s/${token}/submit`, { preserveScroll: true, data: buildPayload() });
    };

    const errorList = useMemo(() => {
        return Object.values(errors ?? {}).filter(Boolean);
    }, [errors]);

    const questionTextById = useMemo(() => {
        const m = {};
        for (const s of sections) {
            for (const q of (s.questions ?? [])) {
                m[q.id] = q.question_text;
            }
        }
        return m;
    }, [sections]);

    const missingItems = useMemo(() => {
        const ids = new Set();
        for (const k of Object.keys(errors ?? {})) {
            const m = String(k).match(/^answers\.([^.\s]+)\./);
            if (m?.[1]) ids.add(m[1]);
        }
        return Array.from(ids)
            .map((id) => questionTextById[id] ?? id)
            .filter(Boolean);
    }, [errors, questionTextById]);

    useEffect(() => {
        if (!isSubmitted) return;
        const ApexCharts = window?.ApexCharts;
        if (!ApexCharts) return;

        const charts = [];
        const create = (selector, chartOptions) => {
            const el = document.querySelector(selector);
            if (!el) return;
            el.innerHTML = '';
            const c = new ApexCharts(el, chartOptions);
            c.render();
            charts.push(c);
        };

        const qCats = ['Q1', 'Q2', 'Q3', 'Q4'];
        const qRatings = (history ?? []).slice(0, 4).map((h) => {
            const r = ratingFromPercent(h?.score_total);
            return r == null ? null : Number(r.toFixed(1));
        });

        const overallPct = Number(survey?.score_total ?? 0);
        const overallRatingLocal = ratingFromPercent(overallPct) ?? 0;
        const overallGaugePct = (overallRatingLocal / 5) * 100;

        const dimKeys = dimensionItems.map((c) => c.key);
        const dimLabels = dimensionItems.map((c) => c.label);

        const dimRatings = dimKeys.map((k) => {
            const r = ratingFromPercent(dimensionScores?.[k]);
            return r == null ? 0 : Number(r.toFixed(1));
        });

        const dimSeriesByQuarter = {};
        for (const h of (history ?? [])) {
            const q = h?.quarter;
            const sc = scoreDimension === 'scope'
                ? (h?.score_by_scope ?? {})
                : (h?.score_by_module ?? normalizeLegacyModuleScoreMap(h?.score_by_category));
            for (const k of Object.keys(sc ?? {})) {
                if (!dimSeriesByQuarter[k]) dimSeriesByQuarter[k] = [null, null, null, null];
                const r = ratingFromPercent(sc?.[k]);
                dimSeriesByQuarter[k][(Number(q) || 1) - 1] = r == null ? null : Number(r.toFixed(1));
            }
        }

        const baselineQuarterIdx = qRatings.findIndex((v) => v != null);
        const baselineKey = baselineQuarterIdx >= 0 ? baselineQuarterIdx : 0;
        const radarCats = dimLabels;
        const radarNow = dimKeys.map((k) => dimSeriesByQuarter[k]?.[(Number(survey?.quarter) || 1) - 1] ?? null);
        const radarBase = dimKeys.map((k) => dimSeriesByQuarter[k]?.[baselineKey] ?? null);

        create('#hs-overall', {
            series: [Number.isFinite(overallGaugePct) ? overallGaugePct : 0],
            chart: { type: 'radialBar', height: 260, toolbar: { show: false } },
            labels: ['Overall'],
            plotOptions: {
                radialBar: {
                    hollow: { size: '60%' },
                    dataLabels: {
                        name: { offsetY: -8 },
                        value: { formatter: () => `${overallRatingLocal.toFixed(1)}/5` },
                    },
                },
            },
            colors: [overallRatingLocal >= 4 ? '#22C55E' : overallRatingLocal >= 3.5 ? '#F59E0B' : '#EF4444'],
        });

        create('#hs-category', {
            series: [{ name: 'Skor (1-5)', data: dimRatings }],
            chart: { type: 'bar', height: Math.max(240, dimLabels.length * 34), toolbar: { show: false } },
            plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '60%' } },
            xaxis: {
                categories: dimLabels,
                min: 1,
                max: 5,
                tickAmount: 5,
                labels: { formatter: (v) => String(Math.round(Number(v))) },
            },
            dataLabels: { enabled: true, formatter: (v) => Number(v).toFixed(1) },
            grid: { borderColor: 'var(--border)' },
            colors: ['#6366F1'],
        });

        create('#hs-quarter', {
            series: [{ name: 'Overall (1-5)', data: qRatings }],
            chart: { type: 'line', height: 260, toolbar: { show: false } },
            stroke: { width: 3, curve: 'smooth' },
            xaxis: { categories: qCats },
            yaxis: { min: 1, max: 5, tickAmount: 4 },
            markers: { size: 5 },
            grid: { borderColor: 'var(--border)' },
            colors: ['#0EA5E9'],
        });

        create('#hs-radar', {
            series: [
                { name: `Skor Akhir (Q${survey?.quarter ?? '-'})`, data: radarNow },
                { name: `Skor Awal (Q${baselineKey + 1})`, data: radarBase },
            ],
            chart: { type: 'radar', height: 340, toolbar: { show: false } },
            xaxis: { categories: radarCats },
            yaxis: { min: 1, max: 5, tickAmount: 4 },
            stroke: { width: 2 },
            fill: { opacity: 0.15 },
            markers: { size: 3 },
            colors: ['#0EA5E9', '#94A3B8'],
        });

        create('#hs-bars', {
            series: dimensionItems.map(({ key, label }) => ({
                name: label,
                data: dimSeriesByQuarter[key] ?? [null, null, null, null],
            })),
            chart: { type: 'bar', height: 360, toolbar: { show: false } },
            plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } },
            xaxis: { categories: qCats },
            yaxis: { min: 1, max: 5, tickAmount: 4 },
            dataLabels: { enabled: false },
            legend: { position: 'bottom' },
            grid: { borderColor: 'var(--border)' },
        });

        return () => {
            for (const c of charts) {
                try {
                    c.destroy();
                } catch (_e) {}
            }
        };
    }, [isSubmitted, survey?.score_total, survey?.score_by_scope, survey?.score_by_module, survey?.score_by_category, history, scoreDimension, scopeItems, moduleItems]);

    return (
        <>
            <Head title="Health Score Survey" />

            <div className="row align-items-center mb-3">
                <div className="col-lg-8">
                    <h3 className="mb-1">Health Score Survey</h3>
                    <div className="text-muted">{template?.name} (v{template?.version})</div>
                </div>
                <div className="col-lg-4 text-lg-end mt-2 mt-lg-0">
                    {survey?.status ? (
                        <span className={`badge ${isSubmitted ? 'badge-success' : 'badge-warning'} me-2`}>{survey.status}</span>
                    ) : null}
                    {overallRating != null ? <span className="badge badge-primary">{fmt1(overallRating)}/5 {stars(overallRating)}</span> : null}
                </div>
            </div>

            <div className="card mb-3">
                <div className="card-body">
                    {errorList.length ? (
                        <div className="alert alert-warning" style={{ whiteSpace: 'pre-wrap' }}>
                            {errorList.join('\n')}
                            {missingItems.length ? `\n\nBelum diisi:\n- ${missingItems.join('\n- ')}` : ''}
                        </div>
                    ) : null}

                    <div className="row g-3">
                        <div className="col-xl-4 col-md-6">
                            <label className="form-label">Partner</label>
                            <div className="form-control bg-light">{pickLabel(survey.partner)}</div>
                        </div>
                        <div className="col-xl-4 col-md-6">
                            <label className="form-label">Project</label>
                            <div className="form-control bg-light">{survey.project ? pickProjectLabel(survey.project) : '-'}</div>
                        </div>
                        <div className="col-xl-2 col-md-6">
                            <label className="form-label">Year</label>
                            <div className="form-control bg-light">{survey.year}</div>
                        </div>
                        <div className="col-xl-2 col-md-6">
                            <label className="form-label">Quarter</label>
                            <div className="form-control bg-light">Q{survey.quarter}</div>
                        </div>
                    </div>
                    {isSubmitted ? <div className="text-muted mt-3">Survey terkunci setelah submit.</div> : null}
                </div>
            </div>

            {isSubmitted ? (
                <>
                    <div className="card mb-3">
                        <div className="card-body d-flex align-items-center justify-content-between flex-wrap gap-2">
                            <div>
                                <h4 className="mb-1">Analisis System Health Score</h4>
                                <div className="text-muted">Evaluasi Komprehensif Metrik Sistem (Skala 1–5 Bintang)</div>
                            </div>
                            <div className={overallHealth.className}>{overallHealth.label}</div>
                        </div>
                    </div>

                    <div className="row g-3 mb-3">
                        {[1, 2, 3, 4].map((q) => {
                            const rRaw = historyRatings[q - 1];
                            const prevRaw = q > 1 ? historyRatings[q - 2] : null;
                            const r = Number.isFinite(Number(rRaw)) ? Number(rRaw) : 0;
                            const prev = Number.isFinite(Number(prevRaw)) ? Number(prevRaw) : 0;
                            const canDelta = r > 0 && prev > 0;
                            const d = canDelta ? Number((r - prev).toFixed(1)) : null;
                            const badge = d != null ? fmtDelta(d) : null;
                            return (
                                <div className="col-xl-3 col-md-6" key={`qcard||${q}`}>
                                    <div className="card h-100">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div className="text-muted">Rata-rata Q{q}</div>
                                                {badge ? <span className={deltaBadgeClass(d)}>{badge}</span> : null}
                                            </div>
                                            <div className="d-flex align-items-end gap-2 mt-1">
                                                <div className="fs-28 fw-bold">{fmt1(r)}</div>
                                                <div className="text-muted mb-1">/5</div>
                                            </div>
                                            <div className="mt-1">{stars(r)}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="row g-3 mb-3">
                        <div className="col-xl-6">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h4 className="card-title mb-0">Overall Q{survey?.quarter ?? '-'} (Skala 1–5)</h4>
                                </div>
                                <div className="card-body">
                                    <div id="hs-overall" />
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-6">
                            <div className="card h-100">
                                <div className="card-header">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                        <h4 className="card-title mb-0">By {scoreDimension === 'scope' ? 'Scope' : 'Module'}</h4>
                                        <div className="btn-group btn-group-sm" role="group" aria-label="Score dimension">
                                            <button
                                                type="button"
                                                className={`btn ${scoreDimension === 'scope' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => setScoreDimension('scope')}
                                                disabled={!hasScopeData}
                                            >
                                                Scope
                                            </button>
                                            <button
                                                type="button"
                                                className={`btn ${scoreDimension === 'module' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => setScoreDimension('module')}
                                            >
                                                Module
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div id="hs-category" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-3 mb-3">
                        <div className="col-xl-4">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h4 className="card-title mb-0">Catatan</h4>
                                </div>
                                <div className="card-body">
                                    <div className="text-muted">
                                        Skor dihitung berbasis bobot, hasil akhir ditampilkan dalam skala 1–5 bintang.
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-8">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h4 className="card-title mb-0">Tren Skor Kesehatan Keseluruhan (Overall Health)</h4>
                                </div>
                                <div className="card-body">
                                    <div id="hs-quarter" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-3 mb-3">
                        <div className="col-xl-6">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h4 className="card-title mb-0">Distribusi Indeks (Q{survey?.quarter ?? '-'})</h4>
                                </div>
                                <div className="card-body">
                                    <div id="hs-radar" />
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-6">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h4 className="card-title mb-0">Pertumbuhan Metrik per Kuartal</h4>
                                </div>
                                <div className="card-body">
                                    <div id="hs-bars" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card mb-3">
                        <div className="card-header">
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                <h4 className="card-title mb-0">Matriks Skor Detail (Skala 1.0 - 5.0)</h4>
                                <div className="btn-group btn-group-sm" role="group" aria-label="Score dimension matrix">
                                    <button
                                        type="button"
                                        className={`btn ${scoreDimension === 'scope' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => setScoreDimension('scope')}
                                        disabled={!hasScopeData}
                                    >
                                        Scope
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn ${scoreDimension === 'module' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => setScoreDimension('module')}
                                    >
                                        Module
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-striped table-responsive-md align-middle">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 240 }}>{scoreDimension === 'scope' ? 'Scope' : 'Module'}</th>
                                            <th style={{ width: 190 }}>{quarterHeaderLabel(1)}</th>
                                            <th style={{ width: 190 }}>{quarterHeaderLabel(2)}</th>
                                            <th style={{ width: 190 }}>{quarterHeaderLabel(3)}</th>
                                            <th style={{ width: 190 }}>{quarterHeaderLabel(4)}</th>
                                            <th style={{ width: 120 }}>Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dimensionItems.map(({ key: k, label }) => {
                                            const dimHistory = scoreDimension === 'scope' ? historyScopeRatings : historyModuleRatings;
                                            const q1 = Number.isFinite(Number(dimHistory?.[0]?.byKey?.[k])) ? Number(dimHistory?.[0]?.byKey?.[k]) : 0;
                                            const q2 = Number.isFinite(Number(dimHistory?.[1]?.byKey?.[k])) ? Number(dimHistory?.[1]?.byKey?.[k]) : 0;
                                            const q3 = Number.isFinite(Number(dimHistory?.[2]?.byKey?.[k])) ? Number(dimHistory?.[2]?.byKey?.[k]) : 0;
                                            const q4 = Number.isFinite(Number(dimHistory?.[3]?.byKey?.[k])) ? Number(dimHistory?.[3]?.byKey?.[k]) : 0;
                                            const d2 = q2 > 0 && q1 > 0 ? Number((q2 - q1).toFixed(1)) : null;
                                            const d3 = q3 > 0 && q2 > 0 ? Number((q3 - q2).toFixed(1)) : null;
                                            const d4 = q4 > 0 && q3 > 0 ? Number((q4 - q3).toFixed(1)) : null;
                                            const first = [q1, q2, q3, q4].find((v) => v > 0);
                                            const last = [q4, q3, q2, q1].find((v) => v > 0);
                                            const trendPct = first != null && last != null && first > 0 ? ((last - first) / first) * 100 : null;
                                            return (
                                                <tr key={`matrix||${k}`}>
                                                    <td className="fw-semibold">{label}</td>
                                                    <td>
                                                        <div className="fw-semibold">{fmt1(q1)}</div>
                                                        <div>{stars(q1)}</div>
                                                    </td>
                                                    <td>
                                                        <div className="fw-semibold">{fmt1(q2)} {d2 != null ? <span className={deltaBadgeClass(d2)}>{fmtDelta(d2)}</span> : null}</div>
                                                        <div>{stars(q2)}</div>
                                                    </td>
                                                    <td>
                                                        <div className="fw-semibold">{fmt1(q3)} {d3 != null ? <span className={deltaBadgeClass(d3)}>{fmtDelta(d3)}</span> : null}</div>
                                                        <div>{stars(q3)}</div>
                                                    </td>
                                                    <td>
                                                        <div className="fw-semibold">{fmt1(q4)} {d4 != null ? <span className={deltaBadgeClass(d4)}>{fmtDelta(d4)}</span> : null}</div>
                                                        <div>{stars(q4)}</div>
                                                    </td>
                                                    <td>
                                                        {trendPct != null ? (
                                                            <span className={trendPct >= 0 ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
                                                                {trendPct >= 0 ? '↑' : '↓'} {Math.abs(trendPct).toFixed(1)}%
                                                            </span>
                                                        ) : <span className="text-muted">-</span>}
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
            ) : null}

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
                                        <th style={{ width: '30%' }}>Parameter</th>
                                        <th style={{ width: '18%' }} className="text-center">Status</th>
                                        <th>Note Instruction</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(section.questions ?? []).map((q) => {
                                        const a = data.answers?.[q.id] ?? {};
                                        const errSelect = errors?.[`answers.${q.id}.selected_option_id`];
                                        const errDate = errors?.[`answers.${q.id}.value_date`];
                                        const yesNoLabels = (q.options ?? []).map((o) => String(o?.label ?? '').trim().toUpperCase());
                                        const isYesNoQuestion = q.answer_type === 'single_select' && (q.options ?? []).length === 2 && yesNoLabels.includes('YES') && yesNoLabels.includes('NO');
                                        const yesOptId = isYesNoQuestion ? String((q.options ?? []).find((o) => String(o?.label ?? '').trim().toUpperCase() === 'YES')?.id ?? '') : '';
                                        const noOptId = isYesNoQuestion ? String((q.options ?? []).find((o) => String(o?.label ?? '').trim().toUpperCase() === 'NO')?.id ?? '') : '';
                                        const dsrLabels = (q.options ?? []).map((o) => String(o?.label ?? '').trim().toUpperCase());
                                        const isDsrQuestion = q.answer_type === 'single_select'
                                            && (q.options ?? []).length === 3
                                            && dsrLabels.includes('TODAY, MTD, YTD BALANCE')
                                            && dsrLabels.includes('TODAY, MTD BALANCE')
                                            && dsrLabels.includes('NOT BALANCE');
                                        const dsrOptFullId = isDsrQuestion ? String((q.options ?? []).find((o) => String(o?.label ?? '').trim().toUpperCase() === 'TODAY, MTD, YTD BALANCE')?.id ?? '') : '';
                                        const dsrOptPartialId = isDsrQuestion ? String((q.options ?? []).find((o) => String(o?.label ?? '').trim().toUpperCase() === 'TODAY, MTD BALANCE')?.id ?? '') : '';
                                        const dsrOptNoId = isDsrQuestion ? String((q.options ?? []).find((o) => String(o?.label ?? '').trim().toUpperCase() === 'NOT BALANCE')?.id ?? '') : '';
                                        return (
                                            <tr key={q.id}>
                                                <td className="fw-semibold">
                                                    <div>{q.question_text}</div>
                                                    {q.module ? (
                                                        <div className="mt-1">
                                                            <span className="badge badge-light text-muted" style={{ fontSize: 11, fontWeight: 600 }}>{q.module}</span>
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="text-center align-middle">
                                                    {isYesNoQuestion ? (
                                                        <>
                                                            {(() => {
                                                                const selectedId = String(a.selected_option_id ?? '');
                                                                const selectedYes = Boolean(yesOptId) && selectedId === yesOptId;
                                                                const selectedNo = Boolean(noOptId) && selectedId === noOptId;
                                                                const hasSelection = selectedYes || selectedNo;
                                                                const disabledBase = processing || isSubmitted;
                                                                const clear = () => setData('answers', { ...data.answers, [q.id]: { ...a, selected_option_id: '' } });
                                                                const pickYes = () => setData('answers', { ...data.answers, [q.id]: { ...a, selected_option_id: yesOptId } });
                                                                const pickNo = () => setData('answers', { ...data.answers, [q.id]: { ...a, selected_option_id: noOptId } });

                                                                if (hasSelection) {
                                                                    const isYes = selectedYes;
                                                                    return (
                                                                        <button
                                                                            type="button"
                                                                            className="btn p-0 border-0 bg-transparent"
                                                                            onClick={clear}
                                                                            disabled={disabledBase}
                                                                            aria-label={isYes ? 'YES' : 'NO'}
                                                                            title={isYes ? 'Yes' : 'No'}
                                                                        >
                                                                            <i className={`fas ${isYes ? 'fa-check text-success' : 'fa-times text-danger'} fs-4`} />
                                                                        </button>
                                                                    );
                                                                }

                                                                return (
                                                                    <div className="d-flex align-items-center justify-content-center gap-3">
                                                                        <button
                                                                            type="button"
                                                                            className="btn p-0 border-0 bg-transparent"
                                                                            onClick={pickYes}
                                                                            disabled={disabledBase || !yesOptId}
                                                                            aria-label="YES"
                                                                            title="Yes"
                                                                        >
                                                                            <i className="fas fa-check text-success fs-4" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="btn p-0 border-0 bg-transparent"
                                                                            onClick={pickNo}
                                                                            disabled={disabledBase || !noOptId}
                                                                            aria-label="NO"
                                                                            title="No"
                                                                        >
                                                                            <i className="fas fa-times text-danger fs-4" />
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })()}
                                                            {errSelect ? <div className="invalid-feedback d-block">{errSelect}</div> : null}
                                                        </>
                                                    ) : isDsrQuestion ? (
                                                        <>
                                                            {(() => {
                                                                const selectedId = String(a.selected_option_id ?? '');
                                                                const selectedFull = Boolean(dsrOptFullId) && selectedId === dsrOptFullId;
                                                                const selectedPartial = Boolean(dsrOptPartialId) && selectedId === dsrOptPartialId;
                                                                const selectedNo = Boolean(dsrOptNoId) && selectedId === dsrOptNoId;
                                                                const hasSelection = selectedFull || selectedPartial || selectedNo;
                                                                const disabledBase = processing || isSubmitted;
                                                                const clear = () => setData('answers', { ...data.answers, [q.id]: { ...a, selected_option_id: '' } });
                                                                const pickFull = () => setData('answers', { ...data.answers, [q.id]: { ...a, selected_option_id: dsrOptFullId } });
                                                                const pickPartial = () => setData('answers', { ...data.answers, [q.id]: { ...a, selected_option_id: dsrOptPartialId } });
                                                                const pickNo = () => setData('answers', { ...data.answers, [q.id]: { ...a, selected_option_id: dsrOptNoId } });

                                                                if (hasSelection) {
                                                                    const type = selectedFull ? 'full' : selectedPartial ? 'partial' : 'no';
                                                                    const iconClass = type === 'no' ? 'fa-times' : 'fa-check';
                                                                    const toneClass = type === 'full' ? 'text-success' : type === 'partial' ? 'text-warning' : 'text-danger';
                                                                    const label = type === 'full'
                                                                        ? 'TODAY, MTD, YTD BALANCE'
                                                                        : type === 'partial'
                                                                            ? 'TODAY, MTD BALANCE'
                                                                            : 'NOT BALANCE';
                                                                    return (
                                                                        <button
                                                                            type="button"
                                                                            className={`btn p-0 border-0 bg-transparent d-inline-flex align-items-center gap-2 ${toneClass}`}
                                                                            onClick={clear}
                                                                            disabled={disabledBase}
                                                                            aria-label={label}
                                                                            title={label}
                                                                        >
                                                                            <i className={`fas ${iconClass} fs-5`} />
                                                                            <span className="fw-semibold">{label}</span>
                                                                        </button>
                                                                    );
                                                                }

                                                                return (
                                                                    <div className="d-flex flex-column align-items-center gap-2">
                                                                        <button
                                                                            type="button"
                                                                            className="btn p-0 border-0 bg-transparent d-inline-flex align-items-center gap-2 text-success"
                                                                            onClick={pickFull}
                                                                            disabled={disabledBase || !dsrOptFullId}
                                                                            aria-label="TODAY, MTD, YTD BALANCE"
                                                                            title="TODAY, MTD, YTD BALANCE"
                                                                        >
                                                                            <i className="fas fa-check fs-5" />
                                                                            <span className="fw-semibold">TODAY, MTD, YTD BALANCE</span>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="btn p-0 border-0 bg-transparent d-inline-flex align-items-center gap-2 text-warning"
                                                                            onClick={pickPartial}
                                                                            disabled={disabledBase || !dsrOptPartialId}
                                                                            aria-label="TODAY, MTD BALANCE"
                                                                            title="TODAY, MTD BALANCE"
                                                                        >
                                                                            <i className="fas fa-check fs-5" />
                                                                            <span className="fw-semibold">TODAY, MTD BALANCE</span>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="btn p-0 border-0 bg-transparent d-inline-flex align-items-center gap-2 text-danger"
                                                                            onClick={pickNo}
                                                                            disabled={disabledBase || !dsrOptNoId}
                                                                            aria-label="NOT BALANCE"
                                                                            title="NOT BALANCE"
                                                                        >
                                                                            <i className="fas fa-times fs-5" />
                                                                            <span className="fw-semibold">NOT BALANCE</span>
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })()}
                                                            {errSelect ? <div className="invalid-feedback d-block">{errSelect}</div> : null}
                                                        </>
                                                    ) : q.answer_type === 'single_select' ? (
                                                        <>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <select
                                                                    className={`form-control ${errSelect ? 'is-invalid' : ''}`}
                                                                    value={String(a.selected_option_id ?? '')}
                                                                    onChange={(e) => setData('answers', { ...data.answers, [q.id]: { ...a, selected_option_id: e.target.value } })}
                                                                    disabled={processing || isSubmitted}
                                                                >
                                                                    <option value="">-- Select --</option>
                                                                    {(q.options ?? []).map((o) => (
                                                                        <option key={`opt||${o.id}`} value={String(o.id)}>{o.label}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            {errSelect ? <div className="invalid-feedback d-block">{errSelect}</div> : null}
                                                        </>
                                                    ) : null}

                                                    {q.answer_type === 'date' ? (
                                                        <>
                                                            <DatePickerInput
                                                                value={a.value_date ?? ''}
                                                                onChange={(v) => setData('answers', { ...data.answers, [q.id]: { ...a, value_date: v } })}
                                                                className="form-control"
                                                                disabled={processing || isSubmitted}
                                                                invalid={Boolean(errDate)}
                                                            />
                                                            {errDate ? <div className="invalid-feedback d-block">{errDate}</div> : null}
                                                        </>
                                                    ) : null}
                                                </td>
                                                <td>
                                                    {q.note_instruction ? (
                                                        <div className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>{q.note_instruction}</div>
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

            {!isSubmitted ? (
                <div className="card mb-3">
                    <div className="card-body d-flex flex-wrap gap-2 align-items-center">
                        <button type="button" className="btn btn-primary" onClick={submit} disabled={processing}>
                            Submit
                        </button>
                    </div>
                </div>
            ) : null}
        </>
    );
}

HealthScorePublicShow.layout = (page) => <PublicSurveyLayout>{page}</PublicSurveyLayout>;
