import create from 'zustand';

interface Operator {
    id: number;
    username: string;
    name: string;
    role: string;
    verificationCode: string;
}

interface AuthStore {
    operator: Operator | null;
    token: string | null;
    isAuthenticated: boolean;

    login: (token: string, operator: Operator) => void;
    logout: () => void;
    verifyCode: (code: string) => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
    operator: null,
    token: localStorage.getItem('authToken'),
    isAuthenticated: !!localStorage.getItem('authToken'),

    login: (token, operator) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('operator', JSON.stringify(operator));
        set({ token, operator, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('operator');
        set({ token: null, operator: null, isAuthenticated: false });
    },

    verifyCode: (code: string) => {
        const { operator } = get();
        return operator?.verificationCode === code;
    }
}));
