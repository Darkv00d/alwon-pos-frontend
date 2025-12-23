# Language: es
# Encoding: UTF-8

Característica: Dashboard de Clientes Activos
  Como operador de la tienda
  Quiero ver todos los clientes activos en tiempo real
  Para saber quiénes están comprando

  Antecedentes:
    Dado que el operador ha iniciado sesión en el POS
    Y el sistema está conectado al Concentrador AI

  Escenario: Ver lista de clientes activos con diferentes tipos
    Dado que hay 3 clientes activos en la tienda:
      | tipo   | nombre          | items |
      | FACIAL | Juan Pérez      | 3     |
      | PIN    | TEMPORAL-001    | 2     |
      | NOID   | NO-ID-005       | 5     |
    Cuando el operador abre el dashboard
    Entonces debe ver 3 clientes en la lista
    Y el cliente "Juan Pérez" debe tener borde verde
    Y el cliente "TEMPORAL-001" debe tener borde amarillo  
    Y el cliente "NO-ID-005" debe tener borde rojo
    Y cada cliente debe mostrar su cantidad de items

  Escenario: Actualización en tiempo real cuando cliente agrega producto
    Dado que el cliente "Juan Pérez" tiene 3 items en su carrito
    Cuando el cliente toma un nuevo producto
    Y el Concentrador AI envía actualización vía WebSocket
    Entonces el contador de items debe actualizarse a 4
    Y el operador debe ver la actualización sin refrescar la página

  Escenario: Distinguir visualmente tipos de clientes
    Dado que hay un cliente tipo FACIAL en la lista
    Cuando el operador pasa el mouse sobre el cliente
    Entonces debe ver un tooltip que dice "Cliente Registrado - Identidad Completa"
    Y el borde debe ser verde (#28a745)
