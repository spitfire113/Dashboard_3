"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown, Calendar } from 'lucide-react';
import Cookies from 'js-cookie';

interface PeriodPickerProps {
    selectedPeriod: string;
    availableYears: string[];
}

const PERIOD_LABELS: Record<string, string> = {
    '3m': 'Letzte 3 Monate',
    '6m': 'Letzte 6 Monate',
    '9m': 'Letzte 9 Monate',
    '12m': 'Letzte 12 Monate',
    'all': 'Gesamter Zeitraum',
};

export default function PeriodPicker({ selectedPeriod, availableYears }: PeriodPickerProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (period: string) => {
        setIsOpen(false);
        const params = new URLSearchParams(searchParams.toString());
        params.set('period', period);
        // Clear old year/start/end params so they don't conflict
        params.delete('year');
        params.delete('start');
        params.delete('end');
        
        Cookies.set('dashboard_time_filter', JSON.stringify({ period }), { expires: 365 });
        router.push(`${pathname}?${params.toString()}`);
    };

    const getDisplayLabel = (period: string) => {
        if (PERIOD_LABELS[period]) return PERIOD_LABELS[period];
        return period; // Fallback to year string
    };

    const dynamicOptions = ['3m', '6m', '9m', '12m', 'all'];

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    padding: '0.5rem 0.85rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                }}
            >
                <Calendar size={18} style={{ color: 'var(--text-secondary)' }} />
                <span>{getDisplayLabel(selectedPeriod)}</span>
                <ChevronDown size={16} style={{ color: 'var(--text-secondary)', marginLeft: '0.25rem' }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.4rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)',
                    zIndex: 100,
                    padding: '0.35rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.125rem',
                    minWidth: '200px',
                    maxHeight: '400px',
                    overflowY: 'auto'
                }}>
                    <div style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                        Zeiträume
                    </div>
                    {dynamicOptions.map(opt => (
                        <div
                            key={opt}
                            onClick={() => handleSelect(opt)}
                            style={{
                                padding: '0.5rem 0.75rem',
                                cursor: 'pointer',
                                borderRadius: '0.25rem',
                                fontSize: '0.875rem',
                                color: opt === selectedPeriod ? 'var(--accent-primary)' : 'var(--text-primary)',
                                backgroundColor: opt === selectedPeriod ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                fontWeight: opt === selectedPeriod ? 500 : 400,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                            onMouseEnter={(e) => {
                                if (opt !== selectedPeriod) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                                if (opt !== selectedPeriod) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            {PERIOD_LABELS[opt]}
                            {opt === selectedPeriod && <span>✓</span>}
                        </div>
                    ))}

                    <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.25rem 0' }}></div>
                    <div style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                        Jahre
                    </div>

                    {availableYears.map(year => (
                        <div
                            key={year}
                            onClick={() => handleSelect(year)}
                            style={{
                                padding: '0.5rem 0.75rem',
                                cursor: 'pointer',
                                borderRadius: '0.25rem',
                                fontSize: '0.875rem',
                                color: year === selectedPeriod ? 'var(--accent-primary)' : 'var(--text-primary)',
                                backgroundColor: year === selectedPeriod ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                fontWeight: year === selectedPeriod ? 600 : 400,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                            onMouseEnter={(e) => {
                                if (year !== selectedPeriod) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                                if (year !== selectedPeriod) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            {year}
                            {year === selectedPeriod && <span>✓</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
