export function formatDateDdMmmYy(value) {
    if (!value) return '-';

    const text = String(value).trim();
    if (!text) return '-';

    let date;

    const m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
        const year = Number(m[1]);
        const month = Number(m[2]);
        const day = Number(m[3]);
        date = new Date(Date.UTC(year, month - 1, day));
    } else {
        date = new Date(text);
    }

    if (Number.isNaN(date.getTime())) return text;

    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
        timeZone: 'UTC',
    }).format(date);
}


export function parseDateDdMmmYyToIso(value) {
    if (value === null || value === undefined) return '';

    const raw = String(value).trim();
    if (!raw) return '';

    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return raw;

    const m = raw.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2}|\d{4})$/);
    if (!m) return raw;

    const day = Number(m[1]);
    const mon = m[2].toLowerCase();
    const yearRaw = m[3];

    const monthMap = {
        jan: 1,
        feb: 2,
        mar: 3,
        apr: 4,
        may: 5,
        jun: 6,
        jul: 7,
        aug: 8,
        sep: 9,
        oct: 10,
        nov: 11,
        dec: 12,
    };

    const month = monthMap[mon];
    if (!month) return raw;

    let year = Number(yearRaw);
    if (yearRaw.length === 2) year += 2000;

    if (!Number.isFinite(day) || !Number.isFinite(year) || day < 1 || day > 31) return raw;

    const d = new Date(Date.UTC(year, month - 1, day));
    if (Number.isNaN(d.getTime())) return raw;

    const yyyy = String(year).padStart(4, '0');
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
}


export function formatDateTimeDdMmmYyDayHms(value) {
    if (!value) return '-';

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const dd = String(d.getDate()).padStart(2, '0');
    const mmm = months[d.getMonth()] ?? '';
    const yy = String(d.getFullYear()).slice(-2);
    const day = days[d.getDay()] ?? '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');

    return `${dd} ${mmm} ${yy} - ${day}, ${hh}:${mm}:${ss}`;
}
