import { create } from 'zustand';

export interface Operator {
    id: string;
    username: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
}

export interface AuthNotifications {
    whatsapp: {
        sent: boolean;
        maskedPhone: string;
    };
    email: {
        sent: boolean;
        maskedEmail: string;
    };
}

interface AuthState {
    // State
    operator: Operator | null;
    token: string | null;
    isPinActive: boolean;
    pinExpiresAt: string | null;
    pinAttempts: number;
    isLoading: boolean;
    error: string | null;

    // Modal states
    showLoginModal: boolean;
    showPinDisplayModal: boolean;
    showPinKeypadModal: boolean;
    showAdminMenuModal: boolean;

    // Last login response
    lastPinGenerated: string | null;
    lastNotifications: AuthNotifications | null;

    // Actions
    setShowLoginModal: (show: boolean) => void;
    setShowPinDisplayModal: (show: boolean) => void;
    setShowPinKeypadModal: (show: boolean) => void;
    setShowAdminMenuModal: (show: boolean) => void;

    setOperator: (operator: Operator | null) => void;
    setToken: (token: string | null) => void;
    setPinActive: (active: boolean) => void;
    setPinExpiresAt: (expiresAt: string | null) => void;
    incrementPinAttempts: () => void;
    resetPinAttempts: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    setLastPinGenerated: (pin: string) => void;
    setLastNotifications: (notifications: AuthNotifications) => void;

    logout: () => void;
    reset: () => void;
}

const initialState = {
    operator: null,
    token: null,
    isPinActive: false,
    pinExpiresAt: null,
    pinAttempts: 0,
    isLoading: false,
    error: null,
    showLoginModal: false,
    showPinDisplayModal: false,
    showPinKeypadModal: false,
    showAdminMenuModal: false,
    lastPinGenerated: null,
    lastNotifications: null,
};

export const useAuthStore = create<AuthState>((set) => ({
    ...initialState,

    // Modal actions
    setShowLoginModal: (show) => set({ showLoginModal: show }),
    setShowPinDisplayModal: (show) => set({ showPinDisplayModal: show }),
    setShowPinKeypadModal: (show) => set({ showPinKeypadModal: show }),
    setShowAdminMenuModal: (show) => set({ showAdminMenuModal: show }),

    // Data actions
    setOperator: (operator) => set({ operator }),
    setToken: (token) => {
        // Save token to localStorage for persistence
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
        set({ token });
    },
    setPinActive: (active) => set({ isPinActive: active }),
    setPinExpiresAt: (expiresAt) => set({ pinExpiresAt: expiresAt }),
    incrementPinAttempts: () => set((state) => ({
        pinAttempts: state.pinAttempts + 1
    })),
    resetPinAttempts: () => set({ pinAttempts: 0 }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),

    setLastPinGenerated: (pin) => set({ lastPinGenerated: pin }),
    setLastNotifications: (notifications) => set({ lastNotifications: notifications }),

    // Logout
    logout: () => set({
        ...initialState,
        // Close all modals
        showLoginModal: false,
        showPinDisplayModal: false,
        showPinKeypadModal: false,
        showAdminMenuModal: false,
    }),

    // Reset (for testing)
    reset: () => set(initialState),
}));
