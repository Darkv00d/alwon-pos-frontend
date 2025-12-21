import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from './Input';
import { Button } from './Button';
import { Calendar } from './Calendar';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import styles from './PromotionFormDates.module.css';

export interface PromotionDateData {
  startDate: Date;
  endDate: Date;
  startTime?: string;
  endTime?: string;
  maxUsesPerCustomer?: number;
  maxTotalUses?: number;
}

interface PromotionFormDatesProps {
  formData: PromotionDateData;
  onChange: <K extends keyof PromotionDateData>(field: K, value: PromotionDateData[K]) => void;
  className?: string;
}

export const PromotionFormDates: React.FC<PromotionFormDatesProps> = ({
  formData,
  onChange,
  className,
}) => {
  return (
    <div className={`${styles.container} ${className || ''}`}>
      <h3 className={styles.title}>Fechas y Límites</h3>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label>Fecha de Inicio</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={styles.dateButton}>
                <CalendarIcon size={16} />
                {formData.startDate ? format(formData.startDate, 'PPP') : <span>Seleccionar fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent removeBackgroundAndPadding>
              <Calendar
                mode="single"
                selected={formData.startDate}
                onSelect={(date) => date && onChange('startDate', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className={styles.field}>
          <label>Fecha de Fin</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={styles.dateButton}>
                <CalendarIcon size={16} />
                {formData.endDate ? format(formData.endDate, 'PPP') : <span>Seleccionar fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent removeBackgroundAndPadding>
              <Calendar
                mode="single"
                selected={formData.endDate}
                onSelect={(date) => date && onChange('endDate', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className={styles.field}>
          <label htmlFor="start-time">Hora de Inicio (Opcional)</label>
          <Input
            id="start-time"
            type="time"
            value={formData.startTime ?? ''}
            onChange={(e) => onChange('startTime', e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="end-time">Hora de Fin (Opcional)</label>
          <Input
            id="end-time"
            type="time"
            value={formData.endTime ?? ''}
            onChange={(e) => onChange('endTime', e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="max-uses-customer">Máx. Usos por Cliente</label>
          <Input
            id="max-uses-customer"
            type="number"
            value={formData.maxUsesPerCustomer ?? ''}
            onChange={(e) => onChange('maxUsesPerCustomer', parseInt(e.target.value, 10))}
            placeholder="Sin límite"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="max-total-uses">Máx. Usos Totales</label>
          <Input
            id="max-total-uses"
            type="number"
            value={formData.maxTotalUses ?? ''}
            onChange={(e) => onChange('maxTotalUses', parseInt(e.target.value, 10))}
            placeholder="Sin límite"
          />
        </div>
      </div>
    </div>
  );
};