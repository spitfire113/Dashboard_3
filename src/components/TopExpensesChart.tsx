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

interface CategoryDataPoint {
    category: string;
    amount: number;
}

export default function TopExpensesChart({ data }: { data: CategoryDataPoint[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const chartRef = useRef(null);

    if (!data || data.length === 0) {
        return <div style={{ color: '#888', textAlign: 'center', width: '100%' }}>Keine Ausgabendaten für den ausgewählten Zeitraum</div>;
    }

    const labels = data.map(d => d.category);

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Ausgabenbetrag',
                data: data.map(d => d.amount),
                backgroundColor: 'rgba(239, 68, 68, 0.7)', // Danger Red with opacity
                hoverBackgroundColor: 'rgba(239, 68, 68, 0.9)',
                borderRadius: 4,
                barPercentage: 0.6,
            }
        ]
    };

    const options = {
        indexAxis: 'y' as const, // Makes the bar chart horizontal
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false, // Hide legend since it's obvious
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: 12,
                cornerRadius: 8,
            }
        },
        scales: {
            x: {
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
            },
            y: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#888',
                    font: { family: 'inherit', size: 11 }
                }
            }
        }
    };

    const onClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const { current: chart } = chartRef;
        if (!chart) return;

        const elements = getElementAtEvent(chart, event);
        if (elements.length > 0) {
            const dataIndex = elements[0].index;
            const clickedCategory = labels[dataIndex];

            // Build URL parameters
            const params = new URLSearchParams(searchParams.toString());
            params.set('category', clickedCategory);
            params.set('type', 'expense');

            router.push(`/transactions?${params.toString()}`);
        }
    };

    return <Bar ref={chartRef} data={chartData} options={options} onClick={onClick} />;
}
