import React from 'react';
import { Crown, Medal, Award, Gem } from 'lucide-react';
import type { Selectable } from 'kysely';
import type { CustomerTiers } from '../helpers/schema';
import styles from './CustomerTierCard.module.css';

// Use a specific type for the component props, converting numeric strings to numbers
export type CustomerTier = Omit<
  Selectable<CustomerTiers>,
  'discountPercentage' | 'pointsMultiplier'
> & {
  discountPercentage: number;
  pointsMultiplier: number;
};

interface CustomerTierCardProps {
  currentTier: CustomerTier;
  lifetimePoints: number;
  nextTier?: CustomerTier;
  className?: string;
}

const getTierIcon = (iconName: string | null, color: string | null) => {
  const iconProps = {
    size: 32,
    color: color ?? 'var(--foreground)',
  };
  switch (iconName) {
    case 'crown':
      return <Crown {...iconProps} />;
    case 'medal':
      return <Medal {...iconProps} />;
    case 'gem':
      return <Gem {...iconProps} />;
    default:
      return <Award {...iconProps} />;
  }
};

export const CustomerTierCard = ({
  currentTier,
  lifetimePoints,
  nextTier,
  className,
}: CustomerTierCardProps) => {
  const pointsToNext = nextTier
    ? nextTier.minLifetimePoints - lifetimePoints
    : 0;

  const progressPercent = nextTier
    ? ((lifetimePoints - currentTier.minLifetimePoints) /
        (nextTier.minLifetimePoints - currentTier.minLifetimePoints)) *
      100
    : 100;

  const tierColor = currentTier.color || 'var(--muted-foreground)';

  return (
    <div
      className={`${styles.tierCard} ${className || ''}`}
      style={
        {
          '--tier-color': tierColor,
        } as React.CSSProperties
      }
    >
      <div className={styles.tierHeader}>
        <div className={styles.tierIcon}>
          {getTierIcon(currentTier.icon, tierColor)}
        </div>
        <div className={styles.tierInfo}>
          <h3 className={styles.tierName}>{currentTier.name}</h3>
          <p className={styles.tierPoints}>
            {lifetimePoints.toLocaleString()} Puntos de por vida
          </p>
        </div>
      </div>

      <div className={styles.tierBenefits}>
        <div className={styles.benefit}>
          <span className={styles.benefitLabel}>Multiplicador</span>
          <span className={styles.benefitValue}>
            {currentTier.pointsMultiplier}x
          </span>
        </div>
        <div className={styles.benefit}>
          <span className={styles.benefitLabel}>Descuento</span>
          <span className={styles.benefitValue}>
            {(currentTier.discountPercentage * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {nextTier && (
        <div className={styles.nextTier}>
          <div className={styles.nextTierHeader}>
            <span className={styles.nextTierLabel}>
              Próximo nivel: {nextTier.name}
            </span>
            <span className={styles.nextTierPoints}>
              {pointsToNext > 0 ? `${pointsToNext.toLocaleString()} puntos restantes` : '¡Alcanzado!'}
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${Math.min(Math.max(progressPercent, 0), 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};