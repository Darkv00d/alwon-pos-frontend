import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import styles from './BackButton.module.css';

interface BackButtonProps {
  /**
   * The path to navigate to when the button is clicked.
   */
  to: string;
  /**
   * The text to display on the button. Defaults to "Atrás".
   */
  label?: string;
  /**
   * Optional additional CSS classes.
   */
  className?: string;
}

export const BackButton = ({ to, label = 'Atrás', className }: BackButtonProps) => {
  return (
    <Link to={to} className={`${styles.backButton} ${className || ''}`}>
      <ArrowLeft size={16} />
      <span>{label}</span>
    </Link>
  );
};