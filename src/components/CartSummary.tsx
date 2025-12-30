import React from 'react';
import './CartSummary.css';

interface CartSummaryProps {
    totalItems: number;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
    totalItems,
    subtotal,
    taxAmount,
    totalAmount
}) => {
    const formatCurrency = (amount: number): string => {
        return `$${amount.toLocaleString('es-CO')}`;
    };

    return (
        <div className="cart-summary">
            <div className="summary-title">📊 Resumen de Compra</div>

            <div className="summary-row">
                <span className="summary-label">🛒 Total de productos:</span>
                <span className="summary-items-count">{totalItems} items</span>
            </div>

            <div className="summary-row">
                <span className="summary-label">💵 Subtotal:</span>
                <span className="summary-value">{formatCurrency(subtotal)}</span>
            </div>

            <div className="summary-row">
                <span className="summary-label">📊 IVA (19%):</span>
                <span className="summary-value">{formatCurrency(taxAmount)}</span>
            </div>

            {/* US-011: Visual divider before total */}
            <div className="summary-divider"></div>

            <div className="summary-row summary-total">
                <span className="summary-label">💰 TOTAL A PAGAR:</span>
                <span className="summary-value">{formatCurrency(totalAmount)}</span>
            </div>
        </div>
    );
};
