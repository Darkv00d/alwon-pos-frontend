import { useState, useEffect } from 'react';
import './KioskPOS.css';
import './KioskPOS-modes.css';
import './KioskPOS-receipt.css';
import StaffPinDialog from './StaffPinDialog';
import CartModificationDialog from './CartModificationDialog';
import CancelDialog from './CancelDialog';
import ReceiptDialog from './ReceiptDialog';
import { kioskApi, type CustomerSessionResponse } from '../services/kioskApi';
import type { IdentificationMode } from './ModeSelector';

interface Customer {
    name: string;
    tower: string;
    apartment: string;
    photoUrl: string | null;
    email: string;
    phone: string;
}

interface CartItem {
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    imageUrl: string;
}

interface Promotion {
    id: number;
    title: string;
    description: string;
    color: string;
}

interface KioskPOSProps {
    identificationMode: IdentificationMode;
}

function KioskPOS({ identificationMode }: KioskPOSProps) {
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Initialize customer based on mode
    const getInitialCustomer = (): Customer => {
        switch (identificationMode) {
            case 'facial':
                return {
                    name: 'Juan Pérez',
                    tower: 'Torre A',
                    apartment: '501',
                    photoUrl: 'https://i.pravatar.cc/300?img=12',
                    email: 'juan.perez@email.com',
                    phone: '+57 300 123 4567'
                };
            case 'pin':
                return {
                    name: 'María González',
                    tower: 'Torre B',
                    apartment: '304',
                    photoUrl: null,
                    email: 'maria.gonzalez@email.com',
                    phone: '+57 301 987 6543'
                };
            case 'unidentified':
                return {
                    name: 'Cliente No Identificado',
                    tower: 'N/A',
                    apartment: 'N/A',
                    photoUrl: null,
                    email: 'N/A',
                    phone: 'N/A'
                };
        }
    };

    const [customer, setCustomer] = useState<Customer>(getInitialCustomer());

    const [cartItems, setCartItems] = useState<CartItem[]>([
        {
            productId: 1,
            productName: 'Leche Entera Alquería 1L',
            quantity: 2,
            unitPrice: 4500,
            imageUrl: 'https://placehold.co/100x100/00BFFF/FFF?text=Leche'
        },
        {
            productId: 2,
            productName: 'Pan Integral Bimbo',
            quantity: 1,
            unitPrice: 3200,
            imageUrl: 'https://placehold.co/100x100/00BFFF/FFF?text=Pan'
        },
        {
            productId: 3,
            productName: 'Arroz Premium 500g',
            quantity: 1,
            unitPrice: 5500,
            imageUrl: 'https://placehold.co/100x100/00BFFF/FFF?text=Arroz'
        }
    ]);

    const [promotions] = useState<Promotion[]>([
        {
            id: 1,
            title: '2x1 en Lácteos',
            description: 'Lleva 2 productos lácteos y paga solo 1',
            color: '#FF6B6B'
        },
        {
            id: 2,
            title: '20% OFF en Granos',
            description: 'Descuento especial en arroz y legumbres',
            color: '#4ECDC4'
        }
    ]);

    const [showPinDialog, setShowPinDialog] = useState(false);
    const [showModificationDialog, setShowModificationDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showReceiptDialog, setShowReceiptDialog] = useState(false);
    const [pendingPaymentResponse, setPendingPaymentResponse] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Simulate creating session on component mount
    useEffect(() => {
        createSession();
    }, []);

    const createSession = async () => {
        try {
            setLoading(true);
            const response = await kioskApi.createSession({
                customerId: 'CUST001',
                biometricData: {
                    faceId: 'face_abc123',
                    confidence: 98.5,
                    timestamp: new Date().toISOString()
                },
                customerInfo: {
                    name: customer.name,
                    photo: customer.photoUrl || '',
                    tower: customer.tower,
                    apartment: customer.apartment
                },
                cart: cartItems.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    imageUrl: item.imageUrl
                }))
            });

            setSessionId(response.sessionId);
            updateFromResponse(response);
            setError(null);
        } catch (err) {
            console.error('Failed to create session:', err);
            setError('No se pudo conectar con el servidor. Usando modo offline.');
        } finally {
            setLoading(false);
        }
    };

    const updateFromResponse = (response: CustomerSessionResponse) => {
        setCustomer({
            name: response.customer.name,
            tower: response.customer.tower,
            apartment: response.customer.apartment,
            photoUrl: response.customer.photoUrl,
            email: customer.email,
            phone: customer.phone
        });

        setCartItems(response.cart.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            imageUrl: item.imageUrl
        })));
    };

    const handleStaffModify = () => {
        setShowPinDialog(true);
    };

    const handlePinSubmit = async (pin: string) => {
        setShowPinDialog(false);

        // Verify PIN (in production, this would be validated by backend)
        if (pin === '1234') {
            setShowModificationDialog(true);
        } else {
            alert('PIN incorrecto');
        }
    };

    const handleCartModification = (modifiedItems: CartItem[]) => {
        // Simply update the local cart state with the modified items
        setCartItems(modifiedItems);
        setShowModificationDialog(false);

        // If we have a backend session, optionally sync with backend
        if (sessionId) {
            // TODO: Sync with backend if needed
            console.log('Cart modified by staff:', modifiedItems);
        }
    };

    const handlePayment = async () => {
        if (!sessionId) {
            alert('No hay sesión activa');
            return;
        }

        try {
            setLoading(true);
            const response = await kioskApi.processPayment(sessionId, {
                paymentMethod: 'PSE',
                amount: calculateTotal()
            });

            // Store response and show receipt dialog
            setPendingPaymentResponse(response);
            setShowReceiptDialog(true);
        } catch (err: any) {
            console.error('Failed to process payment:', err);
            alert(err.message || 'Error al procesar el pago');
        } finally {
            setLoading(false);
        }
    };

    const handleReceiptSend = async (method: 'email' | 'phone') => {
        const receiptDest = method === 'email'
            ? `su correo: ${customer.email}`
            : `su celular: ${customer.phone}`;

        setShowReceiptDialog(false);
        alert(`✅ Pago completado exitosamente!\n\nID: ${pendingPaymentResponse.transactionId}\nLa factura será enviada a ${receiptDest}`);

        // Reset cart after successful payment
        setCartItems([]);
        setPendingPaymentResponse(null);
    };

    const handleCancelTransaction = async () => {
        setShowCancelDialog(true);
    };

    const confirmCancelTransaction = async () => {
        if (!sessionId) {
            // Clear cart without backend call
            setCartItems([]);
            setShowCancelDialog(false);
            alert('Carrito vaciado. Por favor coloque los productos en la MESA DE DEVOLUCIONES o entréguelos al staff de la tienda.');
            return;
        }

        try {
            setLoading(true);
            // Send cancellation to backend to return items to inventory
            await fetch(`http://localhost:8080/api/kiosk/session/${sessionId}/cancel`, {
                method: 'DELETE',
            });

            setCartItems([]);
            setShowCancelDialog(false);
            alert('Transacción cancelada. Los productos han sido devueltos al inventario.\n\nPor favor coloque los productos en la MESA DE DEVOLUCIONES o entréguelos al staff de la tienda.');
        } catch (err: any) {
            console.error('Failed to cancel transaction:', err);
            alert('Error al cancelar la transacción');
        } finally {
            setLoading(false);
        }
    };

    const calculateSubtotal = () => {
        return cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    };

    const calculateTax = () => {
        return calculateSubtotal() * 0.19;
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="kiosk-container">
            {/* Header */}
            <header className="kiosk-header">
                <div className="logo">
                    <div className="logo-icon">A</div>
                    <span className="logo-text">Alwon</span>
                </div>
                <h1 className="kiosk-title">Tienda Autónoma</h1>
                <div className="header-right">
                    {loading && <div className="loading-indicator">Procesando...</div>}
                    <button
                        className="btn-staff-access"
                        onClick={handleStaffModify}
                        disabled={loading}
                        title="Acceso Staff"
                    >
                        🔧 Staff
                    </button>
                </div>
            </header>

            {error && (
                <div className="error-banner">
                    {error}
                </div>
            )}

            {/* Main Content */}
            <div className="kiosk-content">
                {/* Left Panel - Customer Info */}
                <div className="customer-panel">
                    <h2 className="panel-title">Cliente</h2>
                    <div className="customer-card">
                        {/* Customer Photo or Icon */}
                        <div className="customer-photo">
                            {customer.photoUrl ? (
                                <img src={customer.photoUrl} alt={customer.name} />
                            ) : (
                                <div className={`customer-icon ${identificationMode}-icon`}>
                                    {identificationMode === 'pin' ? (
                                        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    ) : (
                                        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                            <circle cx="12" cy="9" r="2" />
                                        </svg>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Mode Badge */}
                        {identificationMode !== 'facial' && (
                            <div className={`mode-indicator ${identificationMode}`}>
                                {identificationMode === 'pin' ? 'Acceso con PIN' : 'No Identificado'}
                            </div>
                        )}

                        <div className="customer-info">
                            <h3 className="customer-name">{customer.name}</h3>
                            <div className="customer-details custom">
                                <div className="detail-item">
                                    <span className="detail-label">Torre:</span>
                                    <span className="detail-value">{customer.tower}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Apartamento:</span>
                                    <span className="detail-value">{customer.apartment}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">📧 Email:</span>
                                    <span className="detail-value small">{customer.email}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">📱 Celular:</span>
                                    <span className="detail-value">{customer.phone}</span>
                                </div>
                            </div>

                            {/* Promotional Banners */}
                            <div className="promotions-section">
                                <h4 className="promotions-title">Promociones del Día</h4>
                                {promotions.map(promo => (
                                    <div
                                        key={promo.id}
                                        className="promo-banner"
                                        style={{ borderLeftColor: promo.color }}
                                    >
                                        <div className="promo-header" style={{ color: promo.color }}>
                                            {promo.title}
                                        </div>
                                        <div className="promo-description">
                                            {promo.description}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Shopping Cart */}
                <div className="cart-panel">
                    <h2 className="panel-title">Carrito de Compras</h2>

                    <div className="cart-items">
                        {cartItems.map((item) => (
                            <div key={item.productId} className="cart-item">
                                <img
                                    src={item.imageUrl}
                                    alt={item.productName}
                                    className="item-image"
                                />
                                <div className="item-details">
                                    <h4 className="item-name">{item.productName}</h4>
                                    <div className="item-quantity">Cantidad: {item.quantity}</div>
                                </div>
                                <div className="item-price">
                                    {formatCurrency(item.unitPrice * item.quantity)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="cart-totals">
                        <div className="total-row">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(calculateSubtotal())}</span>
                        </div>
                        <div className="total-row">
                            <span>IVA (19%):</span>
                            <span>{formatCurrency(calculateTax())}</span>
                        </div>
                        <div className="total-row total-final">
                            <span>TOTAL:</span>
                            <span>{formatCurrency(calculateTotal())}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="cart-actions">
                        <button
                            className="btn btn-danger"
                            onClick={handleCancelTransaction}
                            disabled={loading || cartItems.length === 0}
                        >
                            ❌ Cancelar Transacción
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handlePayment}
                            disabled={loading || cartItems.length === 0}
                        >
                            Proceder a Pago
                        </button>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <StaffPinDialog
                isOpen={showPinDialog}
                onClose={() => setShowPinDialog(false)}
                onSubmit={handlePinSubmit}
            />

            <CartModificationDialog
                isOpen={showModificationDialog}
                cartItems={cartItems}
                onClose={() => setShowModificationDialog(false)}
                onModify={handleCartModification}
            />

            <CancelDialog
                isOpen={showCancelDialog}
                onClose={() => setShowCancelDialog(false)}
                onConfirm={confirmCancelTransaction}
            />

            <ReceiptDialog
                isOpen={showReceiptDialog}
                customerEmail={customer.email}
                customerPhone={customer.phone}
                onSend={handleReceiptSend}
            />
        </div>
    );
}

export default KioskPOS;
