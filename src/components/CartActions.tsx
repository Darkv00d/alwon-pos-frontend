import React from 'react';
import './CartActions.css';

interface CartActionsProps {
    onPay: () => void;
    onCancel: () => void;
    disabled?: boolean;
}

export const CartActions: React.FC<CartActionsProps> = ({
    onPay,
    onCancel,
    disabled = false
}) => {
    return (
        <div className="cart-actions">
            {/* US-018: Simplified Actions - Prominent PAGAR Button */}
            <button
                className="btn-pay-primary"
                onClick={onPay}
                disabled={disabled}
            >
                💳 PAGAR
            </button>

            {/* US-018: Secondary Action - CANCELAR */}
            <button
                className="btn-cancel"
                onClick={onCancel}
                disabled={disabled}
            >
                ❌ CANCELAR
            </button>
        </div>
    );
};
