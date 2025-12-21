import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './Dialog';
import { Button } from './Button';
import { NumericKeypad } from './NumericKeypad';
import { PinRecoveryDialog } from './PinRecoveryDialog';
import { useVerifyPinMutation } from '../helpers/useCustomerQueries';
import { toast } from 'sonner';
import styles from './PinVerificationDialog.module.css';

export interface PinVerificationDialogProps {
  isOpen: boolean;
  customerName: string;
  customerId: number;
  onVerified: (customerId: number) => void;
  onCancel: () => void;
}

export const PinVerificationDialog: React.FC<PinVerificationDialogProps> = ({
  isOpen,
  customerName,
  customerId,
  onVerified,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);

  const { mutate: verifyPin, isPending } = useVerifyPinMutation();

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setPin('');
      setError(null);
    }
  }, [isOpen]);

  const handlePinChange = (value: string) => {
    setPin(value);
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = (value: string) => {
    if (value.length < 4 || isPending) {
      setError('El PIN debe tener entre 4 y 6 dígitos.');
      return;
    }

    verifyPin(
      { customerId, pin: value },
      {
        onSuccess: (data) => {
          if (data.verified) {
            toast.success(`¡Bienvenido de nuevo, ${customerName}!`);
            onVerified(customerId);
          } else {
            const errorMessage =
              data.reason === 'no_pin_set'
                ? 'No se ha configurado un PIN para esta cuenta.'
                : 'El PIN ingresado es incorrecto. Por favor, intenta de nuevo.';
            setError(errorMessage);
            setPin('');
          }
        },
        onError: (err) => {
          const errorMessage =
            err instanceof Error
              ? err.message
              : 'Ocurrió un error inesperado al verificar el PIN.';
          setError(errorMessage);
          toast.error('Error de Verificación', { description: errorMessage });
        },
      },
    );
  };

  const handleForgotPin = () => {
    // Close current dialog and open recovery dialog
    onCancel();
    setShowRecoveryDialog(true);
  };

  const handleRecoverySuccess = () => {
    toast.info('PIN restablecido exitosamente. Puede ingresar con su nuevo PIN.');
    setShowRecoveryDialog(false);
  };

  const handleRecoveryClose = () => {
    setShowRecoveryDialog(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
        <DialogContent className={styles.dialogContent} onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>PIN de Seguridad</DialogTitle>
            <DialogDescription>
              Hola {customerName}, por favor ingresa tu PIN de 4-6 dígitos para continuar.
            </DialogDescription>
          </DialogHeader>
          <div className={styles.contentWrapper}>
            <NumericKeypad
              value={pin}
              onChange={handlePinChange}
              onSubmit={handleSubmit}
              maxLength={6}
              disabled={isPending}
              className={styles.keypad}
            />
            {error && (
              <p className={styles.errorMessage}>
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleForgotPin}
              disabled={isPending}
              className={styles.forgotPinLink}
            >
              ¿Olvidó su PIN?
            </button>
            <div className={styles.cancelButtonWrapper}>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onCancel}
                disabled={isPending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PinRecoveryDialog
        isOpen={showRecoveryDialog}
        onClose={handleRecoveryClose}
        onSuccess={handleRecoverySuccess}
      />
    </>
  );
};