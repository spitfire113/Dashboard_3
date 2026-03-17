import { getCategories } from '@/app/actions';
import CategoryManager from '@/components/CategoryManager';
import styles from './page.module.css';

export default async function CategoriesPage() {
    const categories = await getCategories();

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Kategorien</h1>
                    <p className={styles.subtitle}>Verwalten Sie Ihre Einnahmen- und Ausgabenkategorien</p>
                </div>
            </header>

            <CategoryManager initialCategories={categories} />
        </div>
    );
}
