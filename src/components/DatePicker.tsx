"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import Cookies from 'js-cookie';
import styles from './DatePicker.module.css';

const monthNames: Record<string, string> = {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
};

export default function DatePicker({
    initialStart,
    initialEnd,
    minDate,
    maxDate,
    availableDates = []
}: {
    initialStart: string;
    initialEnd: string;
    minDate?: string;
    maxDate?: string;
    availableDates?: { year: string, month: string }[];
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // Default dates if missing
    const defaultY = new Date().getFullYear().toString();
    const defaultM = String(new Date().getMonth() + 1).padStart(2, '0');

    const [startYear, setStartYear] = useState(initialStart ? initialStart.slice(0, 4) : defaultY);
    const [startMonth, setStartMonth] = useState(initialStart ? initialStart.slice(5, 7) : defaultM);
    const [endYear, setEndYear] = useState(initialEnd ? initialEnd.slice(0, 4) : defaultY);
    const [endMonth, setEndMonth] = useState(initialEnd ? initialEnd.slice(5, 7) : defaultM);

    const [openDropdown, setOpenDropdown] = useState<'startM' | 'startY' | 'endM' | 'endY' | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync state if URL changes externally
    useEffect(() => {
        const start = searchParams.get('start');
        const end = searchParams.get('end');
        if (start) {
            setStartYear(start.slice(0, 4));
            setStartMonth(start.slice(5, 7));
        }
        if (end) {
            setEndYear(end.slice(0, 4));
            setEndMonth(end.slice(5, 7));
        }
    }, [searchParams]);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updateUrl = (sy: string, sm: string, ey: string, em: string) => {
        if (!sy || !sm || !ey || !em) return;

        const startFull = `${sy}-${sm}-01`;
        const lastDay = new Date(parseInt(ey), parseInt(em), 0).getDate();
        const endFull = `${ey}-${em}-${String(lastDay).padStart(2, '0')}`;

        const params = new URLSearchParams(searchParams.toString());
        params.set('start', startFull);
        params.set('end', endFull);

        Cookies.set('dashboard_time_filter', JSON.stringify({ start: startFull, end: endFull }), { expires: 365 });
        router.push(`${pathname}?${params.toString()}`);
    };

    // Calculate available options matching dataset
    const allYears = Array.from(new Set(availableDates.map(d => d.year))).sort((a, b) => b.localeCompare(a));
    const finalYears = allYears.length > 0 ? allYears : [defaultY];

    const availableFromMonths = availableDates.filter(d => d.year === startYear).map(d => d.month).sort();
    const finalStartMonths = availableFromMonths.length > 0 ? availableFromMonths : [startMonth];

    const availableToMonths = availableDates.filter(d => d.year === endYear).map(d => d.month).sort();
    const finalEndMonths = availableToMonths.length > 0 ? availableToMonths : [endMonth];

    const handleSelect = (dropdown: string, val: string) => {
        let sy = startYear, sm = startMonth, ey = endYear, em = endMonth;
        if (dropdown === 'startY') { sy = val; setStartYear(val); }
        if (dropdown === 'startM') { sm = val; setStartMonth(val); }
        if (dropdown === 'endY') { ey = val; setEndYear(val); }
        if (dropdown === 'endM') { em = val; setEndMonth(val); }

        const startDateNum = parseInt(sy) * 12 + parseInt(sm);
        const endDateNum = parseInt(ey) * 12 + parseInt(em);

        if (endDateNum < startDateNum) {
            sy = ey;
            sm = em;
            setStartYear(sy);
            setStartMonth(sm);
        }

        setOpenDropdown(null);
        updateUrl(sy, sm, ey, em);
    };

    const renderDropdown = (
        id: 'startM' | 'startY' | 'endM' | 'endY',
        currentValue: string,
        options: string[],
        isMonth: boolean
    ) => {
        const displayValue = isMonth ? (monthNames[currentValue] || currentValue) : currentValue;
        const isOpen = openDropdown === id;

        return (
            <div className={styles.dropdownWrapper} style={{ position: 'relative' }}>
                <button
                    className={`${styles.dropdownButton} ${isOpen ? styles.dropdownButtonActive : ''}`}
                    onClick={() => setOpenDropdown(isOpen ? null : id)}
                >
                    <span>{displayValue}</span>
                    <ChevronDown size={14} className={styles.dropdownIcon} />
                </button>
                {isOpen && (
                    <div className={styles.dropdownList}>
                        {options.map(opt => (
                            <div
                                key={opt}
                                className={`${styles.dropdownItem} ${opt === currentValue ? styles.dropdownItemActive : ''}`}
                                onClick={() => handleSelect(id, opt)}
                            >
                                {isMonth ? monthNames[opt] : opt}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`${styles.datePickerContainer} glass-panel`} ref={dropdownRef}>
            <div className={styles.inputGroup}>
                <span className={styles.label}>From</span>
                <div className={styles.selectors}>
                    {renderDropdown('startM', startMonth, finalStartMonths, true)}
                    {renderDropdown('startY', startYear, finalYears, false)}
                </div>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.inputGroup}>
                <span className={styles.label}>To</span>
                <div className={styles.selectors}>
                    {renderDropdown('endM', endMonth, finalEndMonths, true)}
                    {renderDropdown('endY', endYear, finalYears, false)}
                </div>
            </div>
        </div>
    );
}

