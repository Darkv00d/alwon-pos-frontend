import { create } from 'zustand';
import { CustomerSession, ShoppingCart, Operator } from '@/types';

interface AppStore {
    // Estado
    sessions: CustomerSession[];
    selectedSession: CustomerSession | null;
    currentCart: ShoppingCart | null;
    operator: Operator | null;
    isEditMode: boolean;
    isLoading: boolean;

    // Acciones - Sesiones
    setSessions: (sessions: CustomerSession[]) => void;
    setSelectedSession: (session: CustomerSession | null) => void;
    addSession: (session: CustomerSession) => void;
    updateSession: (sessionId: string, updates: Partial<CustomerSession>) => void;
    removeSession: (sessionId: string) => void;

    // Acciones - Carrito
    setCurrentCart: (cart: ShoppingCart | null) => void;
    updateCartItem: (itemId: string, quantity: number) => void;
    removeCartItem: (itemId: string) => void;

    // Acciones - Operador
    setOperator: (operator: Operator | null) => void;
    setEditMode: (isEdit: boolean) => void;

    // Acciones - Loading
    setLoading: (loading: boolean) => void;

    // Reset
    reset: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
    // Estado inicial
    sessions: [],
    selectedSession: null,
    currentCart: null,
    operator: null,
    isEditMode: false,
    isLoading: false,

    // Implementación de acciones
    setSessions: (sessions) => set({ sessions }),

    setSelectedSession: (session) => set({ selectedSession: session }),

    addSession: (session) => set((state) => ({
        sessions: [...state.sessions, session]
    })),

    updateSession: (sessionId, updates) => set((state) => ({
        sessions: state.sessions.map((s) =>
            s.sessionId === sessionId ? { ...s, ...updates } : s
        ),
        selectedSession:
            state.selectedSession?.sessionId === sessionId
                ? { ...state.selectedSession, ...updates }
                : state.selectedSession
    })),

    removeSession: (sessionId) => set((state) => ({
        sessions: state.sessions.filter((s) => s.sessionId !== sessionId),
        selectedSession:
            state.selectedSession?.sessionId === sessionId ? null : state.selectedSession
    })),

    setCurrentCart: (cart) => set({ currentCart: cart }),

    updateCartItem: (itemId, quantity) => set((state) => {
        if (!state.currentCart) return state;

        const updatedItems = state.currentCart.items.map((item) =>
            item.id === itemId
                ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
                : item
        );

        const subtotal = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const totalAmount = subtotal - (state.currentCart.discountAmount || 0);

        return {
            currentCart: {
                ...state.currentCart,
                items: updatedItems,
                subtotal,
                totalAmount
            }
        };
    }),

    removeCartItem: (itemId) => set((state) => {
        if (!state.currentCart) return state;

        const updatedItems = state.currentCart.items.filter((item) => item.id !== itemId);
        const subtotal = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const totalAmount = subtotal - (state.currentCart.discountAmount || 0);

        return {
            currentCart: {
                ...state.currentCart,
                items: updatedItems,
                subtotal,
                totalAmount
            }
        };
    }),

    setOperator: (operator) => set({ operator }),

    setEditMode: (isEdit) => set({ isEditMode: isEdit }),

    setLoading: (loading) => set({ isLoading: loading }),

    reset: () => set({
        sessions: [],
        selectedSession: null,
        currentCart: null,
        operator: null,
        isEditMode: false,
        isLoading: false
    })
}));
