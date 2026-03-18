import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="fix-wrapper">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-5 col-md-6">
                        <div className="card mb-0 h-auto">
                            <div className="card-body">
                                <div className="text-center mb-3">
                                    <Link href={route('dashboard')}>
                                        <img className="logo-auth" src="/images/logo-full.png" alt="" />
                                    </Link>
                                </div>
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
