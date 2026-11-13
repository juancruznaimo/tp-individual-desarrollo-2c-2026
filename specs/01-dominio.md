# 01 — Modelo de dominio

Basado en `Diagrama Clase Individual.png` ("Diagrama Tentativo"). Las diferencias con el diagrama están marcadas con **[agregado]** o **[decisión]** y justificadas.

## Entidades

Todas las entidades tienen un `id: String` (UUID) **[agregado]**, que hace falta para referenciarlas desde la API.

### Usuario

| Atributo | Tipo | Notas |
|---|---|---|
| nombre | String | obligatorio |
| apellido | String | obligatorio |
| email | String | **[agregado]** único; se muestra en el selector de usuario |
| favoritos | Evento[] | se guardan como IDs de evento |

No existe un rol fijo **[decisión]**: un mismo usuario es *organizador* de los eventos que creó y *comprador* de las compras que hizo. Así lo modela el diagrama (`Evento.organizador: Usuario`, `Compra.comprador: Usuario`).

### Categoria

| Atributo | Tipo |
|---|---|
| nombre | String (único) |
| descripcion | String |

Las categorías son fijas y vienen del seed: Recitales, Teatro, Festivales, Conferencias, Deportes, Stand-up.

### TipoEntrada

| Atributo | Tipo | Notas |
|---|---|---|
| nombre | String | ej. General, Platea, VIP. Único dentro del evento |
| descripcion | String | opcional |
| precio | Double | `>= 0`, hasta 2 decimales |
| cupo | Int | **[decisión]** cupo *disponible*: se descuenta al comprar y se repone al cancelar |
| cupoTotal | Int | **[agregado]** cupo inicial, para mostrar "vendidas / total" (CU-02) |

**Métodos**

- `hayCupoPara(cantidad: Int): Boolean` → `cantidad <= cupo`.
- `reservar(cantidad)` **[agregado]** → si no `hayCupoPara(cantidad)` lanza `SinCupoError`; si hay, `cupo -= cantidad`.
- `liberar(cantidad)` **[agregado]** → `cupo = min(cupo + cantidad, cupoTotal)`.

### Evento

| Atributo | Tipo | Notas |
|---|---|---|
| nombre | String | obligatorio, 3–120 caracteres |
| descripcion | String | obligatorio, hasta 2000 caracteres |
| categoria | Categoria | debe existir |
| fecha | DateTime | debe ser futura al momento de crear el evento |
| lugar | String | **[agregado]** obligatorio. Lo necesita el chat ("acceso al lugar") y es básico para el usuario |
| tiposEntrada | TipoEntrada[] | al menos 1, nombres sin repetir |
| multimedia | String[] | URLs de imágenes `http(s)`; hasta 10 |
| organizador | Usuario | el usuario que lo crea |
| creadoEn | DateTime | **[agregado]** |

**Métodos**

- `tuPrecioEstaEntre(min: Int, max: Int): Boolean` → `true` si **algún** tipo de entrada tiene `min <= precio <= max`. Cualquiera de los dos límites puede faltar (sin límite de ese lado).
- `precioMinimo(): Double` **[agregado]** → menor precio entre sus tipos de entrada. Se usa para ordenar por precio y para mostrar "desde $X".
- `yaOcurrio(ahora): Boolean` **[agregado]** → `fecha <= ahora`.
- `tipoEntrada(id): TipoEntrada` **[agregado]** → lanza `NoEncontradoError` si el tipo no pertenece al evento.
- `coincideCon(texto): Boolean` **[agregado]** → búsqueda sin distinguir mayúsculas ni tildes sobre `nombre`, `descripcion`, `lugar` y nombre de la categoría.

### Compra

| Atributo | Tipo | Notas |
|---|---|---|
| comprador | Usuario | |
| evento | Evento | |
| tipoEntrada | TipoEntrada | |
| cantidad | Int | entero entre 1 y 10 **[decisión: tope por compra]** |
| total | Double | `precio * cantidad` calculado al crear la compra (el precio queda fijo aunque cambie después) |
| estado | EstadoCompra | arranca en `PENDIENTE` |
| mensajes | Mensaje[] | chat de la compra |
| historial | CambioEstadoCompra[] | **[agregado]** navegabilidad inversa de `CambioEstadoCompra.compra` |
| creadaEn | DateTime | **[agregado]** |

**Métodos**

- `actualizarEstado(nuevoEstado, quien, ahora): void` → valida la transición contra la máquina de estados (abajo). Si es inválida lanza `TransicionInvalidaError`; si es válida cambia `estado` y agrega un `CambioEstadoCompra` al historial.
- `puedeCancelarse(ahora): Boolean` **[agregado]** → regla de CU-08.
- `diasRestantes(ahora): Int | null` **[agregado]** → solo si `estado = CONFIRMADA` (CU-01). Ver "Cálculo de días restantes".
- `participa(usuario): Boolean` **[agregado]** → `true` si el usuario es el comprador o el organizador del evento.
- `agregarMensaje(usuario, texto, ahora)` **[agregado]** → valida que `participa(usuario)` y agrega el `Mensaje`.

### Mensaje

| Atributo | Tipo | Notas |
|---|---|---|
| usuario | Usuario | autor; tiene que participar de la compra |
| mensaje | String | 1–1000 caracteres, sin espacios al principio ni al final |
| enviado | DateTime | |

### Resenia

| Atributo | Tipo | Notas |
|---|---|---|
| comprador | Usuario | |
| evento | Evento | |
| detalle | String | 1–1000 caracteres |
| puntuacion | Double | entre 1 y 5, en pasos de 0.5 |
| creadaEn | DateTime | **[agregado]** |

### CambioEstadoCompra

| Atributo | Tipo |
|---|---|
| compra | Compra |
| estado | EstadoCompra (el estado nuevo) |
| quien | Usuario (`null` si el cambio lo hizo el sistema) |
| fechaHora | DateTime |

Al crear una compra se registra un primer cambio a `PENDIENTE`.

### EstadoCompra (enum)

`PENDIENTE`, `CONFIRMADA`, `UTILIZADA`, `CANCELADA`, `REEMBOLSADA`.

## Máquina de estados de la compra

```
                 pagar (comprador)
   PENDIENTE ───────────────────────▶ CONFIRMADA ──── marcar uso (organizador) ───▶ UTILIZADA
       │                                  │
       │ cancelar (comprador)             │ cancelar (comprador)
       ▼                                  ▼
   CANCELADA ◀────────────────────────────┘
       │
       │ reembolso automático (sistema), solo si la compra se había pagado
       ▼
  REEMBOLSADA
```

| Desde | Hacia | Quién | Condición |
|---|---|---|---|
| PENDIENTE | CONFIRMADA | comprador | el evento no ocurrió |
| PENDIENTE | CANCELADA | comprador | `puedeCancelarse` |
| CONFIRMADA | CANCELADA | comprador | `puedeCancelarse` |
| CANCELADA | REEMBOLSADA | sistema | la compra había pasado por `CONFIRMADA` |
| CONFIRMADA | UTILIZADA | organizador del evento | — |

Estados finales: `UTILIZADA`, `REEMBOLSADA` y `CANCELADA` (cuando nunca se pagó).

**[decisión] Pago simulado.** No hay pasarela de pagos: el comprador confirma la compra con una acción "Pagar". Queda como punto de extensión.

**[decisión] Reembolso.** Cuando se cancela una compra `CONFIRMADA`, el servicio aplica dos transiciones seguidas, `CONFIRMADA → CANCELADA → REEMBOLSADA`, y registra ambas en el historial (la segunda con `quien = null`). Si la compra estaba `PENDIENTE`, no hubo pago y termina en `CANCELADA`.

**[decisión] Marcar como utilizada.** No se restringe por fecha, para poder hacer la demo con datos del seed. Cualquier transición que no figure en la tabla lanza `TransicionInvalidaError`.

## Reglas de negocio

| ID | Regla | CU |
|---|---|---|
| RN-01 | Solo se puede comprar si el evento no ocurrió, el tipo de entrada pertenece al evento, `cantidad` es un entero entre 1 y 10 y `tipoEntrada.hayCupoPara(cantidad)` | CU-12 |
| RN-02 | Comprar descuenta cupo del tipo de entrada. Las compras `PENDIENTE` también reservan cupo | CU-12 |
| RN-03 | Pasar a `CANCELADA` repone el cupo (`liberar`) | CU-07 |
| RN-04 | `puedeCancelarse(ahora)` ⇔ `estado ∈ {PENDIENTE, CONFIRMADA}` y `!evento.yaOcurrio(ahora)` | CU-07, CU-08 |
| RN-05 | Solo el comprador puede pagar o cancelar su compra | CU-07 |
| RN-06 | Solo el organizador del evento puede marcar una compra como `UTILIZADA` y ver las compras del evento | CU-02 |
| RN-07 | En el chat de una compra solo escriben y leen el comprador y el organizador del evento, sin importar el estado de la compra | CU-05, CU-06 |
| RN-08 | Un usuario puede reseñar un evento solo si tiene al menos una compra `UTILIZADA` de ese evento. Una reseña por usuario y evento | CU-09 |
| RN-09 | El organizador no puede comprar entradas de sus propios eventos ni reseñarlos | — |
| RN-10 | **Puntaje del organizador** = promedio de `puntuacion` de todas las reseñas de todos sus eventos, redondeado a 1 decimal. `null` si no tiene reseñas | CU-10, CU-11 |
| RN-11 | `total = round2(tipoEntrada.precio * cantidad)` | CU-12 |
| RN-12 | La búsqueda devuelve por defecto solo eventos que no ocurrieron | CU-03 |

## Cálculo de días restantes

`diasRestantes(ahora)` = diferencia en **días calendario** entre la fecha de `ahora` y la fecha del evento, ambas en `America/Argentina/Buenos_Aires`.

- `0` → el evento es hoy (la app muestra "¡Es hoy!").
- `1` → "Falta 1 día".
- `n` → "Faltan n días".
- `null` si la compra no está `CONFIRMADA`.

Para que los tests sean deterministas, todas las funciones que dependen de la hora reciben `ahora` como parámetro (o de un `clock` inyectable en los servicios).

## Disponibilidad por tipo de entrada (CU-02)

Para cada tipo de entrada de un evento:

- `disponibles` = `tipoEntrada.cupo`
- `vendidas` = suma de `cantidad` de las compras de ese tipo con estado `PENDIENTE`, `CONFIRMADA` o `UTILIZADA`
- `cupoTotal` = `tipoEntrada.cupoTotal`

Invariante (se testea): `disponibles + vendidas = cupoTotal`.

## Errores de dominio

| Error | HTTP | Código |
|---|---|---|
| `ValidacionError` | 400 | `VALIDACION` |
| `NoAutenticadoError` | 401 | `NO_AUTENTICADO` |
| `ProhibidoError` | 403 | `PROHIBIDO` |
| `NoEncontradoError` | 404 | `NO_ENCONTRADO` |
| `SinCupoError` | 409 | `SIN_CUPO` |
| `TransicionInvalidaError` | 409 | `TRANSICION_INVALIDA` |
| `ReglaNegocioError` | 409 | `REGLA_NEGOCIO` (cualquier otra regla RN-xx) |

Todos heredan de `AppError(status, codigo, mensaje, detalles?)`.
