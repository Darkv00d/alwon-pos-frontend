import './ReceiptDialog.css';

interface ReceiptDialogProps {
    isOpen: boolean;
    customerEmail: string;
    customerPhone: string;
    onSend: (method: 'email' | 'phone') => void;
}

function ReceiptDialog({ isOpen, customerEmail, customerPhone, onSend }: ReceiptDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="dialog-overlay">
            <div className="dialog-content receipt-dialog">
                <h2 className="dialog-title">✅ Pago Exitoso</h2>
                <p className="dialog-message">
                    Su transacción ha sido completada exitosamente.
                </p>

                <div className="receipt-question">
                    <h3>¿A dónde desea recibir su factura?</h3>
                </div>

                <div className="receipt-methods">
                    <button
                        className="receipt-method-btn email-btn"
                        onClick={() => onSend('email')}
                    >
                        <div className="method-icon">📧</div>
                        <div className="method-label">Enviar a Email</div>
                        <div className="method-value">{customerEmail}</div>
                    </button>

                    <button
                        className="receipt-method-btn phone-btn"
                        onClick={() => onSend('phone')}
                    >
                        <div className="method-icon">📱</div>
                        <div className="method-label">Enviar a Celular</div>
                        <div className="method-value">{customerPhone}</div>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ReceiptDialog;
