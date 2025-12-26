import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { sessionApi, cartApi } from '@/services/api';
import { SessionCard } from '@/components/SessionCard';
import { Header } from '@/components/Header';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { sessions, setSessions, setSelectedSession, operator } = useAppStore();
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            setIsLoading(true);

            // TEMPORARY: Skip API and use mock data directly
            const { mockSessions } = await import('@/data/mockData');
            setSessions(mockSessions);

            /* Commented for performance - Restore when backend is ready
            const activeSessions = await sessionApi.getActiveSessions();
            const sessionsWithCarts = await Promise.all(
                activeSessions.map(async (session) => {
                    try {
                        const cart = await cartApi.getCart(session.sessionId);
                        return {
                            ...session,
                            itemCount: cart.itemsCount || 0,
                            totalAmount: cart.totalAmount || 0
                        };
                    } catch (error) {
                        console.warn(`No cart for session ${session.sessionId}:`, error);
                        return {
                            ...session,
                            itemCount: 0,
                            totalAmount: 0
                        };
                    }
                })
            );
            setSessions(sessionsWithCarts);
            */
        } catch (error) {
            console.error('Error loading mock data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSessionClick = (session: any) => {
        setSelectedSession(session);
        navigate(`/cart/${session.sessionId}`);
    };

    if (isLoading) {
        return (
            <div className="container">
                <Header operatorName={operator?.name} />
                <div className="flex items-center justify-center h-96">
                    <div className="text-xl text-muted">Cargando sesiones...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <Header operatorName={operator?.name} />

            <div className="grid grid-cols-2 gap-6 mb-6">
                {sessions.map((session) => (
                    <SessionCard
                        key={session.sessionId}
                        sessionId={session.sessionId}
                        clientType={session.clientType}
                        customerName={session.customerName}
                        pinCode={session.pinCode}
                        customerPhotoUrl={session.customerPhotoUrl}
                        tower={session.tower}
                        apartment={session.apartment}
                        itemCount={session.itemCount}
                        totalAmount={session.totalAmount}
                        onClick={() => handleSessionClick(session)}
                    />
                ))}
            </div>

            {sessions.length === 0 && (
                <div className="card text-center py-12">
                    <p className="text-xl text-muted">No hay sesiones activas</p>
                </div>
            )}

            <div className="card">
                <div className="flex justify-between items-center text-sm text-muted">
                    <span>{sessions.length} sesiones activas</span>
                    <span>Actualizado: ahora</span>
                </div>
            </div>
        </div>
    );
};
