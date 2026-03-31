import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Modal from '@/Components/Modal';
import axios from 'axios';

/* ────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────── */
function agingLabel(dateStr) {
    if (!dateStr) return { label: 'No Data', cls: 'bg-secondary' };
    const diff = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (diff < 1) return { label: '< 1 Year', cls: 'bg-success' };
    if (diff < 2) return { label: '1–2 Years', cls: 'bg-warning' };
    return { label: '> 2 Years', cls: 'bg-danger' };
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function AgingDot({ dateStr }) {
    if (!dateStr) return <span className="badge bg-secondary" style={{ fontSize: 11 }}>No Data</span>;
    const diff = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const [cls, txt] = diff < 1 ? ['bg-success', '< 1yr'] : diff < 2 ? ['bg-warning', '1–2yr'] : ['bg-danger', '> 2yr'];
    return (
        <span className={`badge ${cls}`} style={{ fontSize: 11 }}>
            {txt}
        </span>
    );
}

/* ────────────────────────────────────────────────
   KPI Card
──────────────────────────────────────────────── */
function KpiCard({ title, value, sub, color, icon }) {
    return (
        <div className="col-xl-3 col-md-6">
            <div className="card glass-card overflow-hidden h-100" style={{ transition: 'transform 0.2s ease', cursor: 'default' }}
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
                        background: color 
                    }} 
                />
                <div className="card-body d-flex align-items-center gap-3">
                    <div
                        style={{
                            width: 56, height: 56, borderRadius: '16px',
                            background: `linear-gradient(135deg, ${color}22, ${color}44)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: `0 8px 16px ${color}11`
                        }}
                    >
                        <i className={`${icon} fs-4`} style={{ color }} />
                    </div>
                    <div className="flex-grow-1">
                        <p className="mb-1 text-muted text-uppercase fw-bold tracking-wider" style={{ fontSize: 11 }}>{title}</p>
                        <h3 className="mb-0 fw-bold" style={{ color, fontSize: '1.75rem' }}>{value}</h3>
                        {sub && <small className="text-muted d-block mt-1" style={{ fontSize: 11, fontStyle: 'italic' }}>{sub}</small>}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ────────────────────────────────────────────────
   Main Page
──────────────────────────────────────────────── */
export default function DashboardPartners({
    kpi,
    statusBreakdown,
    typeBreakdown,
    areaBreakdown,
    versionBreakdown,
    starBreakdown,
    groupBreakdown,
    implBreakdown,
    visitAging,
    needsAttention,
    recentlyVisited,
}) {
    const chartsRef = useRef([]);
    const [drilldownData, setDrilldownData] = useState({ show: false, title: '', partners: [], loading: false });

    // Track theme dynamically for modal - read from body attribute OR cookie as init
    const getTheme = () => {
        if (typeof document === 'undefined') return 'light';
        const fromBody = document.body.getAttribute('data-theme-version');
        if (fromBody) return fromBody;
        // Fallback: read from cookie
        const match = document.cookie.match(/(^| )version=([^;]+)/);
        return match ? decodeURIComponent(match[2]) : 'light';
    };
    const [currentTheme, setCurrentTheme] = useState(getTheme);
    useEffect(() => {
        // Listen to MutationObserver on body attribute
        const obs = new MutationObserver(() => {
            setCurrentTheme(document.body.getAttribute('data-theme-version') || getTheme());
        });
        if (typeof document !== 'undefined') {
            obs.observe(document.body, { attributes: true, attributeFilter: ['data-theme-version'] });
        }
        // Also listen to custom themechange event dispatched by AuthenticatedLayout
        const onThemeChange = (e) => {
            setCurrentTheme(e.detail?.version || getTheme());
        };
        window.addEventListener('themechange', onThemeChange);
        return () => {
            obs.disconnect();
            window.removeEventListener('themechange', onThemeChange);
        };
    }, []);

    const themeBg = currentTheme === 'dark' ? '#312a2a' : '#ffffff';
    const themeText = currentTheme === 'dark' ? '#ffffff' : '#212529';
    const tableHeaderBg = currentTheme === 'dark' ? '#312a2a' : '#f8f9fa';

    const handleDrilldown = async (type, value) => {
        if (!value) return;
        setDrilldownData({ show: true, title: `Loading ${value}...`, partners: [], loading: true });
        try {
            const resp = await axios.get(route('dashboard.partners.drilldown'), { params: { type, value } });
            setDrilldownData({ show: true, title: resp.data.title, partners: resp.data.partners, loading: false });
        } catch (e) {
            console.error(e);
            setDrilldownData({ show: true, title: 'Error loading data', partners: [], loading: false });
        }
    };

    useEffect(() => {
        const ApexCharts = window?.ApexCharts;
        if (!ApexCharts) return;

        const currentTheme = (typeof document !== 'undefined' && document.body.getAttribute('data-theme-version')) || 'light';

        const destroyAll = () => {
            for (const c of chartsRef.current) { try { c?.destroy?.(); } catch { } }
            chartsRef.current = [];
        };
        destroyAll();

        const create = (selector, options) => {
            const el = document.querySelector(selector);
            if (!el) return;
            el.innerHTML = '';
            
            // Sync theme mode
            const chartOptions = {
                ...options,
                theme: {
                    mode: currentTheme,
                    palette: 'palette1'
                }
            };
            
            const c = new ApexCharts(el, chartOptions);
            c.render();
            chartsRef.current.push(c);
        };

        const PASTEL_PALETTE = {
            purple: '#B19CD9',
            green: '#77DD77',
            blue: '#AEC6CF',
            yellow: '#FDFD96',
            pink: '#FFB7CE',
            orange: '#FFB347',
            red: '#FF6961',
            grey: '#CFCFC4'
        };

        const PALETTE = [PASTEL_PALETTE.purple, PASTEL_PALETTE.blue, PASTEL_PALETTE.green, PASTEL_PALETTE.pink, PASTEL_PALETTE.yellow, PASTEL_PALETTE.orange, PASTEL_PALETTE.red];

        // 1. Status donut
        const statusLabels = ['Active', 'Freeze', 'Inactive'];
        const statusValues = statusLabels.map((s) => statusBreakdown?.[s] ?? 0);
        create('#chart-status', {
            series: statusValues,
            labels: statusLabels,
            colors: [PASTEL_PALETTE.green, PASTEL_PALETTE.yellow, PASTEL_PALETTE.purple],
            legend: { position: 'bottom' },
            dataLabels: { enabled: true, formatter: (val) => `${Math.round(val)}%` },
            plotOptions: { pie: { donut: { size: '55%' } } },
            tooltip: { y: { formatter: (v) => `${v} partners` } },
            chart: {
                type: 'donut',
                height: 260,
                events: {
                    dataPointSelection: (event, chartContext, config) => {
                        const label = statusLabels[config.dataPointIndex];
                        handleDrilldown('status', label);
                    }
                }
            },
        });

        // 2. Visit Aging donut
        const agingColors = [PASTEL_PALETTE.green, PASTEL_PALETTE.yellow, PASTEL_PALETTE.red, PASTEL_PALETTE.grey];
        const agingLabels = ['< 1 Year', '1–2 Years', '> 2 Years', 'No Data'];
        const agingValues = [visitAging?.green ?? 0, visitAging?.yellow ?? 0, visitAging?.red ?? 0, visitAging?.none ?? 0];
        create('#chart-visit-aging', {
            series: agingValues,
            labels: agingLabels,
            colors: agingColors,
            legend: { position: 'bottom' },
            dataLabels: { enabled: true, formatter: (val) => `${Math.round(val)}%` },
            plotOptions: { pie: { donut: { size: '55%' } } },
            tooltip: { y: { formatter: (v) => `${v} partners` } },
            chart: {
                type: 'donut',
                height: 260,
                events: {
                    dataPointSelection: (event, chartContext, config) => {
                        const label = agingLabels[config.dataPointIndex];
                        handleDrilldown('aging', label);
                    }
                }
            },
        });

        // 3. Type horizontal bar
        if ((typeBreakdown ?? []).length > 0) {
            create('#chart-type', {
                series: [{ name: 'Partners', data: typeBreakdown.map((r) => r.value) }],
                chart: {
                    type: 'bar',
                    height: Math.max(180, typeBreakdown.length * 36),
                    toolbar: { show: false },
                    events: {
                        dataPointSelection: (event, chartContext, config) => {
                            const label = typeBreakdown[config.dataPointIndex].label;
                            handleDrilldown('type', label);
                        }
                    }
                },
                plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: '60%' } },
                colors: [PASTEL_PALETTE.purple],
                dataLabels: { enabled: true },
                xaxis: { categories: typeBreakdown.map((r) => r.label) },
                grid: { borderColor: 'var(--border)' },
            });
        }

        // 4. Area horizontal bar
        if ((areaBreakdown ?? []).length > 0) {
            create('#chart-area', {
                series: [{ name: 'Partners', data: areaBreakdown.map((r) => r.value) }],
                chart: {
                    type: 'bar',
                    height: Math.max(180, areaBreakdown.length * 36),
                    toolbar: { show: false },
                    events: {
                        dataPointSelection: (event, chartContext, config) => {
                            const label = areaBreakdown[config.dataPointIndex].label;
                            handleDrilldown('area', label);
                        }
                    }
                },
                plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: '60%' } },
                colors: [PASTEL_PALETTE.blue],
                dataLabels: { enabled: true },
                xaxis: { categories: areaBreakdown.map((r) => r.label) },
                grid: { borderColor: 'var(--border)' },
            });
        }

        // 5. System Version bar
        if ((versionBreakdown ?? []).length > 0) {
            create('#chart-version', {
                series: [{ name: 'Partners', data: versionBreakdown.map((r) => r.label) }],
                chart: {
                    type: 'bar',
                    height: 220,
                    toolbar: { show: false },
                    events: {
                        dataPointSelection: (event, chartContext, config) => {
                            const label = versionBreakdown[config.dataPointIndex].label;
                            handleDrilldown('version', label);
                        }
                    }
                },
                plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
                colors: [PASTEL_PALETTE.orange],
                dataLabels: { enabled: true },
                xaxis: { categories: versionBreakdown.map((r) => r.label) },
                grid: { borderColor: 'var(--border)' },
            });
        }

        // 6. Star rating bar
        if ((starBreakdown ?? []).length > 0) {
            create('#chart-star', {
                series: [{ name: 'Partners', data: starBreakdown.map((r) => r.value) }],
                chart: {
                    type: 'bar',
                    height: 220,
                    toolbar: { show: false },
                    events: {
                        dataPointSelection: (event, chartContext, config) => {
                            const label = starBreakdown[config.dataPointIndex].label;
                            handleDrilldown('star', label);
                        }
                    }
                },
                plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
                colors: PALETTE,
                dataLabels: { enabled: true },
                xaxis: { categories: starBreakdown.map((r) => r.label) },
                grid: { borderColor: 'var(--border)' },
            });
        }

        // 7. Group breakdown donut
        if ((groupBreakdown ?? []).length > 0) {
            create('#chart-group', {
                series: groupBreakdown.map((r) => r.value),
                chart: {
                    type: 'pie',
                    height: 280,
                    events: {
                        dataPointSelection: (event, chartContext, config) => {
                            const label = groupBreakdown[config.dataPointIndex].label;
                            handleDrilldown('group', label);
                        }
                    }
                },
                labels: groupBreakdown.map((r) => r.label),
                colors: PALETTE,
                legend: { position: 'bottom', fontSize: '12px' },
                dataLabels: { enabled: true, formatter: (val) => `${Math.round(val)}%` },
                tooltip: { y: { formatter: (v) => `${v} partners` } },
            });
        }

        // 8. Implementation type pie
        if ((implBreakdown ?? []).length > 0) {
            create('#chart-impl', {
                series: implBreakdown.map((r) => r.value),
                chart: {
                    type: 'pie',
                    height: 260,
                    events: {
                        dataPointSelection: (event, chartContext, config) => {
                            const label = implBreakdown[config.dataPointIndex].label;
                            handleDrilldown('impl', label);
                        }
                    }
                },
                labels: implBreakdown.map((r) => r.label),
                colors: [PASTEL_PALETTE.pink, PASTEL_PALETTE.blue, PASTEL_PALETTE.green, PASTEL_PALETTE.purple, PASTEL_PALETTE.orange],
                legend: { position: 'bottom', fontSize: '12px' },
                dataLabels: { enabled: true, formatter: (val) => `${Math.round(val)}%` },
                tooltip: { y: { formatter: (v) => `${v} partners` } },
            });
        }

        return () => destroyAll();
    }, [currentTheme, statusBreakdown, visitAging, typeBreakdown, areaBreakdown, versionBreakdown, starBreakdown, groupBreakdown, implBreakdown]);

    return (
        <>
            <Head title="Partners Insight" />

            {/* ── HEADER ── */}
            <div className={`d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3 ${currentTheme === 'dark' ? 'text-white' : ''}`}>
                <div>
                    <h2 className="mb-1 fw-bold text-gradient">Partners Insight</h2>
                    <p className={`mb-0 ${currentTheme === 'dark' ? 'text-muted-dark' : 'text-muted'}`} style={{ color: currentTheme === 'dark' ? '#adb5bd' : '#6c757d' }}>Discover strategic partner metrics and operational status</p>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-sm glass-card px-3 py-2 text-white border-0" style={{ backgroundColor: currentTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.6)' }}>
                        <i className="fas fa-file-export me-2 text-info"></i>
                        Export
                    </button>
                    <div className="p-2 glass-card d-flex align-items-center gap-2" style={{ border: '1px solid #26E02322', backgroundColor: currentTheme === 'dark' ? 'rgba(38, 224, 35, 0.05)' : 'rgba(38, 224, 35, 0.1)' }}>
                         <span className="badge bg-success rounded-circle p-1" style={{ width: 8, height: 8, animation: 'pulse-soft 2s infinite' }}></span>
                         <small className="text-success fw-bold" style={{ fontSize: 11 }}>LIVE SYNC</small>
                    </div>
                </div>
            </div>

            {/* ── KPI ROW ── */}
            <div className="row g-3 mb-4">
                <KpiCard title="Total Partners" value={kpi?.total ?? 0} icon="fas fa-handshake" color="#B19CD9" />
                <KpiCard title="Active" value={kpi?.active ?? 0} sub={`${Math.round(((kpi?.active ?? 0) / Math.max(kpi?.total ?? 1, 1)) * 100)}% of total`} icon="fas fa-check-circle" color="#77DD77" />
                <KpiCard title="Freeze" value={kpi?.freeze ?? 0} icon="fas fa-snowflake" color="#FDFD96" />
                <KpiCard title="Inactive" value={kpi?.inactive ?? 0} icon="fas fa-times-circle" color="#FF6961" />
            </div>

            {/* ── ROW 1: Status Donut + Visit Aging Donut ── */}
            <div className="row g-3 mb-4">
                <div className="col-xl-6">
                    <div className="card glass-card border-0 h-100">
                        <div className="card-header border-0 pb-0">
                            <h5 className="card-title mb-0">
                                <i className="fas fa-chart-pie me-2 text-primary" />
                                Partner Status Distribution
                            </h5>
                        </div>
                        <div className="card-body">
                            <div id="chart-status" />
                        </div>
                    </div>
                </div>

                <div className="col-xl-6">
                    <div className="card glass-card border-0 h-100">
                        <div className="card-header border-0 pb-0">
                            <h5 className="card-title mb-0">
                                <i className="fas fa-clock me-2 text-warning" />
                                Last Visit Aging (Active Partners)
                            </h5>
                        </div>
                        <div className="card-body">
                            <div id="chart-visit-aging" />
                            <div className="d-flex justify-content-center gap-4 mt-2 flex-wrap">
                                {[
                                    { label: '< 1 Year', count: visitAging?.green ?? 0, color: '#77DD77' },
                                    { label: '1–2 Years', count: visitAging?.yellow ?? 0, color: '#FDFD96' },
                                    { label: '> 2 Years', count: visitAging?.red ?? 0, color: '#FF6961' },
                                    { label: 'No Data', count: visitAging?.none ?? 0, color: '#CFCFC4' },
                                ].map((a) => (
                                    <div key={a.label} className="text-center">
                                        <span className="badge mb-1" style={{ backgroundColor: a.color }}>&nbsp;</span>
                                        <div style={{ fontSize: 12 }}>{a.label}</div>
                                        <strong>{a.count}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── ROW 2: Type + Area horizontal bars ── */}
            <div className="row g-3 mb-4">
                <div className="col-xl-6">
                    <div className="card glass-card border-0 h-100">
                        <div className="card-header border-0 pb-0">
                            <h5 className="card-title mb-0">
                                <i className="fas fa-tag me-2 text-purple" style={{ color: '#886CC0' }} />
                                Partners by Type (Active)
                            </h5>
                        </div>
                        <div className="card-body">
                            {(typeBreakdown ?? []).length === 0
                                ? <p className="text-muted text-center mt-3">No data</p>
                                : <div id="chart-type" />
                            }
                        </div>
                    </div>
                </div>

                <div className="col-xl-6">
                    <div className="card glass-card border-0 h-100">
                        <div className="card-header border-0 pb-0">
                            <h5 className="card-title mb-0">
                                <i className="fas fa-map-marker-alt me-2" style={{ color: '#61CFF1' }} />
                                Partners by Area (Active)
                            </h5>
                        </div>
                        <div className="card-body">
                            {(areaBreakdown ?? []).length === 0
                                ? <p className="text-muted text-center mt-3">No data</p>
                                : <div id="chart-area" />
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* ── ROW 3: System Version + Star Rating ── */}
            <div className="row g-3 mb-4">
                <div className="col-xl-6">
                    <div className="card glass-card border-0 h-100">
                        <div className="card-header border-0 pb-0">
                            <h5 className="card-title mb-0">
                                <i className="fas fa-code-branch me-2" style={{ color: '#FFA26D' }} />
                                System Version Distribution (Active)
                            </h5>
                        </div>
                        <div className="card-body">
                            {(versionBreakdown ?? []).length === 0
                                ? <p className="text-muted text-center mt-3">No data</p>
                                : <div id="chart-version" />
                            }
                        </div>
                    </div>
                </div>

                <div className="col-xl-6">
                    <div className="card glass-card border-0 h-100">
                        <div className="card-header border-0 pb-0">
                            <h5 className="card-title mb-0">
                                <i className="fas fa-star me-2 text-warning" />
                                Star Rating Distribution (Active)
                            </h5>
                        </div>
                        <div className="card-body">
                            {(starBreakdown ?? []).length === 0
                                ? <p className="text-muted text-center mt-3">No data</p>
                                : <div id="chart-star" />
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* ── ROW 4: Group Pie + Implementation Type Pie ── */}
            <div className="row g-3 mb-4">
                <div className="col-xl-6">
                    <div className="card glass-card border-0 h-100">
                        <div className="card-header border-0 pb-0">
                            <h5 className="card-title mb-0">
                                <i className="fas fa-layer-group me-2" style={{ color: '#FF86B1' }} />
                                Partners by Group (Active)
                            </h5>
                        </div>
                        <div className="card-body">
                            {(groupBreakdown ?? []).length === 0
                                ? <p className="text-muted text-center mt-3">No data</p>
                                : <div id="chart-group" />
                            }
                        </div>
                    </div>
                </div>

                <div className="col-xl-6">
                    <div className="card glass-card border-0 h-100">
                        <div className="card-header border-0 pb-0">
                            <h5 className="card-title mb-0">
                                <i className="fas fa-tools me-2" style={{ color: '#FF5ED2' }} />
                                Implementation Type (Active)
                            </h5>
                        </div>
                        <div className="card-body">
                            {(implBreakdown ?? []).length === 0
                                ? <p className="text-muted text-center mt-3">No data</p>
                                : <div id="chart-impl" />
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* ── ROW 5: Needs Attention + Recently Visited ── */}
            <div className="row g-3 mb-4">
                <div className="col-xl-6">
                    <div className={`card h-100 border-0 ${currentTheme === 'dark' ? 'bg-dark-card' : ''}`} style={{ backgroundColor: themeBg, transition: 'background-color 0.3s' }}>
                        <div className="card-header border-0 pb-0 d-flex align-items-center justify-content-between" style={{ backgroundColor: 'transparent' }}>
                            <h5 className="card-title mb-0" style={{ color: themeText }}>
                                <i className="fas fa-exclamation-triangle me-2 text-danger" />
                                Needs Attention
                                <small className="ms-2 fw-normal" style={{ fontSize: 12, color: currentTheme === 'dark' ? '#adb5bd' : '#6c757d' }}>Active · Last Visit &gt; 2 Years / No Visit</small>
                            </h5>
                            <span className="badge bg-danger shadow-sm">{needsAttention?.length ?? 0}</span>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className={`table table-sm table-hover mb-0 ${currentTheme === 'dark' ? 'table-dark' : ''}`} style={{ backgroundColor: 'transparent' }}>
                                    <thead style={{ backgroundColor: tableHeaderBg }}>
                                        <tr>
                                            <th className="ps-3 border-0">CNC ID</th>
                                            <th className="border-0">Name</th>
                                            <th className="border-0">Area</th>
                                            <th className="border-0">Last Visit</th>
                                            <th className="border-0">Aging</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(needsAttention ?? []).length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center text-muted py-3">
                                                    <i className="fas fa-check-circle text-success me-2" />
                                                    All partners are up-to-date!
                                                </td>
                                            </tr>
                                        ) : (needsAttention ?? []).map((p) => (
                                            <tr key={p.id}>
                                                <td className="ps-3 border-0">
                                                    <Link href={route('partners.index')} className="fw-semibold text-danger">
                                                        {p.cnc_id}
                                                    </Link>
                                                </td>
                                                <td className="border-0" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                                                <td className="border-0">{p.area ?? '-'}</td>
                                                <td className="border-0" style={{ whiteSpace: 'nowrap' }}>{formatDate(p.last_visit)}</td>
                                                <td className="border-0"><AgingDot dateStr={p.last_visit} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="card-footer border-0 text-end" style={{ backgroundColor: 'transparent' }}>
                            <Link href={route('partners.index')} className="btn btn-sm btn-outline-danger border-0">
                                View All Partners →
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="col-xl-6">
                    <div className={`card h-100 border-0 ${currentTheme === 'dark' ? 'bg-dark-card' : ''}`} style={{ backgroundColor: themeBg, transition: 'background-color 0.3s' }}>
                        <div className="card-header border-0 pb-0 d-flex align-items-center justify-content-between" style={{ backgroundColor: 'transparent' }}>
                            <h5 className="card-title mb-0" style={{ color: themeText }}>
                                <i className="fas fa-calendar-check me-2 text-success" />
                                Recently Visited
                                <small className="ms-2 fw-normal" style={{ fontSize: 12, color: currentTheme === 'dark' ? '#adb5bd' : '#6c757d' }}>Active · Last 6 Months</small>
                            </h5>
                            <span className="badge bg-success shadow-sm">{recentlyVisited?.length ?? 0}</span>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className={`table table-sm table-hover mb-0 ${currentTheme === 'dark' ? 'table-dark' : ''}`} style={{ backgroundColor: 'transparent' }}>
                                    <thead style={{ backgroundColor: tableHeaderBg }}>
                                        <tr>
                                            <th className="ps-3 border-0">CNC ID</th>
                                            <th className="border-0">Name</th>
                                            <th className="border-0">Area</th>
                                            <th className="border-0">Last Visit</th>
                                            <th className="border-0">Type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(recentlyVisited ?? []).length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center text-muted py-3">No recent visits</td>
                                            </tr>
                                        ) : (recentlyVisited ?? []).map((p) => (
                                            <tr key={p.id}>
                                                <td className="ps-3 border-0">
                                                    <Link href={route('partners.index')} className="fw-semibold text-success">
                                                        {p.cnc_id}
                                                    </Link>
                                                </td>
                                                <td className="border-0" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                                                <td className="border-0">{p.area ?? '-'}</td>
                                                <td className="border-0" style={{ whiteSpace: 'nowrap' }}>{formatDate(p.last_visit)}</td>
                                                <td className="border-0">
                                                    {p.last_visit_type
                                                        ? <span className="badge bg-info text-dark" style={{ fontSize: 11 }}>{p.last_visit_type}</span>
                                                        : <span className="text-muted">-</span>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="card-footer border-0 text-end" style={{ backgroundColor: 'transparent' }}>
                            <Link href={route('partners.index')} className="btn btn-sm btn-outline-success border-0">
                                View All Partners →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── DRILLDOWN MODAL ── */}
            <Modal 
                show={drilldownData.show} 
                onClose={() => setDrilldownData({ ...drilldownData, show: false })} 
                maxWidth="2xl"
                className="drilldown-modal-panel"
            >
                <div className="modal-content border-0" style={{ backgroundColor: themeBg, color: themeText }}>
                    <div className="modal-header border-0 pb-0" style={{ borderBottomColor: currentTheme === 'dark' ? '#444' : '#dee2e6' }}>
                        <div>
                            <h4 className="modal-title fw-bold" style={{ color: themeText }}>{drilldownData.title}</h4>
                            <p className="mb-0 small" style={{ color: currentTheme === 'dark' ? '#bbb' : '#6c757d' }}>Total: {drilldownData.partners.length} partners (top 100)</p>
                        </div>
                        <button type="button" className={`btn-close ${currentTheme === 'dark' ? 'btn-close-white' : ''}`} onClick={() => setDrilldownData({ ...drilldownData, show: false })} aria-label="Close"></button>
                    </div>

                    <div className="modal-body">
                        <div className="table-responsive" style={{ maxHeight: '60vh' }}>
                            <table className={`table table-sm table-hover mb-0 ${currentTheme === 'dark' ? 'table-dark' : ''}`} style={{ fontSize: 13, backgroundColor: 'transparent' }}>
                                <thead className="sticky-top" style={{ backgroundColor: tableHeaderBg, color: themeText }}>
                                    <tr>

                                        <th>CNC ID</th>
                                        <th>Name</th>
                                        <th>Area</th>
                                        <th>Status</th>
                                        <th>Visit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {drilldownData.loading ? (
                                        <tr><td colSpan={5} className="text-center py-4 text-muted">Loading partners...</td></tr>
                                    ) : drilldownData.partners.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-4 text-muted">No partners found</td></tr>
                                    ) : drilldownData.partners.map(p => (
                                        <tr key={p.id}>
                                            <td className="fw-semibold ps-2">{p.cnc_id}</td>
                                            <td>{p.name}</td>
                                            <td>{p.area}</td>
                                            <td>
                                                <span className={`badge ${p.status === 'Active' ? 'bg-success' : p.status === 'Freeze' ? 'bg-warning' : 'bg-danger'}`} style={{ fontSize: 10 }}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td style={{ whiteSpace: 'nowrap' }}>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span style={{ fontSize: 12 }}>{formatDate(p.last_visit)}</span>
                                                    <AgingDot dateStr={p.last_visit} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="modal-footer border-0">
                        <Link href={route('partners.index')} className="btn btn-sm btn-outline-info">
                            Manage All Partners →
                        </Link>
                    </div>
                </div>
            </Modal>
        </>
    );
}

DashboardPartners.layout = (page) => (
    <AuthenticatedLayout header={<i className="fas fa-handshake me-2 text-primary" />}>{page}</AuthenticatedLayout>
);
