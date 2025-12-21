import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { useProductsQuery } from '../helpers/useProductsQuery';
import { useCategoriesQuery } from '../helpers/useCategoriesQuery';
import { type ProductWithSupplier } from '../endpoints/products_GET.schema';
import { type PublicCategory } from '../endpoints/categories_GET.schema';
import { Input } from './Input';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { Skeleton } from './Skeleton';
import styles from './PromotionFormProducts.module.css';

interface SelectedProduct extends ProductWithSupplier {
  isRequired?: boolean;
}

interface PromotionFormProductsProps {
  selectedProducts: SelectedProduct[];
  selectedCategories: PublicCategory[];
  onProductsChange: (products: SelectedProduct[]) => void;
  onCategoriesChange: (categories: PublicCategory[]) => void;
  requireBundleProducts: boolean;
  className?: string;
}

export const PromotionFormProducts: React.FC<PromotionFormProductsProps> = ({
  selectedProducts,
  selectedCategories,
  onProductsChange,
  onCategoriesChange,
  requireBundleProducts,
  className,
}) => {
  const [productSearch, setProductSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  const { data: allProducts, isFetching: isFetchingProducts } = useProductsQuery();
  const { data: allCategories, isFetching: isFetchingCategories } = useCategoriesQuery();

  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    const selectedIds = new Set(selectedProducts.map((p) => p.id));
    return allProducts
      .filter((p) => !selectedIds.has(p.id))
      .filter((p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(productSearch.toLowerCase())
      );
  }, [allProducts, productSearch, selectedProducts]);

  const filteredCategories = useMemo(() => {
    if (!allCategories) return [];
    const selectedIds = new Set(selectedCategories.map((c) => c.id));
    return allCategories
      .filter((c) => !selectedIds.has(c.id))
      .filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()));
  }, [allCategories, categorySearch, selectedCategories]);

  const addProduct = (product: ProductWithSupplier) => {
    onProductsChange([...selectedProducts, { ...product, isRequired: false }]);
    setProductSearch('');
  };

  const removeProduct = (productId: number) => {
    onProductsChange(selectedProducts.filter((p) => p.id !== productId));
  };

  const toggleProductRequired = (productId: number, isRequired: boolean) => {
    onProductsChange(
      selectedProducts.map((p) => (p.id === productId ? { ...p, isRequired } : p))
    );
  };

  const addCategory = (category: PublicCategory) => {
    onCategoriesChange([...selectedCategories, category]);
    setCategorySearch('');
  };

  const removeCategory = (categoryId: number) => {
    onCategoriesChange(selectedCategories.filter((c) => c.id !== categoryId));
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.column}>
        <h3 className={styles.title}>Productos Aplicables</h3>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <Input
            type="search"
            placeholder="Buscar producto por nombre o código..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        {isFetchingProducts && <Skeleton className={styles.listSkeleton} />}
        {productSearch && !isFetchingProducts && (
          <ul className={styles.resultsList}>
            {filteredProducts.slice(0, 5).map((product) => (
              <li key={product.id} onClick={() => addProduct(product)}>
                {product.name}
              </li>
            ))}
            {filteredProducts.length === 0 && <li className={styles.noResults}>No se encontraron productos.</li>}
          </ul>
        )}
        <div className={styles.selectedList}>
          {selectedProducts.map((product) => (
            <div key={product.id} className={styles.selectedItem}>
              <span className={styles.itemName}>{product.name}</span>
              <div className={styles.itemActions}>
                {requireBundleProducts && (
                  <div className={styles.requiredCheckbox}>
                    <Checkbox
                      id={`req-${product.id}`}
                      checked={product.isRequired}
                      onChange={(e) => toggleProductRequired(product.id, e.target.checked)}
                    />
                    <label htmlFor={`req-${product.id}`}>Requerido</label>
                  </div>
                )}
                <Button variant="ghost" size="icon-sm" onClick={() => removeProduct(product.id)}>
                  <X size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.column}>
        <h3 className={styles.title}>Categorías Aplicables</h3>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <Input
            type="search"
            placeholder="Buscar categoría..."
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        {isFetchingCategories && <Skeleton className={styles.listSkeleton} />}
        {categorySearch && !isFetchingCategories && (
          <ul className={styles.resultsList}>
            {filteredCategories.slice(0, 5).map((category) => (
              <li key={category.id} onClick={() => addCategory(category)}>
                {category.name}
              </li>
            ))}
            {filteredCategories.length === 0 && <li className={styles.noResults}>No se encontraron categorías.</li>}
          </ul>
        )}
        <div className={styles.selectedList}>
          {selectedCategories.map((category) => (
            <div key={category.id} className={styles.selectedItem}>
              <span className={styles.itemName}>{category.name}</span>
              <Button variant="ghost" size="icon-sm" onClick={() => removeCategory(category.id)}>
                <X size={14} />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};