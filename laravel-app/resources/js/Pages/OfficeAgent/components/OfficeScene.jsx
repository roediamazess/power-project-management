import { useEffect, useMemo, useRef, useState } from 'react';
import OfficeCharacter from './OfficeCharacter';

function getStatusDot(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'error') return '#ef4444';
    if (s === 'acting') return '#22c55e';
    if (s === 'thinking') return '#f59e0b';
    if (s === 'listening') return '#06b6d4';
    if (s === 'offline') return '#64748b';
    return '#94a3b8';
}

function Bubble({ text, showKeyboard }) {
    if (!text) return null;

    return (
        <div
            style={{
                position: 'absolute',
                left: '50%',
                top: -14,
                transform: 'translate(-50%, -100%)',
                maxWidth: 360,
                background: 'rgba(2,6,23,0.92)',
                border: '1px solid rgba(148,163,184,0.35)',
                borderRadius: 12,
                padding: '10px 12px',
                color: '#e5e7eb',
                boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
                fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: 13,
                lineHeight: '18px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: '#22c55e',
                        boxShadow: '0 0 10px rgba(34,197,94,0.55)',
                        flex: '0 0 auto',
                    }}
                />
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</span>
                {showKeyboard ? <span style={{ opacity: 0.9, flex: '0 0 auto' }} aria-hidden="true">⌨</span> : null}
            </div>
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: -8,
                    width: 0,
                    height: 0,
                    transform: 'translateX(-50%)',
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: '8px solid rgba(2,6,23,0.92)',
                    filter: 'drop-shadow(0 2px 0 rgba(148,163,184,0.25))',
                }}
            />
        </div>
    );
}

function Agent({ id, name, status, bubbleText, bubbleKeyboard, style, facing }) {
    const dot = getStatusDot(status);

    return (
        <div style={{ position: 'absolute', ...style }}>
            <Bubble text={bubbleText} showKeyboard={bubbleKeyboard} />
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <OfficeCharacter agentId={id} status={status} scale={2} facing={facing} />
                <div
                    style={{
                        padding: '6px 10px',
                        borderRadius: 999,
                        background: 'rgba(2,6,23,0.78)',
                        border: '1px solid rgba(148,163,184,0.28)',
                        color: '#e5e7eb',
                        fontSize: 12,
                        backdropFilter: 'blur(6px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <span
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            background: dot,
                            boxShadow: `0 0 10px ${dot}55`,
                        }}
                    />
                    <span style={{ fontWeight: 600 }}>{name}</span>
                    <span style={{ opacity: 0.85 }}>{String(status || 'idle').toUpperCase()}</span>
                </div>
            </div>
        </div>
    );
}

export default function OfficeScene({ agents, onRunClick }) {
    const canvasRef = useRef(null);
    const roomRef = useRef(null);
    const rafRef = useRef(0);

    const [motion, setMotion] = useState(() => {
        const m = {};
        for (const a of agents || []) {
            m[a.id] = { x: 0, y: 0, facing: 'right' };
        }
        return m;
    });

    const basePx = useMemo(() => {
        const map = {
            security: { x: 150, y: 78 },
            logger: { x: 180, y: 165 },
            notifier: { x: 382, y: 214 },
        };
        return map;
    }, []);

    const targetByStatus = (id, status) => {
        const s = String(status || '').toLowerCase();
        if (id === 'security') {
            if (s === 'acting') return { x: 210, y: 120 };
            if (s === 'thinking') return { x: 110, y: 120 };
            return { x: 150, y: 78 };
        }
        if (id === 'logger') {
            if (s === 'acting') return { x: 120, y: 196 };
            if (s === 'thinking') return { x: 150, y: 150 };
            if (s === 'listening') return { x: 160, y: 170 };
            return { x: 180, y: 165 };
        }
        if (id === 'notifier') {
            if (s === 'acting') return { x: 412, y: 236 };
            if (s === 'error') return { x: 382, y: 214 };
            return { x: 382, y: 214 };
        }
        return basePx[id] || { x: 100, y: 100 };
    };

    useEffect(() => {
        const el = roomRef.current;
        if (!el) return;

        const tick = () => {
            const rect = el.getBoundingClientRect();
            const sx = rect.width / 480;
            const sy = rect.height / 270;

            setMotion((prev) => {
                const next = { ...prev };
                for (const a of agents || []) {
                    const id = a.id;
                    const cur = next[id] || { x: 0, y: 0, facing: 'right' };
                    const base = basePx[id] || { x: 100, y: 100 };
                    const target = targetByStatus(id, a.status);
                    const dx = (target.x - base.x) * sx;
                    const dy = (target.y - base.y) * sy;

                    const ease = String(a.status || '').toLowerCase() === 'idle' ? 0.08 : 0.14;
                    const nx = cur.x + (dx - cur.x) * ease;
                    const ny = cur.y + (dy - cur.y) * ease;
                    const facing = nx < cur.x ? 'left' : (nx > cur.x ? 'right' : cur.facing);
                    next[id] = { x: nx, y: ny, facing };
                }
                return next;
            });

            rafRef.current = window.requestAnimationFrame(tick);
        };

        rafRef.current = window.requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
        };
    }, [agents, basePx]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;

        const W = canvas.width;
        const H = canvas.height;

        const fill = (x, y, w, h, c) => {
            ctx.fillStyle = c;
            ctx.fillRect(x, y, w, h);
        };

        const rect = (x, y, w, h, c) => {
            ctx.strokeStyle = c;
            ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        };

        const tile = (x, y, s, c1, c2) => {
            fill(x, y, s, s, c1);
            fill(x, y, 1, s, c2);
            fill(x, y, s, 1, c2);
        };

        const woodFloor = (x0, y0, w, h) => {
            const s = 6;
            for (let y = y0; y < y0 + h; y += s) {
                for (let x = x0; x < x0 + w; x += s) {
                    const alt = ((x / s + y / s) | 0) % 2 === 0;
                    tile(x, y, s, alt ? '#8b5a2b' : '#7a4b23', '#5b3a1a');
                }
            }
        };

        const blueCarpet = (x0, y0, w, h) => {
            const s = 6;
            for (let y = y0; y < y0 + h; y += s) {
                for (let x = x0; x < x0 + w; x += s) {
                    const alt = ((x / s + y / s) | 0) % 2 === 0;
                    tile(x, y, s, alt ? '#2b4a6a' : '#26435f', '#162636');
                }
            }
        };

        const kitchenTile = (x0, y0, w, h) => {
            const s = 6;
            for (let y = y0; y < y0 + h; y += s) {
                for (let x = x0; x < x0 + w; x += s) {
                    const alt = ((x / s + y / s) | 0) % 2 === 0;
                    tile(x, y, s, alt ? '#e5e7eb' : '#d1d5db', '#9ca3af');
                }
            }
        };

        const drawPlant = (x, y) => {
            fill(x, y + 8, 10, 8, '#6b4e2e');
            rect(x, y + 8, 10, 8, '#3b2a18');
            fill(x + 2, y + 2, 6, 8, '#16a34a');
            fill(x + 1, y + 4, 2, 6, '#22c55e');
            fill(x + 7, y + 4, 2, 6, '#22c55e');
        };

        const drawDesk = (x, y) => {
            fill(x, y, 22, 14, '#6b4e2e');
            rect(x, y, 22, 14, '#2d1f12');
            fill(x + 6, y + 3, 10, 6, '#111827');
            fill(x + 7, y + 4, 8, 4, '#60a5fa');
            fill(x + 2, y + 10, 4, 2, '#3b82f6');
            fill(x + 16, y + 10, 4, 2, '#3b82f6');
        };

        const drawBookshelf = (x, y, w) => {
            fill(x, y, w, 10, '#7c3e1d');
            rect(x, y, w, 10, '#3b1d0d');
            for (let i = 2; i < w - 2; i += 4) {
                fill(x + i, y + 2, 2, 6, i % 8 === 2 ? '#ef4444' : '#f59e0b');
            }
        };

        const drawVending = (x, y) => {
            fill(x, y, 14, 20, '#374151');
            rect(x, y, 14, 20, '#111827');
            fill(x + 2, y + 3, 10, 8, '#1f2937');
            fill(x + 3, y + 4, 8, 6, '#60a5fa');
            fill(x + 3, y + 13, 8, 2, '#9ca3af');
            fill(x + 3, y + 16, 8, 2, '#6b7280');
        };

        const drawFridge = (x, y) => {
            fill(x, y, 14, 22, '#e5e7eb');
            rect(x, y, 14, 22, '#9ca3af');
            fill(x + 1, y + 11, 12, 1, '#9ca3af');
            fill(x + 11, y + 6, 2, 2, '#6b7280');
            fill(x + 11, y + 16, 2, 2, '#6b7280');
        };

        const drawWater = (x, y) => {
            fill(x, y + 10, 10, 10, '#9ca3af');
            rect(x, y + 10, 10, 10, '#6b7280');
            fill(x + 2, y, 6, 10, '#60a5fa');
            rect(x + 2, y, 6, 10, '#1d4ed8');
        };

        const drawClock = (x, y) => {
            fill(x, y, 10, 10, '#f3f4f6');
            rect(x, y, 10, 10, '#9ca3af');
            fill(x + 4, y + 3, 1, 4, '#111827');
            fill(x + 4, y + 4, 3, 1, '#111827');
        };

        fill(0, 0, W, H, '#0b1020');

        const walls = (x, y, w, h) => {
            fill(x, y, w, h, '#0f172a');
            rect(x, y, w, h, '#1f2a44');
        };

        walls(90, 12, 140, 90);
        woodFloor(98, 20, 124, 74);

        walls(30, 90, 220, 150);
        woodFloor(38, 98, 204, 134);

        walls(250, 110, 210, 70);
        kitchenTile(258, 118, 194, 54);

        walls(290, 180, 170, 90);
        blueCarpet(298, 188, 154, 74);

        woodFloor(150, 96, 30, 30);

        drawPlant(104, 26);
        drawPlant(210, 26);
        drawDesk(140, 40);
        drawDesk(120, 60);
        drawDesk(170, 60);
        fill(154, 52, 12, 10, '#7c3e1d');
        rect(154, 52, 12, 10, '#3b1d0d');

        drawBookshelf(40, 110, 70);
        drawBookshelf(120, 110, 70);
        drawDesk(60, 160);
        drawDesk(110, 160);
        drawDesk(60, 200);
        drawDesk(110, 200);
        drawPlant(42, 210);
        drawPlant(225, 210);

        drawVending(300, 122);
        drawWater(320, 128);
        drawClock(352, 128);
        fill(380, 140, 50, 8, '#e5e7eb');
        rect(380, 140, 50, 8, '#9ca3af');
        drawFridge(436, 120);

        drawBookshelf(304, 196, 70);
        drawBookshelf(380, 196, 70);
        drawPlant(304, 240);
        drawPlant(442, 240);
        fill(340, 220, 60, 22, '#6b4e2e');
        rect(340, 220, 60, 22, '#2d1f12');
        fill(360, 228, 10, 8, '#111827');
        fill(361, 229, 8, 6, '#60a5fa');

        fill(92, 12, 136, 6, '#111827');
        fill(32, 90, 216, 6, '#111827');
        fill(252, 110, 206, 6, '#111827');
        fill(292, 180, 166, 6, '#111827');
    }, []);

    return (
        <div
            className="card"
            style={{
                overflow: 'hidden',
                borderRadius: 18,
                border: '1px solid rgba(148,163,184,0.18)',
                background: '#070b16',
            }}
        >
            <div
                ref={roomRef}
                style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16 / 9',
                    background: '#070b16',
                }}
            >
                <canvas
                    ref={canvasRef}
                    width={480}
                    height={270}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        imageRendering: 'pixelated',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'linear-gradient(180deg, rgba(2,6,23,0.25) 0%, rgba(2,6,23,0.35) 70%, rgba(2,6,23,0.55) 100%)',
                    }}
                />

                {agents.map((a) => {
                    const m = motion[a.id] || { x: 0, y: 0, facing: 'right' };
                    return (
                        <Agent
                            key={a.id}
                            id={a.id}
                            name={a.name}
                            status={a.status}
                            bubbleText={a.bubbleText}
                            bubbleKeyboard={a.bubbleKeyboard}
                            facing={m.facing}
                            style={{
                                ...a.pos,
                                transform: `translate(${Math.round(m.x)}px, ${Math.round(m.y)}px)`,
                            }}
                        />
                    );
                })}

                <div
                    style={{
                        position: 'absolute',
                        left: 18,
                        bottom: 18,
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                    }}
                >
                    <button type="button" className="btn btn-primary btn-sm" onClick={onRunClick}>
                        Open Command Dock
                    </button>
                    <div
                        style={{
                            color: '#cbd5e1',
                            fontSize: 12,
                            background: 'rgba(2,6,23,0.65)',
                            border: '1px solid rgba(148,163,184,0.22)',
                            borderRadius: 999,
                            padding: '6px 10px',
                            backdropFilter: 'blur(6px)',
                        }}
                    >
                        3 agents · realtime
                    </div>
                </div>
            </div>
        </div>
    );
}
