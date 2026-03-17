"use client";

import React from 'react';
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
import { AvgMonthlyCost } from '@/app/actions';
import { useRouter } from 'next/navigation';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface AvgMonthlyCostsChartProps {
    data: AvgMonthlyCost[];
    startDate: string;
    endDate: string;
}

export default function AvgMonthlyCostsChart({ data, startDate, endDate }: AvgMonthlyCostsChartProps) {
    const router = useRouter();
    if (!data || data.length === 0) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                Keine Daten für diesen Zeitraum verfügbar.
            </div>
        );
    }

    const chartData = {
        labels: data.map(d => d.category),
        datasets: [
            {
                label: 'Ø Monatliche Ausgaben',
                data: data.map(d => d.avgAmount),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderRadius: 4,
                barThickness: 16,
                maxBarThickness: 24
            }
        ],
    };

    const options = {
        indexAxis: 'y' as const, // Horizontal Bar Chart
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
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
                        if (context.parsed.x !== null) {
                            label += new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(context.parsed.x);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.5)',
                    callback: function (value: any) {
                        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumSignificantDigits: 3 }).format(value);
                    }
                }
            },
            y: {
                grid: {
                    display: false
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    font: {
                        size: 11
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
                const category = data[dataIndex].category;

                const params = new URLSearchParams();
                if (startDate && startDate !== '0000-01-01') params.set('start', startDate);
                if (endDate && endDate !== '2099-12-31') params.set('end', endDate);
                params.set('category', category);
                params.set('type', 'expense');

                router.push(`/transactions?${params.toString()}`);
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
