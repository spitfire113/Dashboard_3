"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown, Calendar } from 'lucide-react';
import Cookies from 'js-cookie';

interface YearPickerProps {
    selectedYear: string;
    availableYears: string[];
}

export default function YearPicker({ selectedYear, availableYears }: YearPickerProps) {
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

    const handleSelect = (year: string) => {
        setIsOpen(false);
        const params = new URLSearchParams(searchParams.toString());
        params.set('year', year);
        // Also set start and end for consistency with other components that might share context or if we just want to update URL cleanly
        params.set('start', `${year}-01-01`);
        params.set('end', `${year}-12-31`);

        Cookies.set('dashboard_time_filter', JSON.stringify({ year, start: `${year}-01-01`, end: `${year}-12-31` }), { expires: 365 });
        router.push(`${pathname}?${params.toString()}`);
    };

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
                    padding: '0.4rem 0.75rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                }}
            >
                <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
                <span>{selectedYear}</span>
                <ChevronDown size={14} style={{ color: 'var(--text-secondary)', marginLeft: '0.25rem' }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.25rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)',
                    zIndex: 100,
                    padding: '0.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.125rem',
                    minWidth: '120px'
                }}>
                    {availableYears.map(year => (
                        <div
                            key={year}
                            onClick={() => handleSelect(year)}
                            style={{
                                padding: '0.5rem 0.75rem',
                                cursor: 'pointer',
                                borderRadius: '0.25rem',
                                fontSize: '0.875rem',
                                color: year === selectedYear ? 'var(--accent-primary)' : 'var(--text-primary)',
                                backgroundColor: year === selectedYear ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                fontWeight: year === selectedYear ? 600 : 400,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                            onMouseEnter={(e) => {
                                if (year !== selectedYear) {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (year !== selectedYear) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }}
                        >
                            {year}
                            {year === selectedYear && <span>✓</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
