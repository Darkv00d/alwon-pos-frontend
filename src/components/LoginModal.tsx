import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import authApi from '../api/authApi';
import './LoginModal.css';

export const LoginModal: React.FC = () => {
    const {
        showLoginModal,
        setShowLoginModal,
        setShowPinDisplayModal,
        setOperator,
        setToken,
        setPinActive,
        setPinExpiresAt,
        setLastPinGenerated,
        setLastNotifications,
        setLoading,
        setError,
        isLoading,
        error
    } = useAuthStore();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleClose = () => {
        setShowLoginModal(false);
        setUsername('');
        setPassword('');
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            setError('Por favor ingresa usuario y contraseña');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await authApi.login({ username, password });

            if (response.success) {
                // Map backend operator fields to frontend format
                const operatorData = {
                    id: response.operator.id,
                    username: response.operator.username,
                    fullName: response.operator.name, // Backend sends 'name', frontend expects 'fullName'
                    email: response.operator.email,
                    phone: response.operator.phone,
                    role: response.operator.role
                };

                // Save operator data
                setOperator(operatorData);
                setToken(response.token);
                setPinActive(true);
                setPinExpiresAt(response.pinExpiresAt);

                // Save PIN (only time it's shown)
                setLastPinGenerated(response.pin);
                setLastNotifications(response.notifications);

                // Close login modal
                setShowLoginModal(false);

                // Show PIN display modal
                setShowPinDisplayModal(true);

                // Clear form
                setUsername('');
                setPassword('');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(
                err.response?.data?.message ||
                'Error al iniciar sesión. Por favor verifica tus credenciales.'
            );
        } finally {
            setLoading(false);
        }
    };

    if (!showLoginModal) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-icon">🔐</div>
                    <h2>Autenticación de Operador</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Usuario</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="usuario.apellido"
                            disabled={isLoading}
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            ❌ {error}
                        </div>
                    )}

                    <div className="button-group">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
