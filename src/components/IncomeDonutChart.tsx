"use client";

import React, { useRef } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Doughnut, getElementAtEvent } from 'react-chartjs-2';
import { useRouter, useSearchParams } from 'next/navigation';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryDataPoint {
    category: string;
    amount: number;
}

export default function IncomeDonutChart({ data }: { data: CategoryDataPoint[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const chartRef = useRef(null);

    if (!data || data.length === 0) {
        return <div style={{ color: '#888', textAlign: 'center', width: '100%' }}>Keine Einnahmendaten für den ausgewählten Zeitraum</div>;
    }

    const labels = data.map(d => d.category);

    // Generate a modern color palette
    const colors = [
        'rgba(59, 130, 246, 0.8)',   // Blue
        'rgba(139, 92, 246, 0.8)',   // Purple
        'rgba(16, 185, 129, 0.8)',   // Green
        'rgba(245, 158, 11, 0.8)',   // Amber
        'rgba(236, 72, 153, 0.8)',   // Pink
        'rgba(6, 182, 212, 0.8)',    // Cyan
    ];

    const chartData = {
        labels: data.map(d => d.category),
        datasets: [
            {
                data: data.map(d => d.amount),
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 4,
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    color: '#888',
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    font: {
                        family: 'inherit',
                        size: 11,
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: function (context: any) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            label += new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(context.parsed);
                        }
                        return label;
                    }
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
            params.set('type', 'income');

            router.push(`/transactions?${params.toString()}`);
        }
    };

    return <Doughnut ref={chartRef} data={chartData} options={options} onClick={onClick} />;
}
