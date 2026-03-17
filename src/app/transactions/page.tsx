import { getTransactions } from '@/app/actions';
import DatePicker from '@/components/DatePicker';
import styles from './page.module.css';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getDateBounds, getCategories, getAvailableMonthYears } from '@/app/actions';
import TransactionTable from '@/components/TransactionTable';

export default async function TransactionsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await searchParams;
    const [bounds, availableDates] = await Promise.all([
        getDateBounds(),
        getAvailableMonthYears()
    ]);

    const startParam = resolvedParams.start as string;
    const endParam = resolvedParams.end as string;

    const startDate = startParam || (bounds?.defaultStart ?? '2025-01-01');
    const endDate = endParam || (bounds?.defaultEnd ?? '2025-01-31');

    const typeParam = resolvedParams.type as string | undefined;
    const categoryParam = resolvedParams.category as string | undefined;
    const isFixedParam = resolvedParams.is_fixed as string | undefined;

    const [transactions, categories] = await Promise.all([
        getTransactions(startDate, endDate, typeParam, categoryParam, 'DESC', isFixedParam),
        getCategories()
    ]);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href={`/?start=${startDate}&end=${endDate}`} className={styles.backButton}>
                        <ArrowLeft size={20} />
                        Zurück zur Übersicht
                    </Link>
                    <h1 className={styles.title}>
                        Transaktionen
                        {typeParam && <span className={styles.badge}>{typeParam}</span>}
                        {categoryParam && <span className={styles.badge}>{categoryParam}</span>}
                        {isFixedParam === 'true' && <span className={styles.badge}>Fixkosten</span>}
                        {isFixedParam === 'false' && <span className={styles.badge}>Variable Kosten</span>}
                    </h1>
                </div>
                <div className={styles.filterSection}>
                    <DatePicker
                        initialStart={startDate}
                        initialEnd={endDate}
                        minDate={bounds?.min}
                        maxDate={bounds?.max}
                        availableDates={availableDates}
                    />
                </div>
            </header>

            <div className={`${styles.tableCard} glass-panel`}>
                <TransactionTable transactions={transactions} initialCategory={categoryParam} allCategories={categories} />
            </div>
        </div>
    );
}
