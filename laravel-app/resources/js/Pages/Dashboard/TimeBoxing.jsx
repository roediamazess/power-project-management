import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import DatePickerInput from '@/Components/DatePickerInput';
import { formatDateDdMmmYy, parseDateDdMmmYyToIso } from '@/utils/date';
import { filterByQuery } from '@/utils/smartSearch';

const numberFmt = (n) => {
    const v = Number(n ?? 0);
    if (!Number.isFinite(v)) return '0';
    return new Intl.NumberFormat('en-US').format(v);
};

const dateLabel = (iso) => (iso ? formatDateDdMmmYy(iso) : '-');

function KpiCard({ title, value, sub, color, icon, onClick }) {
    return (
        <div className="col-xl-3 col-md-6">
            <div
                className="card glass-card overflow-hidden h-100"
                style={{ transition: 'transform 0.2s ease', cursor: onClick ? 'pointer' : 'default' }}
                onClick={onClick}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '4px',
                        height: '100%',
                        background: color,
                    }}
                />
                <div className="card-body d-flex align-items-center gap-3">
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: '16px',
                            background: `linear-gradient(135deg, ${color}22, ${color}44)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: `0 8px 16px ${color}11`,
                        }}
                    >
                        <i className={`${icon} fs-4`} style={{ color }} />
                    </div>
                    <div className="flex-grow-1">
                        <p className="mb-1 text-muted text-uppercase fw-bold" style={{ fontSize: 11 }}>{title}</p>
                        <h3 className="mb-0 fw-bold" style={{ color, fontSize: '1.75rem' }}>{value}</h3>
                        {sub ? <small className="text-muted d-block mt-1" style={{ fontSize: 11, fontStyle: 'italic' }}>{sub}</small> : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DashboardTimeBoxing({
    isManager,
    filters,
    kpi,
    statusBreakdown,
    priorityBreakdown,
    typeBreakdown,
    workloadTypeBreakdown,
    trend,
    topPartners,
}) {
    const chartsRef = useRef([]);

    const [range, setRange] = useState(filters?.range ?? '30d');
    const [fromValue, setFromValue] = useState(dateLabel(filters?.from));
    const [toValue, setToValue] = useState(dateLabel(filters?.to));

    const [drilldownOpen, setDrilldownOpen] = useState(false);
    const [drilldownLoading, setDrilldownLoading] = useState(false);
    const [drilldownTitle, setDrilldownTitle] = useState('');
    const [drilldownError, setDrilldownError] = useState('');
    const [drilldownQuery, setDrilldownQuery] = useState('');
    const [drilldownItems, setDrilldownItems] = useState([]);
    const [drilldownParams, setDrilldownParams] = useState(null);
    const [reopenListAfterEdit, setReopenListAfterEdit] = useState(false);

    const [editorOptions, setEditorOptions] = useState({
        typeOptions: [],
        priorityOptions: [],
        statusOptions: [],
        partners: [],
        projects: [],
    });

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        setRange(filters?.range ?? '30d');
        setFromValue(dateLabel(filters?.from));
        setToValue(dateLabel(filters?.to));
    }, [filters?.range, filters?.from, filters?.to]);

    const applyRange = (nextRange) => {
        router.get(route('dashboard.time-boxing', {}, false), { range: nextRange }, { preserveScroll: true, preserveState: true });
    };

    const applyCustom = () => {
        const fromIso = parseDateDdMmmYyToIso(fromValue);
        const toIso = parseDateDdMmmYyToIso(toValue);
        router.get(
            route('dashboard.time-boxing', {}, false),
            { range: 'custom', from: fromIso || undefined, to: toIso || undefined },
            { preserveScroll: true, preserveState: true },
        );
    };

    const fetchDrilldown = async (params) => {
        const url = route('dashboard.time-boxing.drilldown', params, false);
        const res = await fetch(url, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
        if (!res.ok) {
            throw new Error(`Failed to load drilldown: ${res.status}`);
        }
        return res.json();
    };

    const openDrilldown = async ({ title, ...params }) => {
        const p = {
            ...params,
            range: filters?.range ?? '30d',
            from: filters?.from ?? undefined,
            to: filters?.to ?? undefined,
        };

        setDrilldownTitle(title ?? 'Drilldown');
        setDrilldownError('');
        setDrilldownQuery('');
        setDrilldownOpen(true);
        setDrilldownLoading(true);
        setDrilldownParams(p);
        try {
            const json = await fetchDrilldown(p);
            setDrilldownItems(json?.items ?? []);
            if (json?.options) setEditorOptions(json.options);
        } catch (err) {
            setDrilldownItems([]);
            setDrilldownError(err?.message ?? 'Failed to load drilldown data');
        } finally {
            setDrilldownLoading(false);
        }
    };

    const closeDrilldown = () => {
        setDrilldownOpen(false);
        setDrilldownLoading(false);
        setDrilldownTitle('');
        setDrilldownError('');
        setDrilldownQuery('');
        setDrilldownItems([]);
        setDrilldownParams(null);
    };

    const refreshDrilldown = async () => {
        if (!drilldownParams) return;
        setDrilldownLoading(true);
        setDrilldownError('');
        try {
            const json = await fetchDrilldown(drilldownParams);
            setDrilldownItems(json?.items ?? []);
            if (json?.options) setEditorOptions(json.options);
        } catch (err) {
            setDrilldownItems([]);
            setDrilldownError(err?.message ?? 'Failed to refresh drilldown data');
        } finally {
            setDrilldownLoading(false);
        }
    };

    const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const dateInputValue = (iso) => {
        if (!iso) return '';
        const v = formatDateDdMmmYy(iso);
        return v === '-' ? '' : v;
    };

    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        information_date: formatDateDdMmmYy(todayIso),
        type: '',
        priority: (editorOptions.priorityOptions ?? [])[0] ?? 'Normal',
        user_position: '',
        partner_id: '',
        description: '',
        action_solution: '',
        status: (editorOptions.statusOptions ?? [])[0] ?? 'Brain Dump',
        due_date: '',
        project_id: '',
    });

    const openEdit = (t) => {
        setEditingId(t.id);
        clearErrors();
        setData({
            information_date: t.information_date ? formatDateDdMmmYy(t.information_date) : formatDateDdMmmYy(todayIso),
            type: t.type ?? '',
            priority: t.priority ?? ((editorOptions.priorityOptions ?? [])[0] ?? 'Normal'),
            user_position: t.user_position ?? '',
            partner_id: t.partner_id ?? '',
            description: t.description ?? '',
            action_solution: t.action_solution ?? '',
            status: t.status ?? ((editorOptions.statusOptions ?? [])[0] ?? 'Brain Dump'),
            due_date: t.due_date ? formatDateDdMmmYy(t.due_date) : '',
            project_id: t.project_id ?? '',
        });
        setReopenListAfterEdit(true);
        setDrilldownOpen(false);
        setShowEditModal(true);
    };

    const closeEdit = () => {
        setShowEditModal(false);
        setEditingId(null);
        clearErrors();
        reset();
        if (reopenListAfterEdit) {
            setDrilldownOpen(true);
            setReopenListAfterEdit(false);
        }
    };

    const submitEdit = (e) => {
        e.preventDefault();
        if (!editingId) return;

        const payload = {
            ...data,
            information_date: parseDateDdMmmYyToIso(data.information_date),
            due_date: data.due_date ? parseDateDdMmmYyToIso(data.due_date) : null,
            partner_id: data.partner_id === '' ? null : Number(data.partner_id),
            project_id: data.project_id === '' ? null : String(data.project_id),
        };

        put(route('dashboard.time-boxing.update', { timeBoxing: editingId }, false), {
            preserveScroll: true,
            preserveState: true,
            data: payload,
            onSuccess: async () => {
                closeEdit();
                await refreshDrilldown();
            },
        });
    };

    const filteredDrilldownItems = useMemo(() => {
        const rows = drilldownItems ?? [];
        if (!drilldownQuery) return rows;
        return filterByQuery(rows, drilldownQuery, (t) => [
            t.id,
            t.no,
            t.type,
            t.priority,
            t.status,
            t.partner?.cnc_id,
            t.partner?.name,
            t.project?.cnc_id,
            t.project?.project_name,
            t.description,
            t.action_solution,
        ]);
    }, [drilldownItems, drilldownQuery]);

    const activeTypeOptions = useMemo(() => {
        return (editorOptions.typeOptions ?? []).filter((o) => String(o?.status ?? 'Active') === 'Active');
    }, [editorOptions.typeOptions]);

    const allowedProjects = useMemo(() => {
        const excluded = new Set(['Done', 'Rejected']);
        return (editorOptions.projects ?? []).filter((p) => !excluded.has(String(p?.status ?? '')));
    }, [editorOptions.projects]);

    useEffect(() => {
        const ApexCharts = window?.ApexCharts;
        if (!ApexCharts) return;

        const currentTheme = (typeof document !== 'undefined' && document.body.getAttribute('data-theme-version')) || 'light';

        const destroyAll = () => {
            for (const c of chartsRef.current) {
                try { c?.destroy?.(); } catch { }
            }
            chartsRef.current = [];
        };

        const create = (selector, options) => {
            const el = document.querySelector(selector);
            if (!el) return;
            el.innerHTML = '';
            const chartOptions = {
                ...options,
                theme: {
                    mode: currentTheme,
                    palette: 'palette1',
                },
            };
            const c = new ApexCharts(el, chartOptions);
            c.render();
            chartsRef.current.push(c);
        };

        destroyAll();

        const PASTEL = {
            purple: '#B19CD9',
            green: '#77DD77',
            blue: '#AEC6CF',
            yellow: '#FDFD96',
            pink: '#FFB7CE',
            orange: '#FFB347',
            red: '#FF6961',
            grey: '#CFCFC4',
        };

        const statusLabels = Object.keys(statusBreakdown ?? {}).sort((a, b) => (statusBreakdown?.[b] ?? 0) - (statusBreakdown?.[a] ?? 0));
        const statusValues = statusLabels.map((k) => Number(statusBreakdown?.[k] ?? 0));
        if (statusLabels.length > 0) {
            create('#chart-status', {
                series: statusValues,
                labels: statusLabels,
                colors: [PASTEL.purple, PASTEL.blue, PASTEL.green, PASTEL.yellow, PASTEL.pink, PASTEL.orange, PASTEL.red, PASTEL.grey],
                legend: { position: 'bottom' },
                dataLabels: { enabled: true, formatter: (val) => `${Math.round(val)}%` },
                plotOptions: { pie: { donut: { size: '55%' } } },
                tooltip: { y: { formatter: (v) => `${v} items` } },
                chart: {
                    type: 'donut',
                    height: 280,
                    toolbar: { show: false },
                    events: {
                        dataPointSelection: (_event, _chartContext, config) => {
                            const label = statusLabels[config.dataPointIndex];
                            if (!label) return;
                            openDrilldown({ title: `Status: ${label}`, dimension: 'status', value: label });
                        },
                    },
                },
            });
        }

        const priorityLabels = Object.keys(priorityBreakdown ?? {}).sort((a, b) => (priorityBreakdown?.[b] ?? 0) - (priorityBreakdown?.[a] ?? 0));
        const priorityValues = priorityLabels.map((k) => Number(priorityBreakdown?.[k] ?? 0));
        if (priorityLabels.length > 0) {
            create('#chart-priority', {
                series: priorityValues,
                labels: priorityLabels,
                colors: [PASTEL.grey, PASTEL.yellow, PASTEL.red, PASTEL.orange, PASTEL.blue],
                legend: { position: 'bottom' },
                dataLabels: { enabled: true, formatter: (val) => `${Math.round(val)}%` },
                plotOptions: { pie: { donut: { size: '55%' } } },
                tooltip: { y: { formatter: (v) => `${v} items` } },
                chart: {
                    type: 'donut',
                    height: 280,
                    toolbar: { show: false },
                    events: {
                        dataPointSelection: (_event, _chartContext, config) => {
                            const label = priorityLabels[config.dataPointIndex];
                            if (!label) return;
                            openDrilldown({ title: `Priority: ${label}`, dimension: 'priority', value: label });
                        },
                    },
                },
            });
        }

        if ((typeBreakdown ?? []).length > 0) {
            create('#chart-type', {
                series: [{ name: 'Items', data: (typeBreakdown ?? []).map((r) => Number(r.value ?? 0)) }],
                chart: {
                    type: 'bar',
                    height: Math.max(240, (typeBreakdown ?? []).length * 34),
                    toolbar: { show: false },
                    events: {
                        dataPointSelection: (_event, _chartContext, config) => {
                            const label = typeBreakdown?.[config.dataPointIndex]?.label;
                            if (!label) return;
                            openDrilldown({ title: `Type: ${label}`, dimension: 'type', value: label });
                        },
                    },
                },
                plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: '60%' } },
                colors: [PASTEL.purple],
                dataLabels: { enabled: true },
                xaxis: { categories: (typeBreakdown ?? []).map((r) => r.label) },
                grid: { borderColor: 'var(--border)' },
                tooltip: { y: { formatter: (v) => `${v} items` } },
            });
        }

        if ((trend?.labels ?? []).length > 0) {
            create('#chart-trend', {
                series: [
                    { name: 'Created', data: trend?.created ?? [] },
                    { name: 'Completed', data: trend?.completed ?? [] },
                ],
                chart: { type: 'line', height: 300, toolbar: { show: false } },
                stroke: { curve: 'smooth', width: 3 },
                colors: [PASTEL.blue, PASTEL.green],
                dataLabels: { enabled: false },
                xaxis: {
                    categories: trend?.labels ?? [],
                    labels: {
                        rotate: -45,
                        hideOverlappingLabels: true,
                        formatter: (v) => formatDateDdMmmYy(v),
                    },
                },
                grid: { borderColor: 'var(--border)' },
                tooltip: { shared: true, x: { formatter: (v) => formatDateDdMmmYy(v) } },
                legend: { position: 'top' },
            });
        }

        const workloadTypeLabels = (workloadTypeBreakdown ?? []).map((r) => r.label);
        const workloadTypeValues = (workloadTypeBreakdown ?? []).map((r) => Number(r.value ?? 0));
        if (isManager && workloadTypeLabels.length > 0) {
            create('#chart-workload-type', {
                series: workloadTypeValues,
                labels: workloadTypeLabels,
                colors: [PASTEL.orange, PASTEL.purple, PASTEL.blue, PASTEL.green, PASTEL.yellow, PASTEL.pink, PASTEL.red, PASTEL.grey],
                legend: { position: 'bottom' },
                dataLabels: { enabled: true, formatter: (val) => `${Math.round(val)}%` },
                plotOptions: { pie: { donut: { size: '55%' } } },
                tooltip: { y: { formatter: (v) => `${v} open` } },
                chart: {
                    type: 'donut',
                    height: 280,
                    toolbar: { show: false },
                    events: {
                        dataPointSelection: (_event, _chartContext, config) => {
                            const label = workloadTypeLabels[config.dataPointIndex];
                            if (!label || label === 'Others') return;
                            openDrilldown({ title: `Workload (Open) Type: ${label}`, dimension: 'type', value: label, open_only: true });
                        },
                    },
                },
            });
        }

        return () => destroyAll();
    }, [isManager, statusBreakdown, priorityBreakdown, typeBreakdown, workloadTypeBreakdown, trend]);

    const rangeText = useMemo(() => {
        const f = filters?.from ? formatDateDdMmmYy(filters.from) : null;
        const t = filters?.to ? formatDateDdMmmYy(filters.to) : null;
        if (filters?.range === 'all') return 'All time';
        if (f && t) return `${f} → ${t}`;
        return 'Last 30 days';
    }, [filters?.from, filters?.to, filters?.range]);

    return (
        <>
            <Head title="Dashboard Time Boxing" />

            <div className="row align-items-center mb-3">
                <div className="col-lg-8">
                    <h3 className="mb-1">Dashboard &gt; Time Boxing</h3>
                    <div className="text-muted">Ringkasan dan tren untuk data Time Boxing. Range: {rangeText}</div>
                </div>
                <div className="col-lg-4 text-lg-end mt-2 mt-lg-0">
                    <Link href={route('time-boxing.index', {}, false)} className="btn btn-outline-primary">
                        Buka Time Boxing
                    </Link>
                </div>
            </div>

            <div className="card mb-3">
                <div className="card-body">
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                        <div className="btn-group">
                            <button type="button" className={`btn btn-sm ${range === '7d' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => applyRange('7d')}>7D</button>
                            <button type="button" className={`btn btn-sm ${range === '30d' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => applyRange('30d')}>30D</button>
                            <button type="button" className={`btn btn-sm ${range === '90d' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => applyRange('90d')}>90D</button>
                            <button type="button" className={`btn btn-sm ${range === 'ytd' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => applyRange('ytd')}>YTD</button>
                            <button type="button" className={`btn btn-sm ${range === 'all' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => applyRange('all')}>All</button>
                            <button type="button" className={`btn btn-sm ${range === 'custom' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setRange('custom')}>Custom</button>
                        </div>

                        {range === 'custom' ? (
                            <div className="d-flex flex-wrap gap-2 align-items-center">
                                <div style={{ width: 160 }}>
                                    <DatePickerInput value={fromValue} onChange={setFromValue} className="form-control form-control-sm" />
                                </div>
                                <div className="text-muted">→</div>
                                <div style={{ width: 160 }}>
                                    <DatePickerInput value={toValue} onChange={setToValue} className="form-control form-control-sm" />
                                </div>
                                <button type="button" className="btn btn-sm btn-primary" onClick={applyCustom}>
                                    Apply
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="row g-3 mb-3">
                <KpiCard
                    title="Active (Range)"
                    value={numberFmt(kpi?.active_in_range)}
                    sub="Open (not Completed) within range"
                    color="#6366F1"
                    icon="fas fa-layer-group"
                    onClick={() => openDrilldown({ title: 'Active (Range)', dimension: 'all', open_only: true })}
                />
                <KpiCard
                    title="Overdue (Range)"
                    value={numberFmt(kpi?.overdue_in_range)}
                    sub="Due date < today within range"
                    color="#EF4444"
                    icon="fas fa-exclamation-triangle"
                    onClick={() => openDrilldown({ title: 'Overdue (Range)', dimension: 'all', open_only: true, overdue_only: true })}
                />
                <KpiCard
                    title="Created (Range)"
                    value={numberFmt(kpi?.created_in_range)}
                    sub="Information date"
                    color="#0EA5E9"
                    icon="fas fa-plus-circle"
                    onClick={() => openDrilldown({ title: 'Created (Range)', dimension: 'all' })}
                />
                <KpiCard
                    title="Completed (Range)"
                    value={numberFmt(kpi?.completed_in_range)}
                    sub={`Avg lead time: ${kpi?.lead_time_avg_days ?? '-'}d (${numberFmt(kpi?.lead_time_count)} items)`}
                    color="#22C55E"
                    icon="fas fa-check-circle"
                    onClick={() => openDrilldown({ title: 'Completed (Range)', dimension: 'status', value: 'Completed' })}
                />
            </div>

            <div className="row g-3">
                <div className="col-xl-6">
                    <div className="card h-100">
                        <div className="card-header">
                            <h4 className="card-title mb-0">Status Breakdown</h4>
                        </div>
                        <div className="card-body">
                            <div id="chart-status" />
                        </div>
                    </div>
                </div>
                <div className="col-xl-6">
                    <div className="card h-100">
                        <div className="card-header">
                            <h4 className="card-title mb-0">Priority Breakdown</h4>
                        </div>
                        <div className="card-body">
                            <div id="chart-priority" />
                        </div>
                    </div>
                </div>

                <div className="col-xl-7">
                    <div className="card h-100">
                        <div className="card-header">
                            <h4 className="card-title mb-0">Created vs Completed</h4>
                        </div>
                        <div className="card-body">
                            <div id="chart-trend" />
                        </div>
                    </div>
                </div>

                <div className="col-xl-5">
                    <div className="card h-100">
                        <div className="card-header">
                            <h4 className="card-title mb-0">Top Types (Range)</h4>
                        </div>
                        <div className="card-body">
                            <div id="chart-type" />
                        </div>
                    </div>
                </div>

                {isManager ? (
                    <div className="col-xl-6">
                        <div className="card h-100">
                            <div className="card-header">
                                <h4 className="card-title mb-0">Workload (Open Items by Type)</h4>
                            </div>
                            <div className="card-body">
                                <div id="chart-workload-type" />
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className={isManager ? 'col-xl-6' : 'col-xl-12'}>
                    <div className="card h-100">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <h4 className="card-title mb-0">Top Partners (Open Items)</h4>
                            <div className="text-muted fs-12">Due next 7 days: {numberFmt(kpi?.due_next_7_days)}</div>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-striped table-responsive-md">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 90 }}>CNC</th>
                                            <th>Partner</th>
                                            <th style={{ width: 120 }} className="text-end">Open</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(topPartners ?? []).length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="text-center text-muted">No data</td>
                                            </tr>
                                        ) : null}
                                        {(topPartners ?? []).map((p) => (
                                            <tr key={p.id}>
                                                <td className="text-muted">{p.cnc_id ?? '-'}</td>
                                                <td>
                                                    <button type="button" className="btn btn-link p-0 text-start" onClick={() => openDrilldown({ title: `Partner: ${p.name ?? `#${p.id}`}`, dimension: 'partner', partner_id: p.id })}>
                                                        {p.name ?? `Partner #${p.id}`}
                                                    </button>
                                                </td>
                                                <td className="text-end fw-semibold">{numberFmt(p.open)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {drilldownOpen ? (
                <>
                    <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-xl modal-dialog-centered" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{drilldownTitle}</h5>
                                    <button type="button" className="btn-close" onClick={closeDrilldown} />
                                </div>
                                <div className="modal-body">
                                    {drilldownError ? <div className="alert alert-warning">{drilldownError}</div> : null}
                                    <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                                        <input
                                            className="form-control"
                                            style={{ maxWidth: 360 }}
                                            placeholder="Search..."
                                            value={drilldownQuery}
                                            onChange={(e) => setDrilldownQuery(e.target.value)}
                                        />
                                        <div className="text-muted fs-12">
                                            {drilldownLoading ? 'Loading...' : `${filteredDrilldownItems.length} items`}
                                        </div>
                                    </div>

                                    <div className="table-responsive">
                                        <table className="table table-striped table-responsive-md">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: 90 }}>No</th>
                                                    <th style={{ width: 160 }}>Type</th>
                                                    <th style={{ width: 110 }}>Priority</th>
                                                    <th style={{ width: 140 }}>Status</th>
                                                    <th>Partner / Project</th>
                                                    <th style={{ width: 140 }}>Due</th>
                                                    <th style={{ width: 140 }}>Info</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {!drilldownLoading && filteredDrilldownItems.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="text-center text-muted">No data</td>
                                                    </tr>
                                                ) : null}
                                                {filteredDrilldownItems.map((t) => (
                                                    <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(t)}>
                                                        <td className="fw-semibold">{t.no ?? '-'}</td>
                                                        <td>{t.type ?? '-'}</td>
                                                        <td>{t.priority ?? '-'}</td>
                                                        <td>{t.status ?? '-'}</td>
                                                        <td>
                                                            <div className="fw-semibold">{t.partner ? `${t.partner.cnc_id ?? ''} - ${t.partner.name ?? ''}` : '-'}</div>
                                                            <div className="text-muted fs-12">{t.project ? `${t.project.cnc_id ?? ''} - ${t.project.project_name ?? ''}` : ''}</div>
                                                        </td>
                                                        <td>{t.due_date ? formatDateDdMmmYy(t.due_date) : '-'}</td>
                                                        <td>{t.information_date ? formatDateDdMmmYy(t.information_date) : '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline-secondary" onClick={closeDrilldown}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" onClick={closeDrilldown} />
                </>
            ) : null}

            {showEditModal ? (
                <>
                    <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Edit Time Boxing</h5>
                                    <button type="button" className="btn-close" onClick={closeEdit} />
                                </div>
                                <form onSubmit={submitEdit}>
                                    <div className="modal-body">
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="text-black font-w600 form-label required">Information Date</label>
                                                <DatePickerInput value={data.information_date} onChange={(v) => setData('information_date', v)} className={`form-control ${errors.information_date ? 'is-invalid' : ''}`} />
                                                {errors.information_date ? <div className="invalid-feedback">{errors.information_date}</div> : null}
                                            </div>
                                            <div className="col-md-6">
                                                <label className="text-black font-w600 form-label">Due Date</label>
                                                <DatePickerInput value={data.due_date} onChange={(v) => setData('due_date', v)} className={`form-control ${errors.due_date ? 'is-invalid' : ''}`} />
                                                {errors.due_date ? <div className="invalid-feedback">{errors.due_date}</div> : null}
                                            </div>

                                            <div className="col-md-6">
                                                <label className="text-black font-w600 form-label required">Type</label>
                                                <select className={`form-control ${errors.type ? 'is-invalid' : ''}`} value={data.type} onChange={(e) => setData('type', e.target.value)}>
                                                    <option value="" disabled>-- Select --</option>
                                                    {activeTypeOptions.map((o) => (
                                                        <option key={`type||${o.name}`} value={o.name}>{o.name}</option>
                                                    ))}
                                                </select>
                                                {errors.type ? <div className="invalid-feedback">{errors.type}</div> : null}
                                            </div>
                                            <div className="col-md-3">
                                                <label className="text-black font-w600 form-label required">Priority</label>
                                                <select className={`form-control ${errors.priority ? 'is-invalid' : ''}`} value={data.priority} onChange={(e) => setData('priority', e.target.value)}>
                                                    {(editorOptions.priorityOptions ?? []).map((p) => (
                                                        <option key={`priority||${p}`} value={p}>{p}</option>
                                                    ))}
                                                </select>
                                                {errors.priority ? <div className="invalid-feedback">{errors.priority}</div> : null}
                                            </div>
                                            <div className="col-md-3">
                                                <label className="text-black font-w600 form-label required">Status</label>
                                                <select className={`form-control ${errors.status ? 'is-invalid' : ''}`} value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                                    {(editorOptions.statusOptions ?? []).map((s) => (
                                                        <option key={`status||${s}`} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                                {errors.status ? <div className="invalid-feedback">{errors.status}</div> : null}
                                            </div>

                                            <div className="col-md-6">
                                                <label className="text-black font-w600 form-label">Partner</label>
                                                <select className={`form-control ${errors.partner_id ? 'is-invalid' : ''}`} value={String(data.partner_id ?? '')} onChange={(e) => setData('partner_id', e.target.value)}>
                                                    <option value="">-- None --</option>
                                                    {(editorOptions.partners ?? []).map((p) => (
                                                        <option key={`partner||${p.id}`} value={String(p.id)}>
                                                            {p.cnc_id} - {p.name}{p.status && p.status !== 'Active' ? ` (${p.status})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.partner_id ? <div className="invalid-feedback">{errors.partner_id}</div> : null}
                                            </div>
                                            <div className="col-md-6">
                                                <label className="text-black font-w600 form-label">Project</label>
                                                <select className={`form-control ${errors.project_id ? 'is-invalid' : ''}`} value={String(data.project_id ?? '')} onChange={(e) => setData('project_id', e.target.value)}>
                                                    <option value="">-- None --</option>
                                                    {allowedProjects.map((p) => (
                                                        <option key={`project||${p.id}`} value={String(p.id)}>
                                                            {p.cnc_id} - {p.project_name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.project_id ? <div className="invalid-feedback">{errors.project_id}</div> : null}
                                            </div>

                                            <div className="col-12">
                                                <label className="text-black font-w600 form-label">User Position</label>
                                                <input className={`form-control ${errors.user_position ? 'is-invalid' : ''}`} value={data.user_position} onChange={(e) => setData('user_position', e.target.value)} />
                                                {errors.user_position ? <div className="invalid-feedback">{errors.user_position}</div> : null}
                                            </div>

                                            <div className="col-12">
                                                <label className="text-black font-w600 form-label">Description</label>
                                                <textarea className={`form-control ${errors.description ? 'is-invalid' : ''}`} rows={3} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                                                {errors.description ? <div className="invalid-feedback">{errors.description}</div> : null}
                                            </div>
                                            <div className="col-12">
                                                <label className="text-black font-w600 form-label">Action / Solution</label>
                                                <textarea className={`form-control ${errors.action_solution ? 'is-invalid' : ''}`} rows={3} value={data.action_solution} onChange={(e) => setData('action_solution', e.target.value)} />
                                                {errors.action_solution ? <div className="invalid-feedback">{errors.action_solution}</div> : null}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="submit" className="btn btn-primary" disabled={processing}>Save</button>
                                        <button type="button" className="btn btn-outline-secondary" onClick={closeEdit} disabled={processing}>Cancel</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" onClick={closeEdit} />
                </>
            ) : null}
        </>
    );
}

DashboardTimeBoxing.layout = (page) => <AuthenticatedLayout header="Dashboard Time Boxing">{page}</AuthenticatedLayout>;
