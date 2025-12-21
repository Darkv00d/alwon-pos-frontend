import React from 'react';
import { Input } from './Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Switch } from './Switch';
import { Checkbox } from './Checkbox';
import styles from './PromotionFormBasicInfo.module.css';

// This would typically come from a shared helper or schema file
const PROMOTION_TYPES = {
  PERCENTAGE_OFF: 'Porcentaje de Descuento',
  AMOUNT_OFF: 'Monto Fijo de Descuento',
  BUY_X_GET_Y: 'Compra X, Lleva Y',
  VOLUME_DISCOUNT: 'Descuento por Volumen',
  BUNDLE: 'Paquete (Bundle)',
  HAPPY_HOUR: 'Happy Hour',
};

type PromotionType = keyof typeof PROMOTION_TYPES;

export interface PromotionBasicInfoData {
  id: string;
  name: string;
  description: string;
  promotionType: PromotionType;
  priority: number;
  isActive: boolean;
  daysOfWeek: number[];
}

interface PromotionFormBasicInfoProps {
  formData: PromotionBasicInfoData;
  onChange: <K extends keyof PromotionBasicInfoData>(field: K, value: PromotionBasicInfoData[K]) => void;
  isEditMode: boolean;
  className?: string;
}

const DAYS = [
  { id: 1, label: 'Lun' },
  { id: 2, label: 'Mar' },
  { id: 3, label: 'Mié' },
  { id: 4, label: 'Jue' },
  { id: 5, label: 'Vie' },
  { id: 6, label: 'Sáb' },
  { id: 7, label: 'Dom' },
];

export const PromotionFormBasicInfo: React.FC<PromotionFormBasicInfoProps> = ({
  formData,
  onChange,
  isEditMode,
  className,
}) => {
  const handleDayChange = (dayId: number, checked: boolean) => {
    const currentDays = formData.daysOfWeek || [];
    const newDays = checked
      ? [...currentDays, dayId]
      : currentDays.filter((d) => d !== dayId);
    onChange('daysOfWeek', newDays.sort());
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <h3 className={styles.title}>Información Básica</h3>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="promo-id">ID de la Promoción</label>
          <Input
            id="promo-id"
            value={formData.id}
            onChange={(e) => onChange('id', e.target.value)}
            disabled={isEditMode}
            placeholder="ej: DESC_VERANO_2024"
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="promo-name">Nombre</label>
          <Input
            id="promo-name"
            value={formData.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="ej: Descuento de Verano"
            required
          />
        </div>
        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label htmlFor="promo-description">Descripción</label>
          <textarea
            id="promo-description"
            className={styles.textarea}
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Describe brevemente en qué consiste la promoción."
            rows={3}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="promo-type">Tipo de Promoción</label>
          <Select
            value={formData.promotionType}
            onValueChange={(value: PromotionType) => onChange('promotionType', value)}
          >
            <SelectTrigger id="promo-type">
              <SelectValue placeholder="Selecciona un tipo" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROMOTION_TYPES).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={styles.field}>
          <label htmlFor="promo-priority">Prioridad</label>
          <Input
            id="promo-priority"
            type="number"
            value={formData.priority}
            onChange={(e) => onChange('priority', parseInt(e.target.value, 10) || 0)}
            placeholder="0"
          />
        </div>
        <div className={`${styles.field} ${styles.switchField}`}>
          <label htmlFor="promo-active">Activa</label>
          <Switch
            id="promo-active"
            checked={formData.isActive}
            onCheckedChange={(checked) => onChange('isActive', checked)}
          />
        </div>
        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label>Días de la Semana Aplicables</label>
          <div className={styles.daysContainer}>
            {DAYS.map((day) => (
              <div key={day.id} className={styles.dayCheckbox}>
                <Checkbox
                  id={`day-${day.id}`}
                  checked={(formData.daysOfWeek || []).includes(day.id)}
                  onChange={(e) => handleDayChange(day.id, e.target.checked)}
                />
                <label htmlFor={`day-${day.id}`}>{day.label}</label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};