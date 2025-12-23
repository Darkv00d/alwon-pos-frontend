# 📋 Reglas de Negocio - Alwon POS

## Tipos de Cliente y Privacidad

### 🟢 Cliente FACIAL (Verde)
**Identificación**: Reconocimiento facial permanente

**Datos que SE MUESTRAN:**
- ✅ Foto del cliente
- ✅ Nombre completo
- ✅ ID de cliente permanente
- ✅ Historial de compras

**Características:**
- Cliente registrado en el sistema
- Datos permanentes
- Foto almacenada en base de datos
- Perfil completo disponible

**Experiencia:**
- "Bienvenido de vuelta, Juan Pérez"
- Se muestra foto circular en avatar
- Acceso a promociones personalizadas

---

### 🟡 Cliente PIN (Amarillo)
**Identificación**: PIN temporal biométrico

**Datos que NO SE MUESTRAN:**
- ❌ **NO mostrar foto** (privacidad)
- ❌ NO nombre real (si lo hay)
- ❌ NO almacenar permanentemente

**Datos que SÍ SE MUESTRAN:**
- ✅ Código PIN (ej: "PIN-4521")
- ✅ Session ID temporal
- ✅ Carrito actual

**Características:**
- Cliente temporal que valora privacidad
- Foto biométrica tomada SOLO para identificación
- **Foto se ELIMINA inmediatamente después del pago**
- Sin historial permanente
- Anonimato garantizado

**Experiencia:**
- Avatar muestra ícono genérico "🔑" o "PIN"
- Display: "Cliente PIN-4521"
- No se muestra imagen real del cliente

**Flujo de datos:**
1. Cliente entra → Foto biométrica para generar PIN
2. Durante compra → Solo mostrar código PIN
3. Pago completado → **Foto eliminada automáticamente**
4. No queda registro del cliente

---

### 🔴 Cliente NO IDENTIFICADO (Rojo)
**Identificación**: Sin identificación voluntaria

**Datos que SE MUESTRAN:**
- ✅ **Foto física del cliente** (evidencia de seguridad)
- ✅ Videos/GIFs por producto (evidencia visual)
- ✅ Session ID temporal

**Datos que NO SE MUESTRAN:**
- ❌ Nombre (desconocido)
- ❌ ID permanente

**Características:**
- Cliente no identificado que ingresó sin registro
- **REQUIERE evidencia visual por seguridad**
- Foto del cliente obligatoria
- Video/GIF de cada producto tomado
- Revisión manual requerida
- Datos se mantienen para auditoría

**Experiencia:**
- Avatar muestra foto real del cliente
- Display: "Cliente No Identificado"
- Warning visual (⚠️ rojo)
- Requiere aprobación del operador
- Vista especial con galería de evidencias

**Flujo de evidencia:**
1. Cliente entra → Cámara captura foto física
2. Toma producto → Cámara graba video/GIF
3. POS muestra → Foto + videos de productos
4. Operador revisa → Aprobar o reportar discrepancia
5. Pago → Datos archivados para auditoría (30 días)

---

## Comparación Visual

| Aspecto | FACIAL 🟢 | PIN 🟡 | NO_ID 🔴 |
|---------|----------|--------|----------|
| **Avatar en POS** | Foto real | Ícono genérico 🔑 | Foto real |
| **Nombre** | Nombre completo | "PIN-XXXX" | "No Identificado" |
| **Foto almacenada** | Permanente | Temporal (eliminada) | Temporal (30 días) |
| **Evidencia visual** | No necesaria | No necesaria | Obligatoria |
| **Historial** | Sí | No | No |
| **Privacidad** | Baja | **Alta** | Baja |
| **Revisión manual** | No | No | **Sí (obligatoria)** |

---

## Implementación en UI

### Dashboard - Tarjetas de Sesión

**FACIAL:**
```jsx
<div className="avatar">
  <img src={customer.photoUrl} alt={customer.name} />
</div>
<h3>{customer.name}</h3>
<p>🟢 FACIAL · #{sessionId}</p>
```

**PIN:**
```jsx
<div className="avatar-icon">
  🔑 {/* Ícono genérico, NO foto */}
</div>
<h3>PIN-{pinCode}</h3>
<p>🟡 PIN TEMPORAL · #{sessionId}</p>
```

**NO_ID:**
```jsx
<div className="avatar">
  <img src={physicalPhotoUrl} alt="Cliente" />
  {/* Foto física capturada por cámara */}
</div>
<h3>No Identificado</h3>
<p>🔴 SIN IDENTIFICAR · #{sessionId}</p>
```

---

## Backend - Modelos de Datos

### Session Entity
```java
@Entity
public class CustomerSession {
    private String sessionId;
    
    @Enumerated(EnumType.STRING)
    private ClientType clientType; // FACIAL, PIN, NO_ID
    
    // FACIAL: completo, PIN: null, NO_ID: físico
    private String customerPhotoUrl;
    
    // FACIAL: nombre real, PIN: null, NO_ID: null
    private String customerName;
    
    // Solo PIN
    private String pinCode;
    
    // Solo NO_ID
    @OneToMany
    private List<VisualEvidence> evidences;
}
```

### Lógica de eliminación (PIN)
```java
@Transactional
public void closeSessionAndCleanup(String sessionId) {
    CustomerSession session = findBySessionId(sessionId);
    
    if (session.getClientType() == ClientType.PIN) {
        // ELIMINAR foto biométrica
        if (session.getCustomerPhotoUrl() != null) {
            fileStorageService.delete(session.getCustomerPhotoUrl());
            session.setCustomerPhotoUrl(null);
        }
        
        // ELIMINAR datos personales
        session.setCustomerName(null);
        session.setPinCode(null);
        
        log.info("PIN session {} cleaned - all personal data removed", sessionId);
    }
    
    session.setStatus(SessionStatus.CLOSED);
    save(session);
}
```

---

## Cumplimiento y Seguridad

### FACIAL
- ✅ Datos permanentes con consentimiento
- ✅ GDPR: base legal = consentimiento explícito
- ✅ Cifrado de fotos en BD

### PIN
- ✅ **Privacidad máxima**
- ✅ GDPR: datos temporales, eliminación automática
- ✅ No se almacena historial
- ⚠️ Foto biométrica **solo en RAM durante sesión**
- ✅ Borrado garantizado post-pago

### NO_ID
- ✅ Base legal = seguridad legítima del establecimiento
- ✅ Evidencia visual archivada 30 días
- ✅ Acceso restringido a operadores autorizados
- ⚠️ Revisión manual obligatoria
- ✅ Datos pseudonimizados (sin nombre)

---

## Casos de Uso

### Escenario 1: Cliente PIN preocupado por privacidad
**Entrada:**
- Cliente entra, usa lector biométrico para PIN
- Sistema genera PIN-8234

**Durante compra:**
- Tablet del operador muestra:
  - Avatar: Ícono genérico 🔑
  - Texto: "PIN-8234"
  - **NO se muestra foto**

**Post-pago:**
- Sistema elimina foto biométrica
- PIN-8234 ya no existe en sistema
- Cliente sale sin dejar rastro

### Escenario 2: Cliente NO_ID sospechoso
**Entrada:**
- Cliente entra sin identificarse
- Cámara captura foto física

**Durante compra:**
- Sistema graba video de cada producto tomado

**En POS:**
- Tablet muestra:
  - Avatar: Foto física del cliente
  - Galería: 3 videos de productos
  - Botones: "Aprobar" / "Reportar discrepancia"

**Revisión:**
- Operador valida que productos en video = productos en carrito
- Si todo OK → Aprobar compra
- Si hay discrepancia → Reportar para investigación

---

## Testing

### Unit Tests
```java
@Test
public void whenPinSessionClosed_thenPhotoIsDeleted() {
    // Given
    CustomerSession pinSession = createPinSession();
    pinSession.setCustomerPhotoUrl("/temp/photo123.jpg");
    
    // When
    sessionService.closeSessionAndCleanup(pinSession.getSessionId());
    
    // Then
    CustomerSession updated = sessionService.findById(pinSession.getId());
    assertNull(updated.getCustomerPhotoUrl());
    assertNull(updated.getCustomerName());
    verify(fileStorageService).delete("/temp/photo123.jpg");
}
```

### E2E Tests (Gherkin)
```gherkin
Scenario: Cliente PIN completa compra sin dejar evidencia
  Given un cliente con PIN "PIN-4521"
  And el sistema tiene una foto biométrica temporal
  When el cliente completa el pago
  Then la foto biométrica debe ser eliminada
  And no debe existir registro permanente del cliente
  And el PIN "PIN-4521" debe estar inactivo
```

---

**Última actualización**: 2025-12-22
