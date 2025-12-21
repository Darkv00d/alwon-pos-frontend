/**
 * Kiosk API Service
 * 
 * Adaptador para conectar con el backend Java Spring Boot
 * Optimizado para Android Tablet POS
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Types
export interface Product {
    id: number;
    name: string;
    price: number;
    categoryId?: number;
    imageUrl?: string;
    stock: number;
}

export interface Category {
    id: number;
    name: string;
    icon?: string;
}

export interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    loyaltyPoints?: number;
    tier?: string;
}

export interface TransactionRequest {
    customerId?: string;
    items: Array<{
        productId: number;
        quantity: number;
        unitPrice: number;
    }>;
    paymentMethod: 'card' | 'points' | 'hybrid';
    totalAmount: number;
    pointsUsed?: number;
}

export interface TransactionResponse {
    id: string;
    status: 'success' | 'pending' | 'failed';
    transactionId: string;
    amount: number;
    timestamp: string;
}

/**
 * Kiosk API Client
 */
export const kioskApi = {
    /**
     * Get products for kiosk
     * @param locationId - Store location ID
     * @param categoryId - Optional category filter
     */
    getProducts: async (locationId: number, categoryId?: number): Promise<Product[]> => {
        const params = new URLSearchParams({ locationId: String(locationId) });
        if (categoryId) params.append('categoryId', String(categoryId));

        const response = await fetch(`${API_BASE}/kiosk/products?${params}`);
        if (!response.ok) throw new Error('Failed to fetch products');
        return response.json();
    },

    /**
     * Get categories for location
     */
    getCategories: async (locationId: number): Promise<Category[]> => {
        const response = await fetch(`${API_BASE}/kiosk/categories?locationId=${locationId}`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        return response.json();
    },

    /**
     * Get customer by ID or search
     */
    getCustomer: async (customerId: string): Promise<Customer> => {
        const response = await fetch(`${API_BASE}/kiosk/customers/${customerId}`);
        if (!response.ok) throw new Error('Customer not found');
        return response.json();
    },

    /**
     * Search customers
     */
    searchCustomers: async (query: string): Promise<Customer[]> => {
        const response = await fetch(`${API_BASE}/kiosk/customers/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Search failed');
        return response.json();
    },

    /**
     * Create transaction
     */
    createTransaction: async (data: TransactionRequest): Promise<TransactionResponse> => {
        const response = await fetch(`${API_BASE}/kiosk/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Transaction failed');
        }

        return response.json();
    },

    /**
     * Process payment (PSE or other gateway)
     */
    processPayment: async (transactionId: string, paymentData: any): Promise<any> => {
        const response = await fetch(`${API_BASE}/kiosk/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                transactionId,
                ...paymentData,
            }),
        });

        if (!response.ok) throw new Error('Payment failed');
        return response.json();
    },
};

export default kioskApi;
