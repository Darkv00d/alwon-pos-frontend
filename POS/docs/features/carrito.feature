# Language: es
# Encoding: UTF-8

Característica: Gestión de Carrito
  Como operador
  Quiero ver y modificar el carrito de los clientes
  Para asegurar la precisión de la compra

  Antecedentes:
    Dado que el operador ha iniciado sesión
    Y hay un cliente "Juan Pérez" con 3 productos en su carrito

  Escenario: Ver detalle completo del carrito
    Cuando el operador selecciona al cliente "Juan Pérez"
    Entonces debe ver el carrito con los siguientes productos:
      | producto           | cantidad | precio | subtotal |
      | Coca Cola 500ml    | 2        | 2000   | 4000     |
      | Pan Integral       | 1        | 3500   | 3500     |
      | Leche Deslactosada | 1        | 5200   | 5200     |
    Y el total debe ser 12700

  Escenario: Modificar carrito requiere contraseña
    Dado que el operador está viendo el carrito de un cliente
    Cuando hace clic en "Modificar Carrito"
    Entonces debe aparecer un diálogo solicitando contraseña
    Y el diálogo debe tener campos para usuario y contraseña

  Escenario: Modificar carrito con contraseña correcta
    Dado que el operador hizo clic en "Modificar Carrito"
    Cuando ingresa la contraseña correcta "admin123"
    Entonces el carrito debe entrar en modo edición
    Y debe poder agregar nuevos productos
    Y debe poder quitar productos existentes
    Y debe poder modificar cantidades

  Escenario: Modificar carrito con  contraseña incorrecta
    Dado que el operador hizo clic en "Modificar Carrito"
    Cuando ingresa una contraseña incorrecta
    Entonces debe ver un mensaje de error "Contraseña incorrecta"
    Y el carrito NO debe entrar en modo edición

  Escenario: Agregar producto manualmente al carrito
    Dado que el carrito está en modo edición
    Cuando el operador busca "Jugo Naranja"
    Y selecciona el producto de la lista
    Y especifica cantidad 2
    Y hace clic en "Agregar"
    Entonces el producto debe aparecer en el carrito
    Y el total debe actualizarse
    Y el cambio debe registrarse en el log de auditoría

  Escenario: Quitar producto del carrito
    Dado que el carrito está en modo edición
    Y hay un producto "Pan Integral" en el carrito
    Cuando el operador hace clic en el ícono de eliminar
    Entonces el producto debe desaparecer del carrito
    Y el total debe recalcularse
    Y el cambio debe registrarse en el log de auditoría
