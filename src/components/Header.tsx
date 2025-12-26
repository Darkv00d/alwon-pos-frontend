import React from 'react';
import { OperatorButton } from './OperatorButton';
import { LoginModal } from './LoginModal';
import { PinDisplayModal } from './PinDisplayModal';
import { PinKeypad } from './PinKeypad';
import { AdminMenuModal } from './AdminMenuModal';
import { useAuthStore } from '../store/useAuthStore';

export const Header: React.FC = () => {
    const [currentTime, setCurrentTime] = React.useState(new Date());
    const { showLoginModal, showPinDisplayModal, showPinKeypadModal, showAdminMenuModal } = useAuthStore();

    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
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

                        {/* Operator Button - Opens authentication flow */}
                        <OperatorButton />
                    </div>
                </div>
            </div>

            {/* Conditional rendering - Only render modals when they're active */}
            {showLoginModal && <LoginModal />}
            {showPinDisplayModal && <PinDisplayModal />}
            {showPinKeypadModal && <PinKeypad />}
            {showAdminMenuModal && <AdminMenuModal />}
        </>
    );
};
