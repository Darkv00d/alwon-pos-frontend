import axios from 'axios';
import type { CustomerSession, ShoppingCart, Product, PaymentTransaction, ApiResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000
});

// Interceptor para agregar autenticación si es necesario
apiClient.interceptors.request.use((config) => {
    const operator = localStorage.getItem('operator');
    if (operator) {
        try {
            const { token } = JSON.parse(operator);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error parsing operator token:', error);
        }
    }
    return config;
});

// ===================================
// SESSION API
// ===================================

export const sessionApi = {
    getActiveSessions: async (): Promise<CustomerSession[]> => {
        const { data } = await apiClient.get<CustomerSession[]>('/sessions/active');
        return data;
    },

    getSessionById: async (sessionId: string): Promise<CustomerSession> => {
        const { data } = await apiClient.get<CustomerSession>(`/sessions/${sessionId}`);
        return data;
    },

    createSession: async (sessionData: Partial<CustomerSession>): Promise<CustomerSession> => {
        const { data } = await apiClient.post<CustomerSession>('/sessions', sessionData);
        return data;
    },

    closeSession: async (sessionId: string): Promise<void> => {
        await apiClient.post(`/sessions/${sessionId}/close`);
    },

    suspendSession: async (sessionId: string): Promise<void> => {
        await apiClient.put(`/sessions/${sessionId}/suspend`);
    }
};

// ===================================
// CART API
// ===================================

export const cartApi = {
    getCart: async (sessionId: string): Promise<ShoppingCart> => {
        const { data } = await apiClient.get<ShoppingCart>(`/carts/${sessionId}`);
        return data;
    },

    addItem: async (sessionId: string, productId: string, quantity: number): Promise<ShoppingCart> => {
        const { data } = await apiClient.post<ShoppingCart>(`/carts/${sessionId}/items`, {
            productId,
            quantity
        });
        return data;
    },

    updateItemQuantity: async (
        sessionId: string,
        itemId: string,
        quantity: number
    ): Promise<ShoppingCart> => {
        const { data } = await apiClient.patch<ShoppingCart>(
            `/carts/${sessionId}/items/${itemId}`,
            { quantity }
        );
        return data;
    },

    removeItem: async (sessionId: string, itemId: string): Promise<ShoppingCart> => {
        const { data } = await apiClient.delete<ShoppingCart>(`/carts/${sessionId}/items/${itemId}`);
        return data;
    }
};

// ===================================
// PRODUCT API
// ===================================

export const productApi = {
    getAllProducts: async (): Promise<Product[]> => {
        const { data } = await apiClient.get<Product[]>('/products');
        return data;
    },

    getProductById: async (productId: string): Promise<Product> => {
        const { data } = await apiClient.get<Product>(`/products/${productId}`);
        return data;
    },

    searchProducts: async (query: string): Promise<Product[]> => {
        const { data } = await apiClient.get<Product[]>(`/products/search`, {
            params: { query }
        });
        return data;
    },

    getProductsByCategory: async (category: string): Promise<Product[]> => {
        const { data } = await apiClient.get<Product[]>(`/products/category/${category}`);
        return data;
    }
};

// ===================================
// PAYMENT API
// ===================================

export const paymentApi = {
    initiatePayment: async (
        sessionId: string,
        paymentMethod: string,
        amount: number
    ): Promise<PaymentTransaction> => {
        const { data } = await apiClient.post<PaymentTransaction>('/payments/initiate', {
            sessionId,
            paymentMethod,
            amount
        });
        return data;
    },

    getPaymentStatus: async (transactionId: string): Promise<PaymentTransaction> => {
        const { data } = await apiClient.get<PaymentTransaction>(`/payments/${transactionId}`);
        return data;
    }
};

// ===================================
// ACCESS API
// ===================================

export const accessApi = {
    getClientTypes: async (): Promise<any[]> => {
        const { data } = await apiClient.get('/access/client-types');
        return data;
    }
};

// ===================================
// CAMERA API
// ===================================

export const cameraApi = {
    recognizeFace: async (sessionId: string, imageData: string, mimeType: string = 'image/jpeg'): Promise<any> => {
        const { data } = await apiClient.post('/camera/facial-recognition', {
            sessionId,
            imageData, // Base64 encoded
            mimeType
        });
        return data;
    },

    getEvidence: async (sessionId: string): Promise<any[]> => {
        const { data } = await apiClient.get(`/camera/evidence/session/${sessionId}`);
        return data;
    },

    getEvidenceByType: async (sessionId: string, evidenceType: string): Promise<any[]> => {
        const { data } = await apiClient.get(`/camera/evidence/session/${sessionId}/type/${evidenceType}`);
        return data;
    }
};

export default apiClient;
