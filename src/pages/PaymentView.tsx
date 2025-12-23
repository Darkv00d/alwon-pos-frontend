import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { paymentApi } from '@/services/api';
import { PaymentMethod, ClientType } from '@/types';
import { Header } from '@/components/Header';

export const PaymentView: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const { selectedSession, currentCart, operator } = useAppStore();

    const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethod | null>(null);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [paymentUrl, setPaymentUrl] = React.useState<string | null>(null);

    const handlePayment = async () => {
        if (!selectedMethod || !sessionId || !currentCart) return;

        setIsProcessing(true);
        try {
            const transaction = await paymentApi.initiatePayment(
                sessionId,
                selectedMethod,
                currentCart.totalAmount
            );

            if (transaction.paymentUrl) {
                setPaymentUrl(transaction.paymentUrl);
                // Abrir URL de pago en nueva ventana
                window.open(transaction.paymentUrl, '_blank');
            }

            // Simular espera de confirmación
            setTimeout(() => {
                alert('Pago procesado exitosamente');

                // Si es cliente PIN, eliminar datos
                if (selectedSession?.clientType === ClientType.PIN) {
                    console.log('Eliminando datos de cliente PIN...');
                }

                navigate('/');
            }, 3000);
        } catch (error) {
            console.error('Error processing payment:', error);
            alert('Error al procesar el pago');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!selectedSession || !currentCart) {
        return (
            <div className="container">
                <Header operatorName={operator?.name} />
                <div className="flex items-center justify-center h-96">
                    <div className="text-xl text-muted">Cargando...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <Header operatorName={operator?.name} />

            {/* Back Button */}
            <div className="card mb-6">
                <button className="btn btn-muted" onClick={() => navigate(`/cart/${sessionId}`)}>
                    ← Volver al Carrito
                </button>
            </div>

            {/* Customer Summary */}
            <div className="card mb-6">
                <h2 className="text-2xl font-bold mb-4">Resumen de Compra</h2>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-lg">
                        {selectedSession.clientType === ClientType.FACIAL
                            ? selectedSession.customerName
                            : selectedSession.clientType === ClientType.PIN
                                ? `PIN-${selectedSession.pinCode}`
                                : 'No Identificado'}
                    </span>
                    <span className="text-muted">{currentCart.items.length} productos</span>
                </div>

                <div className="border-t border-border pt-4">
                    <div className="flex justify-between mb-2">
                        <span>Subtotal:</span>
                        <span>${currentCart.subtotal.toLocaleString('es-CO')}</span>
                    </div>
                    {currentCart.discountAmount > 0 && (
                        <div className="flex justify-between mb-2 text-success">
                            <span>Descuento:</span>
                            <span>-${currentCart.discountAmount.toLocaleString('es-CO')}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-2xl font-bold mt-4 pt-4 border-t border-border">
                        <span>TOTAL:</span>
                        <span>${currentCart.totalAmount.toLocaleString('es-CO')}</span>
                    </div>
                </div>
            </div>

            {/* Payment Methods */}
            <div className="card mb-6">
                <h3 className="text-xl font-semibold mb-4">Seleccione Método de Pago</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PSE */}
                    <button
                        className={`card card-bordered p-6 text-left transition-all hover:shadow-lg ${selectedMethod === PaymentMethod.PSE ? 'border-primary' : ''
                            }`}
                        style={{
                            borderWidth: selectedMethod === PaymentMethod.PSE ? '3px' : '1px',
                            borderColor: selectedMethod === PaymentMethod.PSE ? 'var(--primary)' : undefined
                        }}
                        onClick={() => setSelectedMethod(PaymentMethod.PSE)}
                    >
                        <div className="text-4xl mb-3">🏦</div>
                        <h4 className="font-semibold text-lg mb-2">PSE</h4>
                        <p className="text-sm text-muted">Pago Seguro en Línea</p>
                        <p className="text-xs text-muted mt-2">Transferencia bancaria inmediata</p>
                    </button>

                    {/* Débito */}
                    <button
                        className={`card card-bordered p-6 text-left transition-all hover:shadow-lg ${selectedMethod === PaymentMethod.DEBIT ? 'border-primary' : ''
                            }`}
                        style={{
                            borderWidth: selectedMethod === PaymentMethod.DEBIT ? '3px' : '1px',
                            borderColor: selectedMethod === PaymentMethod.DEBIT ? 'var(--primary)' : undefined
                        }}
                        onClick={() => setSelectedMethod(PaymentMethod.DEBIT)}
                    >
                        <div className="text-4xl mb-3">💳</div>
                        <h4 className="font-semibold text-lg mb-2">Tarjeta Débito</h4>
                        <p className="text-sm text-muted">Pago con tarjeta</p>
                        <p className="text-xs text-muted mt-2">Aceptamos todas las franquicias</p>
                    </button>
                </div>
            </div>

            {/* Privacy Notice for PIN clients */}
            {selectedSession.clientType === ClientType.PIN && (
                <div
                    className="card mb-6 text-sm"
                    style={{ background: 'var(--client-pin-light)', borderLeft: '4px solid var(--client-pin)' }}
                >
                    <p className="font-semibold mb-2">🔒 Nota de Privacidad</p>
                    <p className="text-muted">
                        Al completar el pago, sus datos biométricos temporales serán eliminados automáticamente del sistema.
                    </p>
                </div>
            )}

            {/* Payment Button */}
            <button
                className="btn btn-success btn-xl w-full"
                disabled={!selectedMethod || isProcessing}
                onClick={handlePayment}
            >
                {isProcessing ? (
                    <>
                        <span>⏳ Procesando Pago...</span>
                    </>
                ) : (
                    <>
                        <span>PAGAR ${currentCart.totalAmount.toLocaleString('es-CO')}</span>
                        <span>✓</span>
                    </>
                )}
            </button>

            {/* Payment URL for testing */}
            {paymentUrl && (
                <div className="card mt-4 text-xs">
                    <p className="text-muted">URL de pago: {paymentUrl}</p>
                </div>
            )}
        </div>
    );
};
