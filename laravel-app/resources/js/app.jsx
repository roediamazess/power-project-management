import '../css/app.css';
import './bootstrap';

import React from 'react';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Power Project Management';

const hidePreloader = () => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('preloader');
    if (el) el.style.display = 'none';
};

const collapseSidebarOnMobile = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if ((window.innerWidth ?? 9999) > 1199) return;

    const menu = document.getElementById('menu') || document.querySelector('.dlabnav .metismenu');
    if (!menu) return;

    menu.querySelectorAll('ul').forEach((ul) => {
        ul.classList.remove('mm-show', 'mm-collapsing');
        ul.classList.add('mm-collapse');
        ul.style.height = '';
        ul.style.display = 'none';
    });
    menu.querySelectorAll('li.mm-active').forEach((li) => li.classList.remove('mm-active'));
    menu.querySelectorAll('a.has-arrow').forEach((a) => a.setAttribute('aria-expanded', 'false'));
};

if (typeof window !== 'undefined' && window.Ziggy && window.location?.origin) {
    try {
        const existing = new URL(String(window.Ziggy.url || ''), window.location.origin);
        const basePath = existing.pathname && existing.pathname !== '/' ? existing.pathname.replace(/\/+$/, '') : '';
        window.Ziggy.url = window.location.origin + basePath;
    } catch (_e) {
        window.Ziggy.url = window.location.origin;
    }
}

if (typeof window !== 'undefined' && !window.__pp_route_wrapped__ && typeof window.route === 'function') {
    window.__pp_route_wrapped__ = true;

    const originalRoute = window.route;

    window.route = (name, params, absolute = true, config = window.Ziggy) => {
        if (absolute === false) {
            try {
                const base = new URL(String(config?.url || ''), window.location.origin);
                const basePath = base.pathname && base.pathname !== '/' ? base.pathname.replace(/\/+$/, '') : '';
                const rel = originalRoute(name, params, false, config);
                const relPath = String(rel || '').startsWith('/') ? String(rel || '') : `/${rel || ''}`;
                return `${basePath}${relPath}` || relPath;
            } catch (_e) {
                return originalRoute(name, params, false, config);
            }
        }

        return originalRoute(name, params, absolute, config);
    };
}


class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error) {
        if (typeof window !== 'undefined') {
            window.__last_inertia_error__ = error;
        }
    }

    render() {
        if (!this.state.error) return this.props.children;

        const message = String(this.state.error?.message ?? this.state.error);
        return (
            <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
                <h2 style={{ margin: 0, marginBottom: 8 }}>Terjadi error pada aplikasi</h2>
                <p style={{ margin: 0, marginBottom: 16 }}>Halaman ini gagal dirender. Silakan refresh.</p>
                <pre style={{ whiteSpace: 'pre-wrap', background: '#111827', color: '#E5E7EB', padding: 12, borderRadius: 8 }}>{message}</pre>
            </div>
        );
    }
}


if (typeof window !== 'undefined') {
    try {
        router.on('finish', () => {
            hidePreloader();
            collapseSidebarOnMobile();
            setTimeout(collapseSidebarOnMobile, 0);
            setTimeout(collapseSidebarOnMobile, 200);
        });
    } catch (_e) {
    }
}

createInertiaApp({
    title: () => appName,
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.jsx');
        const path = `./Pages/${name}.jsx`;
        if (!pages[path]) {
            console.error(`Page not found: ${path}. Forcing reload to fetch new assets...`);
            window.location.href = window.location.pathname + "?v=" + Date.now();
            return;
        }
        return typeof pages[path] === 'function' ? pages[path]() : pages[path];
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ErrorBoundary>
                <App {...props} />
            </ErrorBoundary>
        );

        hidePreloader();
    },
    progress: {
        color: '#4B5563',
    },
});
