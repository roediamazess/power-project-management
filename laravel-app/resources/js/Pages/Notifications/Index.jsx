import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function NotificationsIndex({ notifications }) {
    const items = notifications?.data ?? [];

    return (
        <AuthenticatedLayout header="Notifications">
            <Head title="Notifications" />

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title mb-0">Notifications</h4>
                            <Link className="btn btn-sm btn-outline-secondary" href={route('notifications.read_all')} method="post" as="button">
                                Mark all read
                            </Link>
                        </div>
                        <div className="card-body p-0">
                            <div className="list-group list-group-flush">
                                {items.length ? (
                                    items.map((n) => (
                                        <Link
                                            key={n.id}
                                            href={route('notifications.open', { notification: n.id })}
                                            className={`list-group-item list-group-item-action d-flex justify-content-between align-items-start${
                                                n.read_at ? '' : ' fw-semibold'
                                            }`}
                                        >
                                            <div className="me-2">
                                                <div>{n.title}</div>
                                                {n.body ? <div className="text-muted fs-12">{n.body}</div> : null}
                                                <div className="text-muted fs-12">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
                                            </div>
                                            <div className="text-end">{n.read_at ? <span className="badge bg-light text-dark">Read</span> : <span className="badge bg-warning">New</span>}</div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="p-3 text-muted">No notifications</div>
                                )}
                            </div>
                        </div>
                        {notifications?.links ? (
                            <div className="card-footer">
                                <div className="d-flex flex-wrap gap-2">
                                    {notifications.links.map((l) => (
                                        <Link
                                            key={l.url ?? l.label}
                                            href={l.url ?? '#'}
                                            className={`btn btn-sm ${l.active ? 'btn-primary' : 'btn-outline-secondary'}${l.url ? '' : ' disabled'}`}
                                            dangerouslySetInnerHTML={{ __html: l.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

