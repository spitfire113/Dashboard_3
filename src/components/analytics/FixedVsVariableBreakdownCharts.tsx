"use client";

import React, { useMemo } from 'react';
import { AvgMonthlyCost } from '@/app/actions';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useRouter } from 'next/navigation';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface FixedVsVariableBreakdownChartsProps {
    data: AvgMonthlyCost[];
    startDate: string;
    endDate: string;
}

export default function FixedVsVariableBreakdownCharts({ data, startDate, endDate }: FixedVsVariableBreakdownChartsProps) {
    const router = useRouter();

    const { fixedCats, varCats } = useMemo(() => {
        const fixedCats: AvgMonthlyCost[] = [];
        const varCats: AvgMonthlyCost[] = [];

        data.forEach(d => {
            if (d.is_fixed === 1) {
                fixedCats.push(d);
            } else {
                varCats.push(d);
            }
        });

        // The input data is already sorted by amount DESC from the SQL query
        return { fixedCats, varCats };
    }, [data]);

    // Common configuration builder for horizontal charting
    const buildChartConfig = (dataset: AvgMonthlyCost[], bgColor: string) => {
        const labels = dataset.map(d => d.category);
        const amounts = dataset.map(d => d.avgAmount);

        const chartData = {
            labels,
            datasets: [
                {
                    data: amounts,
                    backgroundColor: bgColor,
                    borderRadius: 4,
                    barPercentage: 0.7,
                    categoryPercentage: 0.9,
                }
            ]
        };

        const options = {
            indexAxis: 'y' as const,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function (context: any) {
                            return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(context.parsed.x);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.5)',
                        callback: function (value: any) {
                            return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumSignificantDigits: 3 }).format(value);
                        }
                    },
                    beginAtZero: true
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: { size: 11 }
                    }
                }
            },
            onClick: (event: any, elements: any[]) => {
                if (elements.length > 0) {
                    const dataIndex = elements[0].index;
                    const category = labels[dataIndex];

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

        return { chartData, options };
    };

    const fixedConfig = buildChartConfig(fixedCats, 'rgba(59, 130, 246, 0.8)'); // Blue for Fixed
    const varConfig = buildChartConfig(varCats, 'rgba(245, 158, 11, 0.8)'); // Amber for Variable

    // Dynamically size container heights based on item count so bars don't get squished if there are 20 categories
    const fixedHeight = Math.max(300, fixedCats.length * 40);
    const varHeight = Math.max(300, varCats.length * 40);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '2rem', width: '100%' }}>
            {/* Extended Fixed Costs Chart */}
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center', fontWeight: '500' }}>Ø Fixkosten im Detail</h4>
                <div style={{ position: 'relative', width: '100%', height: `${fixedHeight}px` }}>
                    <Bar data={fixedConfig.chartData} options={fixedConfig.options} />
                </div>
            </div>

            {/* Extended Variable Costs Chart */}
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center', fontWeight: '500' }}>Ø Variable Kosten im Detail</h4>
                <div style={{ position: 'relative', width: '100%', height: `${varHeight}px` }}>
                    <Bar data={varConfig.chartData} options={varConfig.options} />
                </div>
            </div>
        </div>
    );
}
