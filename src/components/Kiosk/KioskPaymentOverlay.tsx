import React from 'react';
import { CheckCircle, X, Award } from 'lucide-react';
import { Button } from '../ui/Button';
import styles from '../ui/KioskPaymentOverlay.module.css';

interface KioskPaymentOverlayProps {
  paymentState: 'idle' | 'processing' | 'success' | 'error';
  paymentError: string | null;
  pointsToEarn: number;
  onCancel: () => void;
  onRetry: () => void;
}

export const KioskPaymentOverlay: React.FC<KioskPaymentOverlayProps> = ({
  paymentState,
  paymentError,
  pointsToEarn,
  onCancel,
  onRetry,
}) => {
  if (paymentState === 'idle') return null;

  return (
    <div className={styles.overlay}>
      {paymentState === 'processing' && (
        <div className={styles.content}>
          <div className={styles.spinner} />
          <h2 className={styles.title}>💳 Procesando Pago...</h2>
          <p className={styles.subtitle}>
            Por favor, acerca tu tarjeta o dispositivo al datáfono Bold.
          </p>
          <Button variant="outline" size="lg" className={styles.button} onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      )}

      {paymentState === 'success' && (
        <div className={styles.content}>
          <CheckCircle size={120} className={styles.successIcon} />
          <h2 className={styles.title}>¡Pago Exitoso!</h2>
          <p className={styles.subtitle}>Gracias por tu compra en Alwon.</p>
          {pointsToEarn > 0 && (
            <div className={styles.pointsEarned}>
              <Award size={48} />
              <span>Ganaste {pointsToEarn} puntos</span>
            </div>
          )}
        </div>
      )}

      {paymentState === 'error' && (
        <div className={styles.content}>
          <X size={120} className={styles.errorIcon} />
          <h2 className={styles.title}>Error en el Pago</h2>
          <p className={styles.subtitle}>
            {paymentError || 'No se pudo completar la transacción.'}
          </p>
          <Button size="lg" className={styles.button} onClick={onRetry}>
            Reintentar
          </Button>
          <Button variant="outline" size="lg" className={styles.button} onClick={onCancel}>
            Volver al Carrito
          </Button>
        </div>
      )}
    </div>
  );
};
