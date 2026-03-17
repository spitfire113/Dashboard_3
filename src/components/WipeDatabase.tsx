"use client";

import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { wipeDatabase } from '@/app/actions';

export default function WipeDatabase() {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isWiping, setIsWiping] = useState(false);

    const handleWipe = async () => {
        setIsWiping(true);
        try {
            const result = await wipeDatabase();
            if (result.success) {
                alert(result.message);
                setShowConfirmModal(false);
            } else {
                alert("Fehler: " + result.message);
            }
        } catch (e) {
            console.error(e);
            alert("Fehler beim Löschen der Datenbank.");
        } finally {
            setIsWiping(false);
        }
    };

    return (
        <div>
            <button
                onClick={() => setShowConfirmModal(true)}
                disabled={isWiping}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.25rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--danger)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.5rem',
                    fontWeight: 500,
                    cursor: isWiping ? 'wait' : 'pointer',
                    transition: 'background-color 0.2s'
                }}
            >
                <Trash2 size={18} />
                {isWiping ? 'Lösche...' : 'Datenbank leeren'}
            </button>

            {/* Confirm Wipe Modal */}
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
                                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Datenbank endgültig löschen</h2>
                            </div>
                            <button onClick={() => setShowConfirmModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                            Sie sind dabei, <strong>alle Transaktionen und Kategorien</strong> unwiderruflich zu löschen.
                            Ihre lokalen Einstellungen bleiben erhalten. <br /><br />
                            Haben Sie vorher ein Backup exportiert? Dieser Schritt kann nicht rückgängig gemacht werden.
                        </p>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                disabled={isWiping}
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
                                onClick={handleWipe}
                                disabled={isWiping}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem',
                                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                    color: 'var(--danger)',
                                    border: '1px solid rgba(239, 68, 68, 0.5)',
                                    borderRadius: '0.5rem',
                                    fontWeight: 600,
                                    cursor: isWiping ? 'wait' : 'pointer'
                                }}
                            >
                                <Trash2 size={18} />
                                {isWiping ? 'Lösche...' : 'Ja, komplett leeren'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
