import { useEffect, useMemo, useRef } from 'react';

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

function roleToVariant(agentId) {
    const id = String(agentId || '').toLowerCase();
    if (id === 'security') return 'guardian';
    if (id === 'logger') return 'observer';
    if (id === 'notifier') return 'messenger';
    return 'guardian';
}

function draw(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
}

function px(ctx, x, y, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, 1, 1);
}

function renderSprite(ctx, frame, anim, variant, mood, facing) {
    ctx.clearRect(0, 0, 32, 48);
    ctx.imageSmoothingEnabled = false;

    const baseOutline = mood === 'error' ? '#ef4444' : '#0b1020';
    const shadow = mood === 'offline' ? 'rgba(100,116,139,0.35)' : 'rgba(0,0,0,0.35)';

    const bob = anim === 'idle' ? Math.round(Math.sin(frame / 18) * 1) : 0;
    const step = anim === 'walk' ? (frame % 20 < 10 ? 0 : 1) : 0;
    const tap = anim === 'type' ? (frame % 14 < 7 ? 0 : 1) : 0;

    const y0 = 5 + bob;
    const x0 = 8;

    draw(ctx, 10, 43, 12, 2, shadow);

    const pal = (() => {
        const common = {
            o: baseOutline,
            skin1: mood === 'offline' ? '#9ca3af' : '#f2c7a6',
            skin2: mood === 'offline' ? '#94a3b8' : '#e8bfa0',
            white: mood === 'offline' ? '#cbd5e1' : '#e5e7eb',
            black: '#111827',
            gray: '#374151',
            dark: '#0b1020',
            blue: '#2563eb',
            red: '#ef4444',
            green: '#22c55e',
            yellow: '#f59e0b',
        };
        if (variant === 'guardian') {
            return {
                ...common,
                hair: mood === 'offline' ? '#94a3b8' : '#d1d5db',
                suit: mood === 'offline' ? '#64748b' : '#111827',
                tie: mood === 'offline' ? '#94a3b8' : '#ef4444',
                accent: mood === 'offline' ? '#94a3b8' : '#fbbf24',
            };
        }
        if (variant === 'observer') {
            return {
                ...common,
                hair: mood === 'offline' ? '#64748b' : '#8b5cf6',
                blazer: mood === 'offline' ? '#64748b' : '#1d4ed8',
                skirt: mood === 'offline' ? '#64748b' : '#111827',
                accent: mood === 'offline' ? '#94a3b8' : '#60a5fa',
            };
        }
        return {
            ...common,
            hair: mood === 'offline' ? '#64748b' : '#111827',
            shirt: mood === 'offline' ? '#64748b' : '#ef4444',
            jeans: mood === 'offline' ? '#64748b' : '#1f2937',
            accent: mood === 'offline' ? '#94a3b8' : '#60a5fa',
        };
    })();

    const flip = facing === 'left';
    const fx = (x) => (flip ? 31 - x : x);
    const rect = (x, y, w, h, c) => {
        if (!flip) {
            draw(ctx, x, y, w, h, c);
            return;
        }
        draw(ctx, fx(x + w - 1) - (w - 1), y, w, h, c);
    };
    const p = (x, y, c) => px(ctx, flip ? fx(x) : x, y, c);

    const legA = anim === 'walk' ? step : 0;
    const legB = anim === 'walk' ? 1 - step : 0;

    rect(x0 + 2, y0 + 26, 8, 12, pal.o);
    rect(x0 + 3, y0 + 27, 6, 10, variant === 'observer' ? pal.skirt : (variant === 'guardian' ? pal.suit : pal.jeans));

    rect(x0 + 3, y0 + 36, 2, 7, pal.o);
    rect(x0 + 7, y0 + 36, 2, 7, pal.o);
    rect(x0 + 3, y0 + 36 + legA, 2, 6, variant === 'observer' ? pal.skin2 : (variant === 'guardian' ? pal.gray : pal.jeans));
    rect(x0 + 7, y0 + 36 + legB, 2, 6, variant === 'observer' ? pal.skin2 : (variant === 'guardian' ? pal.gray : pal.jeans));
    rect(x0 + 2, y0 + 41 + legA, 4, 2, pal.dark);
    rect(x0 + 6, y0 + 41 + legB, 4, 2, pal.dark);

    rect(x0 + 2, y0 + 16, 8, 12, pal.o);
    if (variant === 'guardian') {
        rect(x0 + 3, y0 + 17, 6, 10, pal.suit);
        rect(x0 + 5, y0 + 18, 2, 6, pal.tie);
        rect(x0 + 3, y0 + 19, 2, 2, pal.white);
        rect(x0 + 7, y0 + 19, 2, 2, pal.white);
        rect(x0 + 3, y0 + 23, 6, 1, pal.accent);
    } else if (variant === 'observer') {
        rect(x0 + 3, y0 + 17, 6, 10, pal.blazer);
        rect(x0 + 4, y0 + 19, 4, 4, pal.white);
        rect(x0 + 4, y0 + 23, 4, 1, pal.accent);
    } else {
        rect(x0 + 3, y0 + 17, 6, 10, pal.shirt);
        rect(x0 + 3, y0 + 19, 6, 1, pal.white);
        rect(x0 + 3, y0 + 22, 6, 1, pal.white);
    }

    const armSwing = anim === 'walk' ? step : 0;
    const armTap = anim === 'type' ? tap : 0;
    rect(x0 + 0, y0 + 18, 3, 3, pal.o);
    rect(x0 + 9, y0 + 18, 3, 3, pal.o);
    rect(x0 + 0, y0 + 18 + armSwing, 2, 2, pal.skin1);
    rect(x0 + 10, y0 + 18 + (1 - armSwing), 2, 2, pal.skin1);
    if (anim === 'type') {
        rect(x0 + 3, y0 + 22, 2, 2, pal.skin1);
        rect(x0 + 7, y0 + 22, 2, 2, pal.skin1);
        rect(x0 + 4, y0 + 24, 4, 2, pal.black);
        rect(x0 + 4, y0 + 24, 4, 2, armTap ? '#1f2937' : pal.black);
        if (variant === 'messenger') {
            rect(x0 + 9, y0 + 20, 2, 3, pal.black);
            rect(x0 + 9, y0 + 20, 2, 1, pal.accent);
        }
    }

    rect(x0 + 2, y0 + 6, 8, 10, pal.o);
    rect(x0 + 3, y0 + 7, 6, 8, pal.skin1);

    if (variant === 'guardian') {
        rect(x0 + 2, y0 + 6, 8, 3, pal.hair);
        rect(x0 + 2, y0 + 9, 2, 2, pal.hair);
        rect(x0 + 8, y0 + 9, 2, 2, pal.hair);
    } else if (variant === 'observer') {
        rect(x0 + 2, y0 + 6, 8, 3, pal.hair);
        rect(x0 + 8, y0 + 9, 3, 4, pal.hair);
        rect(x0 + 10, y0 + 11, 2, 2, pal.hair);
    } else {
        rect(x0 + 2, y0 + 6, 8, 3, pal.hair);
        rect(x0 + 2, y0 + 9, 2, 2, pal.hair);
        rect(x0 + 8, y0 + 9, 2, 2, pal.hair);
        rect(x0 + 1, y0 + 7, 2, 2, pal.hair);
    }

    const blink = anim === 'idle' && frame % 80 < 4;
    const eye = mood === 'offline' ? '#64748b' : '#111827';
    if (blink) {
        rect(x0 + 4, y0 + 10, 1, 1, eye);
        rect(x0 + 7, y0 + 10, 1, 1, eye);
    } else {
        rect(x0 + 4, y0 + 9, 1, 2, eye);
        rect(x0 + 7, y0 + 9, 1, 2, eye);
    }
    p(x0 + 6, y0 + 12, variant === 'guardian' ? pal.accent : pal.yellow);

    if (variant === 'guardian') {
        rect(x0 - 1, y0 + 20, 3, 6, pal.o);
        rect(x0, y0 + 21, 1, 4, pal.accent);
    }
}

export default function OfficeCharacter({ agentId, status, scale = 2, facing = 'right' }) {
    const canvasRef = useRef(null);
    const rafRef = useRef(0);
    const frameRef = useRef(0);

    const anim = useMemo(() => statusToAnim(status), [status]);
    const variant = useMemo(() => roleToVariant(agentId), [agentId]);
    const mood = useMemo(() => {
        const s = String(status || '').toLowerCase();
        if (s === 'error') return 'error';
        if (s === 'offline') return 'offline';
        return 'normal';
    }, [status]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;

        const loop = () => {
            frameRef.current = (frameRef.current + 1) % 1000000;
            renderSprite(ctx, frameRef.current, anim, variant, mood, String(facing || 'right'));
            rafRef.current = window.requestAnimationFrame(loop);
        };

        rafRef.current = window.requestAnimationFrame(loop);
        return () => {
            if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
        };
    }, [anim, variant, mood, facing]);

    const sc = clamp(Number(scale) || 2, 1, 6);

    return (
        <canvas
            ref={canvasRef}
            width={32}
            height={48}
            style={{
                width: 32 * sc,
                height: 48 * sc,
                imageRendering: 'pixelated',
            }}
            aria-hidden="true"
        />
    );
}

