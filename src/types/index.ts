// Tipos de Cliente
export enum ClientType {
    FACIAL = 'FACIAL',
    PIN = 'PIN',
    NO_ID = 'NO_ID'
}

// Tipos de Estado de Sesión
export enum SessionStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    CLOSED = 'CLOSED'
}

// Sesión de Cliente
export interface CustomerSession {
    sessionId: string;
    clientType: ClientType;
    customerName?: string; // Solo para FACIAL
    customerPhotoUrl?: string; // Para FACIAL y NO_ID (no PIN)
    pinCode?: string; // Solo para PIN
    tower?: string; // Torre del apartamento
    apartment?: string; // Número de apartamento
    status: SessionStatus;
    createdAt: string;
    itemCount: number;
    totalAmount: number;
}

// Producto en Carrito
export interface CartItem {
    id: string;
    productId: string;
    productName: string;
    productDescription: string;
    productImage: string; // Emoji o URL
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    detectedByAI: boolean;
}

// Carrito de Compras
export interface ShoppingCart {
    cartId: string;
    sessionId: string;
    items: CartItem[];
    subtotal: number;
    discountAmount: number;
    totalAmount: number;
    updatedAt: string;
}

// Producto del Catálogo
export interface Product {
    id: string;
    name: string;
    description: string;
    image: string;
    price: number;
    category: string;
    active: boolean;
}

// Método de Pago
export enum PaymentMethod {
    PSE = 'PSE',
    DEBIT = 'DEBIT'
}

// Transacción de Pago
export interface PaymentTransaction {
    transactionId: string;
    sessionId: string;
    paymentMethod: PaymentMethod;
    amount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    paymentUrl?: string;
    completedAt?: string;
}

// Evidencia Visual (para NO_ID)
export interface VisualEvidence {
    evidenceId: string;
    sessionId: string;
    productId: string;
    productName: string;
    mediaType: 'PHOTO' | 'VIDEO' | 'GIF';
    mediaUrl: string;
    capturedAt: string;
}

// Operador
export interface Operator {
    id: string;
    name: string;
    username: string;
    verificationCode: string; // Código único para modificar carrito
}

// Respuestas API
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// WebSocket Events
export interface WebSocketEvent {
    type: 'CART_UPDATED' | 'SESSION_CREATED' | 'SESSION_CLOSED' | 'PAYMENT_COMPLETED';
    payload: any;
    timestamp: string;
}
