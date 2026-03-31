import { useEffect, useMemo, useRef, useState } from 'react';

function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
}

function statusToAnim(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'acting') return 'walk';
    if (s === 'thinking') return 'type';
    if (s === 'listening') return 'idle';
    if (s === 'error') return 'error';
    if (s === 'offline') return 'offline';
    return 'idle';
}

function roleForAgent(agentId) {
    const id = String(agentId || '').toLowerCase();
    if (id === 'security') return 0;
    if (id === 'logger') return 2;
    if (id === 'notifier') return 1;
    return 0;
}

function sheetUrl(version) {
    const v = version ? `?v=${encodeURIComponent(String(version))}` : '';
    return `/office-agent/sprites/sheet.png${v}`;
}

function computeGrid(img) {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const groups = 3;
    const groupW = Math.floor(w / groups);
    const groupH = h;

    const cols = 4;
    const rows = 3;
    const cellW = Math.floor(groupW / cols);
    const cellH = Math.floor(groupH / rows);

    return { w, h, groups, groupW, groupH, cols, rows, cellW, cellH };
}

function frameRect(grid, role, row, col) {
    const gx = clamp(role, 0, grid.groups - 1);
    const r = clamp(row, 0, grid.rows - 1);
    const c = clamp(col, 0, grid.cols - 1);
    const x = gx * grid.groupW + c * grid.cellW;
    const y = r * grid.cellH;
    const w = grid.cellW;
    const h = grid.cellH;
    return { x, y, w, h };
}

export default function SpriteSheetCharacter({ agentId, status, scale = 2, facing = 'right', version }) {
    const canvasRef = useRef(null);
    const rafRef = useRef(0);
    const frameRef = useRef(0);

    const [img, setImg] = useState(null);
    const [grid, setGrid] = useState(null);

    const src = useMemo(() => sheetUrl(version), [version]);
    const anim = useMemo(() => statusToAnim(status), [status]);
    const role = useMemo(() => roleForAgent(agentId), [agentId]);

    useEffect(() => {
        let alive = true;
        const im = new Image();
        im.decoding = 'async';
        im.onload = () => {
            if (!alive) return;
            setImg(im);
            setGrid(computeGrid(im));
        };
        im.onerror = () => {
            if (!alive) return;
            setImg(null);
            setGrid(null);
        };
        im.src = src;
        return () => {
            alive = false;
        };
    }, [src]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;

        const loop = () => {
            frameRef.current = (frameRef.current + 1) % 1000000;
            const f = frameRef.current;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (!img || !grid) {
                ctx.fillStyle = 'rgba(239,68,68,0.10)';
                ctx.fillRect(2, 2, canvas.width - 4, canvas.height - 4);
                ctx.strokeStyle = 'rgba(239,68,68,0.75)';
                ctx.lineWidth = 2;
                ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
                rafRef.current = window.requestAnimationFrame(loop);
                return;
            }

            const mood = String(status || '').toLowerCase();
            const bob = anim === 'idle' ? Math.round(Math.sin(f / 18) * 1) : 0;
            const walkIdx = anim === 'walk' ? (f % 24 < 12 ? 0 : 1) : 0;
            const typeIdx = anim === 'type' ? (f % 16 < 8 ? 1 : 2) : 0;

            let row = 0;
            let col = 0;
            if (anim === 'walk') {
                row = 1;
                col = walkIdx;
            } else if (anim === 'type') {
                row = 0;
                col = typeIdx;
            } else {
                row = 0;
                col = 0;
            }

            const fr = frameRect(grid, role, row, col);
            const dw = canvas.width;
            const dh = canvas.height;
            const s = Math.min(dw / fr.w, dh / fr.h);
            const rw = Math.round(fr.w * s);
            const rh = Math.round(fr.h * s);
            const dx = Math.round((dw - rw) / 2);
            const dy = Math.round((dh - rh) / 2) + bob;

            ctx.drawImage(img, fr.x, fr.y, fr.w, fr.h, dx, dy, rw, rh);

            if (mood === 'error') {
                ctx.strokeStyle = 'rgba(239,68,68,0.9)';
                ctx.lineWidth = 2;
                ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
            }

            rafRef.current = window.requestAnimationFrame(loop);
        };

        rafRef.current = window.requestAnimationFrame(loop);
        return () => {
            if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
        };
    }, [img, grid, status, anim, role]);

    const sc = clamp(Number(scale) || 2, 1, 6);
    const flip = String(facing || 'right') === 'left' ? 'scaleX(-1)' : '';

    return (
        <canvas
            ref={canvasRef}
            width={40}
            height={56}
            style={{
                width: 40 * sc,
                height: 56 * sc,
                imageRendering: 'pixelated',
                transform: flip,
            }}
            aria-hidden="true"
        />
    );
}
