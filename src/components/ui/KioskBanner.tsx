import React from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { useKioskConfig } from '../helpers/kioskConfig';
import { useLocationsQuery } from '../helpers/useLocationsQueries';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from './Carousel';
import { Button } from './Button';
import styles from './KioskBanner.module.css';

interface KioskBannerProps {
  onCTAClick?: () => void;
  className?: string;
}

export const KioskBanner = ({ onCTAClick, className }: KioskBannerProps) => {
  const kioskConfig = useKioskConfig();
  const { data: locations } = useLocationsQuery();

  const currentLocation = locations?.find(loc => loc.id === kioskConfig.locationId);
  const locationName = currentLocation?.name || 'Alwon';
  const locationAddress = currentLocation?.address || 'Tu minimarket de confianza, ahora más cerca de ti.';

  const bannerItems = [
    {
      title: `¡Bienvenido a ${locationName}!`,
      description: locationAddress,
      imageUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?q=80&w=2070',
    },
    {
      title: 'Productos frescos todos los días',
      description: 'Calidad y frescura garantizada en cada compra.',
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2070',
    },
    {
      title: 'Gana puntos con cada compra',
      description: 'Únete a nuestro programa de lealtad y disfruta de beneficios exclusivos.',
      imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070',
    },
  ];

  const autoplayPlugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  return (
    <div className={`${styles.bannerContainer} ${className || ''}`}>
      <Carousel
        plugins={[autoplayPlugin.current]}
        opts={{ loop: true }}
        onMouseEnter={autoplayPlugin.current.stop}
        onMouseLeave={autoplayPlugin.current.reset}
      >
        <CarouselContent>
          {bannerItems.map((item, index) => (
            <CarouselItem key={index} className={styles.carouselItem}>
              <div className={styles.imageWrapper}>
                <img src={item.imageUrl} alt={item.title} className={styles.bannerImage} />
                <div className={styles.overlay}></div>
              </div>
              <div className={styles.textContainer}>
                <h2 className={styles.title}>{item.title}</h2>
                <p className={styles.description}>{item.description}</p>
                <Button className={styles.ctaButton} onClick={onCTAClick}>
                  Compra ahora
                </Button>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};