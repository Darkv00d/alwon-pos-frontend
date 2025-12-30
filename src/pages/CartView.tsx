import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { cartApi } from '@/services/api';
import { CartItem, ClientType } from '@/types';
import { Header } from '@/components/Header';
import { CustomerInfo } from '@/components/CustomerInfo';
import { ProductCard } from '@/components/ProductCard';
import { Pagination } from '@/components/Pagination';
import { CartSummary } from '@/components/CartSummary';
import { CartActions } from '@/components/CartActions';
import './CartView.css';

export const CartView: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const {
        selectedSession,
        currentCart,
        setCurrentCart,
        isEditMode,
        setEditMode,
        operator,
        updateCartItem,
        removeCartItem
    } = useAppStore();

    const [isLoading, setIsLoading] = React.useState(true);
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 6;

    React.useEffect(() => {
        if (sessionId) {
            loadCart(sessionId);
        }
    }, [sessionId]);

    const loadCart = async (sessionId: string) => {
        try {
            setIsLoading(true);

            try {
                // Try to load from backend first
                const cart = await cartApi.getCart(sessionId);
                setCurrentCart(cart);
            } catch (error) {
                console.warn('Backend unavailable, falling back to mock cart:', error);

                // Fallback to mock data
                const { mockCart } = await import('@/data/mockData');
                setCurrentCart({ ...mockCart, sessionId });
            }
        } catch (error) {
            console.error('Error loading cart:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleModifyCart = () => {
        if (isEditMode) {
            setEditMode(false);
            alert('Cambios guardados correctamente');
            return;
        }

        const code = prompt('Ingrese código de verificación del operador:');
        if (code === operator?.verificationCode) {
            setEditMode(true);
        } else {
            alert('Código incorrecto');
        }
    };

    const handleContinueToPayment = () => {
        navigate(`/payment/${sessionId}`);
    };

    const handleCancel = () => {
        const confirm = window.confirm('¿Cancelar esta compra?');
        if (confirm) {
            navigate('/');
        }
    };

    // Calculate summary
    const calculateSummary = () => {
        if (!currentCart?.items) {
            return { totalItems: 0, subtotal: 0, taxAmount: 0, totalAmount: 0 };
        }

        const totalItems = currentCart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
        const subtotal = currentCart.items.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0);
        const taxAmount = currentCart.items.reduce((sum: number, item: any) => sum + (item.taxAmount || 0), 0);
        const totalAmount = subtotal + taxAmount;

        return { totalItems, subtotal, taxAmount, totalAmount };
    };

    // Pagination logic
    const getPaginatedItems = () => {
        if (!currentCart?.items) return [];
        const startIndex = (currentPage - 1) * itemsPerPage;
        return currentCart.items.slice(startIndex, startIndex + itemsPerPage);
    };

    const totalPages = currentCart?.items ? Math.ceil(currentCart.items.length / itemsPerPage) : 0;

    if (isLoading || !currentCart) {
        return (
            <div className="container">
                <Header operatorName={operator?.name} />
                <div className="flex items-center justify-center h-96">
                    <div className="text-xl text-muted">Cargando carrito...</div>
                </div>
            </div>
        );
    }

    // If cart exists but has no items, show empty cart
    if (!currentCart.items || currentCart.items.length === 0) {
        return (
            <div className="container">
                <Header operatorName={operator?.name} />
                <div className="card">
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🛒</div>
                        <h2 className="text-2xl font-bold mb-2">Carrito Vacío</h2>
                        <p className="text-muted mb-6">No hay productos en este carrito</p>
                        <button className="btn btn-primary" onClick={() => navigate('/')}>
                            Volver al Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const summary = calculateSummary();
    const paginatedItems = getPaginatedItems();

    return (
        <div className="container">
            <Header />

            {/* Cart Header */}
            <div className="card mb-6">
                <div className="flex justify-between items-center">
                    <button className="btn btn-muted" onClick={() => navigate('/')}>
                        ← Volver
                    </button>
                    <button
                        className="btn"
                        style={{
                            background: isEditMode ? 'var(--success)' : 'var(--alwon-cyan)',
                            color: 'white'
                        }}
                        onClick={handleModifyCart}
                    >
                        {isEditMode ? '✓ Guardar Cambios' : '🔒 Modificar Carrito'}
                    </button>
                </div>
            </div>

            {/* Customer Info */}
            <CustomerInfo
                clientType={selectedSession?.clientType || ClientType.NO_ID}
                customerName={selectedSession?.customerName}
                customerPhotoUrl={selectedSession?.customerPhotoUrl}
                tower={selectedSession?.tower}
                apartment={selectedSession?.apartment}
                sessionId={currentCart.sessionId}
            />

            {/* Main Content: 2 Columns */}
            <div className="cart-view-main">
                {/* Left: Products Section */}
                <div className="products-section">
                    {/* Products Grid (3 columns) */}
                    <div className="products-grid">
                        {paginatedItems.map((item: any) => (
                            <ProductCard
                                key={item.id}
                                product={{
                                    productId: item.id,
                                    productName: item.productName || 'Producto',
                                    productImageUrl: item.productImageUrl,
                                    quantity: item.quantity,
                                    unitPrice: item.unitPrice || 0,
                                    taxRate: 0.19, // 19% IVA
                                    taxAmount: item.taxAmount || (item.unitPrice * item.quantity * 0.19),
                                    totalAmount: item.subtotal || (item.unitPrice * item.quantity) + (item.taxAmount || 0)
                                }}
                                isReadOnly={!isEditMode}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>

                {/* Right: Summary & Actions */}
                <div className="sidebar">
                    {/* Summary */}
                    <CartSummary
                        totalItems={summary.totalItems}
                        subtotal={summary.subtotal}
                        taxAmount={summary.taxAmount}
                        totalAmount={summary.totalAmount}
                    />

                    {/* US-018: Simplified Action Buttons */}
                    <CartActions
                        onPay={handleContinueToPayment}
                        onCancel={handleCancel}
                    />
                </div>
            </div>
        </div>
    );
};
