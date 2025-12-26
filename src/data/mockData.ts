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
        itemCount: 8,
        totalAmount: 125000,
        status: SessionStatus.ACTIVE,
        createdAt: new Date().toISOString()
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
        totalAmount: 87500,
        status: SessionStatus.ACTIVE,
        createdAt: new Date().toISOString()
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
        totalAmount: 45000,
        status: SessionStatus.ACTIVE,
        createdAt: new Date().toISOString()
    },
    {
        sessionId: 'session-004',
        clientType: ClientType.FACIAL,
        customerName: 'Ana Rodríguez',
        pinCode: '9012',
        customerPhotoUrl: 'https://i.pravatar.cc/150?img=32',
        tower: 'Torre C',
        apartment: '1205',
        itemCount: 12,
        totalAmount: 200000,
        status: SessionStatus.ACTIVE,
        createdAt: new Date().toISOString()
    }
];

export const mockCart = {
    cartId: 'cart-001',
    sessionId: 'session-001',
    items: [
        {
            id: 'item-001',
            productId: 'prod-123',
            productName: 'Leche Entera 1L',
            productDescription: 'Leche entera pasteurizada',
            productImage: '🥛',
            quantity: 2,
            unitPrice: 4500,
            totalPrice: 9000,
            detectedByAI: true
        },
        {
            id: 'item-002',
            productId: 'prod-456',
            productName: 'Pan Integral',
            productDescription: 'Pan integral artesanal',
            productImage: '🍞',
            quantity: 3,
            unitPrice: 3200,
            totalPrice: 9600,
            detectedByAI: true
        },
        {
            id: 'item-003',
            productId: 'prod-789',
            productName: 'Huevos AA x30',
            productDescription: 'Huevos frescos tamaño AA',
            productImage: '🥚',
            quantity: 1,
            unitPrice: 15000,
            totalPrice: 15000,
            detectedByAI: true
        },
        {
            id: 'item-004',
            productId: 'prod-101',
            productName: 'Arroz Premium 1kg',
            productDescription: 'Arroz blanco premium',
            productImage: '🍚',
            quantity: 2,
            unitPrice: 3500,
            totalPrice: 7000,
            detectedByAI: true
        }
    ],
    subtotal: 40600,
    discountAmount: 0,
    totalAmount: 40600,
    updatedAt: new Date().toISOString()
};
