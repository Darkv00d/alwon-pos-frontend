import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import authApi from '../api/authApi';
import './PinKeypad.css';

export const PinKeypad: React.FC = () => {
    const {
        showPinKeypadModal,
        setShowPinKeypadModal,
        setShowAdminMenuModal,
        setShowLoginModal,
        incrementPinAttempts,
        resetPinAttempts,
        pinAttempts,
        setLoading,
        setError,
        isLoading
    } = useAuthStore();

    const [pinInput, setPinInput] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleClose = () => {
        setShowPinKeypadModal(false);
        setPinInput('');
        setErrorMessage('');
    };

    const addDigit = (digit: string) => {
        if (pinInput.length < 6) {
            setPinInput(pinInput + digit);
            setErrorMessage('');
        }
    };

    const deleteDigit = () => {
        setPinInput(pinInput.slice(0, -1));
        setErrorMessage('');
    };

    const validatePin = async () => {
        if (pinInput.length !== 6) {
            setErrorMessage('El PIN debe tener 6 dígitos');
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
            const response = await authApi.validatePin({ pin: pinInput });

            if (response.valid) {
                // PIN correct - reset attempts and show admin menu
                resetPinAttempts();
                setShowPinKeypadModal(false);
                setShowAdminMenuModal(true);
                setPinInput('');
            } else {
                // PIN incorrect
                incrementPinAttempts();

                if (response.requiresLogin) {
                    // Max attempts exceeded - require full login
                    setErrorMessage('Máximo de intentos alcanzado. Por favor inicia sesión nuevamente.');
                    setTimeout(() => {
                        setShowPinKeypadModal(false);
                        setShowLoginModal(true);
                        setPinInput('');
                    }, 2000);
                } else {
                    // Show attempts remaining
                    setErrorMessage(
                        `PIN incorrecto. ${response.attemptsRemaining || 0} intentos restantes`
                    );
                    setPinInput('');
                }
            }
        } catch (err: any) {
            console.error('PIN validation error:', err);
            setErrorMessage(
                err.response?.data?.message ||
                'Error al validar PIN'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key >= '0' && e.key <= '9') {
            addDigit(e.key);
        } else if (e.key === 'Backspace') {
            deleteDigit();
        } else if (e.key === 'Enter' && pinInput.length === 6) {
            validatePin();
        }
    };

    if (!showPinKeypadModal) return null;

    return (
        <div className="modal-overlay" onClick={handleClose} onKeyDown={handleKeyPress} tabIndex={0}>
            <div className="modal-content keypad-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-icon">🔢</div>
                    <h2>Ingresa tu PIN</h2>
                </div>

                <div className="pin-input-display">
                    {'●'.repeat(pinInput.length)}
                </div>

                {errorMessage && (
                    <div className="error-message">
                        {errorMessage}
                    </div>
                )}

                <div className="keypad">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                        <button
                            key={digit}
                            className="key"
                            onClick={() => addDigit(digit.toString())}
                            disabled={isLoading}
                        >
                            {digit}
                        </button>
                    ))}
                    <button
                        className="key special"
                        onClick={deleteDigit}
                        disabled={isLoading}
                    >
                        ←
                    </button>
                    <button
                        className="key"
                        onClick={() => addDigit('0')}
                        disabled={isLoading}
                    >
                        0
                    </button>
                    <button
                        className="key special"
                        onClick={validatePin}
                        disabled={isLoading || pinInput.length !== 6}
                    >
                        ✓
                    </button>
                </div>

                <div className="button-group">
                    <button
                        className="btn btn-secondary"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PinKeypad;
