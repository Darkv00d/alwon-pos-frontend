import { useQuery } from '@tanstack/react-query';

// Temporary useAuth stub
export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

export function useAuth() {
    const user: User | null = null; // TODO: Implement actual auth

    return {
        user,
        isAuthenticated: !!user,
        isLoading: false,
        login: async (email: string, password: string) => { },
        logout: async () => { },
    };
}
