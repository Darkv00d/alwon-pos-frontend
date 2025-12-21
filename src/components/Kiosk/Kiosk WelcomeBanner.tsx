import React, { useEffect } from 'react';
import { Crown, Medal, Gem, Award, Star } from 'lucide-react';
import styles from '../ui/KioskWelcomeBanner.module.css';

interface KioskWelcomeBannerProps {
  customerName: string;
  tierName: string;
  tierIcon: string | null;
  tierColor: string | null;
  currentPoints: number;
  isVisible: boolean;
  onClose: () => void;
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

export const KioskWelcomeBanner: React.FC<KioskWelcomeBannerProps> = ({
  customerName,
  tierName,
  tierIcon,
  tierColor,
  currentPoints,
  isVisible,
  onClose,
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bannerBg = tierColor || 'var(--primary)';

  return (
    <div
      className={styles.banner}
      style={{ backgroundColor: bannerBg } as React.CSSProperties}
    >
      <div className={styles.content}>
        <div className={styles.iconWrapper}>{getTierIcon(tierIcon, 48)}</div>
        <div className={styles.textContent}>
          <h2 className={styles.greeting}>¡Bienvenido, {customerName}!</h2>
          <div className={styles.details}>
            <span className={styles.tier}>{tierName}</span>
            <span className={styles.divider}>•</span>
            <span className={styles.points}>
              <Star size={20} />
              {currentPoints.toLocaleString()} puntos
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
