# Alwon POS - Frontend PWA

Progressive Web App para el sistema POS de tiendas automatizadas Alwon.

## 🚀 Stack Tecnológico

- **React 18** - Biblioteca UI
- **TypeScript** - Type safety
- **Vite** - Build tool ultrarrápido
- **Zustand** - State management
- **React Router** - Navegación
- **Axios** - HTTP client
- **PWA** - Installable app for Android tablets

## 📦 Instalación

```bash
npm install --legacy-peer-deps
```

## 🛠️ Desarrollo

```bash
npm run dev
```

La aplicación se ejecutará en `http://localhost:3000`

## 🏗️ Build  

```bash
npm run build
```

## 🎨 Características

### ✅ Implementado

- **Dashboard**:
  - Grid de sesiones activas
  - 3 tipos de cliente con colores (Verde/Amarillo/Rojo)
  - Cliente PIN NO muestra foto (privacidad)
  - Totalización en tiempo real

- **CartView**:
  - Productos de comestibles con emojis
  - Foto + dirección del cliente (Torre/Apto)
  - Modo solo lectura (cantidades de IA)
  - Modo edición con código de verificación único
  - Botones +/− y eliminar en modo edición
  - Botón "CONTINUAR AL PAGO" prominente (grande, verde)
  - Botones secundarios (suspender/cancelar) más pequeños

- **Componentes**:
  - `SessionCard` - Tarjeta de sesión
  - `Header` - Encabezado con logo Alwon y reloj

### 🔄 Pendiente

- PaymentView (PSE/Débito)
- WebSocket integration para tiempo real
- Service Worker para offline
- Pruebas con backend real

## 📁 Estructura

```
src/
├── components/      # Componentes reutilizables
│   ├── Header.tsx
│   └── SessionCard.tsx
├── pages/           # Vistas principales
│   ├── Dashboard.tsx
│   └── CartView.tsx
├── services/        # API clients
│   └── api.ts
├── store/           # Zustand store
│   └── appStore.ts
├── styles/          # CSS
│   └── base.css
├── types/           # TypeScript types
│   └── index.ts
├── App.tsx          # Router setup
└── main.tsx         # Entry point
```

## 🎨 Design System

### Colores de Marca Alwon
- **Primary**: `#00BFFF` (Cyan)
- **Background**: `#FAFAFA` (Gris muy claro)
- **Surface**: `#FFFFFF` (Blanco)

### Tipos de Cliente
- 🟢 **FACIAL**: Verde `hsl(140 70% 50%)`
- 🟡 **PIN**: Amarillo `hsl(45 95% 55%)`
- 🔴 **NO_ID**: Rojo `hsl(0 75% 60%)`

## 🔒 Privacidad

- **Clientes FACIAL**: Muestra foto + nombre
- **Clientes PIN**: NO muestra foto (solo ícono 🔑)
- **Clientes NO_ID**: Muestra foto para evidencia

## 📱 PWA

Configurado para instalación en tablets Android:
- Manifest con tema Alwon cyan
- Orientación landscape
- Modo standalone (fullscreen)
- Service Worker para offline

## 🔌 Backend Integration

Proxy configurado en `vite.config.ts`:
- `/api` → `http://localhost:8080`

## 📝 Variables de Entorno

Crear `.env` en la raíz:

```env
VITE_API_URL=http://localhost:8080/api
```

## 🐛 Troubleshooting

### npm install falla
```bash
npm install --legacy-peer-deps
```

### Puerto 3000 en uso
Cambiar en `vite.config.ts`:
```ts
server: {
  port: 3001
}
```

---

**Desarrollado para Alwon POS** 🛒✨
