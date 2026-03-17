import styles from './page.module.css';
import WipeDatabase from '@/components/WipeDatabase';
import { AlertTriangle, DatabaseBackup, Info } from 'lucide-react';
import SettingsForm from '@/components/SettingsForm';
import BackupManager from '@/components/BackupManager';
import { getSettings } from '@/app/actions';

export default async function SettingsPage() {
    const settings = await getSettings();

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Einstellungen</h1>
                    <p className={styles.subtitle}>Verwalten Sie Ihre Anwendungsdaten und Einstellungen</p>
                </div>
            </header>

            <div className={styles.grid}>
                {/* Data Management Section */}
                <section className={`${styles.card} glass-panel`}>
                    <div className={styles.cardHeader}>
                        <DatabaseBackup size={24} className={styles.iconPrimary} />
                        <div>
                            <h2 className={styles.cardTitle}>Datenverwaltung</h2>
                            <p className={styles.cardSubtitle}>Steuern Sie, wie Ihre Finanzdaten gespeichert werden</p>
                        </div>
                    </div>

                    <div className={styles.cardBody}>
                        <div className={styles.infoBox}>
                            <Info size={20} className={styles.infoIcon} />
                            <div>
                                <strong>Standard-Import</strong>
                                <p>Wenn Sie im Dashboard auf "CSV importieren" klicken, fügt das System neue Zeilen sicher <strong>hinzu</strong> und überspringt Duplikate automatisch.</p>
                            </div>
                        </div>

                        <div className={styles.dangerZone}>
                            <div className={styles.dangerHeader}>
                                <AlertTriangle size={20} />
                                <h3>Gefahrenzone</h3>
                            </div>
                            <div className={styles.dangerContent}>
                                <div>
                                    <h4>Datenbank leeren</h4>
                                    <p>Diese Aktion löscht alle vorhandenen Transaktionen und Kategorien im System unwiderruflich und setzt die Anwendung auf einen leeren Zustand zurück.</p>
                                </div>
                                <WipeDatabase />
                            </div>
                        </div>

                        <BackupManager />
                    </div>
                </section>

                {/* AI Configuration Section */}
                <SettingsForm initialSettings={settings} />
            </div>
        </div>
    );
}
