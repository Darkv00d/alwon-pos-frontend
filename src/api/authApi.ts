import axios from 'axios';
import type { Operator, AuthNotifications } from '../store/useAuthStore';

// Usar path vacío para que el proxy de Vite maneje las rutas
const API_BASE_URL = '';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear token
            localStorage.removeItem('auth_token');
        }
        return Promise.reject(error);
    }
);

export interface LoginRequest {
    username: string;
    password: string;
}

// Backend sends 'name' but frontend uses 'fullName'
interface BackendOperator {
    id: string;
    username: string;
    name: string; // Backend field
    email: string;
    phone: string;
    role: string;
}

export interface LoginResponse {
    success: boolean;
    operator: BackendOperator; // Backend format
    token: string;
    pin: string;
    pinExpiresAt: string;
    notifications: AuthNotifications;
}

export interface ValidatePinRequest {
    pin: string;
}

export interface ValidatePinResponse {
    success: boolean;
    valid: boolean;
    operator?: Operator;
    attemptsRemaining?: number;
    message?: string;
    requiresLogin?: boolean;
}

export interface SessionResponse {
    active: boolean;
    operator?: Operator;
    pinActive: boolean;
    pinExpiresAt?: string;
}

export interface LogoutResponse {
    success: boolean;
    message: string;
}

export const authApi = {
    /**
     * Login with username and password
     * Generates PIN and sends notifications
     */
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
        return response.data;
    },

    /**
     * Validate 6-digit PIN
     */
    validatePin: async (request: ValidatePinRequest): Promise<ValidatePinResponse> => {
        const response = await apiClient.post<ValidatePinResponse>('/api/auth/validate-pin', request);
        return response.data;
    },

    /**
     * Logout and invalidate PIN
     */
    logout: async (): Promise<LogoutResponse> => {
        const response = await apiClient.post<LogoutResponse>('/api/auth/logout');
        return response.data;
    },

    /**
     * Check active session
     */
    getSession: async (): Promise<SessionResponse> => {
        const response = await apiClient.get<SessionResponse>('/api/auth/session');
        return response.data;
    },
};

export default authApi;
