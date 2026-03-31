import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

export default function OfficeAgent() {
    useEffect(() => {
        window.location.assign('/agent-working-space/');
    }, []);

    const header = (
        <div>
            <div className="h5 mb-0">Office Agent</div>
            <div className="text-muted small">Pixel office · realtime events</div>
        </div>
    );

    return (
        <AuthenticatedLayout header={header}>
            <Head title="Office Agent" />
            <div className="container-fluid">
                <div className="text-muted">Membuka Pixel Office…</div>
                <a className="btn btn-primary mt-3" href="/agent-working-space/">
                    Buka sekarang
                </a>
            </div>
        </AuthenticatedLayout>
    );
}
