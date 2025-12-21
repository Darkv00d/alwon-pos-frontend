import { useState } from 'react';
import './StaffPinDialog.css';

interface StaffPinDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (pin: string) => void;
}

function StaffPinDialog({ isOpen, onClose, onSubmit }: StaffPinDialogProps) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length < 4) {
            setError('El PIN debe tener al menos 4 dígitos');
            return;
        }
        onSubmit(pin);
        setPin('');
        setError('');
    };

    const handleClose = () => {
        setPin('');
        setError('');
        onClose();
    };

    return (
        <div className="dialog-overlay" onClick={handleClose}>
            <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="dialog-title">Autenticación de Personal</h2>
                <p className="dialog-subtitle">Ingrese el PIN de staff para continuar</p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        className="pin-input"
                        placeholder="Ingrese PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        autoFocus
                        maxLength={6}
                    />

                    {error && <div className="error-message">{error}</div>}

                    <div className="dialog-actions">
                        <button type="button" className="btn btn-cancel" onClick={handleClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-confirm">
                            Confirmar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default StaffPinDialog;
