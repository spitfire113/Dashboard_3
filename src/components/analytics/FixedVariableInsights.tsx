"use client";

import React, { useMemo } from 'react';
import { AvgMonthlyCost, SavingsSurplusData } from '@/app/actions';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useRouter } from 'next/navigation';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface FixedVariableInsightsProps {
    data: AvgMonthlyCost[];
    avgIncome: number;
    surplusData: SavingsSurplusData[];
    startDate: string;
    endDate: string;
}

export default function FixedVariableInsights({ data, avgIncome, surplusData, startDate, endDate }: FixedVariableInsightsProps) {
    const router = useRouter();

    const { totalFixed, totalVariable, totalExpense } = useMemo(() => {
        let totalFixed = 0;
        let totalVariable = 0;

        data.forEach(d => {
            if (d.is_fixed === 1) {
                totalFixed += d.avgAmount;
            } else {
                totalVariable += d.avgAmount;
            }
        });

        return {
            totalFixed,
            totalVariable,
            totalExpense: totalFixed + totalVariable
        };
    }, [data]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);

    // Prepare data for the Sparüberschuss Line Chart
    const lineChartData = useMemo(() => {
        const labels = surplusData.map(d => {
            const [y, m] = d.monthStr.split('-');
            const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
            return `${monthNames[parseInt(m, 10) - 1]} '${y.slice(2)}`;
        });

        const dataPoints = surplusData.map(d => d.surplus);

        // Map colors: Positive surplus = Green, Negative = Red
        const pointColors = dataPoints.map(val => val >= 0 ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)');

        return {
            labels,
            datasets: [
                {
                    label: 'Sparüberschuss',
                    data: dataPoints,
                    borderColor: 'rgba(59, 130, 246, 0.8)', // Neutral blue connecting line
                    backgroundColor: 'rgba(59, 130, 246, 0.1)', // Light blue fill under line
                    borderWidth: 2,
                    pointBackgroundColor: pointColors,
                    pointBorderColor: pointColors,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.3 // Smooth curves
                }
            ]
        };
    }, [surplusData]);

    const lineOptions = {
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
                        return formatCurrency(context.parsed.y);
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: 'rgba(255, 255, 255, 0.5)' }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: 'rgba(255, 255, 255, 0.7)' }
            }
        },
        onClick: (event: any, elements: any[]) => {
            if (elements.length > 0) {
                const dataIndex = elements[0].index;
                const monthStrRaw = surplusData[dataIndex].monthStr; // YYYY-MM

                const [yyyy, mm] = monthStrRaw.split('-');
                const monthStart = `${yyyy}-${mm}-01`;
                const lastDay = new Date(parseInt(yyyy), parseInt(mm), 0).getDate();
                const monthEnd = `${yyyy}-${mm}-${String(lastDay).padStart(2, '0')}`;

                const params = new URLSearchParams();
                params.set('start', monthStart);
                params.set('end', monthEnd);

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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', minHeight: '350px', width: '100%' }}>
            {/* Left side: Totals (Income + Expenses + Breakdown) */}
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                        Ø Einnahmen (Gesamt)
                    </h3>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>
                        {formatCurrency(avgIncome)}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                            Ø Fixkosten
                        </h3>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'rgb(59, 130, 246)' }}>
                            {formatCurrency(totalFixed)}
                        </div>
                    </div>
                    <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                            Ø Variable Kosten
                        </h3>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'rgb(245, 158, 11)' }}>
                            {formatCurrency(totalVariable)}
                        </div>
                    </div>
                </div>

                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                        Ø Ausgaben (Gesamt)
                    </h3>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)' }}>
                        {formatCurrency(totalExpense)}
                    </div>
                </div>
            </div>

            {/* Right side: Sparüberschuss Chart (Income - Expense delta) over time */}
            <div style={{ flex: '2 1 400px', backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center', fontWeight: '500' }}>
                    Sparüberschuss im Zeitverlauf (Einnahmen minus Ausgaben)
                </h4>
                <div style={{ height: '320px', position: 'relative', width: '100%' }}>
                    <Line data={lineChartData} options={lineOptions} />
                </div>
            </div>
        </div>
    );
}
