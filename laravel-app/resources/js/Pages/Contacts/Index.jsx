import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

function ContactsIndex({ html }) {
    return (
        <>
            <Head title="Contacts" />
            <div dangerouslySetInnerHTML={{ __html: html }} />
        </>
    );
}

ContactsIndex.layout = (page) => <AuthenticatedLayout header="Contacts">{page}</AuthenticatedLayout>;

export default ContactsIndex;
