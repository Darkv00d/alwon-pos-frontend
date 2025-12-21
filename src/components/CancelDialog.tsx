import './CancelDialog.css';

interface CancelDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

function CancelDialog({ isOpen, onClose, onConfirm }: CancelDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="dialog-overlay" onClick={onClose}>
            <div className="dialog-content cancel-dialog" onClick={(e) => e.stopPropagation()}>
                <h2 className="dialog-title">⚠️ Cancelar Transacción</h2>
                <p className="dialog-message">
                    ¿Está seguro que desea cancelar esta transacción?
                </p>

                <div className="warning-box">
                    <strong>Importante:</strong>
                    <p>Los productos en su carrito serán devueltos al inventario.</p>
                    <p className="highlight">Por favor coloque los productos en la <strong>MESA DE DEVOLUCIONES</strong> o entréguelos al staff de la tienda.</p>
                </div>

                <div className="dialog-actions">
                    <button className="btn btn-cancel" onClick={onClose}>
                        No, Continuar Comprando
                    </button>
                    <button className="btn btn-danger" onClick={onConfirm}>
                        Sí, Cancelar Transacción
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CancelDialog;
