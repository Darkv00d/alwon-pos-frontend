const API_BASE_URL = 'http://localhost:8080/api';

export interface BiometricData {
    faceId: string;
    confidence: number;
    timestamp: string;
}

export interface CustomerInfo {
    name: string;
    photo: string;
    tower: string;
    apartment: string;
}

export interface CartItemRequest {
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    imageUrl: string;
}

export interface CustomerSessionRequest {
    customerId: string;
    biometricData: BiometricData;
    customerInfo: CustomerInfo;
    cart: CartItemRequest[];
}

export interface CartModification {
    action: 'add' | 'remove' | 'update_quantity';
    productId: number;
    newQuantity?: number;
    quantity?: number;
}

export interface CartModificationRequest {
    modifications: CartModification[];
    reason?: string;
}

export interface CustomerSessionResponse {
    sessionId: string;
    status: string;
    expiresAt: string;
    customer: {
        name: string;
        tower: string;
        apartment: string;
        photoUrl: string;
    };
    cart: {
        items: Array<{
            productId: number;
            productName: string;
            quantity: number;
            unitPrice: number;
            imageUrl: string;
        }>;
        subtotal: number;
        tax: number;
        total: number;
    };
}

export const kioskApi = {
    async createSession(request: CustomerSessionRequest): Promise<CustomerSessionResponse> {
        const response = await fetch(`${API_BASE_URL}/kiosk/customer-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create session');
        }

        return response.json();
    },

    async getSession(sessionId: string): Promise<CustomerSessionResponse> {
        const response = await fetch(`${API_BASE_URL}/kiosk/session/${sessionId}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get session');
        }

        return response.json();
    },

    async modifyCart(
        sessionId: string,
        modifications: CartModificationRequest,
        staffPin: string
    ): Promise<CustomerSessionResponse> {
        const response = await fetch(`${API_BASE_URL}/kiosk/session/${sessionId}/cart`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-Staff-Pin': staffPin,
            },
            body: JSON.stringify(modifications),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to modify cart');
        }

        return response.json();
    },

    async processPayment(sessionId: string, paymentData: any): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/kiosk/session/${sessionId}/payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to process payment');
        }

        return response.json();
    },
};
