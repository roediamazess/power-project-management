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

if (typeof window !== 'undefined' && window.Ziggy && window.location?.origin) {
    window.Ziggy.url = window.location.origin;
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
        router.on('finish', hidePreloader);
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
