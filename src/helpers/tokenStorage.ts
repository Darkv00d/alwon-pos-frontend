/**
 * Token Storage Helper
 * Manages JWT tokens for authentication
 */

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenStorage = {
    getToken: (): string | null => {
        return localStorage.getItem(TOKEN_KEY);
    },

    setToken: (token: string): void => {
        localStorage.setItem(TOKEN_KEY, token);
    },

    getRefreshToken: (): string | null => {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },

    setRefreshToken: (token: string): void => {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
    },

    clearTokens: (): void => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    },
};

export default tokenStorage;
