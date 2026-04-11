import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useRef } from 'react';

export default function MessagesShow({ otherUser, messages }) {
    const bottomRef = useRef(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        recipient_id: otherUser?.id ?? '',
        subject: '',
        body: '',
    });

    useEffect(() => {
        if (!bottomRef.current) return;
        bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages?.length]);

    const title = useMemo(() => otherUser?.full_name || otherUser?.name || 'Messages', [otherUser]);

    const submit = (e) => {
        e.preventDefault();
        post(route('messages.store', {}, false), {
            preserveScroll: true,
            onSuccess: () => reset('subject', 'body'),
        });
    };

    return (
        <AuthenticatedLayout header="Messages">
            <Head title={`Messages — ${title}`} />

            <div className="row">
                <div className="col-12 mb-3">
                    <Link href={route('messages.index')} className="btn btn-sm btn-outline-secondary">
                        Back
                    </Link>
                </div>

                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <div className="fw-semibold">{title}</div>
                        </div>
                        <div className="card-body" style={{ maxHeight: 520, overflowY: 'auto' }}>
                            {(messages ?? []).length ? (
                                messages.map((m) => (
                                    <div key={m.id} className={`mb-3 d-flex ${m.sender_id === otherUser?.id ? 'justify-content-start' : 'justify-content-end'}`}>
                                        <div
                                            className={`p-2 rounded ${m.sender_id === otherUser?.id ? 'bg-light text-dark' : 'bg-primary text-white'}`}
                                            style={{ maxWidth: 520, whiteSpace: 'pre-wrap' }}
                                        >
                                            {m.body}
                                            <div className={`mt-1 fs-12 ${m.sender_id === otherUser?.id ? 'text-muted' : 'text-white-50'}`}>
                                                {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-muted">No messages</div>
                            )}
                            <div ref={bottomRef} />
                        </div>
                        <div className="card-footer">
                            <form onSubmit={submit}>
                                <div className="row g-2">
                                    <div className="col-12">
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            value={data.body}
                                            onChange={(e) => setData('body', e.target.value)}
                                            placeholder="Type message..."
                                        />
                                        {errors.body ? <div className="text-danger fs-12 mt-1">{errors.body}</div> : null}
                                    </div>
                                    <div className="col-12 d-flex justify-content-end">
                                        <button type="submit" className="btn btn-primary" disabled={processing || !data.body}>
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

