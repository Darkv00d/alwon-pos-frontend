import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import type { WebSocketEvent } from '@/types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8090/ws';

export const useWebSocket = () => {
    const ws = useRef<WebSocket | null>(null);
    const { addSession, updateSession, removeSession, setCurrentCart } = useAppStore();

    const connect = useCallback(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            ws.current = new WebSocket(WS_URL);

            ws.current.onopen = () => {
                console.log('✅ WebSocket connected');
            };

            ws.current.onmessage = (event) => {
                try {
                    const wsEvent: WebSocketEvent = JSON.parse(event.data);
                    handleWebSocketEvent(wsEvent);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.current.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
            };

            ws.current.onclose = () => {
                console.log('🔌 WebSocket disconnected. Reconnecting in 3s...');
                setTimeout(connect, 3000);
            };
        } catch (error) {
            console.error('Error creating WebSocket:', error);
            setTimeout(connect, 3000);
        }
    }, []);

    const handleWebSocketEvent = (event: WebSocketEvent) => {
        console.log('📨 WebSocket event:', event.type, event.payload);

        switch (event.type) {
            case 'SESSION_CREATED':
                addSession(event.payload);
                break;

            case 'SESSION_CLOSED':
                removeSession(event.payload.sessionId);
                break;

            case 'CART_UPDATED':
                setCurrentCart(event.payload);
                if (event.payload.sessionId) {
                    updateSession(event.payload.sessionId, {
                        itemCount: event.payload.items?.length || 0,
                        totalAmount: event.payload.totalAmount || 0
                    });
                }
                break;

            case 'PAYMENT_COMPLETED':
                removeSession(event.payload.sessionId);
                break;

            default:
                console.warn('Unknown WebSocket event type:', event.type);
        }
    };

    const disconnect = useCallback(() => {
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }
    }, []);

    const sendMessage = useCallback((message: any) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected');
        }
    }, []);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return {
        isConnected: ws.current?.readyState === WebSocket.OPEN,
        sendMessage,
        reconnect: connect
    };
};
