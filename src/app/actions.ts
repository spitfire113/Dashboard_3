'use server';

import db, { initializeDatabase } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import Papa from 'papaparse';
import stringSimilarity from 'string-similarity';

// Ensure DB is initialized when actions are called
try {
    initializeDatabase();
} catch (e) {
    console.error("Failed to initialize DB:", e);
}

export interface YearlyDataPoint {
    label: string;
    income: number;
    expense: number;
}

export interface CategoryDataPoint {
    category: string;
    amount: number;
}

// Left Chart: Yearly/Multi-year Income & Expense
export async function getYearlyData(startDate: string, endDate: string): Promise<YearlyDataPoint[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    // Single year view (display months)
    if (startYear === endYear) {
        const query = db.prepare(`
      SELECT 
        strftime('%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN ABS(amount) ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as expense
      FROM transactions
      WHERE strftime('%Y', date) = ? AND category != '' AND category IS NOT NULL
      GROUP BY month
      ORDER BY month ASC
    `);

        const results = query.all(startYear.toString()) as { month: string, income: number, expense: number }[];

        // Fill all 12 months even if no data
        const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
        return months.map((monthName, index) => {
            const monthStr = String(index + 1).padStart(2, '0');
            const row = results.find(r => r.month === monthStr);
            return {
                label: monthName,
                income: row?.income || 0,
                expense: row?.expense || 0
            };
        });
    }
    // Multi-year view (display years)
    else {
        const query = db.prepare(`
      SELECT 
        strftime('%Y', date) as year,
        SUM(CASE WHEN type = 'income' THEN ABS(amount) ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as expense
      FROM transactions
      WHERE strftime('%Y', date) BETWEEN ? AND ? AND category != '' AND category IS NOT NULL
      GROUP BY year
      ORDER BY year ASC
    `);

        const results = query.all(startYear.toString(), endYear.toString()) as { year: string, income: number, expense: number }[];
        return results.map(row => ({
            label: row.year,
            income: row.income,
            expense: row.expense
        }));
    }
}

// Center Chart: Income by Category
export async function getIncomeCategories(startDate: string, endDate: string): Promise<CategoryDataPoint[]> {
    const query = db.prepare(`
    SELECT category, SUM(ABS(amount)) as amount
    FROM transactions
    WHERE type = 'income' AND date BETWEEN ? AND ? AND category != '' AND category IS NOT NULL
    GROUP BY category
    ORDER BY amount DESC
  `);

    return query.all(startDate, endDate) as CategoryDataPoint[];
}

// Right Chart: Top 10 Expense Categories
export async function getTopExpenses(startDate: string, endDate: string): Promise<CategoryDataPoint[]> {
    const query = db.prepare(`
    SELECT category, SUM(ABS(amount)) as amount
    FROM transactions
    WHERE type = 'expense' AND date BETWEEN ? AND ? AND category != '' AND category IS NOT NULL
    GROUP BY category
    ORDER BY amount DESC
    LIMIT 10
  `);

    return query.all(startDate, endDate) as CategoryDataPoint[];
}

// Get Date Bounds
export async function getDateBounds(): Promise<{ min: string, max: string, defaultStart: string, defaultEnd: string } | null> {
    const query = db.prepare(`SELECT MIN(date) as min, MAX(date) as max FROM transactions WHERE category != '' AND category IS NOT NULL`);
    const result = query.get() as { min: string | null, max: string | null };
    if (result && result.min && result.max) {
        let maxDate = new Date(result.max);
        
        const year = maxDate.getFullYear();
        const month = maxDate.getMonth() + 1; // 1-12

        const defaultStart = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const defaultEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        return {
            min: result.min,
            max: result.max,
            defaultStart,
            defaultEnd
        };
    }
    return null;
}

export async function getAvailableMonthYears(excludeCurrentMonth: boolean = false): Promise<{ year: string, month: string }[]> {
    const query = db.prepare(`
        SELECT DISTINCT strftime('%Y', date) as year, strftime('%m', date) as month
        FROM transactions
        WHERE category != '' AND category IS NOT NULL
        ORDER BY year DESC, month DESC
    `);
    const allMonths = query.all() as { year: string, month: string }[];
    
    if (excludeCurrentMonth) {
        // Hard filter out the current executing month
        const today = new Date();
        const currY = today.getFullYear().toString();
        const currM = String(today.getMonth() + 1).padStart(2, '0');
        
        return allMonths.filter(m => !(m.year === currY && m.month === currM));
    }

    return allMonths;
}

export interface Transaction {
    id: number;
    date: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    suggested_category?: string;
    auftraggeber?: string;
    buchungstext?: string;
    verwendungszweck?: string;
    original_hash?: string;
    ai_confidence?: number;
}

export interface Category {
    id: number;
    name: string;
    type: 'income' | 'expense';
    usageCount?: number;
    is_fixed: boolean;
}

export async function getTransactions(
    startDate: string,
    endDate: string,
    type?: string,
    category?: string,
    sortDir: 'ASC' | 'DESC' = 'DESC',
    isFixed?: string
): Promise<Transaction[]> {
    let queryStr = `
        SELECT t.id, t.date, t.amount, t.type, t.category, t.ai_confidence, t.auftraggeber, t.buchungstext, t.verwendungszweck
        FROM transactions t
    `;

    if (isFixed !== undefined) {
        queryStr += ` JOIN categories c ON t.category = c.name `;
    }

    queryStr += ` WHERE t.date BETWEEN ? AND ? AND t.category != '' AND t.category IS NOT NULL `;

    const params: any[] = [startDate, endDate];

    if (type) {
        queryStr += ` AND t.type = ?`;
        params.push(type);
    }

    if (category) {
        queryStr += ` AND t.category = ?`;
        params.push(category);
    }

    if (isFixed !== undefined) {
        queryStr += ` AND c.is_fixed = ?`;
        params.push(isFixed === 'true' ? 1 : 0);
    }

    queryStr += ` ORDER BY t.date ${sortDir}, t.id ${sortDir}`;

    const query = db.prepare(queryStr);
    return query.all(...params) as Transaction[];
}

export async function getUncategorizedCount(): Promise<number> {
    const query = db.prepare(`
        SELECT COUNT(*) as count
        FROM transactions
        WHERE category = '' OR category IS NULL
    `);
    const result = query.get() as { count: number };
    return result.count;
}

export async function getUncategorizedTransactions(): Promise<Transaction[]> {
    const query = db.prepare(`
        SELECT id, date, amount, type, category, suggested_category, ai_confidence, auftraggeber, buchungstext, verwendungszweck
        FROM transactions
        WHERE category = '' OR category IS NULL
        ORDER BY date DESC
    `);
    return query.all() as Transaction[];
}

// Upload CSV Data (Append or Overwrite)
export async function uploadTransactions(csvData: string, isOverwrite: boolean = false) {
    const settingsRows = db.prepare(`SELECT key, value FROM settings`).all() as { key: string, value: string }[];
    const settings: Record<string, string> = {};
    for (const row of settingsRows) {
        settings[row.key] = row.value;
    }
    const exactThreshold = parseFloat(settings['ai_exact_match_threshold'] || '0.95');
    const suggestThreshold = parseFloat(settings['ai_suggest_match_threshold'] || '0.40');

    return new Promise<{ success: boolean; message: string }>((resolve) => {
        const lines = csvData.split(/\r?\n/);

        const isPaypal = lines[0] && lines[0].includes('"Transaktionscode"') && lines[0].includes('"Netto"');
        let headerIndex = -1;

        if (isPaypal) {
            headerIndex = lines.findIndex(line => line.includes('"Transaktionscode"'));
        } else {
            headerIndex = lines.findIndex(line => line.startsWith('Buchung;'));
        }

        const cleanCsvString = headerIndex >= 0 ? lines.slice(headerIndex).join('\n') : csvData;

        Papa.parse(cleanCsvString, {
            header: true,
            skipEmptyLines: true,
            delimiter: isPaypal ? ',' : ';',
            complete: (results) => {
                try {
                    // Verify format
                    const rows = results.data as any[];
                    if (rows.length === 0) {
                        resolve({ success: false, message: "CSV file is empty." });
                        return;
                    }

                    // Pre-fetch historical data for AI mapping
                    const historicalTxs = db.prepare(`
                        SELECT auftraggeber, verwendungszweck, category, type
                        FROM transactions 
                        WHERE category != '' AND category IS NOT NULL
                    `).all() as { auftraggeber: string, verwendungszweck: string, category: string, type: string }[];

                    if (isPaypal) {
                        let syncCount = 0;
                        const updateBankTxStmt = db.prepare(`
                            UPDATE transactions
                            SET auftraggeber = ?, date = ?, category = ?, suggested_category = ?, ai_confidence = ?
                            WHERE id = ?
                        `);

                        const bankPaypalTxs = db.prepare(`
                            SELECT id, date, amount, type, category, auftraggeber, verwendungszweck 
                            FROM transactions 
                            WHERE auftraggeber LIKE '%PayPal%' COLLATE NOCASE
                        `).all() as any[];

                        const transaction = db.transaction(() => {
                            for (const row of rows) {
                                const datum = row['Datum'];
                                const netto = row['Netto'];
                                const name = row['Name'];

                                if (!datum || !netto || !name || !name.trim()) continue;

                                const [day, month, year] = datum.split('.');
                                if (!day || !month || !year) continue;
                                const ppDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                                const ppDate = new Date(ppDateStr);

                                const amountRaw = parseFloat(netto.replace(/\./g, '').replace(',', '.'));
                                if (isNaN(amountRaw)) continue;
                                const amount = Math.abs(amountRaw);
                                const type = amountRaw >= 0 ? 'income' : 'expense';

                                const matchIndex = bankPaypalTxs.findIndex(tx => {
                                    if (tx.amount !== amount || tx.type !== type) return false;
                                    const bDate = new Date(tx.date);
                                    const diffDays = (bDate.getTime() - ppDate.getTime()) / (1000 * 3600 * 24);
                                    return diffDays >= 0 && diffDays <= 8;
                                });

                                if (matchIndex >= 0) {
                                    const matchedTx = bankPaypalTxs[matchIndex];
                                    bankPaypalTxs.splice(matchIndex, 1);

                                    // Clear existing generic categories to force re-evaluation with the new enriched name
                                    let finalCategory = '';
                                    let suggestedCategory = '';
                                    let finalRating: number | null = null;

                                    // Run the AI engine against the explicitly discovered merchant name
                                    if (historicalTxs.length > 0) {
                                        const searchString = name.trim().toLowerCase();
                                        const relevantHistoricalTxs = historicalTxs.filter(tx => tx.type === type);
                                        const relevantHistoricalStrings = relevantHistoricalTxs.map(tx =>
                                            (tx.auftraggeber + ' ' + tx.verwendungszweck).trim().toLowerCase()
                                        );

                                        if (relevantHistoricalStrings.length > 0) {
                                            const bestMatch = stringSimilarity.findBestMatch(searchString, relevantHistoricalStrings);
                                            const rating = bestMatch.bestMatch.rating;
                                            finalRating = rating;

                                            // Actively apply the thresholds
                                            if (rating >= exactThreshold) {
                                                finalCategory = relevantHistoricalTxs[bestMatch.bestMatchIndex].category;
                                            } else if (rating >= suggestThreshold) {
                                                suggestedCategory = relevantHistoricalTxs[bestMatch.bestMatchIndex].category;
                                            }
                                            // If rating < exactThreshold, finalCategory remains '' and goes into the queue.
                                        }
                                    }

                                    updateBankTxStmt.run(name.trim(), ppDateStr, finalCategory, suggestedCategory, finalRating, matchedTx.id);
                                    syncCount++;
                                }
                            }
                        });

                        transaction();
                        revalidatePath('/');
                        revalidatePath('/transactions');
                        revalidatePath('/import-activity');
                        resolve({ success: true, message: `Erfolgreich ${syncCount} PayPal-Transaktionen mit dem Bankkonto synchronisiert.` });
                        return;
                    }

                    const txs = [];
                    for (const row of rows) {
                        // Dynamically find the "Auftraggeber" column which often suffers from text encoding bugs (e.g. Empfnger)
                        const rowKeys = Object.keys(row);
                        const auftraggeberKey = rowKeys.find(k => k.startsWith('Auftraggeber')) || 'Auftraggeber';

                        const buchung = row['Buchung'] || row['Buchungstag'];
                        const betragStr = row['Betrag'] || row['Umsatz'];

                        // The new CSV does not have categories natively, set to empty string.
                        let category = row['Kategorie'] || row['category'] || '';
                        let suggested_category = '';
                        let ai_confidence: number | null = null;

                        const auftraggeber = row[auftraggeberKey] || '';
                        const buchungstext = row['Buchungstext'] || '';
                        const verwendungszweck = row['Verwendungszweck'] || '';

                        if (!buchung || !betragStr) {
                            continue; // Skip invalid rows
                        }

                        // Convert DD.MM.YYYY to YYYY-MM-DD
                        const [day, month, year] = buchung.split('.');
                        if (!day || !month || !year) continue;
                        const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

                        // Parse Amount (handle European formatting -209,72 -> -209.72)
                        const amountRaw = parseFloat(betragStr.replace('.', '').replace(',', '.'));
                        if (isNaN(amountRaw)) continue;

                        const type = amountRaw >= 0 ? 'income' : 'expense';
                        const amount = Math.abs(amountRaw);

                        // Algorithmic Categorization
                        if (!category && historicalTxs.length > 0) {
                            const searchString = (auftraggeber + ' ' + verwendungszweck).trim().toLowerCase();
                            if (searchString) {
                                const relevantHistoricalTxs = historicalTxs.filter(tx => tx.type === type);
                                const relevantHistoricalStrings = relevantHistoricalTxs.map(tx =>
                                    (tx.auftraggeber + ' ' + tx.verwendungszweck).trim().toLowerCase()
                                );

                                if (relevantHistoricalStrings.length > 0) {
                                    const bestMatch = stringSimilarity.findBestMatch(searchString, relevantHistoricalStrings);
                                    const rating = bestMatch.bestMatch.rating;
                                    ai_confidence = rating;

                                    if (rating >= exactThreshold) {
                                        category = relevantHistoricalTxs[bestMatch.bestMatchIndex].category;
                                    } else if (rating >= suggestThreshold) {
                                        suggested_category = relevantHistoricalTxs[bestMatch.bestMatchIndex].category;
                                    }
                                }
                            }
                        }

                        // Generate a unique deduplication hash from the absolute raw inputs from the CSV
                        const original_hash = `${date}_${amountRaw}_${verwendungszweck.trim()}`;

                        txs.push({ date, amount, type, category, suggested_category, ai_confidence, auftraggeber, buchungstext, verwendungszweck, original_hash });
                    }

                    if (txs.length === 0) {
                        resolve({ success: false, message: "No valid transactions found in CSV." });
                        return;
                    }

                    const clearStmt = db.prepare('DELETE FROM transactions');
                    const insertStmt = db.prepare(`
                        INSERT INTO transactions(date, amount, type, category, suggested_category, ai_confidence, auftraggeber, buchungstext, verwendungszweck, original_hash)
                        VALUES(@date, @amount, @type, @category, @suggested_category, @ai_confidence, @auftraggeber, @buchungstext, @verwendungszweck, @original_hash)
                    `);

                    const checkStmt = db.prepare(`
                        SELECT 1 FROM transactions 
                        WHERE original_hash = @original_hash
                    `);

                    const transaction = db.transaction((transactions: any[]) => {
                        if (isOverwrite) {
                            // Wipe the database completely before importing
                            clearStmt.run();
                            let count = 0;
                            for (const tx of transactions) {
                                insertStmt.run(tx);
                                count++;
                            }
                            return count;
                        } else {
                            // Append mode with strict deduplication
                            let count = 0;
                            for (const tx of transactions) {
                                const exists = checkStmt.get(tx);
                                if (!exists) {
                                    insertStmt.run(tx);
                                    count++;
                                }
                            }
                            return count;
                        }
                    });

                    const insertedCount = transaction(txs) as number;

                    revalidatePath('/');
                    if (isOverwrite) {
                        resolve({ success: true, message: `Successfully cleared and imported ${insertedCount} transactions.` });
                    } else {
                        resolve({ success: true, message: `Appended ${insertedCount} new incoming transactions (skipped ${txs.length - insertedCount} duplicates).` });
                    }
                } catch (error) {
                    console.error("Error inserting CSV data:", error);
                    resolve({ success: false, message: "Error parsing and saving CSV data." });
                }
            },
            error: (error: any) => {
                console.error("Error parsing CSV:", error);
                resolve({ success: false, message: "Failed to read CSV format." });
            }
        });
    });
}

// Update Transaction Detail Inline
export async function updateTransaction(
    id: number,
    updates: { category: string; auftraggeber: string; buchungstext: string; verwendungszweck: string; amount: number }
) {
    try {
        const stmt = db.prepare(`
            UPDATE transactions
            SET category = ?, auftraggeber = ?, buchungstext = ?, verwendungszweck = ?, amount = ?
            WHERE id = ?
        `);
        stmt.run(updates.category, updates.auftraggeber, updates.buchungstext, updates.verwendungszweck, updates.amount, id);
        revalidatePath('/transactions');
        return { success: true };
    } catch (err) {
        console.error("Failed to update transaction", err);
        return { success: false, message: "Error updating database" };
    }
}

// Create New Manual Transaction
export async function createTransaction(tx: {
    date: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    auftraggeber: string;
    buchungstext: string;
    verwendungszweck: string;
}) {
    try {
        // Hash it identically to the CSV parser for consistency, even if manual
        const str = `${tx.date}${tx.amount}${tx.verwendungszweck}`;
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(str).digest('hex');

        const stmt = db.prepare(`
            INSERT INTO transactions (original_hash, date, amount, type, category, auftraggeber, buchungstext, verwendungszweck)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            hash,
            tx.date,
            tx.amount,
            tx.type,
            tx.category,
            tx.auftraggeber,
            tx.buchungstext,
            tx.verwendungszweck
        );

        revalidatePath('/');
        revalidatePath('/transactions');
        return { success: true };
    } catch (err) {
        console.error("Failed to create transaction", err);
        return { success: false, message: "Fehler beim Anlegen der Transaktion" };
    }
}

// ---------------------------------------------------------------------------
// DELETION ACTIONS
// ---------------------------------------------------------------------------

export async function deleteTransaction(id: number) {
    try {
        const stmt = db.prepare('DELETE FROM transactions WHERE id = ?');
        stmt.run(id);
        revalidatePath('/');
        return { success: true, message: "Transaction deleted successfully." };
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return { success: false, message: "Error deleting transaction." };
    }
}

export async function deleteAllUncategorizedTransactions() {
    try {
        const stmt = db.prepare(`DELETE FROM transactions WHERE category = '' OR category IS NULL`);
        const info = stmt.run();
        revalidatePath('/');
        return { success: true, message: `Successfully deleted ${info.changes} uncategorized transactions.` };
    } catch (error) {
        console.error("Error deleting uncategorized transactions:", error);
        return { success: false, message: "Error clearing uncategorized transactions." };
    }
}

// ---------------------------------------------------------------------------
// CATEGORY ACTIONS
// ---------------------------------------------------------------------------

export async function getCategories(): Promise<Category[]> {
    const categories = db.prepare(`
        SELECT 
            c.id,
            c.name,
            c.type,
            c.is_fixed,
            (SELECT COUNT(*) FROM transactions t WHERE t.category = c.name AND t.type = c.type) as usageCount
        FROM categories c
        ORDER BY c.type ASC, c.name ASC
    `).all() as Category[];

    // Explicitly parse the sqlite 1/0 integer boolean to actual boolean for react compatibility
    return categories.map(c => ({
        ...c,
        is_fixed: Boolean(c.is_fixed)
    }));
}

export async function addCategory(name: string, type: 'income' | 'expense', is_fixed: boolean = false) {
    try {
        const stmt = db.prepare(`INSERT INTO categories(name, type, is_fixed) VALUES(?, ?, ?)`);
        stmt.run(name, type, is_fixed ? 1 : 0);
        revalidatePath('/categories');
        return { success: true };
    } catch (err: any) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return { success: false, message: "Category name already exists" };
        }
        return { success: false, message: "Error adding category" };
    }
}

export async function updateCategory(id: number, oldName: string, newName: string, newType: 'income' | 'expense', is_fixed: boolean = false) {
    if (oldName.toLowerCase() === 'paypal' && newName.toLowerCase() !== 'paypal') {
        return { success: false, message: "Die System-Kategorie 'PayPal' darf nicht umbenannt werden." };
    }

    try {
        const transaction = db.transaction(() => {
            // Update the category itself
            const stmt = db.prepare(`UPDATE categories SET name = ?, type = ?, is_fixed = ? WHERE id = ?`);
            stmt.run(newName, newType, is_fixed ? 1 : 0, id);

            // Cascade the name update to all existing transactions to maintain data integrity
            const cascadeStmt = db.prepare(`UPDATE transactions SET category = ?, type = ? WHERE category = ?`);
            cascadeStmt.run(newName, newType, oldName);
        });

        transaction();
        revalidatePath('/');
        revalidatePath('/transactions');
        revalidatePath('/categories');
        return { success: true };
    } catch (err: any) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return { success: false, message: "Category name already exists" };
        }
        return { success: false, message: "Error updating category" };
    }
}

export async function deleteCategory(id: number) {
    try {
        const cat = db.prepare('SELECT name FROM categories WHERE id = ?').get(id) as { name: string } | undefined;
        if (cat && cat.name.toLowerCase() === 'paypal') {
            return { success: false, message: "Die System-Kategorie 'PayPal' darf nicht gelöscht werden." };
        }

        const stmt = db.prepare(`DELETE FROM categories WHERE id = ?`);
        stmt.run(id);
        revalidatePath('/categories');
        return { success: true };
    } catch (err) {
        return { success: false, message: "Error deleting category" };
    }
}

// ---------------------------------------------------------------------------
// SETTINGS ACTIONS
// ---------------------------------------------------------------------------

export async function getSettings(): Promise<Record<string, string>> {
    const rows = db.prepare(`SELECT key, value FROM settings`).all() as { key: string, value: string }[];
    const settings: Record<string, string> = {};
    for (const row of rows) {
        settings[row.key] = row.value;
    }
    return settings;
}

export async function updateSettings(updates: Record<string, string>) {
    try {
        const stmt = db.prepare(`
            INSERT INTO settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `);
        const transaction = db.transaction(() => {
            for (const [key, value] of Object.entries(updates)) {
                stmt.run(key, value);
            }
        });
        transaction();
        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        console.error("Error updating settings:", error);
        return { success: false, message: "Error updating settings" };
    }
}

// ---------------------------------------------------------------------------
// ANALYTICS ACTIONS
// ---------------------------------------------------------------------------

export interface AvgMonthlyCost {
    category: string;
    avgAmount: number;
    is_fixed: number;
}

export async function getAverageMonthlyCosts(startDate: string, endDate: string): Promise<AvgMonthlyCost[]> {
    const startD = new Date(startDate);
    const endD = new Date(endDate);
    const now = new Date();
    
    const effectiveEndD = endD > now ? now : endD;
    const effectiveStartD = startD.getFullYear() < 2000 ? new Date('2020-01-01') : startD; // safety cap for 'all' bounds

    const totalMonths = Math.max(1, (effectiveEndD.getFullYear() - effectiveStartD.getFullYear()) * 12 + (effectiveEndD.getMonth() - effectiveStartD.getMonth()) + 1);

    const query = db.prepare(`
        SELECT 
            t.category,
            SUM(ABS(t.amount)) / ? as avgAmount,
            c.is_fixed
        FROM transactions t
        LEFT JOIN categories c ON t.category = c.name
        WHERE t.type = 'expense' AND t.date BETWEEN ? AND ? AND t.category != '' AND t.category IS NOT NULL
        GROUP BY t.category
        ORDER BY avgAmount DESC
    `);

    return query.all(totalMonths, startDate, endDate) as AvgMonthlyCost[];
}

export async function getAverageMonthlyIncome(startDate: string, endDate: string): Promise<number> {
    const startD = new Date(startDate);
    const endD = new Date(endDate);
    const now = new Date();
    
    const effectiveEndD = endD > now ? now : endD;
    const effectiveStartD = startD.getFullYear() < 2000 ? new Date('2020-01-01') : startD;

    const totalMonths = Math.max(1, (effectiveEndD.getFullYear() - effectiveStartD.getFullYear()) * 12 + (effectiveEndD.getMonth() - effectiveStartD.getMonth()) + 1);

    const query = db.prepare(`
        SELECT SUM(ABS(amount)) / ? as avgIncome
        FROM transactions
        WHERE type = 'income' AND date BETWEEN ? AND ? AND category != '' AND category IS NOT NULL
    `);

    const result = query.get(totalMonths, startDate, endDate) as { avgIncome: number | null };
    return result.avgIncome || 0;
}

export interface SavingsSurplusData {
    monthStr: string;
    surplus: number;
}

export async function getSavingsSurplus(startDate: string, endDate: string): Promise<SavingsSurplusData[]> {
    const query = db.prepare(`
        SELECT 
            strftime('%Y-%m', date) as monthStr,
            SUM(CASE WHEN type = 'income' THEN ABS(amount) ELSE 0 END) - SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as surplus
        FROM transactions
        WHERE date BETWEEN ? AND ? AND category != '' AND category IS NOT NULL
        GROUP BY monthStr
        ORDER BY monthStr ASC
    `);

    return query.all(startDate, endDate) as SavingsSurplusData[];
}

export interface CategoryTrendData {
    monthStr: string;
    category: string;
    amount: number;
}

export async function getCategoryTrend(startDate: string, endDate: string): Promise<CategoryTrendData[]> {
    const query = db.prepare(`
        SELECT 
            strftime('%Y-%m', date) as monthStr,
            category,
            SUM(ABS(amount)) as amount
        FROM transactions
        WHERE type = 'expense' AND date BETWEEN ? AND ? AND category != '' AND category IS NOT NULL
        GROUP BY monthStr, category
        ORDER BY monthStr ASC
    `);

    return query.all(startDate, endDate) as CategoryTrendData[];
}

export interface FixedVsVariable {
    monthStr: string;
    fixed: number;
    variable: number;
}

export async function getFixedVsVariableExpenses(startDate: string, endDate: string): Promise<FixedVsVariable[]> {
    const query = db.prepare(`
        SELECT
            strftime('%Y-%m', t.date) as monthStr,
            SUM(CASE WHEN c.is_fixed = 1 THEN ABS(t.amount) ELSE 0 END) as fixed,
            SUM(CASE WHEN c.is_fixed = 0 THEN ABS(t.amount) ELSE 0 END) as variable
        FROM transactions t
        JOIN categories c ON t.category = c.name
        WHERE t.type = 'expense' AND t.date BETWEEN ? AND ? AND t.category != '' AND t.category IS NOT NULL
        GROUP BY monthStr
        ORDER BY monthStr ASC
    `);
    return query.all(startDate, endDate) as FixedVsVariable[];
}

// ==========================================
// Database Backup & Restore
// ==========================================

export async function exportDatabase() {
    try {
        const transactions = db.prepare(`
            SELECT date, amount, type, category, auftraggeber, buchungstext, verwendungszweck 
            FROM transactions
        `).all();

        const csv = Papa.unparse(transactions);

        return { success: true, data: csv };
    } catch (e: any) {
        console.error("Export Error:", e);
        return { success: false, message: 'Fehler beim Exportieren der Datenbank.' };
    }
}

export async function importDatabase(csvData: string) {
    try {
        return new Promise<{ success: boolean; message: string }>((resolve) => {
            Papa.parse(csvData, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const rows = results.data as any[];

                    if (rows.length === 0) {
                        resolve({ success: false, message: 'Die hochgeladene CSV-Datei ist leer.' });
                        return;
                    }

                    try {
                        const runImport = db.transaction(() => {
                            // Clear existing core data (Settings remain untouched)
                            db.prepare('DELETE FROM transactions').run();
                            db.prepare('DELETE FROM categories').run();

                            const insertTx = db.prepare(`
                                INSERT INTO transactions (date, amount, type, category, auftraggeber, buchungstext, verwendungszweck)
                                VALUES (?, ?, ?, ?, ?, ?, ?)
                            `);

                            const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name, type, is_fixed) VALUES (?, ?, 0)');

                            for (const row of rows) {
                                // Defaulting fallbacks for forwards compatibility
                                const date = row.date || '';
                                const amount = parseFloat(row.amount) || 0;
                                const type = row.type || 'expense';
                                const category = row.category || '';
                                const auftraggeber = row.auftraggeber || '';
                                const buchungstext = row.buchungstext || '';
                                const verwendungszweck = row.verwendungszweck || '';

                                insertTx.run(date, amount, type, category, auftraggeber, buchungstext, verwendungszweck);

                                if (category) {
                                    insertCat.run(category, type);
                                }
                            }
                        });

                        runImport();
                        revalidatePath('/', 'layout');
                        resolve({ success: true, message: 'Transaktionen und Kategorien erfolgreich aus Backup wiederhergestellt.' });
                    } catch (e) {
                        console.error("Import execution failed:", e);
                        resolve({ success: false, message: 'Fehler während der Datenbank-Neuzuweisung.' });
                    }
                },
                error: (error: any) => {
                    console.error("PapaParse error:", error);
                    resolve({ success: false, message: 'Fehler beim Lesen der CSV-Datei.' });
                }
            });
        });
    } catch (e: any) {
        console.error("Import failed:", e);
        return { success: false, message: 'Fehler beim Importieren des Backups. Ist die CSV-Datei valide?' };
    }
}

export async function wipeDatabase() {
    try {
        const runWipe = db.transaction(() => {
            db.prepare('DELETE FROM transactions').run();
            db.prepare('DELETE FROM categories').run();
        });

        runWipe();
        revalidatePath('/', 'layout');
        return { success: true, message: 'Datenbank erfolgreich gelöscht. Das System ist nun leer.' };
    } catch (e: any) {
        console.error("Wipe failed:", e);
        return { success: false, message: 'Fehler beim Löschen der Datenbank.' };
    }
}
