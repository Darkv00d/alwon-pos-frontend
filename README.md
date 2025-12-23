# Alwon POS System - Documentación Completa

Sistema POS para tiendas automatizadas con reconocimiento facial, gestión de inventario y pagos digitales.

## 🏗️ Arquitectura del Sistema

### Repositorios

| Repositorio | Descripción | URL |
|-------------|-------------|-----|
| **Frontend** | React PWA para tablets Android | [alwon-pos-frontend](https://github.com/Darkv00d/alwon-pos-frontend) |
| **Backend** | 9 microservicios Java Spring Boot | [alwon-pos-backend](https://github.com/Darkv00d/alwon-pos-backend) |
| **Docs** | Documentación completa del sistema | [alwon-pos-system](https://github.com/Darkv00d/alwon-pos-system) |

---

## 📚 Contenido de la Documentación

### 📊 Diagramas y Flujos
- [`DIAGRAMA_POS_UNIFICADO.md`](DIAGRAMA_POS_UNIFICADO.md) - Flujo completo del POS en Mermaid
- [`DIAGRAMA_COMPLETO_MERMAID.md`](DIAGRAMA_COMPLETO_MERMAID.md) - 7 fases del sistema
- [`Diagrama_Flujo_Tienda_Automatizada.drawio`](Diagrama_Flujo_Tienda_Automatizada.drawio) - Flujo visual DrawIO
- [`Diagrama_3_Tipos_Acceso.drawio`](Diagrama_3_Tipos_Acceso.drawio) - 3 tipos de cliente
- [`POS/docs/diagrams/Arquitectura_Microservicios.drawio`](POS/docs/diagrams/Arquitectura_Microservicios.drawio) - Arquitectura técnica

### 🏛️ Arquitectura
- [`ARQUITECTURA_MICROSERVICIOS.md`](ARQUITECTURA_MICROSERVICIOS.md) - Arquitectura completa de microservicios
- Descripción de los 9 microservicios
- Stack tecnológico
- Esquemas de base de datos

### 📖 Especificaciones Funcionales
- [`Funcionalidades_POS.md`](Funcionalidades_POS.md) - Mapa de navegación del sistema
- [`Diagrama_Flujo_POS_Completo.md`](Diagrama_Flujo_POS_Completo.md) - 3 tipos de acceso de clientes
- [`Funcionalidad_Banner_Promocional.md`](Funcionalidad_Banner_Promocional.md) - Banner promocional
- [`Cancel_vs_Suspend.md`](Cancel_vs_Suspend.md) - Diferencias entre cancelar y suspender
- [`Flujo_Cancelacion_Devolucion.md`](Flujo_Cancelacion_Devolucion.md) - Proceso de devolución
- [`Integracion_Sistema_Central.md`](Integracion_Sistema_Central.md) - Integración con sistema central

### 👤 User Stories
- [`USER_STORIES.md`](USER_STORIES.md) - 13 user stories completas con criterios de aceptación

### 🥒 Features Gherkin
- [`features/dashboard.feature`](features/dashboard.feature) - Dashboard
- [`features/carrito.feature`](features/carrito.feature) - Gestión de carrito
- [`features/banner_promocional.feature`](features/banner_promocional.feature) - Banner y checkout
- [`features/pagos.feature`](features/pagos.feature) - Procesamiento de pagos
- [`features/evidencia_visual.feature`](features/evidencia_visual.feature) - Evidencia para clientes no identificados

### 📁 Documentación del Proyecto
- [`POS/README.md`](POS/README.md) - Guía general del proyecto completo

---

## 🎯 3 Tipos de Cliente

### 🟢 Cliente FACIAL
- Reconocimiento facial permanente
- Datos almacenados
- Historial de compras
- **Mostrar foto**: ✅ SÍ

### 🟡 Cliente PIN  
- PIN temporal biométrico
- **Privacidad máxima**
- **Mostrar foto**: ❌ NO (solo ícono 🔑)
- Datos eliminados post-pago

### 🔴 Cliente NO_ID
- Sin identificación
- **Requiere evidencia visual**
- **Mostrar foto**: ✅ SÍ (evidencia)
- Videos/fotos por producto

---

## 🏗️ Stack Tecnológico

### Frontend
- React 18 + TypeScript
- Vite
- PWA (Android tablets)
- Zustand (state)
- WebSocket
- Alwon branding (cyan #00BFFF)

### Backend
- Java 21 LTS
- Spring Boot 3.x
- Spring Cloud Gateway
- PostgreSQL
- RabbitMQ
- WebSocket (STOMP)
- Docker Compose

---

## 🚀 Quick Start

### 1. Backend
```bash
cd backend
docker-compose up -d
```
**Puertos:**
- API Gateway: 8080
- WebSocket: 8090
- PostgreSQL: 5432

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
**URL:** http://localhost:3001

---

## 📊 Arquitectura de Microservicios

```
┌─────────────────┐
│   Frontend PWA  │ :3001
└────────┬────────┘
         │
┌────────▼────────┐
│  API Gateway    │ :8080
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┬──────────┐
    │         │          │          │          │
┌───▼───┐ ┌──▼──┐  ┌────▼────┐ ┌──▼──┐  ┌────▼────┐
│Session│ │Cart │  │Product  │ │Pay  │  │Camera   │
│ :8081 │ │:8082│  │  :8083  │ │:8084│  │  :8085  │
└───┬───┘ └──┬──┘  └────┬────┘ └──┬──┘  └────┬────┘
    │        │           │         │          │
┌───▼───┐ ┌──▼──┐  ┌────▼────┐ ┌──▼──────────▼────┐
│Access │ │Inv  │  │WebSocket│ │   PostgreSQL     │
│ :8086 │ │:8087│  │  :8090  │ │     :5432        │
└───────┘ └─────┘  └─────────┘ └──────────────────┘
                                         │
                                   ┌─────▼─────┐
                                   │  RabbitMQ │
                                   │   :5672   │
                                   └───────────┘
```

---

## 🔒 Privacidad y Seguridad

- **JWT** para autenticación de operadores
- **BCrypt** para passwords
- Eliminación automática de datos PIN post-pago
- Evidencia visual para clientes no identificados
- Audit trail completo

---

## 📝 Notas de Desarrollo

Este repositorio contiene **solo documentación**.

**Código fuente:**
- Frontend: [alwon-pos-frontend](https://github.com/Darkv00d/alwon-pos-frontend)
- Backend: [alwon-pos-backend](https://github.com/Darkv00d/alwon-pos-backend)

---

**Desarrollado para Alwon - Sistema de Tiendas Automatizadas** 🛒✨
