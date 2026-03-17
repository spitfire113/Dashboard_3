"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Category, addCategory, updateCategory, deleteCategory } from '@/app/actions';
import { Edit2, Save, X, Trash2, Plus, ChevronDown } from 'lucide-react';
import styles from '@/app/categories/page.module.css';

interface CategoryManagerProps {
    initialCategories: Category[];
}

export default function CategoryManager({ initialCategories }: CategoryManagerProps) {
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ name: '', type: 'expense' as 'income' | 'expense', is_fixed: false });

    // Add New State
    const [isAdding, setIsAdding] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', type: 'expense' as 'income' | 'expense', is_fixed: false });

    // Dropdown States
    const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
    const [isEditTypeOpen, setIsEditTypeOpen] = useState(false);

    const addTypeRef = useRef<HTMLDivElement>(null);
    const editTypeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (addTypeRef.current && !addTypeRef.current.contains(event.target as Node)) {
                setIsAddTypeOpen(false);
            }
            if (editTypeRef.current && !editTypeRef.current.contains(event.target as Node)) {
                setIsEditTypeOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleEditClick = (cat: Category) => {
        setEditingId(cat.id);
        setEditForm({ name: cat.name, type: cat.type, is_fixed: cat.is_fixed || false });
        setIsAdding(false);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
    };

    const handleSaveEdit = async (cat: Category) => {
        if (!editForm.name.trim()) return alert("Name darf nicht leer sein");

        const result = await updateCategory(cat.id, cat.name, editForm.name.trim(), editForm.type, editForm.is_fixed);
        if (result.success) {
            setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, ...editForm, name: editForm.name.trim() } : c));
            setEditingId(null);
        } else {
            alert(result.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Sind Sie sicher? Dies löscht keine Transaktionen, aber sie verlieren ihre gültige Kategoriezuordnung.")) return;

        const result = await deleteCategory(id);
        if (result.success) {
            setCategories(prev => prev.filter(c => c.id !== id));
        } else {
            alert(result.message);
        }
    };

    const handleSaveNew = async () => {
        if (!addForm.name.trim()) return alert("Name darf nicht leer sein");

        const result = await addCategory(addForm.name.trim(), addForm.type, addForm.is_fixed);
        if (result.success) {
            // Optimistic insert to force a re-fetch or assume refresh (server action revalidatePath will refresh data soon)
            window.location.reload();
        } else {
            alert(result.message);
        }
    };

    return (
        <div className={styles.tableCard + " glass-panel"}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Alle Kategorien</h2>
                {!isAdding && (
                    <button
                        onClick={() => { setIsAdding(true); setEditingId(null); }}
                        style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}
                    >
                        <Plus size={18} /> Kategorie hinzufügen
                    </button>
                )}
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Typ</th>
                        <th style={{ textAlign: 'center' }}>Fixkosten? (nur Ausgaben)</th>
                        <th style={{ textAlign: 'center' }}>Nutzung</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Add New Row */}
                    {isAdding && (
                        <tr style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
                            <td>
                                <input
                                    autoFocus
                                    placeholder="Neuer Kategoriename..."
                                    value={addForm.name}
                                    onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                                    style={inputStyle}
                                />
                            </td>
                            <td>
                                <div style={{ position: 'relative' }} ref={addTypeRef}>
                                    <button
                                        onClick={() => setIsAddTypeOpen(!isAddTypeOpen)}
                                        style={{ ...selectStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                    >
                                        <span style={{ textTransform: 'capitalize' }}>{addForm.type === 'expense' ? 'Ausgabe' : 'Einnahme'}</span>
                                        <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
                                    </button>

                                    {isAddTypeOpen && (
                                        <div style={dropdownListStyle}>
                                            {['expense', 'income'].map(t => (
                                                <div
                                                    key={t}
                                                    onClick={() => { setAddForm({ ...addForm, type: t as any }); setIsAddTypeOpen(false); }}
                                                    style={dropdownItemStyle}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <span style={{ textTransform: 'capitalize' }}>{t === 'expense' ? 'Ausgabe' : 'Einnahme'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                {addForm.type === 'expense' ? (
                                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={addForm.is_fixed}
                                            onChange={e => setAddForm({ ...addForm, is_fixed: e.target.checked })}
                                        />
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Fixkosten</span>
                                    </label>
                                ) : (
                                    <span style={{ color: 'var(--text-secondary)' }}>-</span>
                                )}
                            </td>
                            <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>-</td>
                            <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                    <button onClick={handleSaveNew} style={{ color: 'var(--success)', cursor: 'pointer', background: 'transparent', border: 'none' }} title="Speichern">
                                        <Save size={18} />
                                    </button>
                                    <button onClick={() => setIsAdding(false)} style={{ color: 'var(--text-secondary)', cursor: 'pointer', background: 'transparent', border: 'none' }} title="Abbrechen">
                                        <X size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )}

                    {/* Existing Categories */}
                    {[...categories].sort((a, b) => {
                        if (a.type !== b.type) return a.type.localeCompare(b.type);
                        return a.name.localeCompare(b.name);
                    }).map((cat) => {
                        const isEditing = editingId === cat.id;

                        return (
                            <tr key={cat.id} style={isEditing ? { backgroundColor: 'rgba(59, 130, 246, 0.05)' } : {}}>
                                {isEditing ? (
                                    <>
                                        <td>
                                            <input
                                                value={editForm.name}
                                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                style={inputStyle}
                                            />
                                        </td>
                                        <td>
                                            <div style={{ position: 'relative' }} ref={editTypeRef}>
                                                <button
                                                    onClick={() => setIsEditTypeOpen(!isEditTypeOpen)}
                                                    style={{ ...selectStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                >
                                                    <span style={{ textTransform: 'capitalize' }}>{editForm.type === 'expense' ? 'Ausgabe' : 'Einnahme'}</span>
                                                    <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
                                                </button>

                                                {isEditTypeOpen && (
                                                    <div style={dropdownListStyle}>
                                                        {['expense', 'income'].map(t => (
                                                            <div
                                                                key={t}
                                                                onClick={() => { setEditForm({ ...editForm, type: t as any }); setIsEditTypeOpen(false); }}
                                                                style={dropdownItemStyle}
                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            >
                                                                <span style={{ textTransform: 'capitalize' }}>{t === 'expense' ? 'Ausgabe' : 'Einnahme'}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {editForm.type === 'expense' ? (
                                                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={editForm.is_fixed}
                                                        onChange={e => setEditForm({ ...editForm, is_fixed: e.target.checked })}
                                                    />
                                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Fixkosten</span>
                                                </label>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)' }}>-</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            {cat.usageCount || 0}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button onClick={() => handleSaveEdit(cat)} style={{ color: 'var(--success)', cursor: 'pointer', background: 'transparent', border: 'none' }} title="Speichern">
                                                    <Save size={18} />
                                                </button>
                                                <button onClick={handleCancelEdit} style={{ color: 'var(--danger)', cursor: 'pointer', background: 'transparent', border: 'none' }} title="Abbrechen">
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td>{cat.name}</td>
                                        <td>
                                            <span style={{
                                                color: cat.type === 'income' ? 'var(--success)' : 'var(--danger)',
                                                backgroundColor: cat.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '0.25rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                textTransform: 'uppercase'
                                            }}>
                                                {cat.type === 'expense' ? 'Ausgabe' : 'Einnahme'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {cat.type === 'expense' && cat.is_fixed ? (
                                                <span style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 600 }}>Ja ✓</span>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Nein</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {cat.usageCount || 0}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                {cat.name.toLowerCase() === 'paypal' ? (
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }} title="System-Kategorie (Darf nicht geändert werden)">Gesperrt</span>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleEditClick(cat)} style={{ color: 'var(--text-secondary)', cursor: 'pointer', background: 'transparent', border: 'none' }} title="Bearbeiten">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleDelete(cat.id)} style={{ color: 'var(--danger)', cursor: 'pointer', background: 'transparent', border: 'none' }} title="Löschen">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

const inputStyle = {
    width: '100%',
    padding: '0.4rem 0.5rem',
    borderRadius: '0.25rem',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
};

const selectStyle = {
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
