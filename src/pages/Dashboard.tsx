import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { sessionApi, cartApi } from '@/services/api';
import { SessionCard } from '@/components/SessionCard';
import { Header } from '@/components/Header';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { sessions, setSessions, setSelectedSession, operator, setOperator } = useAppStore();
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            setIsLoading(true);

            try {
                // Try to fetch from backend first
                const activeSessions = await sessionApi.getActiveSessions();

                // Fetch cart for each session to get totals and items
                const sessionsWithDetails = await Promise.all(
                    activeSessions.map(async (session) => {
                        try {
                            const cart = await cartApi.getCart(session.sessionId);
                            return {
                                ...session,
                                itemCount: cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
                                totalAmount: cart.totalAmount || 0,
                                cartItems: cart.items?.slice(0, 3).map(item => ({
                                    productName: item.productName,
                                    productImage: item.productImage || '🛒',
                                    quantity: item.quantity
                                }))
                            };
                        } catch (err) {
                            console.warn(`Could not load cart for session ${session.sessionId}`, err);
                            return { ...session, itemCount: 0, totalAmount: 0 };
                        }
                    })
                );

                setSessions(sessionsWithDetails);

                // Also try to load operator from localStorage or backend if available
                const storedOp = localStorage.getItem('operator');
                if (storedOp) {
                    setOperator(JSON.parse(storedOp));
                } else {
                    const { mockOperator } = await import('@/data/mockData');
                    setOperator(mockOperator);
                }

            } catch (error) {
                console.warn('Backend unavailable, falling back to mock data:', error);

                // Fallback to mock data
                const { mockSessions, mockOperator } = await import('@/data/mockData');
                setSessions(mockSessions);
                setOperator(mockOperator);
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
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
                <Header />
                <div className="flex items-center justify-center h-96">
                    <div className="text-xl text-muted">Cargando sesiones...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <Header />

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
                        cartItems={session.cartItems}
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
