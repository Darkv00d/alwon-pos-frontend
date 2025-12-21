import React from 'react';
import { Package, AlertTriangle } from 'lucide-react';
import { type Selectable } from 'kysely';
import { type Products } from '../../helpers/schema';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { ProductPriceDisplay } from '../ui/ProductPriceDisplay';
import styles from '../ui/KioskProductGrid.module.css';

type ProductWithSupplier = Selectable<Products> & {
  supplier: Selectable<import("../helpers/schema").Suppliers> | null;
};

interface KioskProductGridProps {
  products: ProductWithSupplier[] | undefined;
  isFetching: boolean;
  error: Error | null;
  onAddToCart: (product: ProductWithSupplier) => void;
  locationId: number;
}

const getPromotionalBadgeVariant = (label: string): 'default' | 'destructive' | 'secondary' => {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('descuento') || lowerLabel.includes('oferta')) {
    return 'destructive';
  }
  if (lowerLabel.includes('lo tienes que probar') || lowerLabel.includes('recomendado')) {
    return 'secondary';
  }
  return 'default';
};

export const KioskProductGrid: React.FC<KioskProductGridProps> = ({
  products,
  isFetching,
  error,
  onAddToCart,
  locationId,
}) => {
  if (isFetching) {
    return (
      <div className={styles.container}>
        <div className={styles.productGrid}>
          {[...Array(9)].map((_, i) => (
            <div key={i} className={styles.productCardSkeleton}>
              <Skeleton style={{ height: '220px', width: '100%' }} />
              <Skeleton style={{ height: '1.5rem', width: '80%', marginTop: '1rem' }} />
              <Skeleton style={{ height: '1rem', width: '40%', marginTop: '0.5rem' }} />
              <Skeleton style={{ height: '2rem', width: '60%', marginTop: '0.5rem' }} />
              <Skeleton style={{ height: '60px', width: '100%', marginTop: '1rem' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.stateMessage}>
          <AlertTriangle />
          <div>
            <p>Error al cargar productos</p>
            <span>Por favor, intenta de nuevo más tarde</span>
          </div>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.stateMessage}>
          <Package />
          <div>
            <p>No se encontraron productos</p>
            <span>Intenta buscar algo diferente o limpia los filtros</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.productGrid}>
        {products.map((product) => {
          return <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} locationId={locationId} />;
        })}
      </div>
    </div>
  );
};

const ProductCard: React.FC<{
  product: ProductWithSupplier;
  onAddToCart: (product: ProductWithSupplier) => void;
  locationId: number;
}> = ({ product, onAddToCart, locationId }) => {
  const hasPromotionalLabel = product.promotionalLabel && product.promotionalLabel.trim() !== '';
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.minimumStock;

  return (
    <div 
      className={`${styles.productCard} ${isOutOfStock ? styles.outOfStock : ''}`}
    >
      {hasPromotionalLabel && !isOutOfStock && (
        <Badge 
          variant={getPromotionalBadgeVariant(product.promotionalLabel!)} 
          className={styles.promoBadge}
        >
          {product.promotionalLabel}
        </Badge>
      )}
      {isOutOfStock && (
        <Badge variant="destructive" className={styles.outOfStockBadge}>
          AGOTADO
        </Badge>
      )}
      <div className={styles.productImageContainer}>
        {isOutOfStock && <div className={styles.outOfStockOverlay} />}
        {product.imageurl ? (
          <img 
            src={product.imageurl} 
            alt={product.name} 
            className={styles.productImage} 
            loading="lazy" 
          />
        ) : (
          <div className={styles.productImagePlaceholder}>
            <Package size={64} />
          </div>
        )}
      </div>
      <div className={styles.productInfo}>
        <span className={styles.productName}>{product.name}</span>
        {isOutOfStock ? (
          <Badge variant="destructive" className={styles.stockBadge}>
            Agotado
          </Badge>
        ) : isLowStock ? (
          <Badge variant="warning" className={styles.stockBadge}>
            Bajo stock
          </Badge>
        ) : (
          <Badge variant="success" className={styles.stockBadge}>
            Disponible
          </Badge>
        )}
        <div className={styles.priceContainer}>
          <ProductPriceDisplay
            productId={product.id}
            quantity={1}
            locationId={locationId}
            channel="kiosk"
            showBreakdown={false}
          />
        </div>
      </div>
      <Button
        variant="destructive"
        size="lg"
        onClick={() => !isOutOfStock && onAddToCart(product)}
        className={styles.addToCartButton}
        disabled={isOutOfStock}
        aria-label={isOutOfStock ? 'Producto no disponible' : `Agregar ${product.name} al carrito`}
      >
        {isOutOfStock ? 'No Disponible' : 'Agregar al carrito'}
      </Button>
    </div>
  );
};
