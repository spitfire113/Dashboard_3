"use client";

import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { CategoryTrendData } from '@/app/actions';
import styles from '@/app/analyse/page.module.css';
import { useRouter } from 'next/navigation';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface IndividualCategoryChartsProps {
    data: CategoryTrendData[];
    startDate: string;
    endDate: string;
}

import { generateMonthAxis } from '@/lib/chartUtils';

// Consistent colors for each chart or a single unifying color
const CHART_COLOR = 'rgba(59, 130, 246, 1)'; // Blue
const CHART_BG = 'rgba(59, 130, 246, 0.1)';

export default function IndividualCategoryCharts({ data, startDate, endDate }: IndividualCategoryChartsProps) {
    const router = useRouter();
    const { monthLabels, categories, dataByCat } = useMemo(() => {
        const { labels, keys } = generateMonthAxis(data, startDate, endDate);

        // Find all unique categories
        const cats = Array.from(new Set(data.map(d => d.category))).sort();

        // Build a map of category -> keys.length array
        const map = new Map<string, number[]>();
        cats.forEach(c => map.set(c, new Array(keys.length).fill(0)));

        // Helper lookup map for speed
        const catMap = new Map<string, Map<string, number>>();
        cats.forEach(c => catMap.set(c, new Map()));

        data.forEach(d => {
            catMap.get(d.category)?.set(d.monthStr, d.amount);
        });

        cats.forEach(c => {
            const arr = map.get(c)!;
            const lookup = catMap.get(c)!;
            keys.forEach((key, idx) => {
                arr[idx] = lookup.get(key) || 0;
            });
        });

        // Filter out categories that have absolutely 0 spend for the whole year (optional but cleaner)
        const activeCats = cats.filter(c => {
            const arr = map.get(c);
            return arr && arr.some(val => val > 0);
        });

        return { monthLabels: labels, categories: activeCats, dataByCat: map };
    }, [data, startDate, endDate]);

    if (!categories || categories.length === 0) {
        return null;
    }

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: function (context: any) {
                        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.5)',
                    font: { size: 10 }
                }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.4)',
                    maxTicksLimit: 5,
                    callback: function (value: any) {
                        if (value === 0) return '0 €';
                        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumSignificantDigits: 2 }).format(value);
                    }
                },
                beginAtZero: true
            }
        },
        interaction: {
            intersect: false,
            mode: 'index' as const,
        },
    };

    return (
        <div style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem', paddingLeft: '0.5rem' }}>
                Einzelkategorien im Jahresverlauf
            </h2>
            <div className={styles.individualChartsGrid}>
                {categories.map(cat => {
                    const series = dataByCat.get(cat) || new Array(monthLabels.length).fill(0);
                    const total = series.reduce((sum, val) => sum + val, 0);

                    const chartData = {
                        labels: monthLabels,
                        datasets: [
                            {
                                label: cat,
                                data: series,
                                borderColor: CHART_COLOR,
                                backgroundColor: CHART_BG,
                                borderWidth: 2,
                                pointRadius: 2,
                                pointHoverRadius: 4,
                                tension: 0.3,
                                fill: true,
                            }
                        ]
                    };

                    const specificOptions = {
                        ...commonOptions,
                        onClick: (event: any, elements: any[]) => {
                            if (elements.length > 0) {
                                const dataIndex = elements[0].index;
                                const { keys } = generateMonthAxis(data, startDate, endDate);
                                const monthKey = keys[dataIndex];

                                if (monthKey) {
                                    const [year, month] = monthKey.split('-');
                                    const startOfMonth = `${year}-${month}-01`;
                                    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                                    const endOfMonth = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

                                    const params = new URLSearchParams();
                                    params.set('start', startOfMonth);
                                    params.set('end', endOfMonth);
                                    params.set('category', cat);
                                    params.set('type', 'expense');

                                    router.push(`/transactions?${params.toString()}`);
                                }
                            }
                        },
                        onHover: (event: any, elements: any[]) => {
                            if (event.native) {
                                event.native.target.style.cursor = elements && elements.length ? 'pointer' : 'default';
                            }
                        }
                    };

                    return (
                        <div key={cat} className={styles.smallChartCard}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <h3 title={cat}>{cat}</h3>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', backgroundColor: 'var(--bg-main)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem' }}>
                                    ∑ {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(total)}
                                </span>
                            </div>
                            <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
                                <Line data={chartData} options={specificOptions} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
