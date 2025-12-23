# ALWON POS - Historias de Usuario

## Epic: Sistema POS para Tablet Android

**Como** operador de tienda automatizada  
**Quiero** un sistema POS en tablet Android  
**Para** procesar pagos de clientes con diferentes tipos de acceso de manera eficiente y segura

---

## Módulo 1: Dashboard y Visualización de Clientes Activos

### US-001: Ver clientes activos en tiempo real
**Como** operador  
**Quiero** ver una lista en tiempo real de todos los clientes activos en la tienda  
**Para** saber quiénes están comprando y cuántos artículos tienen

**Criterios de Aceptación:**
- El dashboard muestra una lista de clientes activos
- Cada cliente muestra: foto, nombre/ID, y cantidad de artículos
- La lista se actualiza en tiempo real vía WebSocket
- Los 3 tipos de clientes se distinguen visualmente:
  - 🟢 FACIAL (verde): Muestra nombre completo
  - 🟡 PIN (amarillo): Muestra ID temporal
  - 🔴 NO ID (rojo): Muestra "No Identificado" + ID único
- El contador de artículos se actualiza cuando el cliente toma/devuelve productos

**Prioridad:** Alta  
**Estimación:** 5 puntos

---

### US-002: Identificar visualmente tipos de clientes
**Como** operador  
**Quiero** identificar rápidamente el tipo de cada cliente (Facial, PIN, No Identificado)  
**Para** saber qué información está disponible y qué acciones requieren

**Criterios de Aceptación:**
- Clientes FACIAL tienen borde verde y muestran nombre completo
- Clientes PIN tienen borde amarillo y muestran "Cliente Temporal"
- Clientes NO ID tienen borde rojo y muestran "No Identificado"
- Cada tipo tiene un ícono distintivo
- El tooltip explica qué significa cada tipo

**Prioridad:** Media  
**Estimación:** 2 puntos

---

## Módulo 2: Gestión de Carrito

### US-003: Ver detalle del carrito de un cliente
**Como** operador  
**Quiero** ver el carrito completo de un cliente seleccionado  
**Para** verificar qué productos está llevando y el total a pagar

**Criterios de Aceptación:**
- Al hacer clic en un cliente, se muestra su carrito completo
- Se muestra cada producto con: imagen pequeña, nombre, cantidad, precio unitario, subtotal
- Se muestra el total general
- Para clientes NO ID, cada producto muestra un ícono de evidencia disponible
- El carrito se actualiza en tiempo real si el cliente agrega/quita productos

**Prioridad:** Alta  
**Estimación:** 5 puntos

---

### US-004: Modificar carrito manualmente (con password)
**Como** operador autorizado  
**Quiero** poder agregar o quitar productos del carrito de un cliente  
**Para** corregir errores de detección de la IA

**Criterios de Aceptación:**
- Botón "Modificar Carrito" visible solo para operadores autorizados
- Al hacer clic, solicita contraseña
- Si la contraseña es correcta, permite:
  - Agregar productos manualmente (buscar y agregar)
  - Quitar productos del carrito
  - Modificar cantidades
- Si la contraseña es incorrecta, muestra error y bloquea
- Los cambios se registran en un log de auditoría
- El botón cambia a "Guardar Cambios" mientras está en modo edición

**Prioridad:** Alta  
**Estimación:** 8 puntos

---

### US-005: Ver evidencia visual para clientes No Identificados
**Como** operador  
**Quiero** ver la foto de la persona y los videos/GIFs de cada producto  
**Para** verificar visualmente que los productos detectados son correctos

**Criterios de Aceptación:**
- Para clientes tipo NO ID, se muestra:
  - Foto de la persona capturada al entrar
  - Un botón "Ver Evidencia" por cada producto
- Al hacer clic en "Ver Evidencia", se reproduce el video o muestra el GIF
- El video muestra el momento exacto en que la persona tomó el producto
- Se puede pausar, reproducir y cerrar la evidencia
- La evidencia se guarda y puede consultarse después del pago

**Prioridad:** Alta  
**Estimación:** 8 puntos

---

## Módulo 3: Banner Promocional y Opciones

### US-006: Mostrar banner promocional antes del pago
**Como** sistema  
**Quiero** mostrar ofertas promocionales al cliente antes de pagar  
**Para** incentivar compras adicionales y mejorar la experiencia

**Criterios de Aceptación:**
- Antes de procesar el pago, se muestra un banner promocional
- El banner muestra ofertas activas relevantes
- El cliente tiene 3 opciones:
  - ⏸️ **Suspender**: Guardar carrito y volver a la tienda
  - ❌ **Cancelar**: Vaciar carrito y cerrar sesión
  - ✅ **Continuar**: Proceder al pago
- El banner es visualmente atractivo y fácil de leer

**Prioridad:** Media  
**Estimación:** 5 puntos

---

### US-007: Suspender pago y volver a comprar
**Como** cliente  
**Quiero** poder suspender mi pago y volver a la tienda  
**Para** agregar más productos antes de pagar

**Criterios de Aceptación:**
- Al seleccionar "Suspender", la sesión permanece ACTIVA
- El carrito se guarda completamente
- El cliente puede volver a la tienda libremente
- El operador sigue viendo al cliente en el dashboard
- Cuando el cliente vuelve al POS, su carrito sigue intacto
- Se puede continuar con el pago normalmente

**Prioridad:** Media  
**Estimación:** 5 puntos

---

### US-008: Cancelar compra con devolución de productos
**Como** cliente  
**Quiero** poder cancelar mi compra completamente  
**Para** salir de la tienda sin llevar nada

**Criterios de Aceptación:**
- Al seleccionar "Cancelar", se muestra confirmación: "¿Está seguro?"
- Si confirma, se muestra pantalla con instrucciones de devolución:
  - Lista de productos con ubicación exacta (Stan)
  - Ejemplo: "Coca Cola x2 → Stan 3 - Nevera de Bebidas"
- El operador confirma que el cliente devolvió los productos
- El sistema notifica al Sistema Central:
  - Registra venta descartada
  - Actualiza inventario (devuelve productos al stock)
  - Registra salida del cliente en Control de Acceso
- La sesión se cierra completamente
- El carrito se vacía

**Prioridad:** Alta  
**Estimación:** 8 puntos

---

## Módulo 4: Procesamiento de Pagos

### US-009: Procesar pago con PSE
**Como** cliente  
**Quiero** pagar con PSE (Pagos Seguros en Línea)  
**Para** completar mi compra de manera segura desde mi banco

**Criterios de Aceptación:**
- Se muestra opción "Pagar con PSE"
- Se muestra el total a pagar claramente
- Al seleccionar PSE:
  - Se genera transacción en el sistema de pagos
  - Se muestra QR o enlace para que el cliente pague
  - Se espera confirmación del banco
- Si el pago es exitoso:
  - Se actualiza el inventario
  - Se genera recibo digital
  - Se cierra la sesión
  - Para clientes PIN, se eliminan datos temporales
- Si el pago falla, se muestra error y permite reintentar

**Prioridad:** Alta  
**Estimación:** 13 puntos

---

### US-010: Procesar pago con Tarjeta Débito
**Como** cliente  
**Quiero** pagar con tarjeta débito  
**Para** completar mi compra de manera rápida

**Criterios de Aceptación:**
- Se muestra opción "Pagar con Débito"
- El datáfono se integra con el POS
- Se procesa el pago mediante el datáfono
- Si el pago es exitoso:
  - Se actualiza el inventario
  - Se genera recibo digital
  - Se cierra la sesión
  - Para clientes PIN, se eliminan datos temporales
- Si el pago falla, se muestra error y permite reintentar

**Prioridad:** Alta  
**Estimación:** 13 puntos

---

### US-011: Eliminar datos de clientes PIN tras pago
**Como** sistema  
**Quiero** eliminar automáticamente los datos temporales de clientes PIN  
**Para** cumplir con privacidad y no almacenar datos innecesarios

**Criterios de Aceptación:**
- Al confirmar pago exitoso de cliente tipo PIN:
  - Se elimina la foto biométrica temporal
  - Se elimina el ID temporal
  - Se mantiene solo el registro de transacción (sin datos personales)
- El proceso es automático e inmediato
- Se registra en log que los datos fueron eliminados

**Prioridad:** Alta  
**Estimación:** 3 puntos

---

## Módulo 5: Historial y Auditoría

### US-012: Ver historial de transacciones
**Como** operador  
**Quiero** ver el historial de transacciones completadas  
**Para** consultar ventas anteriores y resolver dudas

**Criterios de Aceptación:**
- Se muestra una lista de transacciones pasadas
- Se puede filtrar por:
  - Fecha (hoy, últimos 7 días, rango personalizado)
  - Tipo de cliente (Facial, PIN, No ID)
  - Estado (Exitosa, Cancelada, Fallida)
- Cada transacción muestra:
  - Fecha y hora
  - ID de transacción
  - Tipo de cliente
  - Total pagado
  - Método de pago
- Se puede ver el detalle completo de cada transacción
- Para clientes NO ID, se puede ver la evidencia archivada

**Prioridad:** Media  
**Estimación:** 8 puntos

---

## Módulo 6: Manejo de Sesiones

### US-013: Confirmar identidad del cliente en checkout
**Como** operador  
**Quiero** confirmar visualmente la identidad del cliente antes de procesar el pago  
**Para** asegurar que estoy cobrando a la persona correcta

**Criterios de Aceptación:**
- Cuando un cliente se acerca al POS:
  - El operador selecciona al cliente de la lista
  - Se muestra la foto del cliente en grande
  - El operador compara la foto con la persona física
  - El operador confirma o rechaza la identidad
- Si se confirma, se muestra el carrito y se procede al pago
- Si se rechaza, se vuelve a la selección de clientes
- El proceso de confirmación es obligatorio para todos los tipos

**Prioridad:** Alta  
**Estimación:** 5 puntos

---

## Notas de Implementación

### Colores por Tipo de Cliente
- 🟢 **FACIAL (Verde #d4edda)**: Cliente registrado, identidad completa
- 🟡 **PIN (Amarillo #fff3cd)**: Cliente temporal, datos se eliminan
- 🔴 **NO ID (Rojo #f8d7da)**: Sin identidad, requiere evidencia visual

### Prioridades Generales
1. **Alta**: Dashboard, carrito, pagos, cancelaciones
2. **Media**: Banner promocional, historial, suspender
3. **Baja**: Optimizaciones y mejoras de UX

### Total de Puntos Estimados: 94 puntos
- Velocidad estimada: 10-15 puntos por sprint
- Duración estimada: 6-10 sprints (12-20 semanas)
