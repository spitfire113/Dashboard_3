"use client";

import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { CategoryTrendData } from '@/app/actions';
import { ChevronDown, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface CategoryTrendChartProps {
    data: CategoryTrendData[];
    startDate: string;
    endDate: string;
}

import { generateMonthAxis } from '@/lib/chartUtils';

const COLORS = [
    'rgba(59, 130, 246, 1)',   // Blue
    'rgba(16, 185, 129, 1)',   // Emerald
    'rgba(245, 158, 11, 1)',   // Amber
    'rgba(239, 68, 68, 1)',    // Red
    'rgba(139, 92, 246, 1)',   // Purple
    'rgba(236, 72, 153, 1)',   // Pink
    'rgba(20, 184, 166, 1)',   // Teal
    'rgba(249, 115, 22, 1)'    // Orange
];

export default function CategoryTrendChart({ data, startDate, endDate }: CategoryTrendChartProps) {
    const router = useRouter();
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Identify unique categories and their total amounts for default sorting/selection
    const allCategories = useMemo(() => {
        const catMap = new Map<string, number>();
        data.forEach(d => {
            catMap.set(d.category, (catMap.get(d.category) || 0) + d.amount);
        });

        // Sort categories by total amount descending
        const sortedCats = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);
        return sortedCats.map(c => c[0]);
    }, [data]);

    // Initialize with top 5 categories by default
    useEffect(() => {
        if (selectedCategories.length === 0 && allCategories.length > 0) {
            setSelectedCategories(allCategories.slice(0, 5));
        }
    }, [allCategories, selectedCategories.length]);

    // Handle outside click for dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev => {
            if (prev.includes(cat)) {
                return prev.filter(c => c !== cat);
            } else {
                return [...prev, cat];
            }
        });
    };

    const chartData = useMemo(() => {
        const { labels, keys } = generateMonthAxis(data, startDate, endDate);

        const datasets = selectedCategories.map((cat, index) => {
            const dataForCat = new Array(keys.length).fill(0);

            // Build a lookup map for the specific category
            const catMap = new Map<string, number>();
            data.forEach(d => {
                if (d.category === cat) {
                    catMap.set(d.monthStr, d.amount);
                }
            });

            keys.forEach((key, idx) => {
                dataForCat[idx] = catMap.get(key) || 0;
            });

            return {
                label: cat,
                data: dataForCat,
                backgroundColor: COLORS[index % COLORS.length].replace(', 1)', ', 0.8)'),
                borderRadius: 4,
                borderWidth: 0,
            };
        });

        return {
            labels,
            datasets
        };
    }, [data, selectedCategories, startDate, endDate]);

    if (!data || data.length === 0) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                Keine Trenddaten vorhanden.
            </div>
        );
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    usePointStyle: true,
                    boxWidth: 8,
                    padding: 20
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                cornerRadius: 8,
                mode: 'index' as const,
                intersect: false,
                callbacks: {
                    label: function (context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        onClick: (event: any, elements: any[], chart: any) => {
            const activePoints = chart.getElementsAtEventForMode(event.native || event, 'nearest', { intersect: true }, true);
            if (activePoints.length > 0) {
                const dataIndex = activePoints[0].index;
                const datasetIndex = activePoints[0].datasetIndex;
                const { keys } = generateMonthAxis(data, startDate, endDate);

                // Get the exact YYYY-MM code for the bar clicked
                const monthKey = keys[dataIndex]; // e.g., "2024-05"
                const category = chartData.datasets[datasetIndex].label;

                if (monthKey && category) {
                    const [year, month] = monthKey.split('-');
                    const startOfMonth = `${year}-${month}-01`;
                    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                    const endOfMonth = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

                    const params = new URLSearchParams();
                    params.set('start', startOfMonth);
                    params.set('end', endOfMonth);
                    params.set('category', category);
                    params.set('type', 'expense');

                    router.push(`/transactions?${params.toString()}`);
                }
            }
        },
        onHover: (event: any, elements: any[]) => {
            if (event.native) {
                event.native.target.style.cursor = elements && elements.length ? 'pointer' : 'default';
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)'
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.5)',
                    callback: function (value: any) {
                        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumSignificantDigits: 3 }).format(value);
                    }
                }
            }
        },
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Custom Multi-Select Dropdown */}
            <div style={{ marginBottom: '1rem', position: 'relative', display: 'flex', justifyContent: 'flex-end', zIndex: 10 }} ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                    }}
                >
                    <span>Kategorien ({selectedCategories.length})</span>
                    <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
                </button>

                {isDropdownOpen && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '0.25rem',
                        backgroundColor: '#1e293b',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)',
                        padding: '0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        minWidth: '200px',
                        maxHeight: '300px',
                        overflowY: 'auto'
                    }}>
                        <div style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            fontWeight: 600,
                            marginBottom: '0.25rem'
                        }}>
                            Sichtbare Linien wählen
                        </div>
                        {allCategories.map(cat => {
                            const isSelected = selectedCategories.includes(cat);
                            return (
                                <label
                                    key={cat}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.4rem 0.5rem',
                                        cursor: 'pointer',
                                        borderRadius: '0.25rem',
                                        fontSize: '0.875rem',
                                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleCategory(cat)}
                                        style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                                    />
                                    <span style={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '150px'
                                    }}>
                                        {cat}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Chart Container */}
            <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: 0 }}>
                {selectedCategories.length === 0 ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        Bitte wählen Sie mindestens eine Kategorie aus.
                    </div>
                ) : (
                    <Bar data={chartData} options={options} />
                )}
            </div>
        </div>
    );
}
