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

function spriteForAgent(agentId) {
    const id = String(agentId || '').toLowerCase();
    if (id === 'security') return '/office-agent/sprites/agent-security.png';
    if (id === 'logger') return '/office-agent/sprites/agent-logger.png';
    if (id === 'notifier') return '/office-agent/sprites/agent-notifier.png';
    return '/office-agent/sprites/agent-logger.png';
}

function diff3(a, b) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

function computeBg(data, w, h) {
    const idx = (x, y) => (y * w + x) * 4;
    const c1 = idx(0, 0);
    const c2 = idx(w - 1, 0);
    const c3 = idx(0, h - 1);
    const c4 = idx(w - 1, h - 1);
    const r = (data[c1] + data[c2] + data[c3] + data[c4]) / 4;
    const g = (data[c1 + 1] + data[c2 + 1] + data[c3 + 1] + data[c4 + 1]) / 4;
    const b = (data[c1 + 2] + data[c2 + 2] + data[c3 + 2] + data[c4 + 2]) / 4;
    return [r, g, b];
}

function processSprite(img, maxSize = 256) {
    const ow = img.naturalWidth || img.width || 0;
    const oh = img.naturalHeight || img.height || 0;
    if (!ow || !oh) return null;

    const scale = Math.min(1, maxSize / Math.max(ow, oh));
    const w = Math.max(1, Math.round(ow * scale));
    const h = Math.max(1, Math.round(oh * scale));

    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const bg = computeBg(d, w, h);

    let transparent = 0;
    for (let i = 0; i < d.length; i += 4) {
        const rgb = [d[i], d[i + 1], d[i + 2]];
        const dv = diff3(rgb, bg);
        if (dv < 45) {
            d[i + 3] = 0;
            transparent++;
        }
    }
    ctx.putImageData(imgData, 0, 0);

    const ratio = transparent / (w * h);
    if (ratio < 0.15) {
        return { canvas: c, crop: { x: 0, y: 0, w, h }, keyed: false };
    }

    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4 + 3;
            if (d[i] > 0) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    if (maxX < 0) {
        return { canvas: c, crop: { x: 0, y: 0, w, h }, keyed: true };
    }

    const pad = 2;
    minX = clamp(minX - pad, 0, w - 1);
    minY = clamp(minY - pad, 0, h - 1);
    maxX = clamp(maxX + pad, 0, w - 1);
    maxY = clamp(maxY + pad, 0, h - 1);

    return {
        canvas: c,
        crop: { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 },
        keyed: true,
    };
}

export default function SpriteCharacter({ agentId, status, scale = 2, facing = 'right' }) {
    const canvasRef = useRef(null);
    const rafRef = useRef(0);
    const frameRef = useRef(0);

    const [sprite, setSprite] = useState(null);
    const [imgReady, setImgReady] = useState(false);

    const src = useMemo(() => spriteForAgent(agentId), [agentId]);
    const anim = useMemo(() => statusToAnim(status), [status]);

    useEffect(() => {
        let alive = true;
        setImgReady(false);
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
            if (!alive) return;
            setSprite(processSprite(img, 320));
            setImgReady(true);
        };
        img.onerror = () => {
            if (!alive) return;
            setSprite(null);
            setImgReady(false);
        };
        img.src = src;
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

            const mood = String(status || '').toLowerCase();
            const bob = anim === 'idle' ? Math.round(Math.sin(f / 18) * 1) : 0;
            const step = anim === 'walk' ? (f % 16 < 8 ? 0 : 1) : 0;
            const typeTap = anim === 'type' ? (f % 12 < 6 ? 0 : 1) : 0;

            const y = 1 + bob + (anim === 'walk' ? step : 0);
            const x = anim === 'type' ? (typeTap ? 1 : 0) : 0;

            if (sprite?.canvas) {
                const { canvas: sc, crop } = sprite;
                const dw = canvas.width;
                const dh = canvas.height;

                const s = Math.min(dw / crop.w, dh / crop.h);
                const rw = Math.round(crop.w * s);
                const rh = Math.round(crop.h * s);
                const dx = Math.round((dw - rw) / 2) + x;
                const dy = Math.round((dh - rh) / 2) + y;

                ctx.drawImage(sc, crop.x, crop.y, crop.w, crop.h, dx, dy, rw, rh);
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.fillRect(6, 6, canvas.width - 12, canvas.height - 12);
            }

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
    }, [sprite, status, anim]);

    const sc = clamp(Number(scale) || 2, 1, 6);
    const flip = String(facing || 'right') === 'left' ? 'scaleX(-1)' : '';

    return (
        <canvas
            ref={canvasRef}
            width={36}
            height={48}
            style={{
                width: 36 * sc,
                height: 48 * sc,
                imageRendering: 'pixelated',
                transform: flip,
                opacity: imgReady ? 1 : 0.9,
            }}
            aria-hidden="true"
        />
    );
}
