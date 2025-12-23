# Alwon POS - Sistema de Punto de Venta para Tienda Automatizada

Sistema POS moderno con arquitectura de microservicios para tablets Android, diseñado para tiendas automatizadas con soporte para 3 tipos de acceso de clientes.

## 🏗️ Arquitectura

```
Frontend (PWA)
    ↓
API Gateway (8080) + WebSocket (8090)
    ↓
7 Microservicios (Spring Boot + PostgreSQL + RabbitMQ)
```

### Microservicios

- **API Gateway** (8080): Spring Cloud Gateway
- **WebSocket Server** (8090): Comunicación en tiempo real
- **Session Service** (8081): Autenticación y sesiones
- **Cart Service** (8082): Gestión de carritos
- **Product Service** (8083): Catálogo de productos
- **Payment Service** (8084): Procesamiento de pagos (PSE/Débito)
- **Camera Service** (8085): Reconocimiento facial y evidencia visual
- **Access Service** (8086): Control de acceso y tipos de cliente
- **Inventory Service** (8087): Gestión de inventario y devoluciones

## 🎨 Tipos de Clientes

| Tipo | Color | Descripción |
|------|-------|-------------|
| **FACIAL** | 🟢 Verde | Cliente registrado con ID permanente |
| **PIN** | 🟡 Amarillo | Cliente temporal, datos eliminados tras pago |
| **NO_ID** | 🔴 Rojo | Sin identificación, requiere evidencia visual |

## 🚀 Inicio Rápido

### Prerrequisitos

- **Docker** y **Docker Compose**
- **Java 21** (para desarrollo local sin Docker)
- **Node.js 18+** (para el frontend)
- **Maven 3.9+**

### 1. Levantar toda la infraestructura

```bash
# Clonar el repositorio
git clone https://github.com/Darkv00d/alwon-pos-system.git
cd alwon-pos-system/POS

# Copiar archivo de entorno
cp .env.example .env

# Levantar con Docker Compose
docker-compose up -d

# Ver logs
docker-compose logs -f
```

Esto levantará:
- ✅ PostgreSQL en `localhost:5432`
- ✅ RabbitMQ en `localhost:5672` (Management UI: `localhost:15672`)
- ✅ API Gateway en `localhost:8080`
- ✅ WebSocket Server en `localhost:8090`
- ✅ Todos los microservicios

### 2. Verificar servicios

```bash
# Health check del API Gateway
curl http://localhost:8080/actuator/health

# Listar productos
curl http://localhost:8080/api/products

# RabbitMQ Management UI
# Usuario: alwon
# Contraseña: alwon2024
open http://localhost:15672
```

### 3. Desarrollo local (sin Docker)

#### Backend

```bash
# Terminal 1: Levantar solo PostgreSQL y RabbitMQ
docker-compose up postgres rabbitmq -d

# Terminal 2: Session Service
cd backend/session-service
mvn spring-boot:run

# Terminal 3: Cart Service
cd backend/cart-service
mvn spring-boot:run

# ... (repetir para cada microservicio)
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## 📖 Documentación

- **[Arquitectura de Microservicios](./docs/ARQUITECTURA_MICROSERVICIOS.md)**: Detalles técnicos
- **[Historias de Usuario](./docs/USER_STORIES.md)**: Funcionalidades y estimaciones
- **[Features Gherkin](./docs/features/)**: Casos de prueba BDD
- **[Diagramas](./docs/diagrams/)**: Flujos y arquitectura en DrawIO

### API Documentation

Cada microservicio expone su documentación OpenAPI en:
- `http://localhost:8081/swagger-ui.html` (Session Service)
- `http://localhost:8082/swagger-ui.html` (Cart Service)
- `http://localhost:8083/swagger-ui.html` (Product Service)
- ... etc

## 🧪 Testing

### Backend

```bash
# Tests unitarios
cd backend/session-service
mvn test

# Tests de integración
mvn verify
```

### Frontend

```bash
cd frontend
npm test
npm run test:e2e
```

## 🔧 Configuración

### Variables de Entorno

Consulta [`.env.example`](./.env.example) para todas las variables disponibles.

### Base de Datos

El script [`init-db.sql`](./init-db.sql) crea automáticamente:
- 7 schemas (uno por microservicio)
- Tablas con relaciones
- Datos de ejemplo (10 productos, 1 operador, 3 tipos de cliente)
- Índices para rendimiento

### RabbitMQ

Exchanges y queues configurados:
- `alwon.events` (exchange topic)
- `cart.updated` (cola)
- `payment.processed` (cola)
- `session.closed` (cola)
- `inventory.returned` (cola)

## 📱 PWA para Android Tablet

El frontend React se puede instalar como PWA en tablets Android:

1. Abre Chrome en la tablet
2. Navega a `http://<server-ip>:5173`
3. Menú → "Agregar a pantalla de inicio"
4. La app se instalará como aplicación nativa

### Características PWA

- ✅ **Offline**: Service Worker para caché
- ✅ **Cámara**: Acceso para reconocimiento facial
- ✅ **Push Notifications**: Notificaciones de pago
- ✅ **Instalable**: Ícono en pantalla de inicio
- ✅ **Actualizaciones**: Sin necesidad de Play Store

## 🛠️ Stack Tecnológico

### Backend
- Java 21 (LTS)
- Spring Boot 3.x
- Spring Cloud Gateway
- Spring WebSocket
- Spring Data JPA
- PostgreSQL 15
- RabbitMQ 3
- Maven

### Frontend
- React 18
- TypeScript 5
- Vite 5
- Material-UI / Custom CSS Modules
- Redux Toolkit / Zustand
- Socket.io Client (WebSocket)
- Axios

## 🔐 Seguridad

### Autenticación

- JWT tokens para operadores
- Sesiones temporales para clientes
- Password hash con BCrypt

### Roles

- `ADMIN`: Acceso total
- `OPERATOR`: Operaciones de POS

## 📊 Monitoreo

### Métricas

Cada microservicio expone métricas en:
```
http://localhost:808X/actuator/metrics
http://localhost:808X/actuator/health
```

### Logs

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f cart-service
```

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Add: nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es privado y propiedad de Alwon.

## 👥 Equipo

Desarrollado por el equipo de Alwon para tiendas automatizadas.

---

**Version**: 1.0.0  
**Last Updated**: 2025-12-22
