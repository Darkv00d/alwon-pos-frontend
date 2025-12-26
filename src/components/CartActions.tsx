import React from 'react';
import './CartActions.css';

interface CartActionsProps {
    sessionId: string;
    onPay: () => void;
    onSuspend: () => void;
    onCancel: () => void;
    disabled?: boolean;
}

export const CartActions: React.FC<CartActionsProps> = ({
    sessionId,
    onPay,
    onSuspend,
    onCancel,
    disabled = false
}) => {
    return (
        <div className="cart-actions">
            <button
                className="btn btn-primary"
                onClick={onPay}
                disabled={disabled}
            >
                💳 PAGAR
            </button>

            <button
                className="btn btn-secondary"
                onClick={onSuspend}
                disabled={disabled}
            >
                ⏸️ Suspender
            </button>

            <button
                className="btn btn-danger"
                onClick={onCancel}
                disabled={disabled}
            >
                ❌ Cancelar
            </button>
        </div>
    );
};
