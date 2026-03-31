import { Link, usePage } from '@inertiajs/react';

export default function ArrangementTabs({ isManager }) {
    const url = usePage().url ?? '';
    const isPickUp = url === '/arrangements';
    const isSchedules = url.startsWith('/arrangements/schedules');
    const isBatches = url.startsWith('/arrangements/batches');

    return (
        <ul className="nav nav-tabs">
            <li className="nav-item">
                <Link className={`nav-link${isPickUp ? ' active' : ''}`} href={route('arrangements.index', {}, false)}>
                    Pick Up
                </Link>
            </li>
            {isManager ? (
                <>
                    <li className="nav-item">
                        <Link className={`nav-link${isSchedules ? ' active' : ''}`} href={route('arrangements.schedules.index', {}, false)}>
                            Manage Schedules
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className={`nav-link${isBatches ? ' active' : ''}`} href={route('arrangements.batches.index', {}, false)}>
                            Manage Batches
                        </Link>
                    </li>
                </>
            ) : null}
        </ul>
    );
}

