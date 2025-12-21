import React, { useState, useEffect, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AlertTriangle, KeyRound, Loader2, Search } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './Dialog';
import { Input } from './Input';
import { Button } from './Button';
import { Badge } from './Badge';
import { schema as resetPinSchema } from '../endpoints/customers/reset-pin_POST.schema';
import { useResetPinMutation } from '../helpers/useCustomerQueries';
import styles from './PinRecoveryDialog.module.css';

interface PinRecoveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const formSchema = resetPinSchema.extend({
  confirmPin: z.string(),
}).refine((data) => data.newPin === data.confirmPin, {
  message: "Los PINs no coinciden.",
  path: ["confirmPin"],
});

type FormValues = z.infer<typeof formSchema>;

export const PinRecoveryDialog = ({ isOpen, onClose, onSuccess }: PinRecoveryDialogProps) => {
  const [customerName, setCustomerName] = useState<string | null>(null);
  const identifierInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const pinRecoveryMutation = useResetPinMutation();

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    pinRecoveryMutation.mutate(
      {
        identifier: data.identifier,
        newPin: data.newPin,
      },
      {
        onSuccess: (result) => {
          if (result.success && result.customerName) {
            setCustomerName(result.customerName);
            toast.success(`PIN para ${result.customerName} restablecido exitosamente.`);
            onSuccess();
            handleClose();
          } else {
            // Generic success message for security (user not found)
            toast.info(result.message);
            onSuccess();
            handleClose();
          }
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
          toast.error(`Error al restablecer el PIN: ${errorMessage}`);
          console.error("PIN reset error:", error);
        },
      }
    );
  };

  const handleClose = () => {
    reset();
    setCustomerName(null);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      // Reset form state when dialog opens
      reset();
      setCustomerName(null);
      // Autofocus on the identifier input
      setTimeout(() => identifierInputRef.current?.focus(), 100);
    }
  }, [isOpen, reset]);

  const isLoading = isSubmitting || pinRecoveryMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle>Recuperar PIN de Cliente</DialogTitle>
          <DialogDescription>
            Ingresa el email o teléfono del cliente y un nuevo PIN para restablecer su acceso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="identifier">Email o Teléfono del Cliente</label>
            <div className={styles.inputWithIcon}>
              <Search className={styles.icon} />
              <Input
                id="identifier"
                placeholder="ej: cliente@email.com o 3001234567"
                {...register('identifier')}
                disabled={isLoading}
                ref={identifierInputRef}
                className={styles.inputField}
              />
            </div>
            {errors.identifier && <p className={styles.errorText}>{errors.identifier.message}</p>}
          </div>

          <div className={styles.pinContainer}>
            <div className={styles.inputGroup}>
              <label htmlFor="newPin">Nuevo PIN (4-6 dígitos)</label>
              <div className={styles.inputWithIcon}>
                <KeyRound className={styles.icon} />
                <Input
                  id="newPin"
                  type="password"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="\d*"
                  placeholder="••••"
                  {...register('newPin')}
                  disabled={isLoading}
                  className={`${styles.inputField} ${styles.pinInput}`}
                />
              </div>
              {errors.newPin && <p className={styles.errorText}>{errors.newPin.message}</p>}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPin">Confirmar Nuevo PIN</label>
              <div className={styles.inputWithIcon}>
                <KeyRound className={styles.icon} />
                <Input
                  id="confirmPin"
                  type="password"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="\d*"
                  placeholder="••••"
                  {...register('confirmPin')}
                  disabled={isLoading}
                  className={`${styles.inputField} ${styles.pinInput}`}
                />
              </div>
              {errors.confirmPin && <p className={styles.errorText}>{errors.confirmPin.message}</p>}
            </div>
          </div>

          <Badge variant="warning" className={styles.warningBadge}>
            <AlertTriangle size={16} />
            <span>Por seguridad, verifica la identidad del cliente antes de resetear su PIN.</span>
          </Badge>

          <DialogFooter className={styles.footer}>
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className={styles.spinner} />
                  Restableciendo...
                </>
              ) : (
                'Restablecer PIN'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};