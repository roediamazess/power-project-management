import { Link } from '@inertiajs/react';

export default function PublicSurveyLayout({ children }) {
    return (
        <div className="container py-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <Link href="/" className="d-flex align-items-center text-decoration-none">
                    <img className="logo-auth" src="/images/power-pro-logo-plain.png?v=20260326" alt="Power Pro Logo" style={{ maxWidth: '140px' }} />
                </Link>
            </div>
            {children}
        </div>
    );
}

