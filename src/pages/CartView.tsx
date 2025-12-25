import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { cartApi } from '@/services/api';
import { CartItem, ClientType } from '@/types';
import { Header } from '@/components/Header';

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

    React.useEffect(() => {
        if (sessionId) {
            loadCart(sessionId);
        }
    }, [sessionId]);

    const loadCart = async (sessionId: string) => {
        try {
            setIsLoading(true);
            const cart = await cartApi.getCart(sessionId);
            setCurrentCart(cart);
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

    const handleQuantityChange = async (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        updateCartItem(itemId, newQuantity);

        try {
            if (sessionId) {
                await cartApi.updateItemQuantity(sessionId, itemId, newQuantity);
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        const confirm = window.confirm('¿Eliminar este producto?');
        if (!confirm) return;

        removeCartItem(itemId);

        try {
            if (sessionId) {
                await cartApi.removeItem(sessionId, itemId);
            }
        } catch (error) {
            console.error('Error removing item:', error);
        }
    };

    const handleContinueToPayment = () => {
        navigate(`/payment/${sessionId}`);
    };

    const handleSuspend = () => {
        alert('Pago suspendido');
        navigate('/');
    };

    const handleCancel = () => {
        const confirm = window.confirm('¿Cancelar esta compra?');
        if (confirm) {
            navigate('/');
        }
    };

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

    const getBorderClass = () => {
        if (selectedSession.clientType === ClientType.FACIAL) return 'border-facial';
        if (selectedSession.clientType === ClientType.PIN) return 'border-pin';
        return 'border-no-id';
    };

    return (
        <div className="container">
            <Header operatorName={operator?.name} />

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

            {/* US-007: Enhanced Customer Info Header */}
            <div className="card mb-6 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-2 border-purple-300">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-3xl font-semibold shadow-lg">
                            👤
                        </div>
                        <div className="flex-1">
                            <h2 className="text-3xl font-extrabold mb-2 text-gray-800">
                                Cliente No Identificado
                            </h2>
                            <p className="text-base text-gray-600 mb-1">
                                📍 Sin información de ubicación
                            </p>
                            <p className="text-sm text-gray-500">
                                Sesión: {currentCart.sessionId}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="inline-block px-6 py-3 rounded-full bg-red-100 border-2 border-red-400 text-red-700 font-bold text-lg shadow-md">
                            🔴 SIN IDENTIFICAR
                        </span>
                    </div>
                </div>
            </div>

            {/* Product List */}
            <div className="flex flex-col gap-4 mb-6">
                {currentCart.items.map((item: any) => (
                    <div key={item.id} className="card">
                        <div className="flex justify-between items-center flex-wrap gap-4">
                            <div className="flex gap-4 items-center flex-1">
                                <div
                                    className="w-20 h-20 rounded-lg bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center text-5xl"
                                >
                                    🛒
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold mb-1">{item.productName || 'Producto'}</h4>
                                    <p className="text-sm text-muted mb-2">SKU: {item.productSku || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Quantity Display/Controls */}
                            {!isEditMode ? (
                                <div className="btn btn-muted">
                                    <span className="text-sm text-muted">Cantidad:</span>
                                    <span className="text-lg font-bold">{item.quantity}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button
                                        className="w-11 h-11 rounded-full border-2 border-error text-error text-xl flex items-center justify-center hover:bg-red-50 transition-all"
                                        onClick={() => handleRemoveItem(item.id)}
                                        title="Eliminar producto"
                                    >
                                        🗑️
                                    </button>
                                    <div className="flex items-center gap-1 bg-gray-100 rounded-full px-1 py-1">
                                        <button
                                            className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-primary hover:bg-primary hover:text-white transition-all font-bold text-xl"
                                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                        >
                                            −
                                        </button>
                                        <span className="text-xl font-bold min-w-[50px] text-center px-3">{item.quantity}</span>
                                        <button
                                            className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-primary hover:bg-primary hover:text-white transition-all font-bold text-xl"
                                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Price */}
                            <div className="text-right">
                                <div className="text-sm text-muted">
                                    ${(item.unitPrice || 0).toLocaleString('es-CO')} × {item.quantity}
                                </div>
                                <div className="text-xl font-bold">${(item.subtotal || 0).toLocaleString('es-CO')}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Promo Banner */}
            <div
                className="card mb-4 text-center"
                style={{ background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)' }}
            >
                <h3 className="text-2xl font-bold mb-2">🎉 PROMOCIÓN ESPECIAL</h3>
                <p>¡20% de descuento en tu compra!</p>
            </div>

            {/* US-011: Enhanced Visual Summary */}
            <div className="card mb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300 shadow-xl">
                <h3 className="text-2xl font-bold mb-4 text-gray-800">📊 Resumen de Compra</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-lg text-gray-600">🛒 Total de productos:</span>
                        <span className="text-2xl font-bold text-gray-800">{currentCart.items.length} items</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-lg text-gray-600">💵 Subtotal:</span>
                        <span className="text-2xl font-semibold text-gray-700">${currentCart.totalAmount.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex justify-between items-center bg-green-100 rounded-lg px-4 py-3 border-2 border-green-300">
                        <span className="text-lg text-green-700 font-semibold">🎉 Descuento (20%):</span>
                        <span className="text-2xl font-bold text-green-700">-${(currentCart.totalAmount * 0.2).toLocaleString('es-CO')}</span>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 rounded-full my-4"></div>
                    <div className="bg-white rounded-2xl p-6 shadow-lg border-4 border-purple-400">
                        <div className="flex justify-between items-center">
                            <span className="text-3xl font-extrabold text-gray-800">💰 TOTAL A PAGAR:</span>
                            <span className="text-6xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                                ${((currentCart.totalAmount || 0) * 0.8).toLocaleString('es-CO')}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2 text-right">Ahorro: ${(currentCart.totalAmount * 0.2).toLocaleString('es-CO')}</p>
                    </div>
                </div>
            </div>

            {/* US-009: Larger Secondary Buttons + US-010: Super Prominent Payment Button */}
            <div className="flex flex-col gap-5">
                {/* Suspend and Cancel Buttons - Larger */}
                <div className="flex gap-4">
                    <button
                        className="flex items-center justify-center gap-3 px-8 py-4 rounded-xl border-3 border-gray-400 hover:bg-gray-100 hover:border-gray-600 dark:hover:bg-gray-800 transition-all text-xl font-bold flex-1 shadow-md hover:shadow-lg hover:scale-105"
                        onClick={handleSuspend}
                        style={{ minHeight: '60px' }}
                    >
                        <span className="text-3xl">⏸️</span>
                        <span>SUSPENDER</span>
                    </button>
                    <button
                        className="flex items-center justify-center gap-3 px-8 py-4 rounded-xl border-3 border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600 dark:hover:bg-red-900/20 transition-all text-xl font-bold flex-1 shadow-md hover:shadow-lg hover:scale-105"
                        onClick={handleCancel}
                        style={{ minHeight: '60px' }}
                    >
                        <span className="text-3xl">❌</span>
                        <span>CANCELAR</span>
                    </button>
                </div>

                {/* US-010: SUPER PROMINENT Payment Button */}
                <button
                    className="flex items-center justify-center gap-4 w-full px-10 py-6 rounded-2xl text-white text-3xl font-black shadow-2xl hover:shadow-green-500/60 transition-all duration-300 hover:-translate-y-2 hover:scale-105 animate-pulse"
                    onClick={handleContinueToPayment}
                    style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                        minHeight: '85px',
                        boxShadow: '0 20px 60px rgba(16, 185, 129, 0.4)'
                    }}
                >
                    <span className="text-5xl">💳</span>
                    <span className="tracking-wide">CONTINUAR AL PAGO</span>
                    <span className="text-5xl">→</span>
                </button>
            </div>
        </div>
    );
};
