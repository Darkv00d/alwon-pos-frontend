import React, { useState, useEffect } from 'react';
import { useKioskPunchMutation } from '../helpers/useKioskPunchMutation';
import { Clock, CheckCircle2, XCircle, LoaderCircle } from 'lucide-react';
import styles from './Kiosk.module.css';

export const Kiosk = ({ className }: { className?: string }) => {
  const [employeeCode, setEmployeeCode] = useState('');
  const [pin, setPin] = useState('');

  const kioskPunchMutation = useKioskPunchMutation();
  const { mutate, data, error, isPending, isSuccess, isError, reset } = kioskPunchMutation;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!employeeCode || !pin) return;
    mutate({ employeeCode, pin });
  };

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setEmployeeCode('');
        setPin('');
        reset();
      }, 5000); // Clear form and message after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isSuccess, reset]);

  const handleInputChange = () => {
    if (isSuccess || isError) {
      reset();
    }
  };

  return (
    <div className={`${styles.kioskContainer} ${className ?? ''}`}>
      <div className={styles.header}>
        <Clock className={styles.headerIcon} />
        <h1 className={styles.title}>Kiosko de Marcación</h1>
        <p className={styles.subtitle}>Ingrese su código y PIN para registrar su asistencia.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="employeeCode" className={styles.label}>Código de Empleado</label>
          <input
            id="employeeCode"
            type="text"
            value={employeeCode}
            onChange={(e) => {
              setEmployeeCode(e.target.value);
              handleInputChange();
            }}
            className={styles.input}
            placeholder="Ej: 12345"
            required
            disabled={isPending}
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="pin" className={styles.label}>PIN</label>
          <input
            id="pin"
            type="password"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              handleInputChange();
            }}
            className={styles.input}
            placeholder="••••"
            required
            disabled={isPending}
          />
        </div>
        <button type="submit" className={styles.button} disabled={isPending || !employeeCode || !pin}>
          {isPending ? (
            <>
              <LoaderCircle className={styles.spinner} />
              Procesando...
            </>
          ) : (
            'Marcar Asistencia'
          )}
        </button>
      </form>

      <div className={styles.feedbackArea}>
        {isError && (
          <div className={`${styles.feedbackCard} ${styles.error}`}>
            <XCircle className={styles.feedbackIcon} />
            <div className={styles.feedbackContent}>
              <p className={styles.feedbackTitle}>Error</p>
              <p className={styles.feedbackMessage}>{error?.message || 'Ocurrió un error inesperado.'}</p>
            </div>
          </div>
        )}
        {isSuccess && data && (
          <div className={`${styles.feedbackCard} ${styles.success}`}>
            <CheckCircle2 className={styles.feedbackIcon} />
            <div className={styles.feedbackContent}>
              <p className={styles.feedbackTitle}>¡Hola, {data.employeeName}!</p>
              <p className={styles.feedbackMessage}>
                {data.status === 'clocked_in' ? 'Entrada registrada con éxito.' : 'Salida registrada con éxito.'}
              </p>
              <div className={styles.hoursInfo}>
                <span>Horas de hoy:</span>
                <strong>{data.todaysHours.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};