import {
    getAvailableMonthYears,
    getDateBounds,
    getAverageMonthlyCosts,
    getAverageMonthlyIncome,
    getSavingsSurplus,
    getCategoryTrend,
    getFixedVsVariableExpenses,
    AvgMonthlyCost,
    SavingsSurplusData,
    CategoryTrendData,
    FixedVsVariable
} from '@/app/actions';
import PeriodPicker from '@/components/PeriodPicker';
import { cookies } from 'next/headers';
import styles from './page.module.css';

// Chart Components
import CategoryTrendChart from '@/components/analytics/CategoryTrendChart';
import AvgMonthlyCostsChart from '@/components/analytics/AvgMonthlyCostsChart';
import FixedVsVariableChart from '@/components/analytics/FixedVsVariableChart';
import FixedVariableInsights from '@/components/analytics/FixedVariableInsights';
import FixedVsVariableBreakdownCharts from '@/components/analytics/FixedVsVariableBreakdownCharts';
import IndividualCategoryCharts from '@/components/analytics/IndividualCategoryCharts';

export default async function AnalysePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await searchParams;

    const cookieStore = await cookies();
    const timeFilterCookie = cookieStore.get('dashboard_time_filter');
    let cookiePeriod = '';
    
    if (timeFilterCookie?.value) {
        try {
            const parsed = JSON.parse(timeFilterCookie.value);
            if (parsed.period) cookiePeriod = parsed.period;
            else if (parsed.year) cookiePeriod = parsed.year;
        } catch (e) {
            // ignore parsing error
        }
    }

    const [availableDates, bounds] = await Promise.all([
        getAvailableMonthYears(true),
        getDateBounds()
    ]);
    const availableYears = Array.from(new Set(availableDates.map(d => d.year)));

    let periodParam = typeof resolvedParams.period === 'string' ? resolvedParams.period : null;
    let selectedPeriod = periodParam || cookiePeriod || null;

    // Fallback logic
    if (!selectedPeriod && availableYears.includes(new Date().getFullYear().toString())) {
        selectedPeriod = new Date().getFullYear().toString();
    } else if (!selectedPeriod && availableYears.length > 0) {
        selectedPeriod = availableYears[0];
    } else if (!selectedPeriod) {
        selectedPeriod = 'all';
    }

    let startDate = '';
    let endDate = '';
    const today = new Date();
    const latestAvailableDate = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of previous month
    
    // We base all relative calculations on the latest allowed month, NOT the current incomplete month
    const endY = latestAvailableDate.getFullYear();
    const endM = latestAvailableDate.getMonth(); // 0-indexed month of the previous calendar month

    const getLastDayOfMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

    if (selectedPeriod === 'all') {
        startDate = bounds?.min ? bounds.min.split(' ')[0] : '2000-01-01';
        endDate = bounds?.max ? bounds.max.split(' ')[0] : '2099-12-31';
    } else if (selectedPeriod?.endsWith('m')) {
        const months = parseInt(selectedPeriod.replace('m', ''));
        const endDay = getLastDayOfMonth(endY, endM);
        endDate = `${endY}-${String(endM + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

        // Subtract months - 1 to get the start of the Xth month ago
        const startDateObj = new Date(endY, endM - (months - 1), 1);
        startDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-01`;
    } else {
        // It's a specific year
        startDate = `${selectedPeriod}-01-01`;
        endDate = `${selectedPeriod}-12-31`;
    }

    // Global Cap: Ensure NO URL manipulation can ever bypass the hard cap for the current incomplete month
    const parsedEnd = new Date(endDate);
    if (parsedEnd > latestAvailableDate) {
        endDate = `${latestAvailableDate.getFullYear()}-${String(latestAvailableDate.getMonth() + 1).padStart(2, '0')}-${String(latestAvailableDate.getDate()).padStart(2, '0')}`;
    }

    let avgCosts: AvgMonthlyCost[] = [];
    let avgIncome: number = 0;
    let surplusData: SavingsSurplusData[] = [];
    let trendData: CategoryTrendData[] = [];
    let fixVar: FixedVsVariable[] = [];

    if (startDate && endDate) {
        // Parallel data fetching for performance
        const [avgCostsRes, avgIncomeRes, surplusDataRes, trendDataRes, fixVarRes] = await Promise.all([
            getAverageMonthlyCosts(startDate, endDate),
            getAverageMonthlyIncome(startDate, endDate),
            getSavingsSurplus(startDate, endDate),
            getCategoryTrend(startDate, endDate),
            getFixedVsVariableExpenses(startDate, endDate)
        ]);

        avgCosts = avgCostsRes;
        avgIncome = avgIncomeRes;
        surplusData = surplusDataRes;
        trendData = trendDataRes;
        fixVar = fixVarRes;
    }

    return (
        <main className={styles.main}>
            {/* Header section */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Analysen</h1>
                    <p className={styles.subtitle}>Tiefere Einblicke und Kostentrends über die Zeit.</p>
                </div>

                <div className={styles.datePickerContainer}>
                    <PeriodPicker
                        selectedPeriod={selectedPeriod}
                        availableYears={availableYears}
                    />
                </div>
            </div>

            <div className={styles.dashboardGrid}>
                {/* 1. Month over Month (Grouped Bar Chart) -> to be converted into Category Trend */}
                <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
                    <h2>Kategorie-Jahrestrend</h2>
                    <CategoryTrendChart data={trendData} startDate={startDate} endDate={endDate} />
                </div>

                {/* 3. Average Monthly Costs (Horizontal Bar) */}
                <div className={styles.chartCard}>
                    <h2>Ø Monatliche Ausgaben</h2>
                    <AvgMonthlyCostsChart data={avgCosts} startDate={startDate} endDate={endDate} />
                </div>

                {/* 4. Fixed vs Variable (Donut -> Stacked Bar) */}
                <div className={styles.chartCard} style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2>Fix vs. Variabel</h2>
                    <FixedVsVariableChart data={fixVar} startDate={startDate} endDate={endDate} />
                </div>
            </div>

            {/* 4b. Fixed vs Variable Insights & Sparüberschuss (Totals & Surplus Line) */}
            <div className={`${styles.insightsCard} mb-large`} style={{ marginBottom: '2rem' }}>
                <FixedVariableInsights
                    data={avgCosts}
                    avgIncome={avgIncome}
                    surplusData={surplusData}
                    startDate={startDate}
                    endDate={endDate}
                />
            </div>

            {/* 4c. Exhaustive Fixed & Variable Breakdowns */}
            <div className={`${styles.chartCard} mb-large`} style={{ marginBottom: '2rem', overflow: 'visible' }}>
                <FixedVsVariableBreakdownCharts data={avgCosts} startDate={startDate} endDate={endDate} />
            </div>

            {/* 5. Dynamically Generated Individual Category Line Charts */}
            <IndividualCategoryCharts data={trendData} startDate={startDate} endDate={endDate} />

        </main>
    );
}
