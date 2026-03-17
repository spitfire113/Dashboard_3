"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, updateTransaction, addCategory, deleteTransaction, createTransaction, Category } from '@/app/actions';
import { Edit2, Save, X, Filter, ChevronDown, Trash2, Search, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import styles from '@/app/transactions/page.module.css';

type SortConfig = { key: keyof Transaction; direction: 'asc' | 'desc' } | null;

interface TransactionTableProps {
    transactions: Transaction[];
    initialCategory?: string;
    allCategories: Category[];
}

export default function TransactionTable({ transactions: initialTransactions, initialCategory, allCategories }: TransactionTableProps) {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

    // Sync state when URL params change and fetch new data
    useEffect(() => {
        setTransactions(initialTransactions);
    }, [initialTransactions]);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({
        category: '',
        auftraggeber: '',
        buchungstext: '',
        verwendungszweck: '',
        amount: 0
    });

    // Create Transaction State
    const [isCreatingTx, setIsCreatingTx] = useState(false);
    const [createForm, setCreateForm] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'expense' as 'income' | 'expense',
        amount: 0,
        category: '',
        auftraggeber: '',
        buchungstext: 'Manuelle Buchung',
        verwendungszweck: ''
    });

    // For handling new category additions inside the modal
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategory ? [initialCategory] : []);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // Text Search State
    const [showAuftraggeberSearch, setShowAuftraggeberSearch] = useState(false);
    const [searchAuftraggeber, setSearchAuftraggeber] = useState('');
    const [showVerwendungszweckSearch, setShowVerwendungszweckSearch] = useState(false);
    const [searchVerwendungszweck, setSearchVerwendungszweck] = useState('');

    const [sortConfig, setSortConfig] = useState<SortConfig>(null);

    // Edit Modal Category Dropdown State
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
                setIsCategoryDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Extract unique categories for the filter dropdown
    const uniqueCategories = useMemo(() => {
        const cats = new Set(initialTransactions.map(tx => tx.category));
        return Array.from(cats).sort();
    }, [initialTransactions]);

    // Apply Filters (Category Multi-Select + Text Search)
    const filteredTransactions = useMemo(() => {
        let result = transactions;

        if (selectedCategories.length > 0) {
            result = result.filter(tx => selectedCategories.includes(tx.category));
        }

        if (searchAuftraggeber.trim()) {
            const query = searchAuftraggeber.toLowerCase();
            result = result.filter(tx => (tx.auftraggeber || '').toLowerCase().includes(query));
        }

        if (searchVerwendungszweck.trim()) {
            const query = searchVerwendungszweck.toLowerCase();
            result = result.filter(tx =>
                (tx.verwendungszweck || '').toLowerCase().includes(query) ||
                (tx.buchungstext || '').toLowerCase().includes(query)
            );
        }

        return result;
    }, [transactions, selectedCategories, searchAuftraggeber, searchVerwendungszweck]);

    const sortedTransactions = useMemo(() => {
        let sortableItems = [...filteredTransactions];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aVal: any = a[sortConfig.key];
                let bVal: any = b[sortConfig.key];

                if (sortConfig.key === 'amount') {
                    // Normalize the sorting to be literal absolute financial amounts
                    aVal = a.type === 'expense' ? -Math.abs(aVal) : Math.abs(aVal);
                    bVal = b.type === 'expense' ? -Math.abs(bVal) : Math.abs(bVal);
                } else if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = (bVal || '').toLowerCase();
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredTransactions, sortConfig]);

    const handleSort = (key: keyof Transaction) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: keyof Transaction) => {
        if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={14} style={{ color: 'var(--text-secondary)', marginLeft: '4px', opacity: 0.5 }} />;
        return sortConfig.direction === 'asc' 
            ? <ArrowUp size={14} style={{ color: 'var(--accent-primary)', marginLeft: '4px' }} />
            : <ArrowDown size={14} style={{ color: 'var(--accent-primary)', marginLeft: '4px' }} />;
    };

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const handleEditClick = (tx: Transaction) => {
        setEditingId(tx.id);
        setEditForm({
            category: tx.category,
            auftraggeber: tx.auftraggeber || '',
            buchungstext: tx.buchungstext || '',
            verwendungszweck: tx.verwendungszweck || '',
            amount: Math.abs(tx.amount)
        });
        setIsCreatingCategory(false);
        setNewCategoryName('');
    };

    const handleCancelClick = () => {
        setEditingId(null);
    };

    const handleDeleteClick = async (id: number) => {
        const confirmed = window.confirm("Möchten Sie diese Transaktion wirklich dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden.");
        if (!confirmed) return;

        const result = await deleteTransaction(id);
        if (result.success) {
            setTransactions(prev => prev.filter(tx => tx.id !== id));
            setEditingId(null);
        } else {
            alert(result.message);
        }
    };

    const handleSaveClick = async (id: number) => {
        let finalCategory = editForm.category;

        // Automatically create and save the new category if the user opted to do so
        if (isCreatingCategory && newCategoryName.trim()) {
            finalCategory = newCategoryName.trim();
            // Note: In a complete system we pass type too, assuming derived from transaction
            const txType = transactions.find(t => t.id === id)?.type || 'expense';
            await addCategory(finalCategory, txType);
        }

        const isExpense = transactions.find(t => t.id === id)?.type === 'expense';
        const finalAmount = isExpense ? -Math.abs(editForm.amount) : Math.abs(editForm.amount);

        const result = await updateTransaction(id, { ...editForm, category: finalCategory, amount: finalAmount });
        if (result.success) {
            // Update local state to reflect UI instantly
            setTransactions(prev => prev.map(tx =>
                tx.id === id ? { ...tx, ...editForm, category: finalCategory, amount: finalAmount } : tx
            ));
            setEditingId(null);
        } else {
            alert(result.message);
        }
    };

    const handleSaveNewTx = async () => {
        if (createForm.amount === 0) return alert("Der Betrag darf nicht 0 sein.");
        if (!createForm.category.trim()) return alert("Bitte eine Kategorie angeben.");
        
        let finalCategory = createForm.category;

        if (isCreatingCategory && newCategoryName.trim()) {
            finalCategory = newCategoryName.trim();
            await addCategory(finalCategory, createForm.type);
        }

        const finalAmount = createForm.type === 'expense' ? -Math.abs(createForm.amount) : Math.abs(createForm.amount);

        const result = await createTransaction({
            ...createForm,
            category: finalCategory,
            amount: finalAmount
        });

        if (result.success) {
            // Reload page to reflect exact dates and DB hashes smoothly
            window.location.reload();
        } else {
            alert(result.message || "Fehler beim Anlegen.");
        }
    };

    if (transactions.length === 0) {
        return <div className={styles.emptyState}>Keine Transaktionen für diesen Zeitraum oder Filter gefunden.</div>;
    }

    const inputStyle = {
        width: '100%',
        padding: '0.4rem 0.75rem',
        borderRadius: '0.5rem',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        fontSize: '0.875rem'
    };

    const dropdownListStyle: React.CSSProperties = {
        position: 'absolute',
        top: '100%',
        left: 0,
        width: '100%',
        maxHeight: '250px',
        overflowY: 'auto',
        backgroundColor: '#1e293b',
        border: '1px solid var(--border-color)',
        borderRadius: '0.5rem',
        marginTop: '0.25rem',
        zIndex: 100,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)'
    };

    const dropdownItemStyle: React.CSSProperties = {
        padding: '0.5rem 0.75rem',
        cursor: 'pointer',
        fontSize: '0.875rem',
        backgroundColor: 'transparent',
        color: 'var(--text-primary)'
    };

    return (
        <div className={styles.tableWrapper}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Filter size={18} color="var(--text-secondary)" />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Kategorie filtern:</span>

                    <div style={{ position: 'relative' }} ref={filterRef}>
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            style={{
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '0.5rem',
                                padding: '0.4rem 0.75rem',
                                fontSize: '0.875rem',
                                outline: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <span>{selectedCategories.length === 0 ? 'Alle Kategorien' : `${selectedCategories.length} Ausgewählt`}</span>
                            <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
                        </button>

                        {isFilterOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                marginTop: '0.5rem',
                                width: '240px',
                                backgroundColor: '#1e293b', 
                                border: '1px solid var(--border-color)',
                                borderRadius: '0.5rem',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)',
                                zIndex: 50,
                                maxHeight: '320px',
                                overflowY: 'auto',
                                padding: '0.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem'
                            }}>
                                {uniqueCategories.map(cat => (
                                    <label key={cat} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.4rem 0.5rem',
                                        cursor: 'pointer',
                                        borderRadius: '0.25rem',
                                    }} className={styles.filterOption || ''}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(cat)}
                                            onChange={() => toggleCategory(cat)}
                                            style={{
                                                accentColor: 'var(--accent-primary)',
                                                width: '16px',
                                                height: '16px',
                                                cursor: 'pointer'
                                            }}
                                        />
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{cat}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {!isCreatingTx && (
                    <button
                        onClick={() => { setIsCreatingTx(true); setEditingId(null); }}
                        style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}
                    >
                        <Plus size={16} /> Neue Transaktion
                    </button>
                )}
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>Datum {getSortIcon('date')}</div>
                        </th>
                        <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>Kategorie {getSortIcon('category')}</div>
                        </th>
                        <th>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div onClick={() => handleSort('auftraggeber')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    Auftraggeber {getSortIcon('auftraggeber')}
                                </div>
                                <button
                                    onClick={() => {
                                        setShowAuftraggeberSearch(!showAuftraggeberSearch);
                                        if (showAuftraggeberSearch) setSearchAuftraggeber('');
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: showAuftraggeberSearch || searchAuftraggeber ? 'var(--accent-primary)' : 'var(--text-secondary)'
                                    }}
                                >
                                    <Search size={14} />
                                </button>
                            </div>
                            {showAuftraggeberSearch && (
                                <input
                                    type="text"
                                    value={searchAuftraggeber}
                                    onChange={e => setSearchAuftraggeber(e.target.value)}
                                    placeholder="Suchen..."
                                    autoFocus
                                    style={{
                                        width: '100%',
                                        marginTop: '0.5rem',
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.75rem',
                                        borderRadius: '0.25rem',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-surface)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            )}
                        </th>
                        <th>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div onClick={() => handleSort('verwendungszweck')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    Verwendungszweck {getSortIcon('verwendungszweck')}
                                </div>
                                <button
                                    onClick={() => {
                                        setShowVerwendungszweckSearch(!showVerwendungszweckSearch);
                                        if (showVerwendungszweckSearch) setSearchVerwendungszweck('');
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: showVerwendungszweckSearch || searchVerwendungszweck ? 'var(--accent-primary)' : 'var(--text-secondary)'
                                    }}
                                >
                                    <Search size={14} />
                                </button>
                            </div>
                            {showVerwendungszweckSearch && (
                                <input
                                    type="text"
                                    value={searchVerwendungszweck}
                                    onChange={e => setSearchVerwendungszweck(e.target.value)}
                                    placeholder="Suchen..."
                                    autoFocus
                                    style={{
                                        width: '100%',
                                        marginTop: '0.5rem',
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.75rem',
                                        borderRadius: '0.25rem',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-surface)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            )}
                        </th>
                        <th onClick={() => handleSort('amount')} className={styles.amountCol} style={{ cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                Betrag {getSortIcon('amount')}
                            </div>
                        </th>
                        <th style={{ width: '80px', textAlign: 'center' }}>Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    {/* INLINE ROW FOR CREATING MANUAL TRANSACTION */}
                    {isCreatingTx && (
                        <tr style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
                            <td style={{ verticalAlign: 'top', paddingTop: '1rem' }}>
                                <input 
                                    type="date" 
                                    value={createForm.date} 
                                    onChange={e => setCreateForm({...createForm, date: e.target.value})}
                                    style={{ ...inputStyle, width: '130px' }}
                                    required
                                />
                            </td>
                            <td style={{ verticalAlign: 'top', paddingTop: '1rem' }}>
                                <div style={{ position: 'relative' }} ref={categoryDropdownRef}>
                                    <input
                                        type="text"
                                        placeholder="Kategorie suchen..."
                                        value={isCreatingCategory ? newCategoryName : createForm.category}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (isCreatingCategory) {
                                                setNewCategoryName(val);
                                            } else {
                                                setCreateForm({ ...createForm, category: val });
                                                setIsCreatingCategory(true);
                                                setNewCategoryName(val);
                                            }
                                            setIsCategoryDropdownOpen(true);
                                        }}
                                        onFocus={() => setIsCategoryDropdownOpen(true)}
                                        style={inputStyle}
                                    />
                                    {isCategoryDropdownOpen && (
                                        <div style={dropdownListStyle}>
                                            <div
                                                onClick={() => {
                                                    setIsCreatingCategory(true);
                                                    setIsCategoryDropdownOpen(false);
                                                }}
                                                style={{ ...dropdownItemStyle, color: 'var(--accent-primary)', borderBottom: '1px solid var(--border-color)' }}
                                            >
                                                <Plus size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                                                Neue Kategorie "{isCreatingCategory ? newCategoryName : createForm.category}"
                                            </div>
                                            {allCategories
                                                .filter(c => c.name.toLowerCase().includes((isCreatingCategory ? newCategoryName : createForm.category).toLowerCase()))
                                                .map(cat => (
                                                    <div
                                                        key={cat.id}
                                                        onClick={() => {
                                                            setCreateForm({ ...createForm, category: cat.name, type: cat.type });
                                                            setIsCreatingCategory(false);
                                                            setIsCategoryDropdownOpen(false);
                                                        }}
                                                        style={dropdownItemStyle}
                                                    >
                                                        <span style={{
                                                            display: 'inline-block',
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            marginRight: '8px',
                                                            backgroundColor: cat.type === 'income' ? 'var(--success)' : 'var(--danger)'
                                                        }}></span>
                                                        {cat.name}
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td style={{ verticalAlign: 'top', paddingTop: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="Auftraggeber"
                                    value={createForm.auftraggeber}
                                    onChange={e => setCreateForm({ ...createForm, auftraggeber: e.target.value })}
                                    style={inputStyle}
                                />
                            </td>
                            <td style={{ verticalAlign: 'top', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Buchungstext"
                                        value={createForm.buchungstext}
                                        onChange={e => setCreateForm({ ...createForm, buchungstext: e.target.value })}
                                        style={inputStyle}
                                    />
                                    <textarea
                                        placeholder="Verwendungszweck"
                                        value={createForm.verwendungszweck}
                                        onChange={e => setCreateForm({ ...createForm, verwendungszweck: e.target.value })}
                                        style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }}
                                    />
                                </div>
                            </td>
                            <td style={{ verticalAlign: 'top', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <select
                                        value={createForm.type}
                                        onChange={e => setCreateForm({ ...createForm, type: e.target.value as 'income' | 'expense' })}
                                        style={{ ...inputStyle, width: 'auto', backgroundColor: createForm.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}
                                    >
                                        <option value="expense">Ausgabe (-)</option>
                                        <option value="income">Einnahme (+)</option>
                                    </select>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={createForm.amount || ''}
                                        onChange={e => setCreateForm({ ...createForm, amount: parseFloat(e.target.value) || 0 })}
                                        style={{ ...inputStyle, width: '100px', textAlign: 'right' }}
                                    />
                                    <span style={{ color: 'var(--text-secondary)' }}>€</span>
                                </div>
                            </td>
                            <td style={{ verticalAlign: 'top', paddingTop: '1rem', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                    <button onClick={handleSaveNewTx} style={{ color: 'var(--success)', cursor: 'pointer', background: 'transparent', border: 'none' }} title="Transaktion speichern">
                                        <Save size={18} />
                                    </button>
                                    <button onClick={() => setIsCreatingTx(false)} style={{ color: 'var(--danger)', cursor: 'pointer', background: 'transparent', border: 'none' }} title="Abbrechen">
                                        <X size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )}
                    
                    {/* EXISTING ROWS TRANSACTIONS MAP */}
                    {sortedTransactions.map((tx, idx) => {
                        const dateObj = new Date(tx.date);
                        const formattedDate = dateObj.toLocaleDateString('de-DE'); // DD.MM.YYYY
                        const isIncome = tx.type === 'income';
                        const isEditing = editingId === tx.id;
                        const amount = tx.amount;

                        return (
                            <tr key={tx.id || idx}>
                                <td>{formattedDate}</td>

                                <td>
                                    <div className={styles.categoryCell}>
                                        <span className={styles.dot} style={{ backgroundColor: isIncome ? 'var(--success)' : 'var(--danger)' }}></span>
                                        {tx.category}
                                    </div>
                                </td>
                                <td className={styles.textWrapCell}>
                                    {tx.auftraggeber || <span style={{ color: 'var(--text-secondary)' }}>-</span>}
                                </td>
                                <td className={styles.textWrapCell}>
                                    <div>
                                        {tx.buchungstext ? <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>{tx.buchungstext}</span> : ''}
                                        <span>{tx.verwendungszweck}</span>
                                    </div>
                                </td>

                                <td className={`${styles.amountCol} ${isIncome ? styles.income : styles.expense}`}>
                                    {isEditing ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editForm.amount || ''}
                                                onChange={e => setEditForm({...editForm, amount: parseFloat(e.target.value) || 0})}
                                                style={{...inputStyle, width: '90px', textAlign: 'right'}}
                                            />
                                            <span style={{color: 'var(--text-secondary)', fontSize: '0.875rem'}}>€</span>
                                        </div>
                                    ) : (
                                        <>
                                            {isIncome ? '+' : '-'}{Math.abs(amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                                        </>
                                    )}
                                </td>

                                <td style={{ textAlign: 'center' }}>
                                    <button
                                        onClick={() => handleEditClick(tx)}
                                        style={{ color: 'var(--text-secondary)', cursor: 'pointer', background: 'transparent', border: 'none' }}
                                        title="Edit Row"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* EDIT MODAL PORTAL */}
            {editingId && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.75rem',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
                        width: '100%',
                        maxWidth: '500px',
                        overflow: 'hidden'
                    }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Transaktion bearbeiten</h3>
                            <button onClick={handleCancelClick} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Category Selector */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Kategorie</label>
                                {!isCreatingCategory ? (
                                    <div style={{ position: 'relative' }} ref={categoryDropdownRef}>
                                        <button
                                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                            style={{ ...selectStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                        >
                                            <span>{editForm.category || 'Auswählen...'}</span>
                                            <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
                                        </button>

                                        {isCategoryDropdownOpen && (
                                            <div style={{
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
                                                maxHeight: '200px',
                                                overflowY: 'auto',
                                                padding: '0.25rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.125rem'
                                            }}>
                                                {allCategories.filter(c => c.type === (transactions.find(t => t.id === editingId)?.type || 'expense')).map(c => (
                                                    <div
                                                        key={c.id}
                                                        onClick={() => {
                                                            setEditForm({ ...editForm, category: c.name });
                                                            setIsCategoryDropdownOpen(false);
                                                        }}
                                                        style={{
                                                            padding: '0.4rem 0.5rem',
                                                            cursor: 'pointer',
                                                            borderRadius: '0.25rem',
                                                            fontSize: '0.875rem',
                                                            color: 'var(--text-primary)'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        {c.name}
                                                    </div>
                                                ))}
                                                <div
                                                    onClick={() => {
                                                        setIsCreatingCategory(true);
                                                        setIsCategoryDropdownOpen(false);
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
                                            placeholder="Neue Kategorie eingeben..."
                                            value={newCategoryName}
                                            onChange={e => setNewCategoryName(e.target.value)}
                                            style={inputStyle}
                                            autoFocus
                                        />
                                        <button onClick={() => setIsCreatingCategory(false)} style={{ padding: '0 0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Betrag */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Betrag</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.amount || ''}
                                        onChange={e => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                                        style={{ ...inputStyle, width: '150px', textAlign: 'right' }}
                                    />
                                    <span style={{ color: 'var(--text-secondary)' }}>€</span>
                                </div>
                            </div>

                            {/* Auftraggeber */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Auftraggeber</label>
                                <input
                                    value={editForm.auftraggeber}
                                    onChange={e => setEditForm({ ...editForm, auftraggeber: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>

                            {/* Buchungstext */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Buchungstext</label>
                                <input
                                    value={editForm.buchungstext}
                                    onChange={e => setEditForm({ ...editForm, buchungstext: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>

                            {/* Verwendungszweck */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Verwendungszweck</label>
                                <textarea
                                    value={editForm.verwendungszweck}
                                    onChange={e => setEditForm({ ...editForm, verwendungszweck: e.target.value })}
                                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                                />
                            </div>
                        </div>

                        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button
                                onClick={() => handleDeleteClick(editingId)}
                                style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'background-color 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                            >
                                <Trash2 size={16} /> Delete
                            </button>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={handleCancelClick} style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                                <button onClick={() => handleSaveClick(editingId)} style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Save size={16} /> Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const inputStyle = {
    width: '100%',
    padding: '0.25rem 0.5rem',
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
