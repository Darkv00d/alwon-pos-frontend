import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useDateRange, DateRange as DateRangeType } from '../helpers/locationSelection';
import { Input } from './Input';
import { Button } from './Button';
import styles from './DateRange.module.css';

export const DateRange = ({ className }: { className?: string }) => {
  const [globalDateRange, setGlobalDateRange] = useDateRange();
  
  const [localFrom, setLocalFrom] = useState<string>('');
  const [localTo, setLocalTo] = useState<string>('');

  useEffect(() => {
    setLocalFrom(globalDateRange?.from || '');
    setLocalTo(globalDateRange?.to || '');
  }, [globalDateRange]);

  const handleApply = useCallback(() => {
    if (localFrom && localTo && new Date(localFrom) > new Date(localTo)) {
      toast.error('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    const newRange: DateRangeType = (localFrom || localTo) 
      ? { from: localFrom, to: localTo } 
      : null;

    setGlobalDateRange(newRange);
    toast.success('Rango de fechas actualizado.');
  }, [localFrom, localTo, setGlobalDateRange]);

  const handleClear = useCallback(() => {
    setGlobalDateRange(null);
    toast.info('Rango de fechas limpiado.');
  }, [setGlobalDateRange]);

  const isDirty = globalDateRange?.from !== localFrom || globalDateRange?.to !== localTo;
  const hasSelection = !!(localFrom || localTo);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <Input
        type="date"
        value={localFrom}
        onChange={(e) => setLocalFrom(e.target.value)}
        className={styles.dateInput}
        aria-label="Fecha de inicio"
      />
      <span className={styles.separator}>-</span>
      <Input
        type="date"
        value={localTo}
        onChange={(e) => setLocalTo(e.target.value)}
        className={styles.dateInput}
        aria-label="Fecha de fin"
      />
      <Button 
        onClick={handleApply} 
        size="md"
        disabled={!isDirty}
      >
        Aplicar
      </Button>
      {hasSelection && (
        <Button 
          onClick={handleClear} 
          variant="ghost" 
          size="icon-md" 
          aria-label="Limpiar rango de fechas"
          className={styles.clearButton}
        >
          <X size={16} />
        </Button>
      )}
    </div>
  );
};