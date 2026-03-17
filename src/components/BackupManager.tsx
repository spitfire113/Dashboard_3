"use client";

import React, { useRef, useState } from 'react';
import { Download, Upload, AlertTriangle, X, Save } from 'lucide-react';
import { exportDatabase, importDatabase } from '@/app/actions';

export default function BackupManager() {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        setIsExporting(true);
        const result = await exportDatabase();
        if (result.success && result.data) {
            const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard_backup_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            alert(result.message || 'Fehler beim Exportieren.');
        }
        setIsExporting(false);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setShowConfirmModal(true);
        }
        // Reset so the same file can be picked again if cancelled
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleImport = async () => {
        if (!selectedFile) return;

        setShowConfirmModal(false);
        setIsImporting(true);

        try {
            const text = await selectedFile.text();
            const result = await importDatabase(text);

            if (result.success) {
                alert(result.message);
                // Optionally reload or let Server Actions revalidate
            } else {
                alert("Fehler beim Importieren: " + result.message);
            }
        } catch (e) {
            console.error(e);
            alert("Fehler beim Lesen der Backup-Datei.");
        } finally {
            setIsImporting(false);
            setSelectedFile(null);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Save size={20} style={{ color: 'var(--text-primary)' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>System-Backup</h3>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Sichern Sie Ihre grundlegenden Daten (Transaktionen und Kategorien) als CSV-Datei oder stellen Sie ein vorheriges Backup wieder her. Lokale Einstellungen (wie z.B. Fixkosten-Schwellenwerte) werden beim Import ignoriert.
                </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                    onClick={handleExport}
                    disabled={isExporting || isImporting}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 1.25rem',
                        backgroundColor: 'var(--bg-main)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        fontWeight: 500,
                        cursor: isExporting ? 'wait' : 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                >
                    <Download size={18} />
                    {isExporting ? 'Exportiere...' : 'Backup erstellen'}
                </button>

                <input
                    type="file"
                    accept=".csv"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />

                <button
                    onClick={triggerFileInput}
                    disabled={isImporting || isExporting}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 1.25rem',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        color: 'var(--warning, #f59e0b)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '0.5rem',
                        fontWeight: 500,
                        cursor: isImporting ? 'wait' : 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                >
                    <Upload size={18} />
                    {isImporting ? 'Stelle wieder her...' : 'Backup wiederherstellen'}
                </button>
            </div>

            {/* Restore Confirmation Modal */}
            {showConfirmModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '1rem',
                        padding: '2rem',
                        maxWidth: '500px',
                        width: '90%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--warning, #f59e0b)' }}>
                                <AlertTriangle size={28} />
                                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Backup wiederherstellen</h2>
                            </div>
                            <button onClick={() => { setShowConfirmModal(false); setSelectedFile(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                            Sie sind dabei, das Backup <strong>{selectedFile?.name}</strong> wiederherzustellen.
                            Dadurch wird Ihre <strong>aktuelle Datenbank vollständig gelöscht und überschrieben</strong>.
                            Möchten Sie den Vorgang wirklich fortsetzen?
                        </p>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={() => { setShowConfirmModal(false); setSelectedFile(null); }}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    backgroundColor: 'transparent',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '0.5rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleImport}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem',
                                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                    color: 'var(--warning, #f59e0b)',
                                    border: '1px solid rgba(245, 158, 11, 0.5)',
                                    borderRadius: '0.5rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                <AlertTriangle size={18} />
                                Überschreiben
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
