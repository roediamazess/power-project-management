import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

function KanbanIndex({ html }) {
    return (
        <>
            <Head title="Kanban" />
            <div dangerouslySetInnerHTML={{ __html: html }} />
        </>
    );
}

KanbanIndex.layout = (page) => <AuthenticatedLayout header="Kanban">{page}</AuthenticatedLayout>;

export default KanbanIndex;
