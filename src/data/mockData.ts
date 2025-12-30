import { CustomerSession, ClientType, SessionStatus } from '@/types';

export const mockSessions: CustomerSession[] = [
    {
        sessionId: 'session-001',
        clientType: ClientType.FACIAL,
        customerName: 'Carlos Martínez',
        pinCode: '1234',
        customerPhotoUrl: 'https://i.pravatar.cc/150?img=12',
        tower: 'Torre A',
        apartment: '501',
        itemCount: 10,
        totalAmount: 41500,
        status: SessionStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        cartItems: [
            { productName: 'Leche Alpina 1L', productImage: '🥛', quantity: 2 },
            { productName: 'Pan Tajado Bimbo', productImage: '🍞', quantity: 1 },
            { productName: 'Huevos AA x12', productImage: '🥚', quantity: 1 },
            { productName: 'Arroz Diana 500g', productImage: '🍚', quantity: 2 },
            { productName: 'Coca-Cola 400ml', productImage: '🥤', quantity: 3 },
            { productName: 'Café Colombiano 250g', productImage: '☕', quantity: 1 }
        ]
    },
    {
        sessionId: 'session-002',
        clientType: ClientType.PIN,
        customerName: 'María González',
        pinCode: '5678',
        customerPhotoUrl: 'https://i.pravatar.cc/150?img=45',
        tower: 'Torre B',
        apartment: '302',
        itemCount: 5,
        totalAmount: 20700,
        status: SessionStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        cartItems: [
            { productName: 'Arroz Diana 500g', productImage: '🍚', quantity: 2 },
            { productName: 'Sal de Mesa 500g', productImage: '🧂', quantity: 1 },
            { productName: 'Aceite Girasol 1L', productImage: '🫒', quantity: 1 },
            { productName: 'Azúcar Morena 500g', productImage: '🍬', quantity: 1 }
        ]
    },
    {
        sessionId: 'session-003',
        clientType: ClientType.NO_ID,
        customerName: 'Cliente No Identificado',
        pinCode: '',
        customerPhotoUrl: undefined,
        tower: undefined,
        apartment: undefined,
        itemCount: 3,
        totalAmount: 14700,
        status: SessionStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        cartItems: [
            { productName: 'Coca-Cola 400ml', productImage: '🥤', quantity: 2 },
            { productName: 'Pan Tajado Bimbo', productImage: '🍞', quantity: 1 },
            { productName: 'Café Colombiano 250g', productImage: '☕', quantity: 1 }
        ]
    },
    {
        sessionId: 'session-004',
        clientType: ClientType.FACIAL,
        customerName: 'Ana Rodríguez',
        pinCode: '9012',
        customerPhotoUrl: 'https://i.pravatar.cc/150?img=32',
        tower: 'Torre C',
        apartment: '1205',
        itemCount: 15,
        totalAmount: 53100,
        status: SessionStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        cartItems: [
            { productName: 'Huevos AA x12', productImage: '🥚', quantity: 2 },
            { productName: 'Leche Alpina 1L', productImage: '🥛', quantity: 3 },
            { productName: 'Pasta Espagueti 500g', productImage: '🍝', quantity: 2 },
            { productName: 'Aceite Girasol 1L', productImage: '🫒', quantity: 1 },
            { productName: 'Arroz Diana 500g', productImage: '🍚', quantity: 3 },
            { productName: 'Azúcar Morena 500g', productImage: '🍬', quantity: 2 },
            { productName: 'Sal de Mesa 500g', productImage: '🧂', quantity: 1 },
            { productName: 'Coca-Cola 400ml', productImage: '🥤', quantity: 1 }
        ]
    }
];

export const mockCart = {
    cartId: 'cart-001',
    sessionId: 'session-001',
    items: [
        {
            id: 'item-001',
            productId: 'prod-004',
            productName: 'Leche Alpina 1L',
            productDescription: 'Leche entera ultra pasteurizada',
            productImage: '🥛',
            quantity: 2,
            unitPrice: 3800,
            totalPrice: 7600,
            detectedByAI: true
        },
        {
            id: 'item-002',
            productId: 'prod-003',
            productName: 'Pan Tajado Bimbo',
            productDescription: 'Pan tajado para sandwich',
            productImage: '🍞',
            quantity: 1,
            unitPrice: 4200,
            totalPrice: 4200,
            detectedByAI: true
        },
        {
            id: 'item-003',
            productId: 'prod-001',
            productName: 'Huevos AA x12',
            productDescription: 'Huevos frescos tamaño AA',
            productImage: '🥚',
            quantity: 1,
            unitPrice: 8500,
            totalPrice: 8500,
            detectedByAI: true
        },
        {
            id: 'item-004',
            productId: 'prod-005',
            productName: 'Arroz Diana 500g',
            productDescription: 'Arroz blanco de primera calidad',
            productImage: '🍚',
            quantity: 2,
            unitPrice: 2100,
            totalPrice: 4200,
            detectedByAI: true
        },
        {
            id: 'item-005',
            productId: 'prod-002',
            productName: 'Coca-Cola 400ml',
            productDescription: 'Bebida carbonatada sabor cola',
            productImage: '🥤',
            quantity: 3,
            unitPrice: 2500,
            totalPrice: 7500,
            detectedByAI: true
        },
        {
            id: 'item-006',
            productId: 'prod-009',
            productName: 'Café Colombiano 250g',
            productDescription: 'Café molido 100% colombiano',
            productImage: '☕',
            quantity: 1,
            unitPrice: 9500,
            totalPrice: 9500,
            detectedByAI: true
        }
    ],
    subtotal: 41500,
    discountAmount: 0,
    totalAmount: 41500,
    updatedAt: new Date().toISOString()
};

// Mock Operator for testing cart modifications
export const mockOperator = {
    id: 'op-001',
    name: 'Operador Principal',
    username: 'admin',
    verificationCode: 'admin123'
};
