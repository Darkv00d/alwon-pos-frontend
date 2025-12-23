import React from 'react';

interface HeaderProps {
    operatorName?: string;
}

export const Header: React.FC<HeaderProps> = ({ operatorName = 'Operador' }) => {
    const [currentTime, setCurrentTime] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    };

    return (
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
                <div className="flex gap-8 text-sm text-muted">
                    <span>🕐 {formatTime(currentTime)}</span>
                    <span>👤 {operatorName}</span>
                </div>
            </div>
        </div>
    );
};
