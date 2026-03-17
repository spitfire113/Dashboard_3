import DatePicker from '@/components/DatePicker';
import { getYearlyData, getIncomeCategories, getTopExpenses, getDateBounds, getAvailableMonthYears } from '@/app/actions';
import styles from './page.module.css';
import YearlyChart from '@/components/YearlyChart';
import IncomeDonutChart from '@/components/IncomeDonutChart';
import TopExpensesChart from '@/components/TopExpensesChart';
import UploadCSV from '@/components/UploadCSV';
import { cookies } from 'next/headers';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;

  const cookieStore = await cookies();
  const timeFilterCookie = cookieStore.get('dashboard_time_filter');
  let cookieStart = '';
  let cookieEnd = '';

  if (timeFilterCookie?.value) {
      try {
          const parsed = JSON.parse(timeFilterCookie.value);
          if (parsed.start) cookieStart = parsed.start;
          if (parsed.end) cookieEnd = parsed.end;
      } catch (e) {
          // Ignore parse errors from malformed cookies
      }
  }

  const [bounds, availableDates] = await Promise.all([
    getDateBounds(),
    getAvailableMonthYears()
  ]);

  const startParam = resolvedParams.start as string;
  const endParam = resolvedParams.end as string;

  let startDate = startParam || cookieStart || (bounds?.defaultStart ?? '2025-01-01');
  let endDate = endParam || cookieEnd || (bounds?.defaultEnd ?? '2025-01-31');

  // Fetch data concurrently
  const [yearlyData, incomeCategories, topExpenses] = await Promise.all([
    getYearlyData(startDate, endDate),
    getIncomeCategories(startDate, endDate),
    getTopExpenses(startDate, endDate)
  ]);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Finanzübersicht</h1>
          <p className={styles.subtitle}>Behalten Sie Ihre Einnahmen, Ausgaben und Trends im Blick</p>
        </div>
        <div className={styles.filterSection}>
          <DatePicker
            initialStart={startDate}
            initialEnd={endDate}
            minDate={bounds?.min}
            maxDate={bounds?.max}
            availableDates={availableDates}
          />
          <UploadCSV />
        </div>
      </header>

      <div className={styles.grid}>
        {/* Left Chart (Yearly Overview) */}
        <section className={`${styles.card} ${styles.yearlyCard} glass-panel`}>
          <h2 className={styles.cardTitle}>Jahresüberblick</h2>
          <div className={styles.chartContainer}>
            <YearlyChart data={yearlyData} currentStartDate={startDate} />
          </div>
        </section>

        <div className={styles.rightColumn}>
          {/* Center Chart (Income Donut) */}
          <section className={`${styles.card} glass-panel`}>
            <h2 className={styles.cardTitle}>Einnahmen nach Kategorie</h2>
            <div className={styles.chartContainer}>
              <IncomeDonutChart data={incomeCategories} />
            </div>
          </section>

          {/* Right Chart (Top 10 Expenses) */}
          <section className={`${styles.card} glass-panel`}>
            <h2 className={styles.cardTitle}>Top 10 Ausgaben</h2>
            <div className={styles.chartContainer}>
              <TopExpensesChart data={topExpenses} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
