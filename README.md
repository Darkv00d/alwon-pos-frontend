# Alwon Kiosk - Frontend

Interfaz de usuario del Kiosk POS de Alwon, construida con React + TypeScript.

## 🚀 Tecnologías

- **React 18**
- **TypeScript**
- **Vite**
- **CSS Modules**

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/      # Componentes React
│   │   ├── KioskPOS.tsx
│   │   ├── ModeSelector.tsx
│   │   ├── StaffPinDialog.tsx
│   │   ├── CartModificationDialog.tsx
│   │   ├── CancelDialog.tsx
│   │   └── ReceiptDialog.tsx
│   ├── services/        # API clients
│   │   └── kioskApi.ts
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

## 🔧 Configuración

### Requisitos
- Node.js 18+
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/alwon-kiosk-frontend.git
cd alwon-kiosk-frontend

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

La aplicación estará disponible en: `http://localhost:5174`

## 🎨 Características

### 3 Modos de Identificación
1. **Reconocimiento Facial** - Cliente identificado con foto
2. **Acceso con PIN** - Sin reconocimiento facial (privacidad)
3. **No Identificado** - Invitado sin registro

### Panel del Cliente
- Foto o ícono según modo de identificación
- Nombre, Torre, Apartamento
- Email y Teléfono
- Banners promocionales

### Carrito de Compras
- Productos con imágenes
- Cantidades y precios
- Subtotal, IVA, Total
- Botones de acción

### Funcionalidades
- ✅ Modificación de carrito (staff con PIN)
- ✅ Cancelar transacción
- ✅ Pago con selección de factura post-pago
- ✅ Responsive (tablets y teléfonos)

## ⚙️ Configuración de API

El frontend se conecta al backend en `http://localhost:8080` por defecto.

Para cambiar la URL del backend, editar `src/services/kioskApi.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8080/api';
```

## 🎨 Temas y Estilos

Los colores principales están definidos en `src/App.css`:

```css
--primary-color: #00BFFF;  /* Azul Alwon */
--bg-dark: #000000;
--text-light: #FFFFFF;
```

## 📱 Responsive Design

La interfaz está optimizada para:
- Tablets (principal)
- Teléfonos
- Pantallas grandes

## 🚀 Build para Producción

```bash
npm run build
```

Los archivos estáticos se generarán en `/dist`

## 📝 Licencia

Propietario - Alwon © 2024
