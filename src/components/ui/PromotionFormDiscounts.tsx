import React from 'react';
import { Input } from './Input';
import styles from './PromotionFormDiscounts.module.css';

type PromotionType = 'PERCENTAGE_OFF' | 'AMOUNT_OFF' | 'BUY_X_GET_Y' | 'VOLUME_DISCOUNT' | 'BUNDLE' | 'HAPPY_HOUR';

export interface PromotionDiscountData {
  discountPercentage?: number;
  discountAmount?: number;
  buyQuantity?: number;
  getQuantity?: number;
  minQuantity?: number;
}

interface PromotionFormDiscountsProps {
  promotionType?: PromotionType;
  formData: PromotionDiscountData;
  onChange: <K extends keyof PromotionDiscountData>(field: K, value: PromotionDiscountData[K]) => void;
  className?: string;
}

const DiscountField: React.FC<{
  id: string;
  label: string;
  value?: number;
  onChange: (value: number) => void;
  placeholder?: string;
  prefix?: string;
}> = ({ id, label, value, onChange, placeholder, prefix }) => (
  <div className={styles.field}>
    <label htmlFor={id}>{label}</label>
    <div className={styles.inputWrapper}>
      {prefix && <span className={styles.prefix}>{prefix}</span>}
      <Input
        id={id}
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder={placeholder}
        className={prefix ? styles.inputWithPrefix : ''}
      />
    </div>
  </div>
);

export const PromotionFormDiscounts: React.FC<PromotionFormDiscountsProps> = ({
  promotionType,
  formData,
  onChange,
  className,
}) => {
  const renderDiscountFields = () => {
    switch (promotionType) {
      case 'PERCENTAGE_OFF':
        return (
          <DiscountField
            id="discount-percentage"
            label="Porcentaje de Descuento"
            value={formData.discountPercentage}
            onChange={(v) => onChange('discountPercentage', v)}
            placeholder="10"
            prefix="%"
          />
        );
      case 'AMOUNT_OFF':
        return (
          <DiscountField
            id="discount-amount"
            label="Monto de Descuento"
            value={formData.discountAmount}
            onChange={(v) => onChange('discountAmount', v)}
            placeholder="5000"
            prefix="$"
          />
        );
      case 'BUY_X_GET_Y':
        return (
          <div className={styles.fieldGroup}>
            <DiscountField
              id="buy-quantity"
              label="Cantidad a Comprar (X)"
              value={formData.buyQuantity}
              onChange={(v) => onChange('buyQuantity', v)}
              placeholder="2"
            />
            <DiscountField
              id="get-quantity"
              label="Cantidad a Obtener (Y)"
              value={formData.getQuantity}
              onChange={(v) => onChange('getQuantity', v)}
              placeholder="1"
            />
          </div>
        );
      case 'VOLUME_DISCOUNT':
        return (
          <div className={styles.fieldGroup}>
            <DiscountField
              id="min-quantity"
              label="Cantidad Mínima"
              value={formData.minQuantity}
              onChange={(v) => onChange('minQuantity', v)}
              placeholder="3"
            />
            <DiscountField
              id="discount-percentage-volume"
              label="Porcentaje de Descuento"
              value={formData.discountPercentage}
              onChange={(v) => onChange('discountPercentage', v)}
              placeholder="15"
              prefix="%"
            />
          </div>
        );
      case 'BUNDLE':
        return (
          <div className={styles.fieldGroup}>
            <DiscountField
              id="discount-percentage-bundle"
              label="Porcentaje de Descuento"
              value={formData.discountPercentage}
              onChange={(v) => onChange('discountPercentage', v)}
              placeholder="20"
              prefix="%"
            />
            <DiscountField
              id="discount-amount-bundle"
              label="Monto Fijo de Descuento"
              value={formData.discountAmount}
              onChange={(v) => onChange('discountAmount', v)}
              placeholder="10000"
              prefix="$"
            />
          </div>
        );
      case 'HAPPY_HOUR':
        return (
          <>
            <DiscountField
              id="discount-percentage-happy-hour"
              label="Porcentaje de Descuento"
              value={formData.discountPercentage}
              onChange={(v) => onChange('discountPercentage', v)}
              placeholder="50"
              prefix="%"
            />
            <p className={styles.note}>
              Nota: Las horas de inicio y fin se configuran en la sección de Fechas y Límites.
            </p>
          </>
        );
      default:
        return <p className={styles.placeholder}>Selecciona un tipo de promoción para configurar los descuentos.</p>;
    }
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <h3 className={styles.title}>Configuración de Descuentos</h3>
      {renderDiscountFields()}
    </div>
  );
};