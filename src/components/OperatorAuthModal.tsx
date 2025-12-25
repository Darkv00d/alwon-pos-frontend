import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import axios from 'axios';

interface OperatorAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const OperatorAuthModal: React.FC<OperatorAuthModalProps> = ({ isOpen, onClose }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const login = useAuthStore(state => state.login);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post('http://localhost:8088/api/auth/login', {
                username,
                password
            });

            if (response.data.success) {
                login(response.data.token, response.data.operator);
                setUsername('');
                setPassword('');
                onClose();
            } else {
                setError('Credenciales inválidas');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al iniciar sesión. Verifica que Auth Service esté corriendo.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setUsername('');
        setPassword('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl border-4 border-purple-500 animate-fadeIn">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-4xl">🔐</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Autenticación de Operador</h2>
                    <p className="text-gray-600 dark:text-gray-400">Ingresa tus credenciales para continuar</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Username */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                            👤 Usuario
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none text-lg dark:bg-gray-800 dark:border-gray-600"
                            placeholder="Ingresa tu usuario"
                            required
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                            🔑 Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none text-lg dark:bg-gray-800 dark:border-gray-600"
                            placeholder="Ingresa tu contraseña"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-shake">
                            <span className="text-2xl">⚠️</span>
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-6 py-3 rounded-lg border-2 border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold transition-all text-lg"
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading ? '🔄 Verificando...' : '✓ Ingresar'}
                        </button>
                    </div>
                </form>

                {/* Hint */}
                <div className="mt-6 text-center text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                    <p className="font-semibold mb-1">💡 Credenciales de prueba:</p>
                    <p>👨‍💼 Usuario: <strong className="text-purple-600">admin</strong></p>
                    <p>🔑 Contraseña: <strong className="text-purple-600">admin123</strong></p>
                </div>
            </div>
        </div>
    );
};
