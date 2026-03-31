import { useEffect, useMemo, useRef } from 'react';

function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
}

function drawRect(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
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

function hexToRgb(hex) {
    const h = String(hex || '').replace('#', '');
    if (h.length !== 6) return null;
    const n = parseInt(h, 16);
    if (Number.isNaN(n)) return null;
    return {
        r: (n >> 16) & 255,
        g: (n >> 8) & 255,
        b: n & 255,
    };
}

function mixHex(hex, targetHex, t) {
    const a = hexToRgb(hex);
    const b = hexToRgb(targetHex);
    if (!a || !b) return hex;
    const k = clamp(Number(t) || 0, 0, 1);
    const r = Math.round(a.r + (b.r - a.r) * k);
    const g = Math.round(a.g + (b.g - a.g) * k);
    const bl = Math.round(a.b + (b.b - a.b) * k);
    return `rgb(${r},${g},${bl})`;
}

function sprite(rows) {
    return rows.map((r) => r.padEnd(16, '.').slice(0, 16));
}

const SPRITES = {
    a: {
        palette: {
            o: '#111827',
            s: '#f2c7a6',
            h: '#c99a3a',
            t: '#3b82f6',
            p: '#1f2937',
            b: '#0b1020',
            w: '#e5e7eb',
        },
        idle: sprite([
            '....hhhhhh......',
            '...hhhhhhhh.....',
            '..hhhoooohhh....',
            '..hhossssohh....',
            '..hoss..ssoh....',
            '..hoss..ssoh....',
            '...hossssoh.....',
            '....hooooh......',
            '.....otttto.....',
            '....otwtttto....',
            '....otwtttto....',
            '....otttttto....',
            '.....otttto.....',
            '......oppo......',
            '.....oppppo.....',
            '.....oppppo.....',
            '.....oppppo.....',
            '.....oppppo.....',
            '.....oppppo.....',
            '.....ob..bo.....',
            '....obb..bbo....',
            '....oo....oo....',
            '................',
            '................',
        ]),
        walk: [
            sprite([
                '....hhhhhh......',
                '...hhhhhhhh.....',
                '..hhhoooohhh....',
                '..hhossssohh....',
                '..hoss..ssoh....',
                '..hoss..ssoh....',
                '...hossssoh.....',
                '....hooooh......',
                '.....otttto.....',
                '....otttttto....',
                '....otttttto....',
                '....otttttto....',
                '.....otttto.....',
                '......oppo......',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....ob..bo.....',
                '....obb..bbo....',
                '...oo......oo...',
                '................',
                '................',
            ]),
            sprite([
                '....hhhhhh......',
                '...hhhhhhhh.....',
                '..hhhoooohhh....',
                '..hhossssohh....',
                '..hoss..ssoh....',
                '..hoss..ssoh....',
                '...hossssoh.....',
                '....hooooh......',
                '.....otttto.....',
                '....otttttto....',
                '....otttttto....',
                '....otttttto....',
                '.....otttto.....',
                '......oppo......',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....ob..bo.....',
                '....obb..bbo....',
                '....oo....oo....',
                '................',
                '................',
            ]),
        ],
    },
    c: {
        palette: {
            o: '#111827',
            s: '#caa78e',
            h: '#2d2a2e',
            t: '#ef4444',
            p: '#1f2937',
            b: '#0b1020',
            w: '#f59e0b',
        },
        idle: sprite([
            '....hhhhhh......',
            '...hhhhhhhh.....',
            '..hhhoooohhh....',
            '..hhossssohh....',
            '..hosw..wsoh....',
            '..hoss..ssoh....',
            '...hossssoh.....',
            '....hooooh......',
            '.....otttto.....',
            '....otttttto....',
            '....otttttto....',
            '....otttttto....',
            '.....otttto.....',
            '......oppo......',
            '.....oppppo.....',
            '.....oppppo.....',
            '.....oppppo.....',
            '.....oppppo.....',
            '.....oppppo.....',
            '.....ob..bo.....',
            '....obb..bbo....',
            '....oo....oo....',
            '................',
            '................',
        ]),
        walk: [
            sprite([
                '....hhhhhh......',
                '...hhhhhhhh.....',
                '..hhhoooohhh....',
                '..hhossssohh....',
                '..hosw..wsoh....',
                '..hoss..ssoh....',
                '...hossssoh.....',
                '....hooooh......',
                '.....otttto.....',
                '....otttttto....',
                '....otttttto....',
                '....otttttto....',
                '.....otttto.....',
                '......oppo......',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....ob..bo.....',
                '....obb..bbo....',
                '...oo......oo...',
                '................',
                '................',
            ]),
            sprite([
                '....hhhhhh......',
                '...hhhhhhhh.....',
                '..hhhoooohhh....',
                '..hhossssohh....',
                '..hosw..wsoh....',
                '..hoss..ssoh....',
                '...hossssoh.....',
                '....hooooh......',
                '.....otttto.....',
                '....otttttto....',
                '....otttttto....',
                '....otttttto....',
                '.....otttto.....',
                '......oppo......',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....ob..bo.....',
                '....obb..bbo....',
                '....oo....oo....',
                '................',
                '................',
            ]),
        ],
    },
    e: {
        palette: {
            o: '#111827',
            s: '#f2c7a6',
            h: '#e5e7eb',
            t: '#ffffff',
            p: '#9ca3af',
            b: '#0b1020',
            w: '#60a5fa',
        },
        idle: sprite([
            '....hhhhhh......',
            '...hhhhhhhh.....',
            '..hhhoooohhh....',
            '..hhossssohh....',
            '..hosw..wsoh....',
            '..hoss..ssoh....',
            '...hossssoh.....',
            '....hooooh......',
            '.....otttto.....',
            '....otttttto....',
            '....otttttto....',
            '....otttttto....',
            '.....otttto.....',
            '......oppo......',
            '.....oppppo.....',
            '.....oppppo.....',
            '.....oppppo.....',
            '.....oppppo.....',
            '.....oppppo.....',
            '.....ob..bo.....',
            '....obb..bbo....',
            '....oo....oo....',
            '................',
            '................',
        ]),
        walk: [
            sprite([
                '....hhhhhh......',
                '...hhhhhhhh.....',
                '..hhhoooohhh....',
                '..hhossssohh....',
                '..hosw..wsoh....',
                '..hoss..ssoh....',
                '...hossssoh.....',
                '....hooooh......',
                '.....otttto.....',
                '....otttttto....',
                '....otttttto....',
                '....otttttto....',
                '.....otttto.....',
                '......oppo......',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....ob..bo.....',
                '....obb..bbo....',
                '...oo......oo...',
                '................',
                '................',
            ]),
            sprite([
                '....hhhhhh......',
                '...hhhhhhhh.....',
                '..hhhoooohhh....',
                '..hhossssohh....',
                '..hosw..wsoh....',
                '..hoss..ssoh....',
                '...hossssoh.....',
                '....hooooh......',
                '.....otttto.....',
                '....otttttto....',
                '....otttttto....',
                '....otttttto....',
                '.....otttto.....',
                '......oppo......',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....oppppo.....',
                '.....ob..bo.....',
                '....obb..bbo....',
                '....oo....oo....',
                '................',
                '................',
            ]),
        ],
    },
};

function applyMood(color, mood, role) {
    if (!color) return color;
    if (mood === 'offline') return mixHex(color, '#64748b', 0.55);
    if (mood === 'error' && role === 'o') return '#ef4444';
    return color;
}

function renderSprite(ctx, frame, anim, skinKey, mood) {
    ctx.clearRect(0, 0, 24, 32);

    const data = SPRITES[String(skinKey || 'a').toLowerCase()] || SPRITES.a;
    const base = data.idle;
    const walkFrames = Array.isArray(data.walk) ? data.walk : [base, base];

    const bob = anim === 'idle' ? Math.round(Math.sin(frame / 18) * 1) : 0;
    const yOff = 4 + bob;
    const xOff = 4;

    const shadow = mood === 'offline' ? 'rgba(100,116,139,0.30)' : 'rgba(0,0,0,0.35)';
    drawRect(ctx, 7, 28, 10, 2, shadow);

    const use = anim === 'walk' ? walkFrames[(frame % 16 < 8) ? 0 : 1] : base;
    const pal = data.palette || {};

    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < use.length; y++) {
        const row = use[y];
        for (let x = 0; x < row.length; x++) {
            const ch = row[x];
            if (ch === '.') continue;
            const col = applyMood(pal[ch], mood, ch);
            if (!col) continue;
            ctx.fillStyle = col;
            ctx.fillRect(xOff + x, yOff + y, 1, 1);
        }
    }

    if (anim === 'type') {
        const t = frame % 12 < 6;
        ctx.fillStyle = applyMood(pal.s, mood, 's');
        ctx.fillRect(xOff + (t ? 4 : 10), yOff + 12, 2, 2);
        ctx.fillStyle = applyMood(pal.o, mood, 'o');
        ctx.fillRect(xOff + 7, yOff + 14, 2, 2);
        ctx.fillRect(xOff + 9, yOff + 14, 2, 2);
    }
}

export default function PixelCharacter({ status, skin = 'a', scale = 2, facing = 'right' }) {
    const canvasRef = useRef(null);
    const rafRef = useRef(0);
    const frameRef = useRef(0);

    const mood = useMemo(() => {
        const s = String(status || '').toLowerCase();
        if (s === 'error') return 'error';
        if (s === 'offline') return 'offline';
        return 'normal';
    }, [status]);

    const anim = useMemo(() => statusToAnim(status), [status]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;

        const loop = () => {
            frameRef.current = (frameRef.current + 1) % 1000000;
            renderSprite(ctx, frameRef.current, anim, skin, mood);
            rafRef.current = window.requestAnimationFrame(loop);
        };

        rafRef.current = window.requestAnimationFrame(loop);
        return () => {
            if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
        };
    }, [anim, skin, mood]);

    const sc = clamp(Number(scale) || 2, 1, 6);
    const flip = String(facing || 'right') === 'left' ? 'scaleX(-1)' : '';

    return (
        <canvas
            ref={canvasRef}
            width={24}
            height={32}
            style={{
                width: 24 * sc,
                height: 32 * sc,
                imageRendering: 'pixelated',
                transform: flip,
            }}
            aria-hidden="true"
        />
    );
}
