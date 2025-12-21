import React from 'react';
import { Delete, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import styles from './NumericKeypad.module.css';

interface NumericKeypadProps {
  /** The current value of the keypad input. */
  value: string;
  /** Callback function when the value changes. */
  onChange: (value: string) => void;
  /** Callback function when the submit button is pressed. */
  onSubmit: (value: string) => void;
  /** The maximum number of digits allowed. Defaults to 6. */
  maxLength?: number;
  /** Disables all keypad interactions. */
  disabled?: boolean;
  /** Optional className for custom styling. */
  className?: string;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  value,
  onChange,
  onSubmit,
  maxLength = 6,
  disabled = false,
  className,
}) => {
  const handleNumberClick = (digit: string) => {
    if (value.length < maxLength) {
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
    onSubmit(value);
  };

  const renderMaskedInput = () => {
    const dots = [];
    for (let i = 0; i < maxLength; i++) {
      const isActive = i < value.length;
      dots.push(
        <div
          key={i}
          className={`${styles.dot} ${isActive ? styles.activeDot : ''}`}
        />
      );
    }
    return dots;
  };

  const buttons = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
  ];

  return (
    <form onSubmit={handleSubmit} className={`${styles.keypadContainer} ${className || ''}`}>
      <div className={styles.display} aria-label={`${value.length} of ${maxLength} digits entered`}>
        {renderMaskedInput()}
      </div>
      <div className={styles.grid}>
        {buttons.map((btn) => (
          <Button
            key={btn}
            type="button"
            variant="outline"
            size="lg"
            className={styles.keypadButton}
            onClick={() => handleNumberClick(btn)}
            disabled={disabled || value.length >= maxLength}
            aria-label={`Enter digit ${btn}`}
          >
            {btn}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className={styles.keypadButton}
          onClick={handleClear}
          disabled={disabled || value.length === 0}
          aria-label="Clear input"
        >
          Clear
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className={styles.keypadButton}
          onClick={() => handleNumberClick('0')}
          disabled={disabled || value.length >= maxLength}
          aria-label="Enter digit 0"
        >
          0
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className={`${styles.keypadButton} ${styles.iconButton}`}
          onClick={handleBackspace}
          disabled={disabled || value.length === 0}
          aria-label="Backspace"
        >
          <Delete />
        </Button>
      </div>
      <Button
        type="submit"
        size="lg"
        className={styles.submitButton}
        disabled={disabled || value.length === 0}
        aria-label="Submit PIN"
      >
        <CheckCircle size={24} />
        Enter
      </Button>
    </form>
  );
};