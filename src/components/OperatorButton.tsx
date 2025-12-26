import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import './OperatorButton.css';

export const OperatorButton: React.FC = () => {
    const {
        operator,
        isPinActive,
        setShowLoginModal,
        setShowPinKeypadModal
    } = useAuthStore();

    const handleClick = () => {
        if (operator && isPinActive) {
            // Already logged in - show PIN keypad for quick access
            setShowPinKeypadModal(true);
        } else {
            // Not logged in - show login modal
            setShowLoginModal(true);
        }
    };

    return (
        <button
            className={`operator-button ${operator ? 'authenticated' : 'unauthenticated'}`}
            onClick={handleClick}
            aria-label={operator ? `Operador: ${operator.fullName || ''}` : 'Iniciar sesión'}
        >
            {operator && isPinActive ? (
                <>
                    <span className="operator-icon">✓</span>
                    <span className="operator-name">{operator.fullName?.split(' ')[0] || 'Op'}</span>
                </>
            ) : (
                <>
                    <span className="operator-icon">👤</span>
                    <span className="operator-label">Operador</span>
                </>
            )}
        </button>
    );
};

export default OperatorButton;
