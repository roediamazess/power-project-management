import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { filterByQuery } from '@/utils/smartSearch';
import { formatDateDdMmmYy } from '@/utils/date';

export default function HolidayIndex({ holidays, pageSearchQuery }) {
    const pageErrors = usePage().props.errors ?? {};
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const filteredHolidays = useMemo(() => {
        return filterByQuery(holidays ?? [], pageSearchQuery, (h) => [h.id, h.date, h.description]);
    }, [holidays, pageSearchQuery]);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        date: '',
        description: '',
    });

    useEffect(() => {
        if (!showModal) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') closeModal();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showModal]);

    const openCreate = () => {
        setEditingId(null);
        clearErrors();
        reset();
        setData({ date: '', description: '' });
        setShowModal(true);
    };

    const openEdit = (h) => {
        setEditingId(h.id);
        clearErrors();
        setData({ date: h.date ?? '', description: h.description ?? '' });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        clearErrors();
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(route('tables.holiday.update', { holiday: editingId }), {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });
            return;
        }

        post(route('tables.holiday.store'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
        });
    };

    const doDelete = async (h) => {
        const label = `${h.date} — ${h.description}`;

        if (typeof window !== 'undefined' && window.Swal?.fire) {
            const result = await window.Swal.fire({
                title: 'Hapus holiday?',
                text: label,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya, hapus',
                cancelButtonText: 'Batal',
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                reverseButtons: true,
                focusCancel: true,
            });
            if (!result.isConfirmed) return;
        } else {
            if (!window.confirm(`Delete holiday: ${label}?`)) return;
        }

        destroy(route('tables.holiday.destroy', { holiday: h.id }), {
            preserveScroll: true,
        });
    };

    const formatDate = (ymd) => {
        if (!ymd) return '-';
        return formatDateDdMmmYy(ymd);
    };

    return (
        <>
            <Head title="Holiday" />

            <div className="row">
                <div className="col-xl-12">
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <h4 className="card-title mb-0">Tables &gt; Holiday</h4>
                                <p className="mb-0 text-muted">Isi tanggal hari libur nasional untuk penandaan di Jobsheet.</p>
                            </div>
                            <div className="d-flex gap-2">
                                <button type="button" className="btn btn-primary" onClick={openCreate}>
                                    New
                                </button>
                            </div>
                        </div>

                        <div className="card-body">
                            {pageErrors.delete ? <div className="alert alert-warning">{pageErrors.delete}</div> : null}

                            <div className="table-responsive">
                                <table className="table table-striped table-responsive-md">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 80 }}>ID</th>
                                            <th style={{ width: 160 }}>Date</th>
                                            <th>Description</th>
                                            <th style={{ width: 160 }} />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHolidays.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center text-muted">
                                                    No holidays found
                                                </td>
                                            </tr>
                                        ) : null}
                                        {filteredHolidays.map((h) => (
                                            <tr key={h.id}>
                                                <td>{h.id}</td>
                                                <td>
                                                    <div className="fw-semibold">{formatDate(h.date)}</div>
                                                    <div className="text-muted fs-12">{h.date}</div>
                                                </td>
                                                <td>{h.description}</td>
                                                <td className="text-end">
                                                    <div className="d-flex gap-2 justify-content-end">
                                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openEdit(h)}>
                                                            Edit
                                                        </button>
                                                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => doDelete(h)} disabled={processing}>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showModal ? (
                <>
                    <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{editingId ? 'Edit Holiday' : 'New Holiday'}</h5>
                                    <button type="button" className="btn-close" onClick={closeModal} />
                                </div>

                                <form onSubmit={submit}>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label className="text-black font-w600 form-label required">Date</label>
                                            <input
                                                type="date"
                                                className={`form-control ${errors.date ? 'is-invalid' : ''}`}
                                                value={data.date}
                                                onChange={(e) => setData('date', e.target.value)}
                                            />
                                            {errors.date ? <div className="invalid-feedback">{errors.date}</div> : null}
                                        </div>

                                        <div className="mb-3">
                                            <label className="text-black font-w600 form-label required">Description</label>
                                            <input
                                                className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                placeholder="Contoh: Hari Raya Nyepi"
                                            />
                                            {errors.description ? <div className="invalid-feedback">{errors.description}</div> : null}
                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button type="submit" className="btn btn-primary" disabled={processing}>
                                            {editingId ? 'Update' : 'Create'}
                                        </button>
                                        <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={processing}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" onClick={closeModal} />
                </>
            ) : null}
        </>
    );
}

HolidayIndex.layout = (page) => <AuthenticatedLayout header="Holiday">{page}</AuthenticatedLayout>;
