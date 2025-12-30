import React from 'react';
import { useAppStore } from '@/store/appStore';
import './ProductCard.css';

interface ProductCardProps {
    product: {
        productId: string;
        productName: string;
        productImageUrl?: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        taxAmount: number;
        totalAmount: number;
    };
    isReadOnly: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, isReadOnly }) => {
    const { updateCartItem, removeCartItem } = useAppStore();

    // Generate emoji fallback based on product name
    const getProductEmoji = (name: string): string => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('leche') || lowerName.includes('milk')) return '🥛';
        if (lowerName.includes('pan') || lowerName.includes('bread')) return '🍞';
        if (lowerName.includes('huevo') || lowerName.includes('egg')) return '🥚';
        if (lowerName.includes('arroz') || lowerName.includes('rice')) return '🍚';
        if (lowerName.includes('coca') || lowerName.includes('cola') || lowerName.includes('soda')) return '🥤';
        if (lowerName.includes('café') || lowerName.includes('coffee')) return '☕';
        if (lowerName.includes('queso') || lowerName.includes('cheese')) return '🧀';
        if (lowerName.includes('carne') || lowerName.includes('meat')) return '🥩';
        if (lowerName.includes('pollo') || lowerName.includes('chicken')) return '🍗';
        if (lowerName.includes('pescado') || lowerName.includes('fish')) return '🐟';
        if (lowerName.includes('fruta') || lowerName.includes('fruit')) return '🍎';
        if (lowerName.includes('verdura') || lowerName.includes('vegetal')) return '🥬';
        if (lowerName.includes('aceite') || lowerName.includes('oil')) return '🫒';
        if (lowerName.includes('azúcar') || lowerName.includes('sugar')) return '🍬';
        if (lowerName.includes('sal') || lowerName.includes('salt')) return '🧂';
        if (lowerName.includes('pasta') || lowerName.includes('espagueti')) return '🍝';
        return '🛒'; // Default
    };

    const formatCurrency = (amount: number): string => {
        return `$${amount.toLocaleString('es-CO')}`;
    };

    const handleIncrement = () => {
        if (!isReadOnly) {
            // productId is actually the item.id from the cart
            updateCartItem(product.productId, product.quantity + 1);
        }
    };

    const handleDecrement = () => {
        if (!isReadOnly) {
            if (product.quantity > 1) {
                // productId is actually the item.id from the cart
                updateCartItem(product.productId, product.quantity - 1);
            } else {
                // If quantity is 1 and user clicks -, remove the item
                const confirmRemove = window.confirm(`¿Eliminar ${product.productName} del carrito?`);
                if (confirmRemove) {
                    // productId is actually the item.id from the cart
                    removeCartItem(product.productId);
                }
            }
        }
    };

    const taxPercentage = (product.taxRate * 100).toFixed(0);

    return (
        <div className="product-card">
            <div className="product-image">
                {product.productImageUrl ? (
                    <img src={product.productImageUrl} alt={product.productName} />
                ) : (
                    <span className="product-emoji">{getProductEmoji(product.productName)}</span>
                )}
            </div>

            <div className="product-name" title={product.productName}>
                {product.productName}
            </div>

            {/* US-008: Interactive Quantity Controls when in edit mode */}
            {isReadOnly ? (
                <div className="product-quantity">
                    Cantidad: <span className="qty-badge">{product.quantity}</span>
                </div>
            ) : (
                <div className="quantity-controls">
                    <button
                        className="quantity-btn"
                        onClick={handleDecrement}
                        aria-label="Disminuir cantidad"
                        title="Disminuir cantidad"
                    >
                        −
                    </button>
                    <div className="quantity-display">{product.quantity}</div>
                    <button
                        className="quantity-btn"
                        onClick={handleIncrement}
                        aria-label="Aumentar cantidad"
                        title="Aumentar cantidad"
                    >
                        +
                    </button>
                </div>
            )}

            <div className="product-price-row">
                <span>Precio unit.</span>
                <span>{formatCurrency(product.unitPrice)}</span>
            </div>

            <div className="product-tax">
                {product.taxAmount > 0 ? (
                    <>IVA ({taxPercentage}%): {formatCurrency(product.taxAmount)}</>
                ) : (
                    <>Sin impuesto</>
                )}
            </div>

            <div className="product-total">
                {formatCurrency(product.totalAmount)}
            </div>
        </div>
    );
};
