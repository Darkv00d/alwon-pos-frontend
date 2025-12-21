import React from 'react';
import { ArrowLeft, Package } from 'lucide-react';
import { Button } from './Button';
import { getCategoryIcon } from '../helpers/getCategoryIcon';
import styles from './KioskCategoryGrid.module.css';

export interface CategoryInfo {
  name: string;
  count: number;
}

interface KioskCategoryGridProps {
  categories: CategoryInfo[];
  onSelectCategory: (category: string | null) => void;
  onViewAll: () => void;
}

export const KioskCategoryGrid: React.FC<KioskCategoryGridProps> = ({
  categories,
  onSelectCategory,
  onViewAll,
}) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>¿Qué deseas comprar hoy?</h2>
      <div className={styles.categoryGrid}>
        <button className={styles.categoryCard} onClick={onViewAll}>
          <div className={styles.categoryIcon}>🛒</div>
          <div className={styles.categoryInfo}>
            <span className={styles.categoryName}>Ver Todos</span>
            <span className={styles.categoryCount}>
              {categories.reduce((sum, cat) => sum + cat.count, 0)} productos
            </span>
          </div>
        </button>
        {categories.map((category) => (
          <button
            key={category.name}
            className={styles.categoryCard}
            onClick={() => onSelectCategory(category.name)}
          >
            <div className={styles.categoryIcon}>{getCategoryIcon(category.name)}</div>
            <div className={styles.categoryInfo}>
              <span className={styles.categoryName}>{category.name}</span>
              <span className={styles.categoryCount}>{category.count} productos</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};