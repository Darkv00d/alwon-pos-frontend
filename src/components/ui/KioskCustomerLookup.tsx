import React from 'react';
import { Search, XCircle } from 'lucide-react';
import { Button } from './Button';
import styles from './KioskCustomerLookup.module.css';

interface KioskCustomerLookupProps {
  /** The current value of the keypad input. */
  value: string;
  /** Callback function when the value changes. */
  onChange: (value: string) => void;
  /** Callback function when the search button is pressed. */
  onSearch: () => void;
  /** An error message to display. */
  errorMessage: string | null;
  /** Disables all interactions when true. */
  isLoading: boolean;
  /** Optional className for custom styling. */
  className?: string;
}

const MAX_LENGTH = 15;
const MIN_LENGTH = 4;
const DISPLAY_PLACEHOLDERS = 10;

export const KioskCustomerLookup: React.FC<KioskCustomerLookupProps> = ({
  value,
  onChange,
  onSearch,
  errorMessage,
  isLoading,
  className,
}) => {
  const handleNumberClick = (digit: string) => {
    if (value.length < MAX_LENGTH) {
      onChange(value + digit);
    }
  };

  const handleBackspace = () => {
    if (value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    onChange('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.length >= MIN_LENGTH && !isLoading) {
      onSearch();
    }
  };

  const renderDisplay = () => {
    const valueChars = value.split('');
    const displayChars = [];

    for (let i = 0; i < DISPLAY_PLACEHOLDERS; i++) {
      if (i < valueChars.length) {
        displayChars.push(
          <span key={`char-${i}`} className={styles.displayChar}>
            {valueChars[i]}
          </span>
        );
      } else {
        displayChars.push(
          <span key={`dot-${i}`} className={styles.displayPlaceholder}>
            ●
          </span>
        );
      }
    }
    return displayChars;
  };

  const buttons = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <form onSubmit={handleSubmit} className={`${styles.container} ${className || ''}`}>
      <h2 className={styles.title}>Ingresa tu celular o cédula</h2>
      
      <div className={`${styles.display} ${errorMessage ? styles.displayError : ''}`}>
        {renderDisplay()}
      </div>

      {errorMessage && (
        <p className={styles.errorMessage} role="alert">
          {errorMessage}
        </p>
      )}

      <div className={styles.grid}>
        {buttons.map((btn) => (
          <Button
            key={btn}
            type="button"
            variant="outline"
            className={styles.keypadButton}
            onClick={() => handleNumberClick(btn)}
            disabled={isLoading || value.length >= MAX_LENGTH}
            aria-label={`Ingresar dígito ${btn}`}
          >
            {btn}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          className={styles.keypadButton}
          onClick={handleClear}
          disabled={isLoading || value.length === 0}
          aria-label="Borrar todo"
        >
          <XCircle />
        </Button>
        <Button
          type="button"
          variant="outline"
          className={styles.keypadButton}
          onClick={() => handleNumberClick('0')}
          disabled={isLoading || value.length >= MAX_LENGTH}
          aria-label="Ingresar dígito 0"
        >
          0
        </Button>
        <Button
          type="button"
          variant="outline"
          className={styles.keypadButton}
          onClick={handleBackspace}
          disabled={isLoading || value.length === 0}
          aria-label="Retroceso"
        >
          Borrar
        </Button>
      </div>

      <Button
        type="submit"
        className={styles.searchButton}
        disabled={isLoading || value.length < MIN_LENGTH}
        aria-label="Buscar cliente"
      >
        <Search />
        Buscar
      </Button>
    </form>
  );
};