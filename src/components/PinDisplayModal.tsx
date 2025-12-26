import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import './PinDisplayModal.css';

export const PinDisplayModal: React.FC = () => {
    const {
        showPinDisplayModal,
        setShowPinDisplayModal,
        lastPinGenerated,
        lastNotifications,
        operator
    } = useAuthStore();

    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (showPinDisplayModal && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            handleClose();
        }
    }, [showPinDisplayModal, countdown]);

    const handleClose = () => {
        setShowPinDisplayModal(false);
        setCountdown(5);
    };

    if (!showPinDisplayModal || !lastPinGenerated) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content pin-display-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="success-icon">✅</div>
                    <h2>Login Exitoso</h2>
                    <p className="welcome-text">
                        Bienvenido, <strong>{operator?.fullName || 'Operador'}</strong>
                    </p>
                </div>

                <p className="info-text">Tu PIN temporal es:</p>

                <div className="pin-display">
                    <div className="pin-digits">{lastPinGenerated}</div>
                </div>

                <p className="info-text memo">🕐 Memoriza este PIN</p>

                {lastNotifications && (
                    <div className="notifications">
                        {lastNotifications.whatsapp?.sent && (
                            <div className="notification">
                                <span>✓</span>
                                <span>Enviado a tu WhatsApp: {lastNotifications.whatsapp.maskedPhone}</span>
                            </div>
                        )}
                        {lastNotifications.email?.sent && (
                            <div className="notification">
                                <span>✓</span>
                                <span>Enviado a tu Email: {lastNotifications.email.maskedEmail}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="countdown-text">
                    Auto-cierre en <span className="countdown-number">{countdown}</span> segundos...
                </div>

                <div className="button-group">
                    <button className="btn btn-primary" onClick={handleClose}>
                        Continuar (Enter)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PinDisplayModal;
