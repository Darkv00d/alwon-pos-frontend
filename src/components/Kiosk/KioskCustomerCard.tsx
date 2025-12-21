import React from 'react';
import { X, MapPin, Star, Award } from 'lucide-react';
import { Crown, Medal, Gem } from 'lucide-react';
import { Button } from './Button';
import styles from './KioskCustomerCard.module.css';

interface KioskCustomerCardProps {
  customerName: string;
  firstName?: string | null;
  apartment?: string | null;
  address?: string | null;
  currentPoints: number;
  tierName: string;
  tierIcon: string | null;
  tierColor: string | null;
  pointsToEarn: number;
  hasItemsInCart: boolean;
  onLogout: () => void;
}

const getTierIcon = (iconName: string | null, size: number = 32) => {
  const iconProps = { size, className: styles.tierIcon };
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

const getInitial = (name: string): string => {
  return name.charAt(0).toUpperCase();
};

export const KioskCustomerCard = ({
  customerName,
  firstName,
  apartment,
  address,
  currentPoints,
  tierName,
  tierIcon,
  tierColor,
  pointsToEarn,
  hasItemsInCart,
  onLogout,
}: KioskCustomerCardProps) => {
  const displayName = firstName || customerName;
  const initial = getInitial(displayName);
  const avatarBg = tierColor || 'var(--primary)';
  const location = apartment && address ? `${address} - ${apartment}` : apartment || address || null;

  return (
    <div className={styles.customerCard}>
      <div className={styles.customerHeader}>
        <div
          className={styles.avatar}
          style={{ backgroundColor: avatarBg } as React.CSSProperties}
        >
          {initial}
        </div>
        <div className={styles.customerInfo}>
          <h3 className={styles.customerName}>{displayName}</h3>
          <div
            className={styles.tierBadge}
            style={{ backgroundColor: avatarBg } as React.CSSProperties}
          >
            {getTierIcon(tierIcon, 20)}
            <span>{tierName}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-md"
          onClick={onLogout}
          className={styles.logoutButton}
        >
          <X size={24} />
        </Button>
      </div>

      <div className={styles.customerStats}>
        <div className={styles.statItem}>
          <Star size={28} className={styles.starIcon} />
          <div className={styles.statText}>
            <span className={styles.statValue}>{currentPoints.toLocaleString()}</span>
            <span className={styles.statLabel}>Puntos Disponibles</span>
          </div>
        </div>

        {location && (
          <div className={styles.statItem}>
            <MapPin size={28} className={styles.locationIcon} />
            <div className={styles.statText}>
              <span className={styles.statValue}>{location}</span>
            </div>
          </div>
        )}
      </div>

      {hasItemsInCart && pointsToEarn > 0 && (
        <div className={styles.earnBanner}>
          <Award size={32} />
          <div className={styles.earnText}>
            <span className={styles.earnLabel}>Ganarás con esta compra:</span>
            <span className={styles.earnValue}>+{pointsToEarn} puntos</span>
          </div>
        </div>
      )}
    </div>
  );
};