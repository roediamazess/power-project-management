import { useEffect, useMemo, useRef } from 'react';
import { formatDateDdMmmYy, parseDateDdMmmYyToIso } from '@/utils/date';

const isoToLocalDate = (iso) => {
    if (!iso) return null;
    const parts = String(iso).split('-').map((v) => Number(v));
    if (parts.length !== 3) return null;
    const [y, m, d] = parts;
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
};

const dateToIsoLocal = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export default function DatePickerInput({
    value,
    onChange,
    className,
    placeholder = 'dd Mmm yy',
    disabled = false,
    invalid = false,
    inputProps,
}) {
    const inputRef = useRef(null);
    const readyRef = useRef(false);

    const mergedClassName = useMemo(() => {
        const base = className ? String(className) : '';
        const inv = invalid ? ' is-invalid' : '';
        return `${base}${inv}`.trim();
    }, [className, invalid]);

    useEffect(() => {
        const $ = window?.jQuery;
        if (!inputRef.current || !$ || !$.fn?.datepicker) return;

        const opts = {
            autoclose: true,
            todayHighlight: true,
            format: 'dd M yyyy',
        };

        const $el = $(inputRef.current);

        $el.datepicker(opts).on('changeDate', (e) => {
            const iso = dateToIsoLocal(e.date);
            const formatted = iso ? formatDateDdMmmYy(iso) : '';
            if (typeof onChange === 'function') onChange(formatted);
            setTimeout(() => {
                if (inputRef.current) inputRef.current.value = formatted;
            }, 0);
        });

        readyRef.current = true;

        return () => {
            try {
                $el.datepicker('destroy');
            } catch (_e) {}
        };
    }, []);

    useEffect(() => {
        const $ = window?.jQuery;
        if (!readyRef.current || !$ || !$.fn?.datepicker) return;

        const $el = $(inputRef.current);
        const iso = parseDateDdMmmYyToIso(value);

        if (iso) $el.datepicker('update', isoToLocalDate(iso));
        else $el.datepicker('clearDates');

        setTimeout(() => {
            if (inputRef.current) inputRef.current.value = value || '';
        }, 0);
    }, [value]);

    return (
        <input
            ref={inputRef}
            type="text"
            className={mergedClassName}
            placeholder={placeholder}
            value={value || ''}
            readOnly
            disabled={disabled}
            {...(inputProps ?? {})}
        />
    );
}
