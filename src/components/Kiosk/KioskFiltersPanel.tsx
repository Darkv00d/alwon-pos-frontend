import React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/Accordion';
import { Button } from '../ui/Button';
import styles from '../ui/KioskFiltersPanel.module.css';

interface KioskFiltersPanelProps {
  categories: Array<{ name: string; count: number }>;
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  onClearFilters: () => void;
  availabilityFilter: 'in-stock' | 'all';
  onAvailabilityChange: (filter: 'in-stock' | 'all') => void;
  className?: string;
}

export const KioskFiltersPanel = ({
  categories,
  selectedCategories,
  onToggleCategory,
  onClearFilters,
  availabilityFilter,
  onAvailabilityChange,
  className,
}: KioskFiltersPanelProps) => {
  const hasActiveFilters = selectedCategories.length > 0 || availabilityFilter !== 'all';

  return (
    <aside className={`${styles.panel} ${className || ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <SlidersHorizontal size={20} />
          Filtros
        </h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className={styles.clearButton}>
            <X size={14} />
            Limpiar
          </Button>
        )}
      </div>

      <div className={styles.content}>
        <Accordion type="multiple" defaultValue={['categories', 'availability']} className={styles.accordion}>
          <AccordionItem value="categories" className={styles.accordionItem}>
            <AccordionTrigger className={styles.accordionTrigger}>
              Categorías
            </AccordionTrigger>
            <AccordionContent className={styles.accordionContent}>
              <div className={styles.filterGroup}>
                {categories.map((category) => (
                  <label key={category.name} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={selectedCategories.includes(category.name)}
                      onChange={() => onToggleCategory(category.name)}
                    />
                    <span className={styles.checkboxText}>{category.name}</span>
                    <span className={styles.categoryCount}>{category.count}</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="availability" className={styles.accordionItem}>
            <AccordionTrigger className={styles.accordionTrigger}>
              Disponibilidad
            </AccordionTrigger>
            <AccordionContent className={styles.accordionContent}>
              <div className={styles.filterGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="availability"
                    className={styles.radio}
                    value="in-stock"
                    checked={availabilityFilter === 'in-stock'}
                    onChange={() => onAvailabilityChange('in-stock')}
                  />
                  <span className={styles.radioText}>En Stock</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="availability"
                    className={styles.radio}
                    value="all"
                    checked={availabilityFilter === 'all'}
                    onChange={() => onAvailabilityChange('all')}
                  />
                  <span className={styles.radioText}>Todos</span>
                </label>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </aside>
  );
};
