import React from 'react';
import { Tag } from 'lucide-react';
import { useProductPriceQuery } from '../helpers/usePriceCalculation';
import { Skeleton } from './Skeleton';
import { Badge } from './Badge';
import styles from './ProductPriceDisplay.module.css';

type ProductPriceDisplayProps = {
  productId: number;
  quantity: number;
  locationId?: number;
  channel?: 'pos' | 'kiosk' | 'online' | 'wholesale';
  customerId?: number;
  couponCode?: string;
  showBreakdown?: boolean;
  className?: string;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const ProductPriceDisplay = ({
  productId,
  quantity,
  locationId,
  channel,
  customerId,
  couponCode,
  showBreakdown = false,
  className,
}: ProductPriceDisplayProps) => {
  const { data, isFetching, error } = useProductPriceQuery({
    productId,
    quantity,
    locationId,
    channel,
    customerId,
    couponCode,
  });

  if (isFetching) {
    return (
      <div className={`${styles.container} ${className ?? ''}`}>
        {showBreakdown ? (
          <div className={styles.breakdownSkeleton}>
            <Skeleton style={{ width: '120px', height: '1rem' }} />
            <Skeleton style={{ width: '100px', height: '1rem' }} />
            <Skeleton style={{ width: '150px', height: '1.5rem', marginTop: 'var(--spacing-2)' }} />
          </div>
        ) : (
          <Skeleton style={{ width: '100px', height: '1.5rem' }} />
        )}
      </div>
    );
  }

  if (error) {
    console.error('Error fetching product price:', error);
    return (
      <div className={`${styles.container} ${styles.error} ${className ?? ''}`}>
        No disponible
      </div>
    );
  }

  if (!data?.success || !data.data) {
    return (
      <div className={`${styles.container} ${styles.error} ${className ?? ''}`}>
        Precio no válido
      </div>
    );
  }

  const { basePrice, finalPrice, discount, appliedPromotions } = data.data;
  const hasDiscount = discount > 0;

  if (showBreakdown) {
    return (
      <div className={`${styles.container} ${styles.breakdown} ${className ?? ''}`}>
        <div className={styles.breakdownRow}>
          <span>Precio Base:</span>
          <span>{formatCurrency(basePrice)}</span>
        </div>
        {hasDiscount && (
          <div className={`${styles.breakdownRow} ${styles.discountText}`}>
            <span>Descuento:</span>
            <span>- {formatCurrency(discount)}</span>
          </div>
        )}
        {hasDiscount && appliedPromotions.length > 0 && (
          <div className={styles.promotionsList}>
            <p>Promociones Aplicadas:</p>
            <ul>
              {appliedPromotions.map((promo) => (
                <li key={promo.promotionId}>
                  <Tag size={14} />
                  {promo.promotionName} (-{formatCurrency(promo.discountAmount)})
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className={`${styles.breakdownRow} ${styles.finalPriceRow}`}>
          <strong>Precio Final:</strong>
          <strong>{formatCurrency(finalPrice)}</strong>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${styles.compact} ${className ?? ''}`}>
      {hasDiscount ? (
        <>
          <div className={styles.priceWrapper}>
            <s className={styles.basePrice}>{formatCurrency(basePrice)}</s>
            <span className={styles.finalPriceDiscounted}>{formatCurrency(finalPrice)}</span>
          </div>
          <Badge variant="success" className={styles.discountBadge}>
            -{formatCurrency(discount)} ({Math.round((discount / basePrice) * 100)}% OFF)
          </Badge>
        </>
      ) : (
        <span className={styles.finalPrice}>{formatCurrency(finalPrice)}</span>
      )}
    </div>
  );
};