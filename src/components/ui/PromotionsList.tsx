import React, { useState, useMemo } from 'react';
import { type OutputType as PromotionsListType } from '../endpoints/promotions_GET.schema';
import { Input } from './Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Button } from './Button';
import { Badge } from './Badge';
import { Skeleton } from './Skeleton';
import { Edit, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import styles from './PromotionsList.module.css';

type Promotion = PromotionsListType[0];

interface PromotionsListProps {
  promotions: Promotion[];
  isLoading: boolean;
  onEdit: (promotion: Promotion) => void;
  filters: {
    active?: boolean;
    promotionType?: string;
    search?: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<PromotionsListProps['filters']>>;
  className?: string;
}

const PROMOTION_TYPES = [
  { value: 'PERCENTAGE_OFF', label: 'Porcentaje' },
  { value: 'AMOUNT_OFF', label: 'Monto Fijo' },
  { value: 'BUY_X_GET_Y', label: 'Compra X, Lleva Y' },
  { value: 'BUNDLE', label: 'Paquete' },
  { value: 'HAPPY_HOUR', label: 'Happy Hour' },
  { value: 'VOLUME_DISCOUNT', label: 'Volumen' },
];

const getPromotionTypeLabel = (type: string) => {
  return PROMOTION_TYPES.find(t => t.value === type)?.label ?? type;
};

const formatDiscount = (p: Promotion) => {
  switch (p.promotionType) {
    case 'PERCENTAGE_OFF':
    case 'HAPPY_HOUR':
    case 'VOLUME_DISCOUNT':
      return `${p.discountPercentage}% OFF`;
    case 'AMOUNT_OFF':
      return `$${p.discountAmount} OFF`;
    case 'BUY_X_GET_Y':
      return `Compra ${p.buyQuantity}, Lleva ${p.getQuantity}`;
    case 'BUNDLE':
      if (p.discountAmount) return `$${p.discountAmount} OFF`;
      if (p.discountPercentage) return `${p.discountPercentage}% OFF`;
      return 'N/A';
    default:
      return 'N/A';
  }
};

export const PromotionsList = ({ promotions, isLoading, onEdit, filters, setFilters, className }: PromotionsListProps) => {
  const handleFilterChange = <K extends keyof PromotionsListProps['filters']>(key: K, value: PromotionsListProps['filters'][K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={styles.row}>
          <div className={styles.cell}><Skeleton style={{ height: '1.25rem', width: '150px' }} /></div>
          <div className={styles.cell}><Skeleton style={{ height: '1.5rem', width: '100px' }} /></div>
          <div className={styles.cell}><Skeleton style={{ height: '1.25rem', width: '120px' }} /></div>
          <div className={styles.cell}><Skeleton style={{ height: '1.25rem', width: '180px' }} /></div>
          <div className={styles.cell}><Skeleton style={{ height: '1.5rem', width: '120px' }} /></div>
          <div className={styles.cell}><Skeleton style={{ height: '1.5rem', width: '80px' }} /></div>
          <div className={styles.cell}><Skeleton style={{ height: '1.25rem', width: '80px' }} /></div>
          <div className={styles.cell}><Skeleton style={{ height: '2rem', width: '40px' }} /></div>
        </div>
      ));
    }

    if (promotions.length === 0) {
      return <div className={styles.emptyState}>No se encontraron promociones.</div>;
    }

    return promotions.map(p => (
      <div key={p.id} className={styles.row} onClick={() => onEdit(p)}>
        <div className={styles.cell} data-label="Nombre">{p.name}</div>
        <div className={styles.cell} data-label="Tipo">
          <Badge>{getPromotionTypeLabel(p.promotionType)}</Badge>
        </div>
        <div className={styles.cell} data-label="Descuento">{formatDiscount(p)}</div>
        <div className={styles.cell} data-label="Rango de Fechas">
          {format(new Date(p.startDate), 'dd/MM/yy')} - {format(new Date(p.endDate), 'dd/MM/yy')}
        </div>
        <div className={styles.cell} data-label="Ubicaciones">
          {p.appliesToAllLocations ? (
            <Badge variant="secondary">Todas las tiendas</Badge>
          ) : p.locations.length > 0 ? (
            <div className={styles.locationBadges}>
              {p.locations.slice(0, 2).map(loc => (
                <Badge key={loc.id} variant="outline" className={styles.locationBadge}>
                  {loc.name}
                </Badge>
              ))}
              {p.locations.length > 2 && (
                <Badge variant="outline" className={styles.locationBadge}>
                  +{p.locations.length - 2}
                </Badge>
              )}
            </div>
          ) : (
            <span className={styles.noLocations}>Sin ubicaciones</span>
          )}
        </div>
        <div className={styles.cell} data-label="Estado">
          <Badge variant={p.isActive ? 'success' : 'destructive'}>
            {p.isActive ? 'Activa' : 'Inactiva'}
          </Badge>
        </div>
        <div className={styles.cell} data-label="Usos">
          {p.currentUses ?? 0} / {p.maxTotalUses ?? '∞'}
        </div>
        <div className={styles.cell} data-label="Acciones">
          <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); onEdit(p); }}>
            <Edit size={16} />
          </Button>
        </div>
      </div>
    ));
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.filters}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <Input
            placeholder="Buscar por nombre..."
            value={filters.search ?? ''}
            onChange={e => handleFilterChange('search', e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <Select
          value={filters.promotionType ?? '__empty'}
          onValueChange={value => handleFilterChange('promotionType', value === '__empty' ? undefined : value)}
        >
          <SelectTrigger className={styles.filterSelect}>
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__empty">Todos los tipos</SelectItem>
            {PROMOTION_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.active === undefined ? '__empty' : String(filters.active)}
          onValueChange={value => handleFilterChange('active', value === '__empty' ? undefined : value === 'true')}
        >
          <SelectTrigger className={styles.filterSelect}>
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__empty">Todos los estados</SelectItem>
            <SelectItem value="true">Activa</SelectItem>
            <SelectItem value="false">Inactiva</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={styles.table}>
        <div className={`${styles.row} ${styles.header}`}>
          <div className={styles.cell}>Nombre</div>
          <div className={styles.cell}>Tipo</div>
          <div className={styles.cell}>Descuento</div>
          <div className={styles.cell}>Rango de Fechas</div>
          <div className={styles.cell}>Ubicaciones</div>
          <div className={styles.cell}>Estado</div>
          <div className={styles.cell}>Usos</div>
          <div className={styles.cell}>Acciones</div>
        </div>
        <div className={styles.body}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};