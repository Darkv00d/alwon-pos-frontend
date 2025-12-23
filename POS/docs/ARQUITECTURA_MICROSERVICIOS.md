# ALWON POS - Arquitectura de Microservicios

## Stack Tecnológico

### Frontend
- **Framework:** React 18
- **Lenguaje:** TypeScript
- **Build Tool:** Vite
- **UI Library:** Material-UI / TailwindCSS
- **State Management:** Redux Toolkit / Zustand
- **Real-time:** WebSocket (Socket.io-client)
- **API Client:** Axios

### Backend
- **Lenguaje:** Java 21 LTS
- **Framework:** Spring Boot 3.x
- **Build Tool:** Maven
- **Base de Datos:** PostgreSQL (producción), H2 (dev/test)
- **ORM:** Spring Data JPA
- **API Documentation:** OpenAPI 3.0 / Swagger
- **Message Queue:** RabbitMQ (para eventos)
- **WebSocket:** Spring WebSocket

---

## Arquitectura de Microservicios

```
┌─────────────────────────────────────────────────────────────┐
│                     TABLET ANDROID - POS                     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │         React 18 + TypeScript + Vite              │     │
│  │  - Dashboard      - Payment UI                     │     │
│  │  - Cart View      - Evidence Viewer                │     │
│  │  - Promo Banner   - History                        │     │
│  └───────────────────┬──────────────────────────────┬─┘     │
│                      │ REST API / WebSocket         │        │
└──────────────────────┼──────────────────────────────┼────────┘
                       │                              │
              ┌────────▼────────┐          ┌─────────▼────────┐
              │   API Gateway    │          │  WebSocket       │
              │   (Port 8080)    │          │  Server          │
              │  Spring Cloud    │          │  (Port 8090)     │
              │   Gateway        │          └──────────────────┘
              └────────┬─────────┘
                       │
       ┌───────────────┼───────────────┬──────────────────┐
       │               │               │                  │
┌──────▼───────┐ ┌────▼──────┐ ┌──────▼─────┐ ┌─────────▼────────┐
│   Session    │ │   Cart    │ │  Product   │ │     Payment      │
│   Service    │ │  Service  │ │  Service   │ │     Service      │
│  (Port 8081) │ │(Port 8082)│ │(Port 8083) │ │   (Port 8084)    │
└──────┬───────┘ └────┬──────┘ └──────┬─────┘ └─────────┬────────┘
       │              │               │                  │
┌──────▼───────┐ ┌────▼──────┐ ┌──────▼─────┐ ┌─────────▼────────┐
│   Camera     │ │  Access   │ │ Inventory  │ │    Central       │
│ Integration  │ │  Control  │ │  Service   │ │    Manager       │
│  Service     │ │  Service  │ │(Port 8087) │ │   (Externo)      │
│  (Port 8085) │ │(Port 8086)│ └────────────┘ └──────────────────┘
└──────────────┘ └───────────┘
       │                │
       │                │
┌──────▼────────────────▼─────┐
│    Concentrador AI           │
│    (Sistema Externo)         │
└──────────────────────────────┘
```

---

## Microservicios Definidos

### 1. **Session Service** (Port 8081)
**Responsabilidades:**
- Gestión de sesiones de clientes
- Registro de inicio/fin de sesión
- Estado de sesiones (ACTIVE, SUSPENDED, CANCELLED, COMPLETED)
- Datos de clientes según tipo (FACIAL, PIN, NOID)

**Endpoints:**
```
POST   /api/sessions                    # Crear sesión
GET    /api/sessions/{id}               # Obtener sesión
GET    /api/sessions/active             # Listar sesiones activas
PUT    /api/sessions/{id}/suspend       # Suspender sesión
DELETE /api/sessions/{id}               # Cancelar sesión
PUT    /api/sessions/{id}/complete      # Completar sesión
```

**Base de Datos:**
```sql
Session {
  id: UUID
  clientType: ENUM(FACIAL, PIN, NOID)
  clientId: String
  clientName: String (nullable)
  clientPhoto: String (Base64 o URL)
  status: ENUM(ACTIVE, SUSPENDED, CANCELLED, COMPLETED)
  createdAt: Timestamp
  updatedAt: Timestamp
  completedAt: Timestamp (nullable)
}
```

---

### 2. **Cart Service** (Port 8082)
**Responsabilidades:**
- Gestión de carritos de compra
- Agregar/quitar productos
- Calcular totales
- Modificaciones manuales con auditoría

**Endpoints:**
```
POST   /api/carts                       # Crear carrito
GET    /api/carts/session/{sessionId}  # Obtener carrito por sesión
POST   /api/carts/{id}/items            # Agregar item
PUT    /api/carts/{id}/items/{itemId}  # Actualizar item
DELETE /api/carts/{id}/items/{itemId}  # Quitar item
GET    /api/carts/{id}/total            # Calcular total
POST   /api/carts/{id}/audit            # Registrar modificación manual
```

**Base de Datos:**
```sql
Cart {
  id: UUID
  sessionId: UUID (FK -> Session)
  total: Decimal
  createdAt: Timestamp
  updatedAt: Timestamp
}

CartItem {
  id: UUID
  cartId: UUID (FK -> Cart)
  productId: UUID (FK -> Product)
  quantity: Integer
  pricePerUnit: Decimal
  subtotal: Decimal
  evidenceUrl: String (nullable, solo para NOID)
  evidenceType: ENUM(VIDEO, GIF, null)
  addedBy: ENUM(AI, MANUAL)
}

CartAudit {
  id: UUID
  cartId: UUID (FK -> Cart)
  action: ENUM(ADD, REMOVE, UPDATE)
  productId: UUID
  quantity: Integer
  modifiedBy: String (operatorId)
  reason: String
  timestamp: Timestamp
}
```

---

### 3. **Product Service** (Port 8083)
**Responsabilidades:**
- Catálogo de productos
- Información de productos (nombre, precio, imagen, ubicación)
- Búsqueda de productos

**Endpoints:**
```
GET    /api/products                    # Listar todos los productos
GET    /api/products/{id}               # Obtener producto por ID
GET    /api/products/search?q={query}   # Buscar productos
POST   /api/products                    # Crear producto (admin)
PUT    /api/products/{id}               # Actualizar producto (admin)
DELETE /api/products/{id}               # Eliminar producto (admin)
```

**Base de Datos:**
```sql
Product {
  id: UUID
  name: String
  description: String
  price: Decimal
  imageUrl: String
  category: String
  stanId: String (ubicación física)
  stanName: String
  active: Boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

---

### 4. **Payment Service** (Port 8084)
**Responsabilidades:**
- Procesamiento de pagos PSE
- Procesamiento de pagos con Débito
- Integración con pasarelas de pago
- Generación de recibos
- Historial de transacciones

**Endpoints:**
```
POST   /api/payments/pse                # Iniciar pago PSE
POST   /api/payments/debit              # Iniciar pago Débito
GET    /api/payments/{id}               # Estado de pago
GET    /api/payments/{id}/receipt       # Obtener recibo
GET    /api/payments/history            # Historial de pagos
POST   /api/payments/{id}/refund        # Reembolso (admin)
```

**Base de Datos:**
```sql
Payment {
  id: UUID
  sessionId: UUID (FK -> Session)
  cartId: UUID (FK -> Cart)
  amount: Decimal
  method: ENUM(PSE, DEBIT)
  status: ENUM(PENDING, SUCCESS, FAILED, REFUNDED)
  transactionId: String (external)
  receiptUrl: String
  createdAt: Timestamp
  completedAt: Timestamp (nullable)
  errorMessage: String (nullable)
}
```

---

### 5. **Camera Integration Service** (Port 8085)
**Responsabilidades:**
- Recibir datos del Concentrador AI
- Almacenar evidencia visual (fotos, videos, GIFs)
- Servir evidencia al POS

**Endpoints:**
```
POST   /api/camera/evidence             # Recibir evidencia del AI
GET    /api/camera/evidence/{id}        # Obtener evidencia
GET    /api/camera/evidence/session/{sessionId}  # Evidencia por sesión
DELETE /api/camera/evidence/{id}        # Eliminar evidencia (datos PIN)
```

**Base de Datos:**
```sql
Evidence {
  id: UUID
  sessionId: UUID (FK -> Session)
  type: ENUM(PERSON_PHOTO, PRODUCT_VIDEO, PRODUCT_GIF)
  fileUrl: String (S3 o filesystem)
  productId: UUID (nullable, FK -> Product)
  capturedAt: Timestamp
  deletedAt: Timestamp (nullable, para PIN)
}
```

---

### 6. **Access Control Service** (Port 8086)
**Responsabilidades:**
- Integración con Video Portero
- Registro de entradas/salidas
- Autorización de acceso
- Bloqueo/desbloqueo de puertas

**Endpoints:**
```
POST   /api/access/entry                # Registrar entrada
POST   /api/access/exit                 # Registrar salida
GET    /api/access/history              # Historial de accesos
POST   /api/access/authorize            # Autorizar salida tras cancelación
```

**Base de Datos:**
```sql
AccessEvent {
  id: UUID
  sessionId: UUID (FK -> Session)
  type: ENUM(ENTRY, EXIT)
  clientType: ENUM(FACIAL, PIN, NOID)
  authorizedBy: String (nullable, para NOID)
  timestamp: Timestamp
  reason: String (nullable, ej: "PURCHASE_COMPLETED", "PURCHASE_CANCELLED")
}
```

---

### 7. **Inventory Service** (Port 8087)
**Responsabilidades:**
- Gestión de stock por ubicación (Stan)
- Actualización de inventario tras pago/cancelación
- Alertas de stock bajo

**Endpoints:**
```
GET    /api/inventory/product/{productId}        # Stock de producto
PUT    /api/inventory/product/{productId}        # Actualizar stock
POST   /api/inventory/return                     # Devolver productos (cancelación)
GET    /api/inventory/stan/{stanId}              # Stock por ubicación
POST   /api/inventory/adjust                     # Ajuste manual de inventario
```

**Base de Datos:**
```sql
InventoryItem {
  id: UUID
  productId: UUID (FK -> Product)
  stanId: String
  quantity: Integer
  lastUpdated: Timestamp
  updatedBy: String
}

InventoryTransaction {
  id: UUID
  productId: UUID (FK -> Product)
  type: ENUM(SALE, RETURN, ADJUSTMENT)
  quantity: Integer (+ or -)
  sessionId: UUID (nullable, FK -> Session)
  reason: String
  timestamp: Timestamp
}
```

---

## Comunicación entre Microservicios

### REST API
- Frontend → API Gateway → Microservicios
- Microservicios entre sí (RestTemplate o WebClient)

### WebSocket
- Frontend ← WebSocket Server ← Concentrador AI
- Actualizaciones en tiempo real:
  - Nuevos clientes entran
  - Productos agregados/quitados
  - Cambios en cantidades

### Message Queue (RabbitMQ)
- **Eventos asíncronos:**
  - `payment.completed` → Actualizar inventario + Cerrar sesión
  - `session.cancelled` → Devolver inventario + Registrar salida
  - `session.suspended` → Notificar a otros servicios

---

## Flujo de Datos - Ejemplo: Pago Exitoso

```
1. Frontend → Payment Service: POST /api/payments/pse
2. Payment Service → PSE Gateway: Procesar pago
3. PSE Gateway → Payment Service: Confirmación exitosa
4. Payment Service → RabbitMQ: Publish "payment.completed"
5. Inventory Service ← RabbitMQ: Consume event → Actualizar stock
6. Session Service ← RabbitMQ: Consume event → Cerrar sesión
7. Camera Service ← RabbitMQ: (Si PIN) Eliminar evidencia temporal
8. Payment Service → Frontend: Response "Pago exitoso"
```

---

## Gestión de Datos según Tipo de Cliente

| Tipo    | Datos Almacenados                  | Al Pagar Exitoso        |
|---------|------------------------------------|-------------------------|
| FACIAL  | Nombre, foto, ID, transacción      | Mantener todo           |
| PIN     | ID temporal, foto temp, transacción| Eliminar foto e ID temp |
| NOID    | ID único, foto física, evidencia   | Mantener todo           |

---

## Seguridad

### Autenticación
- JWT tokens para API Gateway
- Tokens tienen rol: `OPERATOR`, `ADMIN`

### Autorización
- Modificar carrito: requiere rol `OPERATOR` + contraseña adicional
- Admin endpoints: requiere rol `ADMIN`

### CORS
- Frontend en tablet puede hacer requests a API Gateway
- API Gateway valida origen

---

## Despliegue

### Desarrollo
```
Frontend: npm run dev (puerto 5173)
Backend:  mvn spring-boot:run (cada servicio en su puerto)
```

### Producción (Android Tablet)
```
Frontend: APK Android (WebView con React build)
Backend:  Docker Compose con todos los microservicios
```

---

## Próximos Pasos
1. Implementar API Gateway con Spring Cloud Gateway
2. Crear estructura de cada microservicio
3. Implementar Session Service (primer microservicio)
4. Crear frontend React base con routing
5. Integrar WebSocket para tiempo real
