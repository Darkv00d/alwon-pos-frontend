# Language: es
# Encoding: UTF-8

Característica: Banner Promocional y Opciones de Checkout
  Como sistema
  Quiero ofrecer opciones al cliente antes del pago
  Para mejorar la experiencia y manejar casos especiales

  Antecedentes:
    Dado que el operador ha confirmado la identidad del cliente
    Y el carrito del cliente tiene un total de 12700 pesos

  Escenario: Mostrar banner promocional con ofertas
    Cuando se muestra el banner promocional
    Entonces debe mostrar las ofertas activas:
      | titulo                          | descuento |
      | Lleva 3 Coca Cola por $8,000   | 1000      |
      | Combo Pan + Mermelada = $6,000 | 1500      |
    Y debe mostrar 3 botones: "Cancelar", "Suspender", "Continuar"

  Escenario: Cliente suspende pago para seguir comprando
    Dado que se muestra el banner promocional
    Cuando el operador selecciona "Suspender"
    Entonces la sesión debe permanecer ACTIVA
    Y el carrito debe guardarse completamente
    Y el cliente debe aparecer en el dashboard como "Suspendido"
    Y el cliente puede volver a la tienda

  Escenario: Cliente cancela compra completamente
    Dado que se muestra el banner promocional
    Cuando el operador selecciona "Cancelar"
    Entonces debe aparecer un diálogo de confirmación
    Y el diálogo debe decir "¿Está seguro de cancelar esta compra?"
    Y debe mostrar el total de items a devolver

  Escenario: Confirmación de cancelación con instrucciones de devolución
    Dado que el operador seleccionó "Cancelar"
    Cuando confirma la cancelación
    Entonces debe aparecer pantalla con instrucciones:
      | producto           | ubicacion            |
      | Coca Cola x2       | Stan 3 - Bebidas     |
      | Pan Integral x1    | Stan 7 - Panadería   |
      | Leche x1           | Stan 3 - Bebidas     |
    Y debe haber un botón "Productos Devueltos"

  Escenario: Completar cancelación con integración al Sistema Central
    Dado que se muestran las instrucciones de devolución
    Cuando el operador confirma "Productos Devueltos"
    Entonces el sistema debe:
      | accion                           | resultado |
      | Notificar al Sistema Central     | SUCCESS   |
      | Actualizar inventario            | SUCCESS   |
      | Registrar salida en Acceso       | SUCCESS   |
      | Cerrar sesión del cliente        | SUCCESS   |
      | Vaciar carrito                   | SUCCESS   |
    Y el cliente debe desaparecer del dashboard

  Escenario: Cliente continúa al pago
    Dado que se muestra el banner promocional
    Cuando el operador selecciona "Continuar"
    Entonces debe mostrarse la pantalla de selección de método de pago
    Y debe mostrarse el total a pagar
    Y deben estar disponibles las opciones "PSE" y "Débito"
