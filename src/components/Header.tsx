import React, { useState } from 'react';
import { OperatorAuthModal } from './OperatorAuthModal';

interface HeaderProps {
    operatorName?: string;
}

export const Header: React.FC<HeaderProps> = ({ operatorName: initialOperatorName = 'Operador' }) => {
    const [currentTime, setCurrentTime] = React.useState(new Date());
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [operatorName, setOperatorName] = useState(initialOperatorName);

    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    };

    const handleOperatorClick = () => {
        if (!isAuthenticated) {
            setIsAuthModalOpen(true);
        }
    };

    const handleAuthenticated = (username: string) => {
        setIsAuthenticated(true);
        setOperatorName(username);
        setIsAuthModalOpen(false);
    };

    const handleCashClosure = () => {
        // TODO: Implement cash closure logic when backend is ready
        alert('🔄 Función de Cierre de Caja\n\nEsta funcionalidad se implementará próximamente con el backend.');
    };

    return (
        <>
            <div className="card mb-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold"
                            style={{ background: 'var(--alwon-cyan)' }}
                        >
                            Ao
                        </div>
                        <span className="text-xl font-bold">ALWON POS</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted">
                        <span>🕐 {formatTime(currentTime)}</span>

                        {isAuthenticated && (
                            <button
                                onClick={handleCashClosure}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-all hover:shadow-lg"
                                title="Cierre de Caja"
                            >
                                💰 Cierre Caja
                            </button>
                        )}

                        <button
                            onClick={handleOperatorClick}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${isAuthenticated
                                    ? 'bg-blue-600 text-white'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            title={isAuthenticated ? 'Operador autenticado' : 'Click para autenticar'}
                        >
                            👤 {operatorName}
                        </button>
                    </div>
                </div>
            </div>

            <OperatorAuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onAuthenticated={handleAuthenticated}
            />
        </>
    );
};
