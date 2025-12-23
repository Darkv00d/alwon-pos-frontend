-- Alwon POS Database Initialization Script
-- This script creates all necessary schemas for the microservices

-- Create schemas for each microservice
CREATE SCHEMA IF NOT EXISTS sessions;
CREATE SCHEMA IF NOT EXISTS carts;
CREATE SCHEMA IF NOT EXISTS products;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS camera;
CREATE SCHEMA IF NOT EXISTS access;
CREATE SCHEMA IF NOT EXISTS inventory;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA sessions TO alwon;
GRANT ALL PRIVILEGES ON SCHEMA carts TO alwon;
GRANT ALL PRIVILEGES ON SCHEMA products TO alwon;
GRANT ALL PRIVILEGES ON SCHEMA payments TO alwon;
GRANT ALL PRIVILEGES ON SCHEMA camera TO alwon;
GRANT ALL PRIVILEGES ON SCHEMA access TO alwon;
GRANT ALL PRIVILEGES ON SCHEMA inventory TO alwon;

-- Sessions schema tables
CREATE TABLE IF NOT EXISTS sessions.operators (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'OPERATOR',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions.customer_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    client_type VARCHAR(20) NOT NULL, -- FACIAL, PIN, NO_ID
    customer_id VARCHAR(100),
    customer_name VARCHAR(100),
    customer_photo_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, CLOSED
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

-- Insert default operator
INSERT INTO sessions.operators (username, password_hash, full_name, role) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Administrator', 'ADMIN')
ON CONFLICT (username) DO NOTHING;

-- Carts schema tables
CREATE TABLE IF NOT EXISTS carts.shopping_carts (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    items_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, COMPLETED, CANCELLED
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carts.cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL REFERENCES carts.shopping_carts(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    product_image_url VARCHAR(500),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    added_by VARCHAR(50), -- 'AI' or operator username
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carts.cart_modifications_log (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL REFERENCES carts.shopping_carts(id) ON DELETE CASCADE,
    operator_username VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL, -- ADD, REMOVE, UPDATE_QUANTITY
    product_id BIGINT,
    product_name VARCHAR(200),
    old_quantity INTEGER,
    new_quantity INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Products schema tables
CREATE TABLE IF NOT EXISTS products.products (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500),
    barcode VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample products
INSERT INTO products.products (sku, name, description, category, price, image_url, barcode) VALUES
('PROD-001', 'Laptop Dell XPS 13', 'Portátil ultraligero de 13 pulgadas', 'Electrónica', 1299.99, '/images/laptop-dell.jpg', '7501234567890'),
('PROD-002', 'Mouse Logitech MX Master', 'Mouse inalámbrico ergonómico', 'Accesorios', 99.99, '/images/mouse-logitech.jpg', '7501234567891'),
('PROD-003', 'Teclado Mecánico RGB', 'Teclado gaming con switches azules', 'Accesorios', 149.99, '/images/keyboard-rgb.jpg', '7501234567892'),
('PROD-004', 'Monitor LG 27" 4K', 'Monitor UHD con HDR10', 'Electrónica', 499.99, '/images/monitor-lg.jpg', '7501234567893'),
('PROD-005', 'Webcam Logitech C920', 'Cámara Full HD 1080p', 'Accesorios', 79.99, '/images/webcam-c920.jpg', '7501234567894'),
('PROD-006', 'Audífonos Sony WH-1000XM4', 'Audífonos con cancelación de ruido', 'Audio', 349.99, '/images/headphones-sony.jpg', '7501234567895'),
('PROD-007', 'SSD Samsung 1TB', 'Disco sólido NVMe M.2', 'Almacenamiento', 129.99, '/images/ssd-samsung.jpg', '7501234567896'),
('PROD-008', 'RAM Corsair 16GB DDR4', 'Memoria RAM 3200MHz', 'Componentes', 89.99, '/images/ram-corsair.jpg', '7501234567897'),
('PROD-009', 'Cargador USB-C 65W', 'Cargador universal tipo C', 'Accesorios', 39.99, '/images/charger-usbc.jpg', '7501234567898'),
('PROD-010', 'Cable HDMI 4K 2m', 'Cable HDMI 2.1 certificado', 'Accesorios', 19.99, '/images/cable-hdmi.jpg', '7501234567899')
ON CONFLICT (sku) DO NOTHING;

-- Payments schema tables
CREATE TABLE IF NOT EXISTS payments.payment_transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    payment_method VARCHAR(20) NOT NULL, -- PSE, DEBIT
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, FAILED
    external_reference VARCHAR(200),
    response_code VARCHAR(50),
    response_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Camera schema tables
CREATE TABLE IF NOT EXISTS camera.visual_evidence (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    evidence_type VARCHAR(20) NOT NULL, -- FACIAL_PHOTO, PRODUCT_VIDEO, PRODUCT_GIF
    product_id BIGINT,
    file_url VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT,
    captured_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Access schema tables
CREATE TABLE IF NOT EXISTS access.client_types (
    id SERIAL PRIMARY KEY,
    type_code VARCHAR(20) UNIQUE NOT NULL, -- FACIAL, PIN, NO_ID
    type_name VARCHAR(50) NOT NULL,
    description TEXT,
    color_hex VARCHAR(7) NOT NULL,
    requires_identification BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO access.client_types (type_code, type_name, description, color_hex, requires_identification) VALUES
('FACIAL', 'Cliente Facial', 'Cliente identificado por reconocimiento facial con ID permanente', '#60a917', true),
('PIN', 'Cliente PIN', 'Cliente temporal identificado con PIN, datos eliminados tras pago', '#f0a30a', true),
('NO_ID', 'No Identificado', 'Cliente sin identificación, requiere evidencia visual', '#e51400', false)
ON CONFLICT (type_code) DO NOTHING;

-- Inventory schema tables
CREATE TABLE IF NOT EXISTS inventory.stock_movements (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    movement_type VARCHAR(20) NOT NULL, -- SALE, RETURN, ADJUSTMENT
    quantity INTEGER NOT NULL,
    session_id VARCHAR(100),
    reference_type VARCHAR(50), -- CART_ID, CANCELLATION_ID, etc.
    reference_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory.product_stock (
    product_id BIGINT PRIMARY KEY,
    available_quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Initialize stock for sample products
INSERT INTO inventory.product_stock (product_id, available_quantity) 
SELECT id, 100 FROM products.products 
ON CONFLICT (product_id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_sessions_status ON sessions.customer_sessions(status);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_client_type ON sessions.customer_sessions(client_type);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_session ON carts.shopping_carts(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON carts.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products.products(category);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_session ON payments.payment_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_visual_evidence_session ON camera.visual_evidence(session_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON inventory.stock_movements(product_id);
