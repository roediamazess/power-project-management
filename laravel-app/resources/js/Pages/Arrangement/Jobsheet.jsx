import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { formatDateDdMmmYy } from '@/utils/date';
import ArrangementTabs from './Partials/ArrangementTabs';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function Jobsheet({ isManager, pics, holidays, periods, selectedPeriod, approvedAssignments, manualEntries }) {
    const [showCreate, setShowCreate] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        start_date: '',
        end_date: '',
    });
    const [showManual, setShowManual] = useState(false);
    const {
        data: manualData,
        setData: setManualData,
        post: postManual,
        processing: manualProcessing,
        errors: manualErrors,
        reset: resetManual,
        clearErrors: clearManualErrors,
    } = useForm({
        period_id: '',
        user_id: '',
        start_date: '',
        end_date: '',
        code: '',
    });

    const dragRef = useRef({ active: false, userId: null, start: null, end: null });
    const [dragState, setDragState] = useState(null);

    const days = useMemo(() => {
        if (!selectedPeriod?.start_date || !selectedPeriod?.end_date) return [];
        const s = new Date(`${selectedPeriod.start_date}T00:00:00+07:00`);
        const e = new Date(`${selectedPeriod.end_date}T00:00:00+07:00`);
        if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s > e) return [];
        const out = [];
        const cur = new Date(s);
        while (cur <= e) {
            out.push(new Date(cur));
            cur.setDate(cur.getDate() + 1);
        }
        return out;
    }, [selectedPeriod?.start_date, selectedPeriod?.end_date]);

    const formatDayHeader = (d) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dd = String(d.getDate()).padStart(2, '0');
        return { mmm: months[d.getMonth()] ?? '', dd };
    };

    const holidaySet = useMemo(() => new Set((holidays ?? []).map((x) => String(x).trim()).filter(Boolean)), [holidays]);

    const ymd = (d) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const getDayStyle = (d, isHeader) => {
        const key = ymd(d);
        const dow = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', weekday: 'short' }).format(d);
        const isSun = dow === 'Sun';
        const isSat = dow === 'Sat';
        const isHoliday = holidaySet.has(key);

        if (isSun) {
            return { background: '#ef4444', color: '#111827' };
        }
        if (isSat) {
            return { background: '#d946ef', color: '#111827' };
        }
        if (isHoliday) {
            return { background: '#e5e7eb', color: '#111827' };
        }
        if (isHeader) {
            return { background: 'rgba(255,255,255,0.02)' };
        }
        return undefined;
    };

    const periodeSummary = useMemo(() => {
        if (!selectedPeriod) return null;
        return {
            id: selectedPeriod.id,
            name: selectedPeriod.name,
            slug: selectedPeriod.slug,
            startText: selectedPeriod.start_date ? formatDateDdMmmYy(selectedPeriod.start_date) : '-',
            endText: selectedPeriod.end_date ? formatDateDdMmmYy(selectedPeriod.end_date) : '-',
            isDefault: Boolean(selectedPeriod.is_default),
        };
    }, [selectedPeriod]);

    const selectPeriod = (slug) => {
        if (!slug) return;
        router.get(route('arrangements.jobsheet.slug', { periodSlug: slug }, false), {}, { preserveScroll: true, preserveState: true });
    };

    const openCreate = () => {
        reset();
        setShowCreate(true);
    };

    const closeCreate = () => {
        if (processing) return;
        setShowCreate(false);
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('arrangements.jobsheet.store', {}, false), {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreate(false);
                reset();
            },
        });
    };

    const setDefault = () => {
        if (!periodeSummary?.id) return;
        router.post(
            route('arrangements.jobsheet.default', {}, false),
            { period_id: periodeSummary.id },
            { preserveScroll: true },
        );
    };

    const stickyPicHeaderStyle = {
        minWidth: 180,
        position: 'sticky',
        left: 0,
        zIndex: 3,
        background: 'var(--bs-body-bg)',
    };

    const stickyPicCellStyle = {
        position: 'sticky',
        left: 0,
        zIndex: 2,
        background: 'var(--bs-body-bg)',
    };

    const manualOptions = useMemo(
        () => [
            { label: 'Middle', code: 'MD' },
            { label: 'Duty', code: 'DT' },
            { label: 'Public Holiday', code: 'D.PH' },
            { label: 'Saturday', code: 'D.ST' },
            { label: 'Sunday', code: 'D.SN' },
            { label: 'Day', code: 'D' },
            { label: 'Maintenance Dalam Kota', code: 'M.TCD' },
            { label: 'Maintenance DETABEK', code: 'M.TCK' },
            { label: 'Maintenance Luar Kota', code: 'M.TLK' },
            { label: 'Maintenance Luar Negeri', code: 'M.TLN' },
            { label: 'Implementasi Dalam Kota', code: 'I.TCD' },
            { label: 'Implementasi DETABEK', code: 'I.TCK' },
            { label: 'Implementasi Luar Kota', code: 'I.TLK' },
            { label: 'Implementasi Luar Negeri', code: 'I.TLN' },
            { label: 'Upgrade Dalam Kota', code: 'U.TCD' },
            { label: 'Upgrade DETABEK', code: 'U.TCK' },
            { label: 'Upgrade Luar Kota', code: 'U.TLK' },
            { label: 'Upgrade Luar Negeri', code: 'U.TLN' },
            { label: 'Seamless Maintenance', code: 'D.SM' },
            { label: 'OKR Officer', code: 'D.OKR' },
            { label: 'Online Training', code: 'D.OT' },
            { label: 'Online Meeting', code: 'D.OM' },
            { label: 'Standby Officer', code: 'D.OD' },
            { label: 'Assesor Officer', code: 'D.ASSESSOR' },
            { label: 'Assessee', code: 'D.ASSESSEE' },
            { label: 'Bali Officer', code: 'B' },
            { label: 'Bali Officer Online Training', code: 'B.OT' },
        ],
        [],
    );

    const scheduleTypeCode = (scheduleType) => {
        const v = String(scheduleType ?? '').trim();
        if (v === 'Middle') return 'MD';
        if (v === 'Duty') return 'DT';
        if (v === 'Public Holiday') return 'D.PH';
        if (v === 'Saturday') return 'D.ST';
        if (v === 'Sunday') return 'D.SN';
        return v || '-';
    };

    const approvedMap = useMemo(() => {
        const map = new Map();
        const dayKeys = days.map((d) => ymd(d));

        for (const a of approvedAssignments ?? []) {
            const userId = Number(a?.user_id);
            const start = String(a?.start_date ?? '');
            const end = String(a?.end_date ?? '');
            if (!userId || !start || !end) continue;

            const code = scheduleTypeCode(a?.schedule_type);
            for (const k of dayKeys) {
                if (k < start || k > end) continue;
                const key = `${userId}|${k}`;
                const prev = map.get(key);
                if (!prev) {
                    map.set(key, code);
                    continue;
                }
                if (prev === code) continue;
                map.set(key, `${prev}/${code}`);
            }
        }

        return map;
    }, [approvedAssignments, days]);

    const manualMap = useMemo(() => {
        const map = new Map();
        for (const e of manualEntries ?? []) {
            const userId = Number(e?.user_id);
            const workDate = String(e?.work_date ?? '');
            const code = String(e?.code ?? '').trim();
            if (!userId || !workDate || !code) continue;
            map.set(`${userId}|${workDate}`, code);
        }
        return map;
    }, [manualEntries]);

    const openManual = ({ userId, start, end }) => {
        if (!isManager) return;
        if (!selectedPeriod?.id) return;

        const s = start <= end ? start : end;
        const e = start <= end ? end : start;

        clearManualErrors();
        setManualData({
            period_id: selectedPeriod.id,
            user_id: String(userId),
            start_date: s,
            end_date: e,
            code: '',
        });
        setShowManual(true);
    };

    const closeManual = () => {
        if (manualProcessing) return;
        setShowManual(false);
        resetManual();
        setDragState(null);
        dragRef.current = { active: false, userId: null, start: null, end: null };
    };

    const submitManual = (e) => {
        e.preventDefault();
        postManual(route('arrangements.jobsheet.entries.upsert', {}, false), {
            preserveScroll: true,
            onSuccess: () => {
                setShowManual(false);
                resetManual();
                router.reload({
                    only: ['manualEntries', 'approvedAssignments'],
                    preserveScroll: true,
                    preserveState: true,
                });
            },
        });
    };

    const submitClear = () => {
        postManual(route('arrangements.jobsheet.entries.clear', {}, false), {
            preserveScroll: true,
            onSuccess: () => {
                setShowManual(false);
                resetManual();
                router.reload({
                    only: ['manualEntries', 'approvedAssignments'],
                    preserveScroll: true,
                    preserveState: true,
                });
            },
        });
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const onUp = () => {
            if (!dragRef.current.active) return;
            const { userId, start, end } = dragRef.current;
            dragRef.current.active = false;
            setDragState(null);
            if (userId && start && end) {
                openManual({ userId, start, end });
            }
        };

        const onTouchMove = (e) => {
            if (!dragRef.current.active) return;
            const t = e.touches?.[0];
            if (!t) return;
            const el = document.elementFromPoint(t.clientX, t.clientY);
            const dateKey = el?.dataset?.jobsheetDate;
            const userId = el?.dataset?.jobsheetUserId;
            if (!dateKey || !userId) return;
            const uid = Number(userId);
            if (!uid) return;
            if (dragRef.current.userId !== uid) return;
            if (approvedMap.has(`${uid}|${dateKey}`)) return;

            dragRef.current.end = dateKey;
            setDragState({ userId: uid, start: dragRef.current.start, end: dateKey });
            e.preventDefault();
        };

        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchend', onUp);
        window.addEventListener('touchcancel', onUp);
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        return () => {
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchend', onUp);
            window.removeEventListener('touchcancel', onUp);
            window.removeEventListener('touchmove', onTouchMove);
        };
    }, [approvedMap, isManager, selectedPeriod?.id]);

    const isKeyInRange = (key, a, b) => {
        const s = a <= b ? a : b;
        const e = a <= b ? b : a;
        return key >= s && key <= e;
    };

    const lockedInManualRange = useMemo(() => {
        if (!manualData.user_id || !manualData.start_date || !manualData.end_date) return false;
        const userId = Number(manualData.user_id);
        if (!userId) return false;

        const dayKeys = days.map((d) => ymd(d));
        for (const k of dayKeys) {
            if (!isKeyInRange(k, manualData.start_date, manualData.end_date)) continue;
            if (approvedMap.has(`${userId}|${k}`)) return true;
        }

        return false;
    }, [approvedMap, days, manualData.user_id, manualData.start_date, manualData.end_date]);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Arrangement — Jobsheet</h2>}>
            <Head title="Arrangement Jobsheet" />

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex flex-wrap flex-md-nowrap align-items-center justify-content-between pb-2 gap-2">
                            <div className="d-flex align-items-center flex-grow-1 overflow-auto w-100 w-md-auto">
                                <ArrangementTabs isManager={isManager} />
                            </div>
                            <div className="d-flex align-items-center gap-2 flex-wrap flex-md-nowrap w-100 w-md-auto justify-content-between justify-content-md-end">
                                {isManager ? (
                                    <>
                                        <div className="flex-grow-1" style={{ maxWidth: 520, minWidth: 220 }}>
                                            <div className="input-group">
                                                <span className="input-group-text">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="18"
                                                        height="18"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                        <line x1="16" y1="2" x2="16" y2="6" />
                                                        <line x1="8" y1="2" x2="8" y2="6" />
                                                        <line x1="3" y1="10" x2="21" y2="10" />
                                                    </svg>
                                                </span>
                                                <select
                                                    className="form-select"
                                                    value={periodeSummary?.slug ?? ''}
                                                    onChange={(e) => selectPeriod(e.target.value)}
                                                >
                                                    <option value="">Pilih Periode...</option>
                                                    {(periods ?? []).map((p) => (
                                                        <option key={p.id} value={p.slug ?? ''}>
                                                            {p.name}{p.is_default ? ' (Default)' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary text-nowrap"
                                            onClick={setDefault}
                                            disabled={!periodeSummary?.id || periodeSummary?.isDefault}
                                        >
                                            Set Default
                                        </button>
                                        <button type="button" className="btn btn-primary text-nowrap" onClick={openCreate}>
                                            Create Periode
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-muted text-nowrap">
                                        {periodeSummary ? (
                                            <>{periodeSummary.name}</>
                                        ) : (
                                            'Periode belum tersedia'
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="card-body">
                            {days.length ? (
                                <div className="table-responsive">
                                    <table className="table table-bordered align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th style={stickyPicHeaderStyle}>PIC</th>
                                                {days.map((d) => (
                                                    <th
                                                        key={d.toISOString()}
                                                        className="text-center white-space-nowrap"
                                                        style={{ minWidth: 90, ...getDayStyle(d, true) }}
                                                    >
                                                        <div className="text-muted fs-12">{formatDayHeader(d).mmm}</div>
                                                        <div className="fw-semibold">{formatDayHeader(d).dd}</div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(pics ?? []).length
                                                ? pics.map((p) => (
                                                      <tr key={p.id}>
                                                          <td className="fw-semibold" style={stickyPicCellStyle}>
                                                              {p.name}
                                                          </td>
                                                          {days.map((d) => (
                                                              (() => {
                                                                  const dateKey = ymd(d);
                                                                  const cellKey = `${p.id}|${dateKey}`;
                                                                  const locked = approvedMap.has(cellKey);
                                                                  const value = locked ? approvedMap.get(cellKey) : manualMap.get(cellKey) ?? '-';
                                                                  const selecting =
                                                                      dragState?.userId === p.id &&
                                                                      dragState?.start &&
                                                                      dragState?.end &&
                                                                      isKeyInRange(dateKey, dragState.start, dragState.end);

                                                                  const baseStyle = getDayStyle(d, false);
                                                                  const style = selecting
                                                                      ? { ...(baseStyle ?? {}), boxShadow: 'inset 0 0 0 9999px rgba(99,102,241,0.18)' }
                                                                      : baseStyle;

                                                                  return (
                                                                      <td
                                                                          key={d.toISOString()}
                                                                          className={`text-center${locked ? ' text-muted' : ''}`}
                                                                          style={style}
                                                                          data-jobsheet-user-id={p.id}
                                                                          data-jobsheet-date={dateKey}
                                                                          onMouseDown={() => {
                                                                              if (!isManager || !selectedPeriod?.id) return;
                                                                              if (locked) return;
                                                                              dragRef.current = { active: true, userId: p.id, start: dateKey, end: dateKey };
                                                                              setDragState({ userId: p.id, start: dateKey, end: dateKey });
                                                                          }}
                                                                          onMouseEnter={() => {
                                                                              if (!dragRef.current.active) return;
                                                                              if (dragRef.current.userId !== p.id) return;
                                                                              if (locked) return;
                                                                              dragRef.current.end = dateKey;
                                                                              setDragState({ userId: p.id, start: dragRef.current.start, end: dateKey });
                                                                          }}
                                                                          onClick={() => {
                                                                              if (!isManager || !selectedPeriod?.id) return;
                                                                              if (locked) return;
                                                                              openManual({ userId: p.id, start: dateKey, end: dateKey });
                                                                          }}
                                                                          onTouchStart={() => {
                                                                              if (!isManager || !selectedPeriod?.id) return;
                                                                              if (locked) return;
                                                                              dragRef.current = { active: true, userId: p.id, start: dateKey, end: dateKey };
                                                                              setDragState({ userId: p.id, start: dateKey, end: dateKey });
                                                                          }}
                                                                      >
                                                                          {value}
                                                                      </td>
                                                                  );
                                                              })()
                                                          ))}
                                                      </tr>
                                                  ))
                                                : null}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-muted">Pilih periode untuk menampilkan Jobsheet.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showCreate ? (
                <>
                    <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content border-0 shadow-lg overflow-hidden">
                                <div className="modal-header">
                                    <h5 className="modal-title mb-0">Create Periode</h5>
                                    <button type="button" className="btn-close" onClick={closeCreate} disabled={processing} />
                                </div>
                                <form onSubmit={submitCreate}>
                                    <div className="modal-body">
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label className="form-label">Periode Name</label>
                                                <input type="text" className="form-control" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                                {errors.name ? <div className="text-danger fs-12 mt-1">{errors.name}</div> : null}
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label">Start Periode</label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    value={data.start_date}
                                                    onChange={(e) => setData('start_date', e.target.value)}
                                                />
                                                {errors.start_date ? <div className="text-danger fs-12 mt-1">{errors.start_date}</div> : null}
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label">End Periode</label>
                                                <input type="date" className="form-control" value={data.end_date} onChange={(e) => setData('end_date', e.target.value)} />
                                                {errors.end_date ? <div className="text-danger fs-12 mt-1">{errors.end_date}</div> : null}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={processing || !data.name || !data.start_date || !data.end_date}
                                        >
                                            Create
                                        </button>
                                        <button type="button" className="btn btn-outline-secondary" onClick={closeCreate} disabled={processing}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" onClick={closeCreate} />
                </>
            ) : null}

            {showManual ? (
                <>
                    <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content border-0 shadow-lg overflow-hidden">
                                <div className="modal-header">
                                    <h5 className="modal-title mb-0">Set Jobsheet</h5>
                                    <button type="button" className="btn-close" onClick={closeManual} disabled={manualProcessing} />
                                </div>
                                <form onSubmit={submitManual}>
                                    <div className="modal-body">
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label className="form-label">Tanggal</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={`${manualData.start_date || '-'} → ${manualData.end_date || '-'}`}
                                                    disabled
                                                />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label">Type</label>
                                                <select
                                                    className="form-select"
                                                    value={manualData.code}
                                                    onChange={(e) => setManualData('code', e.target.value)}
                                                    disabled={lockedInManualRange}
                                                >
                                                    <option value="">Pilih type...</option>
                                                    {manualOptions.map((o) => (
                                                        <option key={o.code} value={o.code}>
                                                            {o.label} ({o.code})
                                                        </option>
                                                    ))}
                                                </select>
                                                {manualErrors.code ? <div className="text-danger fs-12 mt-1">{manualErrors.code}</div> : null}
                                                {manualErrors.date ? <div className="text-danger fs-12 mt-1">{manualErrors.date}</div> : null}
                                                {lockedInManualRange ? (
                                                    <div className="text-muted fs-12 mt-1">Range ini memiliki data Approved, tidak bisa diubah/di-clear.</div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-outline-danger me-auto"
                                            onClick={submitClear}
                                            disabled={manualProcessing || lockedInManualRange}
                                        >
                                            Clear
                                        </button>
                                        <button type="submit" className="btn btn-primary" disabled={manualProcessing || lockedInManualRange || !manualData.code}>
                                            Save
                                        </button>
                                        <button type="button" className="btn btn-outline-secondary" onClick={closeManual} disabled={manualProcessing}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" onClick={closeManual} />
                </>
            ) : null}
        </AuthenticatedLayout>
    );
}
