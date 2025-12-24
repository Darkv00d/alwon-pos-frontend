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

-- ================================
-- SESSIONS SCHEMA
-- ================================

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

-- ================================
-- CARTS SCHEMA
-- ================================

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

-- ================================
-- PRODUCTS SCHEMA
-- ================================

CREATE TABLE IF NOT EXISTS products.categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(500),
    icon_url VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products.products (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id BIGINT REFERENCES products.categories(id) ON DELETE SET NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 5,
    image_url VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT true,
    taxable BOOLEAN NOT NULL DEFAULT true,
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 19.00,
    barcode VARCHAR(50),
    brand VARCHAR(50),
    unit VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample categories
INSERT INTO products.categories (name, description, display_order) VALUES
('Electronica', 'Dispositivos electronicos y gadgets', 1),
('Accesorios', 'Accesorios para computadores y dispositivos', 2),
('Audio', 'Equipos y accesorios de audio', 3),
('Almacenamiento', 'Dispositivos de almacenamiento', 4),
('Componentes', 'Componentes de hardware', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert sample products
INSERT INTO products.products (sku, name, description, category_id, price, stock, min_stock, image_url, barcode, brand, unit) VALUES
('PROD-001', 'Laptop Dell XPS 13', 'Portatil ultraligero de 13 pulgadas', (SELECT id FROM products.categories WHERE name = 'Electronica'), 1299.99, 25, 5, '/images/laptop-dell.jpg', '7501234567890', 'Dell', 'unit'),
('PROD-002', 'Mouse Logitech MX Master', 'Mouse inalambrico ergonomico', (SELECT id FROM products.categories WHERE name = 'Accesorios'), 99.99, 50, 10, '/images/mouse-logitech.jpg', '7501234567891', 'Logitech', 'unit'),
('PROD-003', 'Teclado Mecanico RGB', 'Teclado gaming con switches azules', (SELECT id FROM products.categories WHERE name = 'Accesorios'), 149.99, 30, 8, '/images/keyboard-rgb.jpg', '7501234567892', 'Generic', 'unit'),
('PROD-004', 'Monitor LG 27" 4K', 'Monitor UHD con HDR10', (SELECT id FROM products.categories WHERE name = 'Electronica'), 499.99, 15, 5, '/images/monitor-lg.jpg', '7501234567893', 'LG', 'unit'),
('PROD-005', 'Webcam Logitech C920', 'Camara Full HD 1080p', (SELECT id FROM products.categories WHERE name = 'Accesorios'), 79.99, 40, 10, '/images/webcam-c920.jpg', '7501234567894', 'Logitech', 'unit'),
('PROD-006', 'Audifonos Sony WH-1000XM4', 'Audifonos con cancelacion de ruido', (SELECT id FROM products.categories WHERE name = 'Audio'), 349.99, 20, 5, '/images/headphones-sony.jpg', '7501234567895', 'Sony', 'unit'),
('PROD-007', 'SSD Samsung 1TB', 'Disco solido NVMe M.2', (SELECT id FROM products.categories WHERE name = 'Almacenamiento'), 129.99, 60, 15, '/images/ssd-samsung.jpg', '7501234567896', 'Samsung', 'unit'),
('PROD-008', 'RAM Corsair 16GB DDR4', 'Memoria RAM 3200MHz', (SELECT id FROM products.categories WHERE name = 'Componentes'), 89.99, 45, 10, '/images/ram-corsair.jpg', '7501234567897', 'Corsair', 'unit'),
('PROD-009', 'Cargador USB-C 65W', 'Cargador universal tipo C', (SELECT id FROM products.categories WHERE name = 'Accesorios'), 39.99, 80, 20, '/images/charger-usbc.jpg', '7501234567898', 'Generic', 'unit'),
('PROD-010', 'Cable HDMI 4K 2m', 'Cable HDMI 2.1 certificado', (SELECT id FROM products.categories WHERE name = 'Accesorios'), 19.99, 100, 25, '/images/cable-hdmi.jpg', '7501234567899', 'Generic', 'unit')
ON CONFLICT (sku) DO NOTHING;

-- ================================
-- PAYMENTS SCHEMA
-- ================================

CREATE TABLE IF NOT EXISTS payments.payment_transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    payment_method VARCHAR(20) NOT NULL, -- PSE, DEBIT, CREDIT
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, APPROVED, REJECTED, FAILED, CANCELLED
    external_reference VARCHAR(200),
    response_code VARCHAR(50),
    response_message TEXT,
    customer_email VARCHAR(200),
    customer_name VARCHAR(200),
    bank_name VARCHAR(100),
    card_last_digits VARCHAR(4),
    approval_code VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- ================================
-- CAMERA SCHEMA
-- ================================

CREATE TABLE IF NOT EXISTS camera.visual_evidence (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    evidence_type VARCHAR(20) NOT NULL, -- FACIAL_PHOTO, PRODUCT_VIDEO, PRODUCT_GIF, ENTRY_PHOTO, EXIT_PHOTO
    product_id BIGINT,
    file_url VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    duration_seconds INTEGER,
    confidence_score FLOAT,
    face_id VARCHAR(100),
    customer_id VARCHAR(100),
    metadata TEXT,
    captured_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- ACCESS SCHEMA
-- ================================

CREATE TABLE IF NOT EXISTS access.client_types (
    id SERIAL PRIMARY KEY,
    type_code VARCHAR(20) UNIQUE NOT NULL, -- FACIAL, PIN, NO_ID
    type_name VARCHAR(50) NOT NULL,
    description TEXT,
    color_hex VARCHAR(7) NOT NULL,
    requires_identification BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS access.access_log (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100),
    client_type VARCHAR(20) NOT NULL,
    customer_id VARCHAR(100),
    access_type VARCHAR(10) NOT NULL, -- ENTRY, EXIT
    entry_time TIMESTAMP,
    exit_time TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO access.client_types (type_code, type_name, description, color_hex, requires_identification) VALUES
('FACIAL', 'Cliente Facial', 'Cliente identificado por reconocimiento facial con ID permanente', '#60a917', true),
('PIN', 'Cliente PIN', 'Cliente temporal identificado con PIN, datos eliminados tras pago', '#f0a30a', true),
('NO_ID', 'No Identificado', 'Cliente sin identificacion, requiere evidencia visual', '#e51400', false)
ON CONFLICT (type_code) DO NOTHING;

-- ================================
-- INVENTORY SCHEMA
-- ================================

CREATE TABLE IF NOT EXISTS inventory.stock_movements (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    movement_type VARCHAR(20) NOT NULL, -- SALE, RETURN, ADJUSTMENT, RESTOCK, DAMAGE
    quantity INTEGER NOT NULL,
    session_id VARCHAR(100),
    reference_type VARCHAR(50),
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

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_customer_sessions_status ON sessions.customer_sessions(status);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_client_type ON sessions.customer_sessions(client_type);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_session_id ON sessions.customer_sessions(session_id);

-- Carts indexes
CREATE INDEX IF NOT EXISTS idx_shopping_carts_session ON carts.shopping_carts(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON carts.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON carts.cart_items(product_id);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_categories_active ON products.categories(active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON products.categories(display_order);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products.products(active);
CREATE INDEX IF NOT EXISTS idx_products_name ON products.products(name);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_session ON payments.payment_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payments.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON payments.payment_transactions(transaction_id);

-- Camera indexes
CREATE INDEX IF NOT EXISTS idx_visual_evidence_session ON camera.visual_evidence(session_id);
CREATE INDEX IF NOT EXISTS idx_visual_evidence_product ON camera.visual_evidence(product_id);
CREATE INDEX IF NOT EXISTS idx_visual_evidence_face_id ON camera.visual_evidence(face_id);
CREATE INDEX IF NOT EXISTS idx_visual_evidence_customer_id ON camera.visual_evidence(customer_id);

-- Access indexes
CREATE INDEX IF NOT EXISTS idx_access_log_session ON access.access_log(session_id);
CREATE INDEX IF NOT EXISTS idx_access_log_customer ON access.access_log(customer_id);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON inventory.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_session ON inventory.stock_movements(session_id);
