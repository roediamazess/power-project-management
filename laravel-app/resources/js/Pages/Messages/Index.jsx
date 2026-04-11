import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo } from 'react';

export default function MessagesIndex({ threads, users }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        recipient_id: '',
        subject: '',
        body: '',
    });

    const userOptions = useMemo(() => users ?? [], [users]);

    const submit = (e) => {
        e.preventDefault();
        post(route('messages.store', {}, false), {
            preserveScroll: true,
            onSuccess: () => reset('subject', 'body'),
        });
    };

    return (
        <AuthenticatedLayout header="Messages">
            <Head title="Messages" />

            <div className="row">
                <div className="col-xl-5">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="card-title mb-0">Inbox</h4>
                        </div>
                        <div className="card-body p-0">
                            <div className="list-group list-group-flush">
                                {(threads ?? []).length ? (
                                    threads.map((t) => (
                                        <Link
                                            key={t.user?.id}
                                            href={route('messages.show', { otherUser: t.user?.id }, false)}
                                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
                                        >
                                            <div className="me-2">
                                                <div className="fw-semibold">{t.user?.full_name || t.user?.name}</div>
                                                <div className="text-muted fs-12">{t.last_message?.body}</div>
                                            </div>
                                            <div className="text-end">
                                                {t.unread_count > 0 ? <div className="badge bg-danger">{t.unread_count}</div> : null}
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="p-3 text-muted">No messages yet</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-7">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="card-title mb-0">New Message</h4>
                        </div>
                        <div className="card-body">
                            <form onSubmit={submit}>
                                <div className="row g-3">
                                    <div className="col-12">
                                        <label className="form-label">To</label>
                                        <select
                                            className="form-select"
                                            value={data.recipient_id}
                                            onChange={(e) => setData('recipient_id', e.target.value)}
                                        >
                                            <option value="">Select user...</option>
                                            {userOptions.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.full_name || u.name} {u.email ? `(${u.email})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.recipient_id ? <div className="text-danger fs-12 mt-1">{errors.recipient_id}</div> : null}
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Subject</label>
                                        <input
                                            className="form-control"
                                            value={data.subject}
                                            onChange={(e) => setData('subject', e.target.value)}
                                            placeholder="(Optional)"
                                        />
                                        {errors.subject ? <div className="text-danger fs-12 mt-1">{errors.subject}</div> : null}
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Message</label>
                                        <textarea
                                            className="form-control"
                                            rows={6}
                                            value={data.body}
                                            onChange={(e) => setData('body', e.target.value)}
                                            placeholder="Write your message..."
                                        />
                                        {errors.body ? <div className="text-danger fs-12 mt-1">{errors.body}</div> : null}
                                    </div>
                                    <div className="col-12 d-flex justify-content-end">
                                        <button type="submit" className="btn btn-primary" disabled={processing || !data.recipient_id || !data.body}>
                                            Send
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
