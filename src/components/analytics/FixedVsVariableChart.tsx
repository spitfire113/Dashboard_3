"use client";

import React, { useMemo } from 'react';
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
import { FixedVsVariable } from '@/app/actions';
import { useRouter } from 'next/navigation';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface FixedVsVariableChartProps {
    data: FixedVsVariable[];
    startDate: string;
    endDate: string;
}

import { generateMonthAxis } from '@/lib/chartUtils';

export default function FixedVsVariableChart({ data, startDate, endDate }: FixedVsVariableChartProps) {
    const router = useRouter();
    if (!data || data.length === 0) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                Keine ausreichenden Ausgabendaten vorhanden.
            </div>
        );
    }

    const { labels, fixedData, variableData } = useMemo(() => {
        const { labels, keys } = generateMonthAxis(data, startDate, endDate);

        const fixed = new Array(keys.length).fill(0);
        const variable = new Array(keys.length).fill(0);

        // Build a lookup map
        const dataMap = new Map<string, FixedVsVariable>();
        data.forEach(d => dataMap.set(d.monthStr, d));

        keys.forEach((key, index) => {
            const d = dataMap.get(key);
            if (d) {
                fixed[index] = d.fixed || 0;
                variable[index] = d.variable || 0;
            }
        });

        return {
            labels,
            fixedData: fixed,
            variableData: variable
        };
    }, [data, startDate, endDate]);

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Fixkosten',
                data: fixedData,
                backgroundColor: 'rgba(59, 130, 246, 0.8)', // Primary blue
                borderRadius: 4,
                barPercentage: 0.8,
                categoryPercentage: 0.8
            },
            {
                label: 'Variable Kosten',
                data: variableData,
                backgroundColor: 'rgba(245, 158, 11, 0.8)', // Amber
                borderRadius: 4,
                barPercentage: 0.8,
                categoryPercentage: 0.8
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                align: 'end' as const,
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
        scales: {
            x: {
                stacked: false,
                grid: {
                    display: false
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    font: {
                        size: 11
                    }
                }
            },
            y: {
                stacked: false,
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
        animation: {
            duration: 500
        },
        onClick: (event: any, elements: any[]) => {
            if (elements.length > 0) {
                const dataIndex = elements[0].index;
                const { keys } = generateMonthAxis(data, startDate, endDate);

                // Get the exact YYYY-MM code for the bar clicked
                const monthKey = keys[dataIndex]; // e.g., "2024-05"
                const datasetIndex = elements[0].datasetIndex;

                if (monthKey) {
                    const [year, month] = monthKey.split('-');
                    const startOfMonth = `${year}-${month}-01`;
                    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                    const endOfMonth = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

                    const params = new URLSearchParams();
                    params.set('start', startOfMonth);
                    params.set('end', endOfMonth);
                    params.set('type', 'expense');

                    // Dataset 0 is Fixkosten, Dataset 1 is Variable Kosten
                    if (datasetIndex === 0) {
                        params.set('is_fixed', 'true');
                    } else if (datasetIndex === 1) {
                        params.set('is_fixed', 'false');
                    }

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
        <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 2rem)' }}>
            <Bar data={chartData} options={options} />
        </div>
    );
}
