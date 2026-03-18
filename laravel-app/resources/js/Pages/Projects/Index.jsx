import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

function ProjectsIndex({ html }) {
    return (
        <>
            <Head title="Project" />
            <div dangerouslySetInnerHTML={{ __html: html }} />
        </>
    );
}

ProjectsIndex.layout = (page) => <AuthenticatedLayout header="Project">{page}</AuthenticatedLayout>;

export default ProjectsIndex;
