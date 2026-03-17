import Database from 'better-sqlite3';
import path from 'path';

// Define the path to the SQLite file
const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

export function initializeDatabase() {
  db.pragma('journal_mode = WAL');

  // Create transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Add new columns to transactions if they don't exist
  const columns = db.pragma('table_info(transactions)') as any[];
  const columnNames = columns.map(c => c.name);

  if (!columnNames.includes('auftraggeber')) {
    db.exec("ALTER TABLE transactions ADD COLUMN auftraggeber TEXT DEFAULT ''");
  }
  if (!columnNames.includes('buchungstext')) {
    db.exec("ALTER TABLE transactions ADD COLUMN buchungstext TEXT DEFAULT ''");
  }
  if (!columnNames.includes('verwendungszweck')) {
    db.exec("ALTER TABLE transactions ADD COLUMN verwendungszweck TEXT DEFAULT ''");
  }
  if (!columnNames.includes('original_hash')) {
    db.exec("ALTER TABLE transactions ADD COLUMN original_hash TEXT DEFAULT ''");
  }
  if (!columnNames.includes('suggested_category')) {
    db.exec("ALTER TABLE transactions ADD COLUMN suggested_category TEXT DEFAULT ''");
  }
  if (!columnNames.includes('ai_confidence')) {
    db.exec("ALTER TABLE transactions ADD COLUMN ai_confidence REAL DEFAULT NULL");
  }

  // Add new columns to categories if they don't exist
  const catColumns = db.pragma('table_info(categories)') as any[];
  const catColumnNames = catColumns.map(c => c.name);

  if (!catColumnNames.includes('is_fixed')) {
    db.exec("ALTER TABLE categories ADD COLUMN is_fixed BOOLEAN DEFAULT 0");
  }

  // Auto-seed categories from existing transactions to ensure data safety and backwards compatibility
  db.exec(`
    INSERT OR IGNORE INTO categories (name, type)
    SELECT DISTINCT category, type FROM transactions WHERE category IS NOT NULL AND category != ''
  `);

  // Ensure PayPal exists as a default protected category
  db.exec("INSERT OR IGNORE INTO categories (name, type, is_fixed) VALUES ('PayPal', 'expense', 0)");

  // Seed default settings if they don't exist
  db.exec(`
    INSERT OR IGNORE INTO settings (key, value) VALUES
    ('ai_exact_match_threshold', '0.95'),
    ('ai_suggest_match_threshold', '0.40')
  `);
}

// Export the db instance for querying
export default db;
