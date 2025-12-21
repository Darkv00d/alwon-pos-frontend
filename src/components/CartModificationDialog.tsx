import { useState } from 'react';
import './CartModificationDialog.css';

interface CartItem {
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    imageUrl: string;
}

interface Product {
    id: number;
    name: string;
    price: number;
    category: string;
    imageUrl: string;
    inStock: boolean;
}

// Catálogo de productos de ejemplo con emojis
const PRODUCT_CATALOG: Product[] = [
    { id: 1, name: 'Leche Entera Alquería 1L', price: 4500, category: 'Lácteos', imageUrl: '🥛', inStock: true },
    { id: 2, name: 'Pan Integral Bimbo', price: 3200, category: 'Panadería', imageUrl: '🍞', inStock: true },
    { id: 3, name: 'Arroz Premium 500g', price: 2800, category: 'Granos', imageUrl: '🍚', inStock: true },
    { id: 4, name: 'Aceite Girasol 1L', price: 8900, category: 'Aceites', imageUrl: '🧴', inStock: true },
    { id: 5, name: 'Huevos AA x12', price: 6500, category: 'Lácteos', imageUrl: '🥚', inStock: true },
    { id: 6, name: 'Azúcar Refinada 1kg', price: 3500, category: 'Endulzantes', imageUrl: '🍬', inStock: true },
    { id: 7, name: 'Café Molido 500g', price: 12000, category: 'Bebidas', imageUrl: '☕', inStock: true },
    { id: 8, name: 'Pasta Espagueti 500g', price: 4200, category: 'Granos', imageUrl: '🍝', inStock: true },
    { id: 9, name: 'Atún en Lata 170g', price: 5800, category: 'Enlatados', imageUrl: '🐟', inStock: true },
    { id: 10, name: 'Jabón de Tocador x3', price: 7200, category: 'Aseo', imageUrl: '🧼', inStock: true },
];

interface CartModificationDialogProps {
    isOpen: boolean;
    cartItems: CartItem[];
    onClose: () => void;
    onModify: (modifiedItems: CartItem[]) => void;
}

function CartModificationDialog({ isOpen, cartItems, onClose, onModify }: CartModificationDialogProps) {
    const [localItems, setLocalItems] = useState<CartItem[]>([...cartItems]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'cart' | 'catalog'>('cart');

    if (!isOpen) return null;

    const handleQuantityChange = (productId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            setLocalItems(prev => prev.filter(item => item.productId !== productId));
        } else {
            setLocalItems(prev =>
                prev.map(item =>
                    item.productId === productId
                        ? { ...item, quantity: newQuantity }
                        : item
                )
            );
        }
    };

    const handleAddProduct = (product: Product) => {
        const existingItem = localItems.find(item => item.productId === product.id);

        if (existingItem) {
            // Si ya existe, aumentar cantidad
            handleQuantityChange(product.id, existingItem.quantity + 1);
        } else {
            // Si no existe, agregar nuevo
            setLocalItems(prev => [...prev, {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                unitPrice: product.price,
                imageUrl: product.imageUrl
            }]);
        }

        // Cambiar a pestaña de carrito para mostrar el producto agregado
        setActiveTab('cart');
    };

    const handleSubmit = () => {
        onModify(localItems);
        onClose();
    };

    const filteredProducts = PRODUCT_CATALOG.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Helper to render image: emoji if single char, img tag if URL
    const renderImage = (imageUrl: string, alt: string = '') => {
        // Check if it's a URL (starts with http)
        if (imageUrl.startsWith('http')) {
            return <img src={imageUrl} alt={alt} className="item-img" />;
        }
        // Otherwise it's an emoji
        return <span className="item-emoji-large">{imageUrl}</span>;
    };

    return (
        <div className="modification-overlay">
            <div className="modification-dialog">
                <div className="modification-header">
                    <h2>Modificación de Carrito - Staff</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {/* Tabs */}
                <div className="modification-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'cart' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cart')}
                    >
                        Carrito Actual ({localItems.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
                        onClick={() => setActiveTab('catalog')}
                    >
                        Agregar Productos
                    </button>
                </div>

                <div className="modification-content">
                    {/* Tab: Carrito Actual */}
                    {activeTab === 'cart' && (
                        <>
                            {localItems.length === 0 ? (
                                <div className="empty-message">
                                    El carrito está vacío. Agrega productos desde el catálogo.
                                </div>
                            ) : (
                                <div className="modification-list">
                                    {localItems.map((item) => (
                                        <div key={item.productId} className="modification-item">
                                            <div className="item-image-container">
                                                {renderImage(item.imageUrl, item.productName)}
                                            </div>
                                            <div className="item-info">
                                                <div className="item-name">{item.productName}</div>
                                                <div className="item-price">${item.unitPrice.toLocaleString()}</div>
                                            </div>
                                            <div className="quantity-controls">
                                                <button
                                                    className="qty-btn"
                                                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                                >
                                                    -
                                                </button>
                                                <span className="qty-display">{item.quantity}</span>
                                                <button
                                                    className="qty-btn"
                                                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Tab: Catálogo de Productos */}
                    {activeTab === 'catalog' && (
                        <>
                            <div className="search-container">
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="🔍 Buscar productos..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="product-grid">
                                {filteredProducts.map((product) => (
                                    <div key={product.id} className="product-card">
                                        <div className="product-icon">{product.imageUrl}</div>
                                        <div className="product-name">{product.name}</div>
                                        <div className="product-price">${product.price.toLocaleString()}</div>
                                        <button
                                            className="add-product-btn"
                                            onClick={() => handleAddProduct(product)}
                                        >
                                            Agregar +
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="modification-actions">
                    <button className="btn-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="btn-save" onClick={handleSubmit}>
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CartModificationDialog;
