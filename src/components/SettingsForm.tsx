"use client";

import React, { useState, useEffect } from 'react';
import { updateSettings } from '@/app/actions';
import { Brain, Save, Check } from 'lucide-react';
import styles from '@/app/settings/page.module.css';

interface SettingsFormProps {
    initialSettings: Record<string, string>;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
    const [exactMatch, setExactMatch] = useState(parseFloat(initialSettings.ai_exact_match_threshold || '0.95') * 100);
    const [suggestMatch, setSuggestMatch] = useState(parseFloat(initialSettings.ai_suggest_match_threshold || '0.40') * 100);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        setShowSuccess(false);

        const updates = {
            ai_exact_match_threshold: (exactMatch / 100).toString(),
            ai_suggest_match_threshold: (suggestMatch / 100).toString(),
        };

        const result = await updateSettings(updates);

        setIsSaving(false);
        if (result.success) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    };

    return (
        <section className={`${styles.card} glass-panel`}>
            <div className={styles.cardHeader}>
                <Brain size={24} className={styles.iconPrimary} style={{ color: 'var(--accent-primary)' }} />
                <div>
                    <h2 className={styles.cardTitle}>KI-Kategorisierung</h2>
                    <p className={styles.cardSubtitle}>Passen Sie die Konfidenzschwellenwerte für die automatische Zuweisung an</p>
                </div>
            </div>

            <div className={styles.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Exact Match Slider */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            Zuversicht für direkte Zuweisung
                        </label>
                        <span style={{
                            background: 'var(--accent-primary)',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold'
                        }}>
                            {exactMatch}%
                        </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Ab diesem Wert ordnet die KI die Kategorie <strong style={{ color: 'var(--success)' }}>sofort</strong> zu und überspringt die Warteschlange. (Standard: 95%)
                    </p>
                    <input
                        type="range"
                        min="50"
                        max="100"
                        step="1"
                        value={exactMatch}
                        onChange={(e) => setExactMatch(parseInt(e.target.value))}
                        style={{ width: '100%', marginTop: '0.5rem', accentColor: 'var(--accent-primary)' }}
                    />
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

                {/* Suggest Match Slider */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            Zuversicht für einen Vorschlag
                        </label>
                        <span style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: 'var(--accent-primary)',
                            border: '1px solid var(--accent-primary)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold'
                        }}>
                            {suggestMatch}%
                        </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Ab diesem Wert erstellt die KI einen <strong style={{ color: 'var(--accent-primary)' }}>✨ Vorschlag</strong> für die Import-Aktivität. (Standard: 40%)
                    </p>
                    <input
                        type="range"
                        min="10"
                        max="90"
                        step="1"
                        value={suggestMatch}
                        onChange={(e) => setSuggestMatch(parseInt(e.target.value))}
                        style={{ width: '100%', marginTop: '0.5rem', accentColor: 'var(--accent-primary)' }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: showSuccess ? 'var(--success)' : 'var(--accent-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: isSaving ? 'wait' : 'pointer',
                            fontWeight: 600,
                            transition: 'background-color 0.2s'
                        }}
                    >
                        {showSuccess ? <Check size={18} /> : <Save size={18} />}
                        {isSaving ? 'Speichert...' : showSuccess ? 'Gespeichert' : 'Einstellungen speichern'}
                    </button>
                </div>

            </div>
        </section>
    );
}
