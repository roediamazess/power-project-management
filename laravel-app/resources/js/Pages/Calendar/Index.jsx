import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

function CalendarIndex({ html }) {
    const calendarRef = useRef(null);

    useEffect(() => {
        const el = document.getElementById('calendar');
        const FullCalendar = window?.FullCalendar;

        if (!el || !FullCalendar?.Calendar) return;

        if (calendarRef.current?.destroy) {
            calendarRef.current.destroy();
            calendarRef.current = null;
        }

        const calendar = new FullCalendar.Calendar(el, {
            headerToolbar: {
                left: 'title,prev,next',
                right: 'today',
                center: 'dayGridMonth,timeGridWeek,timeGridDay',
            },
            initialView: 'dayGridMonth',
            initialDate: '2023-02-13',
            weekNumbers: true,
            navLinks: true,
            nowIndicator: true,
            editable: true,
            selectable: true,
            selectMirror: true,
            select: function (arg) {
                const title = window.prompt('Event Title:');
                if (title) {
                    calendar.addEvent({
                        title,
                        start: arg.start,
                        end: arg.end,
                        allDay: arg.allDay,
                    });
                }
                calendar.unselect();
            },
            events: [
                { title: 'All Day Event', start: '2023-02-01' },
                {
                    title: 'Annual Meeting Envatos Community with Kleon Team',
                    start: '2023-02-07',
                    end: '2023-02-10',
                    className: 'bg-danger',
                },
                { groupId: 999, title: 'Repeating Event', start: '2023-02-09T16:00:00' },
                { groupId: 999, title: 'Repeating Event', start: '2023-02-16T16:00:00' },
                { title: 'Conference', start: '2023-02-11', end: '2023-02-13', className: 'bg-danger' },
                { title: 'Lunch', start: '2023-02-12T12:00:00' },
                { title: 'Meeting', start: '2023-04-12T14:30:00' },
                { title: 'Happy Hour', start: '2023-07-12T17:30:00' },
                { title: 'Dinner', start: '2023-02-12T20:00:00', className: 'bg-warning' },
                { title: 'Birthday Party', start: '2023-02-13T07:00:00', className: 'bg-secondary' },
                { title: 'Click for Google', url: 'http://google.com/', start: '2023-02-28' },
            ],
        });

        calendar.render();
        calendarRef.current = calendar;

        return () => {
            if (calendarRef.current?.destroy) calendarRef.current.destroy();
            calendarRef.current = null;
        };
    }, [html]);

    return (
        <>
            <Head title="Calendar" />
            <div dangerouslySetInnerHTML={{ __html: html }} />
        </>
    );
}

CalendarIndex.layout = (page) => <AuthenticatedLayout header="Calendar">{page}</AuthenticatedLayout>;

export default CalendarIndex;
