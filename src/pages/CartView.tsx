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

    if (isLoading || !selectedSession || !currentCart) {
        return (
            <div className="container">
                <Header operatorName={operator?.name} />
                <div className="flex items-center justify-center h-96">
                    <div className="text-xl text-muted">Cargando carrito...</div>
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

            {/* Customer Info */}
            <div className={`card ${getBorderClass()} mb-6`}>
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-3xl font-semibold overflow-hidden">
                        {selectedSession.clientType === ClientType.PIN ? (
                            '🔑'
                        ) : selectedSession.customerPhotoUrl ? (
                            <img src={selectedSession.customerPhotoUrl} alt="Cliente" className="w-full h-full object-cover" />
                        ) : (
                            selectedSession.customerName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-1">
                            {selectedSession.clientType === ClientType.FACIAL
                                ? selectedSession.customerName
                                : selectedSession.clientType === ClientType.PIN
                                    ? `PIN-${selectedSession.pinCode}`
                                    : 'No Identificado'}
                        </h3>
                        <p className="text-muted mb-2">
                            Session: {selectedSession.sessionId} · {currentCart.items.length} productos
                        </p>
                        {selectedSession.tower && selectedSession.apartment && (
                            <div className="flex gap-6 text-sm">
                                <div>
                                    <strong className="text-muted">Torre:</strong> {selectedSession.tower}
                                </div>
                                <div>
                                    <strong className="text-muted">Apto:</strong> {selectedSession.apartment}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Product List */}
            <div className="flex flex-col gap-4 mb-6">
                {currentCart.items.map((item: CartItem) => (
                    <div key={item.id} className="card">
                        <div className="flex justify-between items-center flex-wrap gap-4">
                            <div className="flex gap-4 items-center flex-1">
                                <div
                                    className="w-20 h-20 rounded-lg bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center text-5xl"
                                >
                                    {item.productImage}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold mb-1">{item.productName}</h4>
                                    <p className="text-sm text-muted mb-2">{item.productDescription}</p>
                                    {item.detectedByAI && (
                                        <span
                                            className="inline-block text-xs font-semibold px-2 py-1 rounded"
                                            style={{ background: 'var(--alwon-cyan-light)', color: 'var(--alwon-cyan-dark)' }}
                                        >
                                            🤖 Detectado por IA
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Quantity Display/Controls */}
                            {!isEditMode ? (
                                <div className="btn btn-muted">
                                    <span className="text-sm text-muted">Cantidad:</span>
                                    <span className="text-lg font-bold">{item.quantity}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <button
                                        className="w-9 h-9 rounded-full border-2 border-error text-error flex items-center justify-center hover:bg-red-50"
                                        onClick={() => handleRemoveItem(item.id)}
                                    >
                                        🗑
                                    </button>
                                    <button
                                        className="w-9 h-9 rounded-full border-2 border-border flex items-center justify-center hover:border-primary hover:text-primary"
                                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                    >
                                        −
                                    </button>
                                    <span className="text-lg font-semibold min-w-[40px] text-center">{item.quantity}</span>
                                    <button
                                        className="w-9 h-9 rounded-full border-2 border-border flex items-center justify-center hover:border-primary hover:text-primary"
                                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                    >
                                        +
                                    </button>
                                </div>
                            )}

                            {/* Price */}
                            <div className="text-right">
                                <div className="text-sm text-muted">
                                    ${item.unitPrice.toLocaleString('es-CO')} × {item.quantity}
                                </div>
                                <div className="text-xl font-bold">${item.totalPrice.toLocaleString('es-CO')}</div>
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

            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                    <button className="btn btn-muted flex-1" onClick={handleSuspend}>
                        SUSPENDER
                    </button>
                    <button className="btn btn-error flex-1" onClick={handleCancel}>
                        CANCELAR
                    </button>
                </div>
                <button className="btn btn-success btn-xl w-full" onClick={handleContinueToPayment}>
                    <span>CONTINUAR AL PAGO</span>
                    <span>▶</span>
                </button>
            </div>
        </div>
    );
};
