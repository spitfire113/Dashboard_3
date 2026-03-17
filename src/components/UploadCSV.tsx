"use client";

import React, { useRef, useState } from 'react';
import { UploadCloud, AlertTriangle, Download, X } from 'lucide-react';
import { uploadTransactions, exportDatabase } from '@/app/actions';

interface UploadCSVProps {
    isOverwrite?: boolean;
    buttonText?: string;
    variant?: 'primary' | 'danger';
}

export default function UploadCSV({
    isOverwrite = false,
    buttonText = 'CSV importieren',
    variant = 'primary'
}: UploadCSVProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        if (isOverwrite) {
            setShowConfirmModal(true);
        } else {
            fileInputRef.current?.click();
        }
    };

    const confirmAndPickFile = () => {
        setShowConfirmModal(false);
        fileInputRef.current?.click();
    };

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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        try {
            const text = await file.text();
            const result = await uploadTransactions(text, isOverwrite);

            if (result.success) {
                alert(result.message);
            } else {
                alert("Fehler beim Hochladen: " + result.message);
            }
        } catch (err) {
            console.error(err);
            alert("Fehler beim Hochladen der Datei.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const buttonStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: variant === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'var(--accent-primary)',
        color: variant === 'danger' ? 'var(--danger)' : 'white',
        border: variant === 'danger' ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        cursor: isUploading ? 'not-allowed' : 'pointer',
        fontWeight: 500,
        opacity: isUploading ? 0.7 : 1,
        transition: 'all 0.2s',
        fontSize: '0.875rem',
        marginLeft: variant === 'primary' ? '1rem' : '0'
    };

    return (
        <>
            <input
                type="file"
                accept=".csv"
                className="hidden"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            <button
                onClick={handleUploadClick}
                disabled={isUploading}
                style={buttonStyle}
                suppressHydrationWarning
            >
                {variant === 'danger' ? <AlertTriangle size={18} /> : <UploadCloud size={18} />}
                {isUploading ? 'Lädt hoch...' : buttonText}
            </button>

            {/* Warn-Modal für das Überschreiben */}
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--danger)' }}>
                                <AlertTriangle size={28} />
                                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Achtung: Datenbank überschreiben</h2>
                            </div>
                            <button onClick={() => setShowConfirmModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                            Dadurch werden <strong>alle vorhandenen Transaktionen</strong> in der Datenbank vollständig gelöscht und durch die neue CSV-Datei ersetzt.
                            Diese Aktion kann nicht rückgängig gemacht werden. Möchten Sie vorher ein Backup exportieren?
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    width: '100%',
                                    padding: '0.75rem',
                                    backgroundColor: 'var(--accent-primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontWeight: 600,
                                    cursor: isExporting ? 'wait' : 'pointer'
                                }}
                            >
                                <Download size={18} />
                                {isExporting ? 'Exportiere...' : 'Backup herunterladen'}
                            </button>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                <button
                                    onClick={() => setShowConfirmModal(false)}
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
                                    onClick={confirmAndPickFile}
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.75rem',
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        color: 'var(--danger)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '0.5rem',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Trotzdem überschreiben
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
