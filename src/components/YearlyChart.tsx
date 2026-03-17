"use client";

import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, getElementAtEvent } from 'react-chartjs-2';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef } from 'react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface YearlyDataPoint {
    label: string;
    income: number;
    expense: number;
}

export default function YearlyChart({ data, currentStartDate }: { data: YearlyDataPoint[], currentStartDate?: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const chartRef = useRef(null);

    const labels = data.map(d => d.label);

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Einnahmen',
                data: data.map(d => d.income),
                backgroundColor: 'rgba(16, 185, 129, 0.8)', // Success Green
                borderRadius: 4,
            },
            {
                label: 'Ausgaben',
                data: data.map(d => d.expense),
                backgroundColor: 'rgba(239, 68, 68, 0.8)', // Danger Red
                borderRadius: 4,
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#888',
                    font: {
                        family: 'inherit',
                        weight: 500,
                    }
                }
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#fff',
                bodyColor: '#e2e8f0',
                padding: 12,
                cornerRadius: 8,
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
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#888',
                    font: { family: 'inherit' }
                }
            },
            y: {
                grid: {
                    color: 'rgba(136, 136, 136, 0.1)',
                },
                ticks: {
                    color: '#888',
                    font: { family: 'inherit' },
                    callback: function (value: any) {
                        return value + ' €';
                    }
                }
            }
        },
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
    };

    const onClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const { current: chart } = chartRef;
        if (!chart) return;

        const elements = getElementAtEvent(chart, event);
        if (elements.length > 0) {
            const datasetIndex = elements[0].datasetIndex;
            const dataIndex = elements[0].index;

            const clickedLabel = labels[dataIndex];
            const clickedType = datasetIndex === 0 ? 'income' : 'expense';

            const params = new URLSearchParams(searchParams.toString());

            // Re-map the click to actual date bounds
            // The YearlyChart currently shows months for single-year views or years for multi-year views.
            // A precise mapping requires the current start/end bounds.
            const currentStart = currentStartDate || searchParams.get('start') || '2025-01-01';
            const yearStr = currentStart.split('-')[0];

            const monthMap: Record<string, string> = {
                'Jan': '01', 'Feb': '02', 'Mär': '03', 'Apr': '04', 'Mai': '05', 'Jun': '06',
                'Jul': '07', 'Aug': '08', 'Sep': '09', 'Okt': '10', 'Nov': '11', 'Dez': '12'
            };

            if (monthMap[clickedLabel]) {
                const m = monthMap[clickedLabel];
                const lastDay = new Date(parseInt(yearStr), parseInt(m), 0).getDate();
                params.set('start', `${yearStr}-${m}-01`);
                params.set('end', `${yearStr}-${m}-${String(lastDay).padStart(2, '0')}`);
            } else if (!isNaN(parseInt(clickedLabel))) {
                // It's a year view
                params.set('start', `${clickedLabel}-01-01`);
                params.set('end', `${clickedLabel}-12-31`);
            }

            params.set('type', clickedType);
            params.delete('category'); // Clear category just in case

            router.push(`/transactions?${params.toString()}`);
        }
    };

    return <Bar ref={chartRef} data={chartData} options={options} onClick={onClick} />;
}
