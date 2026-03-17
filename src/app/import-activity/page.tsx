import React from 'react';
import { getUncategorizedTransactions, getCategories, getSettings } from '@/app/actions';
import ImportActivityTable from '@/components/ImportActivityTable';
import styles from './page.module.css';

export default async function ImportActivityPage() {
    // Fetch all transactions missing a category
    const transactions = await getUncategorizedTransactions();
    // Fetch all available categories to populate the dropdowns
    const categories = await getCategories();
    // Fetch settings to allow AI adjustments
    const settings = await getSettings();

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Import-Aktivität</h1>
                    <p className={styles.subtitle}>
                        {transactions.length} Transaktion{transactions.length !== 1 ? 'en warten' : ' wartet'} auf Kategorisierung
                    </p>
                </div>
            </header>

            {transactions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <ImportActivityTable initialTransactions={transactions} allCategories={categories} initialSettings={settings} />
                </div>
            ) : (
                <div className={`${styles.tableCard} glass-panel`} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--success)' }}>Alles erledigt!</div>
                    <p>Es gibt keine importierten Transaktionen ohne Kategorie.</p>
                </div>
            )}
        </div>
    );
}
