import { useEffect, useMemo, useRef, useState } from 'react';

function nowIso() {
    try {
        return new Date().toISOString();
    } catch {
        return '';
    }
}

export default function CommandDock({ open, onClose, onStartRun, isRunning, chat }) {
    const [prompt, setPrompt] = useState('');
    const panelRef = useRef(null);

    const canRun = useMemo(() => {
        return !isRunning && String(prompt || '').trim().length > 0;
    }, [isRunning, prompt]);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    useEffect(() => {
        if (!open) return;
        window.setTimeout(() => {
            const el = panelRef.current?.querySelector('textarea');
            if (el) el.focus();
        }, 0);
    }, [open]);

    const run = async () => {
        const text = String(prompt || '').trim();
        if (!text) return;
        setPrompt('');
        await onStartRun?.(text);
    };

    if (!open) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1050,
            }}
        >
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(2,6,23,0.55)',
                    backdropFilter: 'blur(2px)',
                }}
            />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: 20,
                    transform: 'translateX(-50%)',
                    width: 'min(980px, calc(100vw - 24px))',
                    borderRadius: 16,
                    border: '1px solid rgba(148,163,184,0.25)',
                    background: 'rgba(2,6,23,0.92)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                    color: '#e5e7eb',
                    overflow: 'hidden',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(148,163,184,0.18)',
                    }}
                >
                    <div>
                        <div style={{ fontWeight: 700 }}>Office Agent Command Dock</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>Run instruksi dan lihat transcript singkat</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, opacity: 0.85 }}>{isRunning ? 'RUNNING' : 'READY'}</span>
                        <button type="button" className="btn btn-sm btn-outline-light" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>

                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
                    <div>
                        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>Prompt</div>
                        <textarea
                            className="form-control"
                            rows={4}
                            value={prompt}
                            placeholder="Contoh: Buat 3 time boxing untuk follow-up minggu ini, prioritas High, due date Jumat."
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={isRunning}
                            style={{
                                background: 'rgba(15,23,42,0.6)',
                                color: '#e5e7eb',
                                border: '1px solid rgba(148,163,184,0.25)',
                            }}
                        />
                        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                            <button type="button" className="btn btn-primary" onClick={run} disabled={!canRun}>
                                Run
                            </button>
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setPrompt('')} disabled={isRunning}>
                                Clear
                            </button>
                        </div>

                    </div>

                    <div>
                        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>Transcript</div>
                        <div
                            style={{
                                height: 170,
                                overflow: 'auto',
                                borderRadius: 12,
                                border: '1px solid rgba(148,163,184,0.18)',
                                background: 'rgba(15,23,42,0.35)',
                                padding: 10,
                            }}
                        >
                            {Array.isArray(chat) && chat.length ? (
                                chat.slice(-8).map((m, idx) => (
                                    <div key={idx} style={{ marginBottom: 10 }}>
                                        <div style={{ fontSize: 11, opacity: 0.75 }}>
                                            {(m.role || '').toUpperCase()} · {m.at || nowIso()}
                                        </div>
                                        <div style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{String(m.text || '')}</div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ fontSize: 12, opacity: 0.75 }}>Belum ada chat.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
