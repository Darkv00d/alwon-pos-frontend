# 🎨 Alwon - Guía de Identidad de Marca

## Logo

![Alwon Logo](C:/Users/algam/.gemini/antigravity/brain/9ff55730-fefa-4d07-a9df-df542e0f79b8/uploaded_image_1766453723167.jpg)

### Descripción
- **Forma**: Letras "A" y "o" fusionadas en diseño moderno
- **Estilo**: Minimalista, geométrico, tecnológico
- **Color**: Cyan brillante (#00BFFF / hsl(195, 100%, 50%))

---

## Paleta de Colores de Marca

### Color Primario - Cyan Alwon
```css
--alwon-cyan: hsl(195 100% 50%);
/* RGB: rgb(0, 191, 255) */
/* HEX: #00BFFF */
```

**Uso:**
- Logo principal
- Botones primarios
- Enlaces
- Iconos de acción
- Header/navegación

### Variaciones del Cyan

**Cyan Claro** (fondos sutiles)
```css
--alwon-cyan-light: hsl(195 100% 95%);
/* Para badges, fondos de notificaciones */
```

**Cyan Oscuro** (hover states)
```css
--alwon-cyan-dark: hsl(195 100% 35%);
/* Para hover en botones */
```

---

## Uso del Logo en la Aplicación

### Header Principal
```
┌────────────────────────────────────┐
│ [Ao] ALWON POS                     │
│ (cyan) (texto gris oscuro)         │
└────────────────────────────────────┘
```

### Variantes del Logo

**Logo completo**: Para header y pantallas de login
- Icono "Ao" + texto "ALWON POS"
- Color: Cyan (#00BFFF)
- Tamaño: 32px alto

**Logo solo ícono**: Para favicon y notificaciones
- Solo "Ao"
- Color: Cyan
- Tamaño: 24px

**Logo monocromático**: Para impresos/facturación
- Gris oscuro (#2D3748)

---

## Complementos de Color

### Colores de Estado (mantienen su identidad)
- ✅ **Success**: Verde `hsl(140 70% 40%)`
- ⚠️ **Warning**: Naranja `hsl(35 90% 60%)`
- ❌ **Error**: Rojo `hsl(0 80% 60%)`
- ℹ️ **Info**: Cyan Alwon `hsl(195 100% 50%)` ← Usa color de marca

### Colores de Tipos de Cliente
- 🟢 **FACIAL**: Verde `hsl(140 70% 50%)`
- 🟡 **PIN**: Amarillo `hsl(45 95% 55%)`
- 🔴 **NO_ID**: Rojo `hsl(0 75% 60%)`

Estos colores **NO se mezclan** con el cyan de marca para mantener claridad visual.

---

## Tipografía

### Familia Principal
```css
font-family: 'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Jerarquía
- **Logo**: Figtree Bold, 18px
- **Títulos H1**: Figtree SemiBold, 24px
- **Títulos H2**: Figtree Medium, 20px
- **Cuerpo**: Figtree Regular, 16px
- **Secundario**: Figtree Regular, 14px

---

## Espaciado y Diseño

### Filosofía
- **Minimalista**: Mucho espacio en blanco
- **Limpio**: Sin decoraciones innecesarias
- **Profesional**: Alineación precisa
- **Touch-friendly**: Elementos grandes para tablets

### Grid
- **Columnas**: 12 columnas en desktop, 4 en tablet
- **Gutters**: 24px entre columnas
- **Márgenes**: 32px en bordes de pantalla

---

## Aplicación del Cyan Alwon

### ✅ Usar Cyan PARA:
- Logo y branding
- Botones de acción primaria ("Confirmar", "Iniciar")
- Enlaces y navegación
- Iconos de sistema
- Loading spinners
- Focus states de inputs

### ❌ NO usar Cyan PARA:
- Bordes de tipos de cliente (usar verde/amarillo/rojo)
- Botones de cancelar (usar rojo)
- Warnings (usar naranja)
- Success messages (usar verde)

---

## Iconografía

### Estilo
- **Librería**: Lucide Icons (consistente con goveci-temp)
- **Grosor**: 2px stroke
- **Tamaño**: 24px estándar, 32px para acciones principales
- **Color**: Cyan Alwon para activos, gris para inactivos

---

## Ejemplos de Uso

### Botón Primario
```css
.button-primary {
  background: var(--alwon-cyan);
  color: white;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
}

.button-primary:hover {
  background: var(--alwon-cyan-dark);
}
```

### Badge/Tag Informativo
```css
.info-badge {
  background: var(--alwon-cyan-light);
  color: var(--alwon-cyan-dark);
  border: 1px solid var(--alwon-cyan);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
}
```

---

## Accesibilidad

### Contraste
- Cyan sobre blanco: **Ratio 3.14:1** ❌ (No cumple WCAG AA para texto)
  - **Solución**: Usar cyan solo para elementos grandes (botones, íconos)
  - Para texto, usar gris oscuro `hsl(220 10% 20%)`

- Blanco sobre cyan: **Ratio 6.76:1** ✅ (Cumple WCAG AA)
  - OK para botones con texto blanco

### Recomendaciones
1. **Botones**: Cyan con texto blanco ✅
2. **Enlaces**: Usar cyan oscuro `hsl(195 100% 35%)` para mejor contraste
3. **Iconos**: Cyan está OK (no son texto)
4. **Badges**: Usar fondo cyan claro con borde cyan y texto oscuro

---

## PWA Manifest

```json
{
  "name": "Alwon POS",
  "short_name": "Alwon",
  "theme_color": "#00BFFF",
  "background_color": "#FAFAFA",
  "display": "standalone",
  "orientation": "landscape",
  "icons": [
    {
      "src": "/icons/alwon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/alwon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**theme_color**: Utiliza el cyan de Alwon para la barra de estado en Android.
