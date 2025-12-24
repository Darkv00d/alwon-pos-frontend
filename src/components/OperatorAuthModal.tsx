import React, { useState } from 'react';
import './OperatorAuthModal.css';

interface OperatorAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAuthenticated: (username: string) => void;
}

export const OperatorAuthModal: React.FC<OperatorAuthModalProps> = ({
    isOpen,
    onClose,
    onAuthenticated
}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Mock credentials for prototype
    const MOCK_CREDENTIALS = {
        username: 'admin',
        password: 'admin123'
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate empty fields
        if (!username.trim() || !password.trim()) {
            setError('Por favor ingrese usuario y contraseña');
            return;
        }

        // Validate credentials
        if (username === MOCK_CREDENTIALS.username && password === MOCK_CREDENTIALS.password) {
            // Success
            onAuthenticated(username);
            handleClose();
        } else {
            // Error
            setError('Usuario o contraseña incorrectos');
            setPassword(''); // Clear password
        }
    };

    const handleClose = () => {
        setUsername('');
        setPassword('');
        setError('');
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="operator-auth-overlay" onClick={handleClose} onKeyDown={handleKeyDown}>
            <div className="operator-auth-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Autenticación de Operador</h2>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username">Usuario:</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="form-input"
                            autoFocus
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-input"
                            autoComplete="current-password"
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="button-group">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="btn btn-secondary"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            Aceptar
                        </button>
                    </div>
                </form>

                <div className="hint-text">
                    <small>💡 Credenciales de demo: admin / admin123</small>
                </div>
            </div>
        </div>
    );
};
