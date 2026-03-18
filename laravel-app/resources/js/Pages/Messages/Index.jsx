import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

function MessagesIndex({ html }) {
    return (
        <>
            <Head title="Messages" />
            <div dangerouslySetInnerHTML={{ __html: html }} />
        </>
    );
}

MessagesIndex.layout = (page) => <AuthenticatedLayout header="Messages">{page}</AuthenticatedLayout>;

export default MessagesIndex;
