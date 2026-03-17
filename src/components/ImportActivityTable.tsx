"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Transaction, Category, updateTransaction, addCategory, deleteTransaction, deleteAllUncategorizedTransactions } from '@/app/actions';
import { Check, ChevronDown, X, Trash2, Brain } from 'lucide-react';
import SettingsForm from '@/components/SettingsForm';

interface ImportActivityTableProps {
    initialTransactions: Transaction[];
    allCategories: Category[];
    initialSettings: Record<string, string>;
}

export default function ImportActivityTable({ initialTransactions, allCategories, initialSettings }: ImportActivityTableProps) {
    const [transactions, setTransactions] = useState(initialTransactions);
    const [categories, setCategories] = useState(allCategories);
    const [showAIDetails, setShowAIDetails] = useState(false);

    // Track active dropdown
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Track state of creating new category in a row
    const [creatingCategoryForId, setCreatingCategoryForId] = useState<number | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Form states per row for fast editing
    const [edits, setEdits] = useState<Record<number, { category: string; auftraggeber: string; buchungstext: string; verwendungszweck: string }>>({});

    const handleEditChange = (id: number, field: string, value: string) => {
        setEdits(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || transactions.find(t => t.id === id)!),
                [field]: value
            }
        }));
    };

    const handleSaveRow = async (id: number) => {
        const tx = transactions.find(t => t.id === id);
        if (!tx) return;

        const rowEdits = edits[id] || tx;

        const finalCategory = rowEdits.category || tx.suggested_category || '';

        // Wait till it's saved
        await updateTransaction(id, {
            category: finalCategory,
            auftraggeber: rowEdits.auftraggeber,
            buchungstext: rowEdits.buchungstext,
            verwendungszweck: rowEdits.verwendungszweck,
            amount: tx.amount
        });

        // Optimistically remove from "To-Do" list if it now has a category
        if (finalCategory && finalCategory !== '') {
            setTransactions(prev => prev.filter(t => t.id !== id));
        }
    };

    const handleDeleteRow = async (id: number) => {
        const result = await deleteTransaction(id);
        if (result.success) {
            setTransactions(prev => prev.filter(t => t.id !== id));
        } else {
            alert(result.message);
        }
    };

    const handleDeleteAll = async () => {
        const confirmed = window.confirm("Sind Sie sicher, dass Sie ALLE unkategorisierten Transaktionen dauerhaft löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden und entfernt sie vollständig aus der Datenbank.");
        if (!confirmed) return;

        const result = await deleteAllUncategorizedTransactions();
        if (result.success) {
            setTransactions([]);
        } else {
            alert(result.message);
        }
    };

    const handleCreateNewCategory = async (txId: number, txType: 'income' | 'expense') => {
        if (!newCategoryName.trim()) return;

        const result = await addCategory(newCategoryName.trim(), txType);
        if (result.success) {
            setCategories([...categories, { id: Date.now(), name: newCategoryName.trim(), type: txType, is_fixed: false }]);
            handleEditChange(txId, 'category', newCategoryName.trim());
            setCreatingCategoryForId(null);
            setNewCategoryName('');
            setOpenDropdownId(null);
        } else {
            alert(result.message);
        }
    };

    if (transactions.length === 0) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--success)' }}>Alles erledigt!</div>
                <p>Es gibt keine importierten Transaktionen ohne Kategorie.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                    onClick={() => setShowAIDetails(!showAIDetails)}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: showAIDetails ? 'var(--accent-primary)' : 'rgba(59, 130, 246, 0.1)',
                        color: showAIDetails ? 'white' : 'var(--accent-primary)',
                        border: `1px solid var(--accent-primary)`,
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        transition: 'all 0.2s'
                    }}
                >
                    <Brain size={16} /> KI-Details {showAIDetails ? 'ausblenden' : 'anzeigen'}
                </button>
                <button
                    onClick={handleDeleteAll}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--danger)',
                        border: '1px solid var(--danger)',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                >
                    <Trash2 size={16} /> Alle löschen
                </button>
            </div>

            {showAIDetails && (
                <div>
                    <SettingsForm initialSettings={initialSettings} />
                </div>
            )}

            <div className="glass-panel" style={{ overflowX: 'visible', paddingBottom: '200px', backgroundColor: 'var(--bg-card)', borderRadius: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Datum</th>
                            <th style={thStyle}>Betrag</th>
                            <th style={thStyle}>Auftraggeber</th>
                            <th style={thStyle}>Buchungstext</th>
                            <th style={thStyle}>Verwendungszweck</th>
                            <th style={{ ...thStyle, width: '250px' }}>Kategorie</th>
                            <th style={{ ...thStyle, textAlign: 'center', width: '100px' }}>Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(tx => {
                            const rowState = edits[tx.id] || tx;
                            const isDropdownOpen = openDropdownId === tx.id;
                            const isCreating = creatingCategoryForId === tx.id;
                            const displayCategory = rowState.category || tx.suggested_category || '';
                            const hasSuggestion = !rowState.category && !!tx.suggested_category;

                            const isPayPal = (tx.auftraggeber || '').toLowerCase().includes('paypal') || (tx.verwendungszweck || '').toLowerCase().includes('paypal');
                            const rowBg = isPayPal ? 'rgba(59, 130, 246, 0.1)' : 'transparent';
                            const hoverBg = isPayPal ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.02)';

                            return (
                                <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: rowBg, transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg} onMouseLeave={e => e.currentTarget.style.backgroundColor = rowBg}>
                                    <td style={tdStyle}>{tx.date}</td>
                                    <td style={{ ...tdStyle, color: tx.type === 'income' ? 'var(--success)' : 'var(--text-primary)', fontWeight: 600 }}>
                                        {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                                    </td>

                                    <td style={tdStyle}>
                                        <input
                                            style={inputStyle}
                                            value={rowState.auftraggeber}
                                            onChange={e => handleEditChange(tx.id, 'auftraggeber', e.target.value)}
                                            placeholder="Auftraggeber..."
                                        />
                                    </td>

                                    <td style={tdStyle}>
                                        <input
                                            style={inputStyle}
                                            value={rowState.buchungstext || ''}
                                            onChange={e => handleEditChange(tx.id, 'buchungstext', e.target.value)}
                                            placeholder="Buchungstext..."
                                        />
                                    </td>

                                    <td style={tdStyle}>
                                        <input
                                            style={inputStyle}
                                            value={rowState.verwendungszweck}
                                            onChange={e => handleEditChange(tx.id, 'verwendungszweck', e.target.value)}
                                            placeholder="Verwendungszweck..."
                                        />
                                    </td>

                                    <td style={tdStyle}>
                                        {!isCreating ? (
                                            <div style={{ position: 'relative' }} ref={isDropdownOpen ? dropdownRef : null}>
                                                <button
                                                    onClick={() => setOpenDropdownId(isDropdownOpen ? null : tx.id)}
                                                    style={{
                                                        ...selectStyle,
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        borderColor: !displayCategory ? 'var(--danger)' : hasSuggestion ? 'var(--accent-primary)' : 'var(--border-color)',
                                                        backgroundColor: hasSuggestion ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-surface)'
                                                    }}
                                                >
                                                    <div style={{ height: '20px', display: 'flex', alignItems: 'center' }}>
                                                        {(() => {
                                                            let text = displayCategory || 'Kategorie auswählen...';
                                                            if (hasSuggestion) text = `✨ Vorschlag: ${displayCategory}`;

                                                            if (showAIDetails && tx.ai_confidence !== undefined && tx.ai_confidence !== null) {
                                                                const perc = Math.round(tx.ai_confidence * 100);
                                                                return (
                                                                    <span style={{
                                                                        color: !displayCategory ? 'var(--danger)' : hasSuggestion ? 'var(--accent-primary)' : 'var(--text-primary)',
                                                                        fontWeight: hasSuggestion ? 600 : 400,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.5rem'
                                                                    }}>
                                                                        <span style={{
                                                                            fontSize: '0.75rem',
                                                                            padding: '2px 6px',
                                                                            borderRadius: '4px',
                                                                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                                                            color: 'var(--accent-primary)',
                                                                            fontFamily: 'monospace'
                                                                        }}>
                                                                            {perc}%
                                                                        </span>
                                                                        {text}
                                                                    </span>
                                                                );
                                                            }

                                                            return (
                                                                <span style={{
                                                                    color: !displayCategory ? 'var(--danger)' : hasSuggestion ? 'var(--accent-primary)' : 'var(--text-primary)',
                                                                    fontWeight: hasSuggestion ? 600 : 400
                                                                }}>
                                                                    {text}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                    <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
                                                </button>

                                                {isDropdownOpen && (
                                                    <div style={dropdownListStyle}>
                                                        {categories.filter(c => c.type === tx.type).map(c => (
                                                            <div
                                                                key={c.id}
                                                                onClick={() => {
                                                                    handleEditChange(tx.id, 'category', c.name);
                                                                    setOpenDropdownId(null);
                                                                }}
                                                                style={dropdownItemStyle}
                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            >
                                                                {c.name}
                                                            </div>
                                                        ))}
                                                        <div
                                                            onClick={() => {
                                                                setCreatingCategoryForId(tx.id);
                                                                setOpenDropdownId(null);
                                                            }}
                                                            style={{
                                                                padding: '0.4rem 0.5rem',
                                                                cursor: 'pointer',
                                                                borderRadius: '0.25rem',
                                                                fontSize: '0.875rem',
                                                                color: 'var(--accent-primary)',
                                                                fontWeight: 600,
                                                                borderTop: '1px solid var(--border-color)',
                                                                marginTop: '0.25rem'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        >
                                                            + Neue Kategorie hinzufügen...
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    placeholder="Neue Kategorie..."
                                                    value={newCategoryName}
                                                    onChange={e => setNewCategoryName(e.target.value)}
                                                    style={inputStyle}
                                                    autoFocus
                                                />
                                                <button onClick={() => setCreatingCategoryForId(null)} style={{ padding: '0 0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                                    <X size={14} />
                                                </button>
                                                <button onClick={() => handleCreateNewCategory(tx.id, tx.type)} style={{ padding: '0 0.5rem', border: '1px solid var(--accent-primary)', borderRadius: '0.25rem', background: 'var(--accent-primary)', color: 'white', cursor: 'pointer' }}>
                                                    <Check size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </td>

                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            {(() => {
                                                const isReadyToSave = !!(rowState.category || tx.suggested_category);
                                                return (
                                                    <button
                                                        onClick={() => handleSaveRow(tx.id)}
                                                        disabled={!isReadyToSave}
                                                        style={{
                                                            backgroundColor: isReadyToSave ? 'var(--success)' : 'rgba(255, 255, 255, 0.05)',
                                                            color: isReadyToSave ? 'white' : 'var(--text-secondary)',
                                                            border: 'none',
                                                            borderRadius: '50%',
                                                            width: '32px',
                                                            height: '32px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: isReadyToSave ? 'pointer' : 'not-allowed',
                                                            transition: 'all 0.2s',
                                                        }}
                                                        title="Save & Mark Done"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                );
                                            })()}
                                            <button
                                                onClick={() => handleDeleteRow(tx.id)}
                                                style={{
                                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                    color: 'var(--danger)',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '32px',
                                                    height: '32px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                                title="Delete Transaction"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const thStyle: React.CSSProperties = {
    padding: '1rem',
    textAlign: 'left',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'rgba(255,255,255,0.02)'
};

const tdStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    verticalAlign: 'middle'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.4rem 0.5rem',
    borderRadius: '0.25rem',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
};

const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer'
};

const dropdownListStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '0.25rem',
    backgroundColor: '#1e293b',
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)',
    zIndex: 100,
    maxHeight: '250px',
    overflowY: 'auto',
    padding: '0.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem'
};

const dropdownItemStyle: React.CSSProperties = {
    padding: '0.4rem 0.5rem',
    cursor: 'pointer',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    color: 'var(--text-primary)'
};
