import React from 'react';
import { getCategoryIcon } from '../helpers/getCategoryIcon';
import styles from './KioskCategoryCircles.module.css';

interface KioskCategoryCirclesProps {
  categories: Array<{ name: string; count: number }>;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  className?: string;
}

export const KioskCategoryCircles: React.FC<KioskCategoryCirclesProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  className,
}) => {
  const totalProducts = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.scrollArea}>
        {/* "All" Category Button */}
        <button
          className={`${styles.categoryButton} ${selectedCategory === null ? styles.active : ''}`}
          onClick={() => onSelectCategory(null)}
          aria-pressed={selectedCategory === null}
        >
          <div className={styles.iconWrapper}>
            <span className={styles.icon}>🛍️</span>
          </div>
          <span className={styles.name}>Todas</span>
          <span className={styles.count}>{totalProducts}</span>
        </button>

        {/* Individual Category Buttons */}
        {categories.map((category) => (
          <button
            key={category.name}
            className={`${styles.categoryButton} ${selectedCategory === category.name ? styles.active : ''}`}
            onClick={() => onSelectCategory(category.name)}
            aria-pressed={selectedCategory === category.name}
            disabled={category.count === 0}
          >
            <div className={styles.iconWrapper}>
              <span className={styles.icon}>
                {getCategoryIcon(category.name)}
              </span>
            </div>
            <span className={styles.name}>{category.name}</span>
            <span className={styles.count}>{category.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};