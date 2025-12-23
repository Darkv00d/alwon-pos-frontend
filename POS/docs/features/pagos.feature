# Language: es
# Encoding: UTF-8

Característica: Procesamiento de Pagos
  Como cliente
  Quiero poder pagar con diferentes métodos
  Para completar mi compra de manera conveniente

  Antecedentes:
    Dado que el cliente ha decidido continuar al pago
    Y el carrito tiene un total de 12700 pesos

  Escenario: Pago exitoso con PSE
    Dado que el operador seleccionó "Pagar con PSE"
    Cuando el sistema genera la transacción PSE
    Y se muestra el QR de pago al cliente
    Y el cliente completa el pago en su banco
    Entonces el sistema debe recibir confirmación de pago exitoso
    Y debe actualizar el inventario
    Y debe generar recibo digital
    Y debe cerrar la sesión del cliente
    Y debe mostrar mensaje "Pago Exitoso"

  Escenario: Pago fallido con PSE
    Dado que el operador seleccionó "Pagar con PSE"
    Cuando el sistema genera la transacción PSE
    Y el cliente intenta pagar
    Pero el pago es rechazado por el banco
    Entonces debe mostrar mensaje "Pago Rechazado - Intente nuevamente"
    Y debe permitir reintentar el pago
    Y la sesión debe permanecer activa

  Escenario: Pago exitoso con Tarjeta Débito
    Dado que el operador seleccionó "Pagar con Débito"
    Cuando el datáfono procesa la transacción
    Y la transacción es aprobada
    Entonces debe actualizar el inventario
    Y debe generar recibo digital
    Y debe cerrar la sesión del cliente
    Y debe mostrar mensaje "Pago Exitoso"

  Escenario: Eliminar datos de cliente PIN tras pago exitoso
    Dado que el cliente es tipo PIN "TEMPORAL-001"
    Y el pago fue exitoso
    Cuando se completa el proceso de pago
    Entonces el sistema debe eliminar:
      | dato                    | estado    |
      | Foto biométrica temporal| ELIMINADO |
      | ID temporal             | ELIMINADO |
    Y debe mantener solo el registro de transacción anónimo
    Y debe registrar en log "Datos temporales eliminados"

  Escenario: Mantener datos de cliente FACIAL tras pago
    Dado que el cliente es tipo FACIAL "Juan Pérez"
    Y el pago fue exitoso
    Cuando se completa el proceso de pago
    Entonces todos los datos del cliente deben mantenerse
    Y el registro de transacción debe incluir el ID del cliente
    Y la sesión debe cerrarse normalmente

  Esquema del escenario: Procesamiento de pagos para diferentes tipos de clientes
    Dado que el cliente es tipo <tipo>
    Cuando el pago es <resultado>
    Entonces los datos deben <accion_datos>
    Y el inventario debe <accion_inventario>

    Ejemplos:
      | tipo   | resultado | accion_datos        | accion_inventario |
      | FACIAL | exitoso   | mantenerse         | actualizarse      |
      | PIN    | exitoso   | eliminarse         | actualizarse      |
      | NOID   | exitoso   | mantenerse         | actualizarse      |
      | FACIAL | fallido   | mantenerse         | no_actualizarse   |
      | PIN    | fallido   | mantenerse         | no_actualizarse   |
