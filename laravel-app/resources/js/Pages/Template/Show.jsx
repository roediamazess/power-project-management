import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

function TemplateShow({ title, html, assets }) {
    useEffect(() => {
        const scripts = assets?.scripts ?? [];

        const hasScript = (srcPath) => {
            const nodes = Array.from(document.querySelectorAll('script[src]'));
            return nodes.some((n) => {
                try {
                    const u = new URL(n.src, window.location.origin);
                    return u.pathname === srcPath;
                } catch {
                    return false;
                }
            });
        };

        const loadScript = (srcPath) =>
            new Promise((resolve, reject) => {
                if (hasScript(srcPath)) {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = srcPath;
                script.async = false;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error(`Failed to load ${srcPath}`));
                document.body.appendChild(script);
            });

        const run = async () => {
            for (const src of scripts) {
                try {
                    await loadScript(src);
                } catch {
                }
            }

            try {
                if (window?.jQuery) window.jQuery(window).trigger('load');
            } catch {
            }

            try {
                window.dispatchEvent(new Event('load'));
            } catch {
            }

            const Fillow = window?.Fillow;
            if (Fillow?.resize) Fillow.resize();
            if (Fillow?.handleMenuPosition) Fillow.handleMenuPosition();
        };

        const t = setTimeout(run, 50);
        return () => clearTimeout(t);
    }, [assets?.scripts, html]);

    return (
        <>
            <Head title={title} />
            <div dangerouslySetInnerHTML={{ __html: html }} />
        </>
    );
}

TemplateShow.layout = (page) => <AuthenticatedLayout header={page.props.title}>{page}</AuthenticatedLayout>;

export default TemplateShow;
