import React, { useState, useCallback } from 'react';
import { ArrowUp, Delete, CornerDownLeft, X } from 'lucide-react';
import { Button } from './Button';
import styles from './AlphanumericKeyboard.module.css';

interface AlphanumericKeyboardProps {
  /** The current value of the input. */
  value: string;
  /** Callback function when the value changes. */
  onChange: (value: string) => void;
  /** Callback function when the submit button is pressed. */
  onSubmit?: (value: string) => void;
  /** Optional className for custom styling. */
  className?: string;
}

const row1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const row2 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
const row3 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
const row4 = ['z', 'x', 'c', 'v', 'b', 'n', 'm', '.', '-'];
const specialChars = ['@'];

export const AlphanumericKeyboard: React.FC<AlphanumericKeyboardProps> = ({
  value,
  onChange,
  onSubmit,
  className,
}) => {
  const [isShiftActive, setIsShiftActive] = useState(false);

  const handleKeyPress = useCallback((key: string) => {
    const char = isShiftActive ? key.toUpperCase() : key.toLowerCase();
    onChange(value + char);
  }, [value, onChange, isShiftActive]);

  const handleBackspace = useCallback(() => {
    onChange(value.slice(0, -1));
  }, [value, onChange]);

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  const handleShift = useCallback(() => {
    setIsShiftActive(prev => !prev);
  }, []);

  const handleSpace = useCallback(() => {
    onChange(value + ' ');
  }, [value, onChange]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(value);
    }
  }, [onSubmit, value]);

  const renderKey = (key: string) => (
    <Button
      key={key}
      type="button"
      variant="outline"
      className={styles.keyButton}
      onClick={() => handleKeyPress(key)}
    >
      {isShiftActive ? key.toUpperCase() : key.toLowerCase()}
    </Button>
  );

  return (
    <form onSubmit={handleSubmit} className={`${styles.keyboardContainer} ${className || ''}`}>
      <div className={styles.keyboardRow}>
        {row1.map(renderKey)}
        <Button
          type="button"
          variant="outline"
          className={`${styles.keyButton} ${styles.functionKey}`}
          onClick={handleBackspace}
          aria-label="Backspace"
        >
          <Delete />
        </Button>
      </div>
      <div className={styles.keyboardRow}>
        {row2.map(renderKey)}
      </div>
      <div className={styles.keyboardRow}>
        {row3.map(renderKey)}
      </div>
      <div className={styles.keyboardRow}>
        <Button
          type="button"
          variant="outline"
          className={`${styles.keyButton} ${styles.functionKey} ${isShiftActive ? styles.shiftActive : ''}`}
          onClick={handleShift}
          aria-label="Shift"
        >
          <ArrowUp />
        </Button>
        {row4.map(renderKey)}
        <Button
          type="button"
          variant="outline"
          className={`${styles.keyButton} ${styles.functionKey}`}
          onClick={handleClear}
          aria-label="Clear"
        >
          <X />
        </Button>
      </div>
      <div className={styles.keyboardRow}>
        {specialChars.map(renderKey)}
        <Button
          type="button"
          variant="outline"
          className={`${styles.keyButton} ${styles.spaceKey}`}
          onClick={handleSpace}
          aria-label="Space"
        >
          Space
        </Button>
        {onSubmit && (
          <Button
            type="submit"
            className={`${styles.keyButton} ${styles.enterKey}`}
            aria-label="Enter"
          >
            <CornerDownLeft />
            Enter
          </Button>
        )}
      </div>
    </form>
  );
};