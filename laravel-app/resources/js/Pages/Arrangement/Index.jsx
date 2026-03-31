import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { formatDateDdMmmYy } from '@/utils/date';
import ArrangementTabs from './Partials/ArrangementTabs';

export default function Index({ isManager, availableSchedules, myPickups, myPoints }) {
    const authUserId = usePage().props?.auth?.user?.id;
    const { post, delete: destroy, processing } = useForm();

    const pickup = (scheduleId) => {
        post(route('arrangements.pickups.store', { schedule: scheduleId }, false), { preserveScroll: true });
    };

    const release = (pickupId) => {
        destroy(route('arrangements.pickups.destroy', { pickup: pickupId }, false), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Arrangement</h2>}
        >
            <Head title="Arrangement" />

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body py-2">
                            <ArrangementTabs isManager={isManager} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <div>
                                <h4 className="card-title mb-0">Available Schedules</h4>
                                <div className="text-muted fs-12">Point kamu: {myPoints}</div>
                            </div>
                            {isManager ? <div className="text-muted fs-12">Manage via tabs</div> : null}
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-responsive-md">
                                    <thead>
                                        <tr>
                                            <th>Schedule</th>
                                            <th>Start</th>
                                            <th>End</th>
                                            <th>Count</th>
                                            <th>Picked</th>
                                            <th>Batch</th>
                                            <th>Status</th>
                                            <th className="text-end">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(availableSchedules ?? []).length ? (
                                            availableSchedules.map((s) => {
                                                const picked = (s.pickups ?? []).length;
                                                const full = picked >= (s.count ?? 0);
                                                const alreadyPicked = (s.pickups ?? []).some((p) => p.user_id === authUserId);
                                                return (
                                                    <tr key={s.id}>
                                                        <td>
                                                            <div className="fw-semibold">{s.schedule_type}</div>
                                                            <div className="text-muted fs-12">{s.note || '-'}</div>
                                                        </td>
                                                        <td>{formatDateDdMmmYy(s.start_date)}</td>
                                                        <td>{formatDateDdMmmYy(s.end_date)}</td>
                                                        <td>{s.count}</td>
                                                        <td>{picked}</td>
                                                        <td>{s.batch ? `${s.batch.name} (${s.batch.requirement_points})` : '-'}</td>
                                                        <td>{s.status}</td>
                                                        <td className="text-end">
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-primary"
                                                                onClick={() => pickup(s.id)}
                                                                disabled={processing || full || alreadyPicked}
                                                            >
                                                                Pick Up
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="text-center text-muted">
                                                    No publish schedules.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h4 className="card-title mb-0">My Pickups</h4>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-responsive-md">
                                    <thead>
                                        <tr>
                                            <th>Schedule</th>
                                            <th>Range</th>
                                            <th>Batch</th>
                                            <th>Status</th>
                                            <th>Points</th>
                                            <th className="text-end">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(myPickups ?? []).length ? (
                                            myPickups.map((p) => (
                                                <tr key={p.id}>
                                                    <td>{p.schedule?.schedule_type ?? '-'}</td>
                                                    <td>
                                                        {p.schedule?.start_date ? formatDateDdMmmYy(p.schedule.start_date) : '-'} –{' '}
                                                        {p.schedule?.end_date ? formatDateDdMmmYy(p.schedule.end_date) : '-'}
                                                    </td>
                                                    <td>{p.schedule?.batch ? `${p.schedule.batch.name} (${p.schedule.batch.requirement_points})` : '-'}</td>
                                                    <td>{p.schedule?.status ?? '-'}</td>
                                                    <td>{p.points}</td>
                                                    <td className="text-end">
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => release(p.id)}
                                                            disabled={processing || p.schedule?.status === 'Approved'}
                                                        >
                                                            Release
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="text-center text-muted">
                                                    No pickups.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
