"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LayoutDashboard, Receipt, Settings, Tags, Menu, X, ListTodo, BarChart2 } from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
    { name: 'Übersicht', href: '/', icon: LayoutDashboard },
    { name: 'Transaktionen', href: '/transactions', icon: Receipt },
    { name: 'Analysen', href: '/analyse', icon: BarChart2 },
    { name: 'Kategorien', href: '/categories', icon: Tags },
    { name: 'Import-Aktivität', href: '/import-activity', icon: ListTodo },
    { name: 'Einstellungen', href: '/settings', icon: Settings },
];

export default function Sidebar({ uncompleteCount = 0 }: { uncompleteCount?: number }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <>
            <div className={styles.mobileHeader}>
                <div className={styles.logo}>Finance<span className={styles.accent}>Hub</span></div>
                <button className={styles.menuButton} onClick={toggleSidebar}>
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}

            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''} glass-panel`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.logo}>Finance<span className={styles.accent}>Hub</span></div>
                </div>

                <nav className={styles.navContainer}>
                    <ul className={styles.navList}>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            let href = item.href;

                            const start = searchParams.get('start');
                            const end = searchParams.get('end');

                            if (item.name === 'Übersicht' || item.name === 'Transaktionen' || item.name === 'Analysen') {
                                const params = new URLSearchParams();
                                if (start) params.set('start', start);
                                if (end) params.set('end', end);

                                const queryStr = params.toString();
                                if (queryStr) {
                                    href = `${item.href}?${queryStr}`;
                                }
                            }

                            const isActive = pathname === item.href;

                            return (
                                <li key={item.name}>
                                    <Link
                                        href={href}
                                        className={`${styles.navItem} ${isActive ? styles.active : ''} ${item.name === 'Import-Aktivität' && uncompleteCount > 0 ? styles.navItemWarning : ''}`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                            <Icon className={styles.navIcon} size={20} />
                                            <span>{item.name}</span>
                                        </div>
                                        {item.name === 'Import-Aktivität' && uncompleteCount > 0 && (
                                            <span className={styles.badge}>{uncompleteCount}</span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>


            </aside>
        </>
    );
}
