# Language: es
# Encoding: UTF-8

Característica: Evidencia Visual para Clientes No Identificados
  Como operador
  Quiero ver la evidencia visual de productos
  Para verificar compras de clientes no identificados

  Antecedentes:
    Dado que hay un cliente tipo NO-ID "NOID-005"
    Y el cliente tiene 3 productos en su carrito
    Y cada producto tiene evidencia visual capturada

  Escenario: Ver foto del cliente no identificado
    Cuando el operador selecciona al cliente "NOID-005"
    Entonces debe ver la foto de la persona
    Y la foto debe tener timestamp de captura
    Y la foto debe mostrarse prominentemente

  Escenario: Ver lista de productos con indicador de evidencia
    Dado que el operador está viendo el carrito de "NOID-005"
    Entonces cada producto debe tener un ícono de evidencia visual
    Y el ícono debe indicar si es video o GIF
    Y debe haber un botón "Ver Evidencia" por producto

  Escenario: Reproducir video de evidencia de producto
    Dado que el carrito muestra "Coca Cola x2"
    Cuando el operador hace clic en "Ver Evidencia"
    Entonces debe abrirse un modal con el video
    Y el video debe mostrar al cliente tomando el producto
    Y debe tener controles de reproducción:
      | control | disponible |
      | Play    | SI         |
      | Pause   | SI         |
      | Cerrar  | SI         |
    Y el video debe tener timestamp visible

  Escenario: Ver múltiples evidencias para mismo producto
    Dado que el carrito muestra "Coca Cola x2"
    Cuando el operador hace clic en "Ver Evidencia"
    Entonces debe ver 2 videos/GIFs
    Y cada uno debe corresponder a una unidad tomada
    Y cada uno debe tener timestamp diferente

  Escenario: Verificar evidencia antes de procesar pago
    Dado que el operador revisa evidencia de todos los productos
    Y todas las evidencias son correctas
    Cuando el operador confirma las evidencias
    Entonces puede proceder al pago normalmente

  Escenario: Modificar carrito si evidencia no coincide
    Dado que el operador revisa evidencia de "Pan Integral"
    Y la evidencia muestra que el cliente tomó "Pan Blanco"
    Cuando el operador hace clic en "Modificar Carrito"
    Y ingresa la contraseña correcta
    Entonces puede corregir el producto
    Y debe poder agregar nota explicativa
    Y la corrección debe registrarse en auditoría

  Escenario: Conservar evidencia después del pago
    Dado que el cliente "NOID-005" completó el pago
    Cuando el operador consulta el historial
    Y busca la transacción de "NOID-005"
    Entonces debe poder acceder a toda la evidencia archivada
    Y la evidencia debe estar disponible por al menos 30 días
