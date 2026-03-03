# Arquitectura Frontend — Heroica

> **Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Zustand · Shadcn/ui · Sonner

---

## Tabla de Contenidos

1. [Estructura de directorios](#1-estructura-de-directorios)
2. [Enrutado (App Router)](#2-enrutado-app-router)
3. [Páginas](#3-páginas)
4. [Componentes](#4-componentes)
5. [Stores (Zustand)](#5-stores-zustand)
6. [Custom Hooks](#6-custom-hooks)
7. [Lib — Utilidades compartidas](#7-lib--utilidades-compartidas)
8. [Endpoints de la API](#8-endpoints-de-la-api)
9. [Flujo de autenticación](#9-flujo-de-autenticación)

---

## 1. Estructura de directorios

```
Front_Heroica/
├── app/                        # App Router de Next.js
│   ├── layout.tsx              # Layout raíz (fuentes + Toaster)
│   ├── globals.css             # Estilos globales
│   ├── page.tsx                # Login (ruta raíz "/")
│   ├── sucursales/
│   │   ├── page.tsx            # Lista de sucursales "/sucursales"
│   │   └── [id]/
│   │       ├── page.tsx        # Detalle de sucursal "/sucursales/:id"
│   │       ├── caja-efectivo/
│   │       │   └── page.tsx    # Caja efectivo "/sucursales/:id/caja-efectivo"
│   │       ├── caja-banco/
│   │       │   └── page.tsx    # Caja banco "/sucursales/:id/caja-banco"
│   │       ├── pagos-pendientes/
│   │       │   └── page.tsx    # Pagos pendientes "/sucursales/:id/pagos-pendientes"
│   │       └── reportes/
│   │           └── page.tsx    # Reportes "/sucursales/:id/reportes"
│   └── configuracion/
│       └── page.tsx            # Configuración global "/configuracion"
│
├── components/                 # Componentes reutilizables
│   ├── Navbar.tsx              # Barra de navegación superior
│   ├── NuevoMovimientoDialog.tsx  # Dialog unificado para crear movimientos
│   ├── caja/                   # Componentes específicos del módulo caja
│   │   ├── CajaTabs.tsx        # Tabs Saldo Real / Saldo Necesario
│   │   ├── PageHeader.tsx      # Cabecera con título y botón "Nuevo Movimiento"
│   │   ├── StatusBadge.tsx     # Badge de estado/prioridad reutilizable
│   │   ├── TransactionTable.tsx # Tabla de movimientos con acciones
│   │   └── TransactionDialogs.tsx # Dialogs: Detalles, CambioEstado, Eliminar
│   └── ui/                     # Primitivos Shadcn/ui
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       └── textarea.tsx
│
├── store/
│   └── authStore.ts            # Store Zustand de autenticación
│
├── hooks/
│   ├── use-auth-guard.ts       # Guard de autenticación + logout
│   └── use-caja-data.ts        # Lógica centralizada del módulo caja
│
├── lib/
│   ├── config.ts               # API_URL y todos los API_ENDPOINTS
│   ├── types.ts                # Interfaces TypeScript compartidas
│   ├── formatters.ts           # Funciones de formateo (fecha, monto, colores)
│   └── utils.ts                # Utilidades menores (cn, etc.)
│
└── public/                     # Assets estáticos (logos, íconos)
```

---

## 2. Enrutado (App Router)

El proyecto usa **Next.js App Router** (directorio `app/`). Todas las rutas son **Client Components** (`"use client"`).

| Ruta                               | Archivo                                         | Descripción                                        |
| ---------------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| `/`                                | `app/page.tsx`                                  | Login                                              |
| `/sucursales`                      | `app/sucursales/page.tsx`                       | ABM de sucursales                                  |
| `/sucursales/:id`                  | `app/sucursales/[id]/page.tsx`                  | Detalle + documentos                               |
| `/sucursales/:id/caja-efectivo`    | `app/sucursales/[id]/caja-efectivo/page.tsx`    | Caja en efectivo                                   |
| `/sucursales/:id/caja-banco`       | `app/sucursales/[id]/caja-banco/page.tsx`       | Caja bancaria                                      |
| `/sucursales/:id/pagos-pendientes` | `app/sucursales/[id]/pagos-pendientes/page.tsx` | Pagos pendientes                                   |
| `/sucursales/:id/reportes`         | `app/sucursales/[id]/reportes/page.tsx`         | Reportes                                           |
| `/configuracion`                   | `app/configuracion/page.tsx`                    | Configuración (categorías, bancos, medios de pago) |

### Redirecciones de guard

- Si el usuario **no está autenticado**, `useAuthGuard` redirige automáticamente a `/`.
- Al hacer logout, el usuario es enviado a `/`.

---

## 3. Páginas

### `app/page.tsx` — Login

- Formulario de usuario y contraseña.
- POST a `API_ENDPOINTS.AUTH.LOGIN`.
- Al autenticarse, guarda `token` y `user` en el `authStore` (Zustand) y navega a `/sucursales`.

### `app/sucursales/page.tsx` — Lista de Sucursales

- Carga todas las sucursales desde `API_ENDPOINTS.SUCURSALES.GET_ALL`.
- Permite **crear** y **eliminar** sucursales.
- Cada tarjeta navega a `/sucursales/:id`.
- Usa: `Navbar`, `useAuthGuard`, primitivos Shadcn.

### `app/sucursales/[id]/page.tsx` — Detalle de Sucursal

- Carga datos via `API_ENDPOINTS.SUCURSALES.GET_BY_ID`.
- Carga totales de caja efectivo y banco (`MOVIMIENTOS.GET_TOTALES`, `CAJA_BANCO.GET_TOTALES`).
- Carga conteo de pagos pendientes (`PAGOS_PENDIENTES.GET_BY_SUCURSAL`).
- Permite:
  - **Editar** datos de la sucursal.
  - **Gestionar documentos** (subir, descargar, eliminar).
- Tarjetas de acceso rápido a: Caja Efectivo, Caja Banco, Pagos Pendientes, Reportes.
- Usa: `Navbar`, `useAuthGuard`, `formatMonto`, Dialog de Shadcn.

### `app/sucursales/[id]/caja-efectivo/page.tsx` — Caja Efectivo

- Consume `useCajaData("efectivo")` para toda la lógica de datos.
- Muestra dos tabs: **Saldo Real** (movimientos completados) y **Saldo Necesario** (pendientes/aprobados).
- Acciones sobre movimientos: ver detalles/editar, cambiar estado, eliminar.
- Botón "Nuevo Movimiento" abre `NuevoMovimientoDialog` con `cajaTipo="efectivo"`.
- Usa: `PageHeader`, `CajaTabs`, `TransactionTable`, `TransactionDialogs`, `NuevoMovimientoDialog`, `Navbar`.

### `app/sucursales/[id]/caja-banco/page.tsx` — Caja Banco

- Idéntica lógica a Caja Efectivo pero con `useCajaData("banco")`.
- Muestra además un **panel de parciales por banco** (`BancoParcial[]`).
- Columnas adicionales en la tabla: Comprobante, Medio de Pago, Banco.
- Botón "Nuevo Movimiento" abre `NuevoMovimientoDialog` con `cajaTipo="banco"`.

### `app/sucursales/[id]/pagos-pendientes/page.tsx` — Pagos Pendientes

- Carga pagos via `API_ENDPOINTS.PAGOS_PENDIENTES.GET_BY_SUCURSAL`.
- Acciones: **Aprobar**, **Rechazar** (con motivo), **Eliminar**.
- Botón de creación abre `NuevoMovimientoDialog` con `isPagoPendiente=true`.
- Muestra badge de estado (pendiente / aprobado / rechazado).

### `app/configuracion/page.tsx` — Configuración

- ABM completo de:
  - **Categorías** (`CONFIGURACION.CATEGORIAS.*`)
  - **Subcategorías** (`CONFIGURACION.SUBCATEGORIAS.*`)
  - **Bancos** (`CONFIGURACION.BANCOS.*`)
  - **Medios de Pago** (`CONFIGURACION.MEDIOS_PAGO.*`)
- Es la página más grande del proyecto (~1000 líneas), toda la lógica es inline.

---

## 4. Componentes

### Globales

#### `Navbar`

```
props: { userName?, userRole?, onLogout?, showBackButton?, backUrl? }
```

- Barra superior presente en todas las páginas protegidas.
- Muestra saludo según hora del día.
- Verifica la sesión contra `API_ENDPOINTS.AUTH.VERIFY` al montar.
- Botón de "volver" configurable (`showBackButton`, `backUrl`).
- Botón de logout.

#### `NuevoMovimientoDialog`

```
props: { isOpen, onClose, sucursalId, onSuccess, cajaTipo?, isPagoPendiente? }
```

- Dialog **unificado** para crear movimientos. Soporta tres modos:
  - `cajaTipo="efectivo"` → crea en `MOVIMIENTOS.CREATE_EFECTIVO`
  - `cajaTipo="banco"` → crea en `CAJA_BANCO.CREATE`
  - `isPagoPendiente=true` → crea en `PAGOS_PENDIENTES.CREATE`
- Carga catálogos (categorías, subcategorías, bancos, medios de pago) internamente.
- Campos: fecha, concepto, monto, tipo (ingreso/egreso), prioridad, descripción, categoría, subcategoría, comprobante, banco, medio de pago.

---

### Módulo `components/caja/`

#### `CajaTabs`

```
props: { saldoReal: Transaction[], saldoNecesario: Transaction[], children }
```

- Panel de resumen con tabs tipo "segmented pill".
- Muestra **Total Saldo Real** y diferencia en cada tab.
- Re-exporta `TabsContent` para uso en páginas.

#### `PageHeader`

```
props: { title, subtitle, onNewMovimiento }
```

- Cabecera reutilizable con título, subtítulo y botón "+ Nuevo Movimiento".

#### `StatusBadge`

```
props: { value: string, colorMap: Record<string, string> }
```

- Badge genérico. Recibe el valor y un mapa `valor → clases CSS`.
- Usa `capitalize` de `lib/formatters`.

#### `TransactionTable`

```
props: { title, description, transactions, customTotal?, columns, onViewDetails, onChangeState, onDelete }
```

- Tabla de movimientos configurable via array de `ColumnDef`.
- **Presets de columnas:**
  - `getEfectivoColumns()` → BASE + descripción + monto
  - `getBancoColumns()` → BASE + comprobante + medio de pago + banco + monto
- Botones de acción por fila: Ver/Editar, Cambiar Estado, Eliminar.
- Muestra total al pie con `calcularTotal`.

#### `TransactionDialogs`

Tres dialogs independientes exportados desde el mismo archivo:

| Componente      | Propósito                                            |
| --------------- | ---------------------------------------------------- |
| `DetailsDialog` | Edición completa de un movimiento (todos los campos) |
| `StateDialog`   | Cambio rápido de estado (select + guardar)           |
| `DeleteDialog`  | Confirmación de eliminación                          |

---

### Primitivos `components/ui/` (Shadcn/ui)

| Componente                                                                                         | Uso                          |
| -------------------------------------------------------------------------------------------------- | ---------------------------- |
| `Button`                                                                                           | Botón estándar con variantes |
| `Card` + `CardContent` + `CardHeader` + `CardTitle` + `CardDescription`                            | Contenedores de tarjeta      |
| `Dialog` + `DialogContent` + `DialogHeader` + `DialogTitle` + `DialogDescription` + `DialogFooter` | Modales                      |
| `Input`                                                                                            | Input de texto               |
| `Label`                                                                                            | Etiqueta de formulario       |
| `Select` + variantes                                                                               | Select accesible             |
| `Table` + variantes                                                                                | Tabla HTML semántica         |
| `Tabs` + variantes                                                                                 | Tabs                         |
| `Textarea`                                                                                         | Textarea                     |

---

## 5. Stores (Zustand)

### `store/authStore.ts` — `useAuthStore`

Maneja el estado global de autenticación. Persiste en `localStorage` bajo la clave `auth-storage`.

```typescript
interface AuthState {
  user: { id; email; nombre; rol } | null;
  token: string | null;
  isAuthenticated: boolean;
  login(token: string, user: User): void;
  logout(): void;
}
```

| Campo / Acción       | Descripción                                  |
| -------------------- | -------------------------------------------- |
| `user`               | Datos del usuario logueado                   |
| `token`              | JWT de sesión                                |
| `isAuthenticated`    | Booleano de sesión activa                    |
| `login(token, user)` | Setea token + user + `isAuthenticated: true` |
| `logout()`           | Resetea todo a `null / false`                |

---

## 6. Custom Hooks

### `useAuthGuard` — `hooks/use-auth-guard.ts`

Centraliza la lógica de protección de rutas.

```typescript
// Retorna:
{
  user,
  isHydrated,
  isAuthenticated,
  handleLogout,
  isGuardLoading,   // true mientras hidrata o no está autenticado
}
```

- Si `isAuthenticated === false` después de hidratar → redirige a `/`.
- `handleLogout()` hace logout en el store y redirige a `/`.
- **Patrón de uso:** todas las páginas protegidas lo consumen al inicio del componente y devuelven `null` mientras `isGuardLoading === true`.

---

### `useCajaData` — `hooks/use-caja-data.ts`

Hook principal de toda la lógica de datos del módulo caja. Recibe `tipo: "efectivo" | "banco"` y selecciona los endpoints correspondientes.

**Estado que maneja:**

| Grupo       | Estado                                                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Carga       | `isLoading`, `error`                                                                                                               |
| Movimientos | `saldoReal`, `saldoNecesario`, `parciales`                                                                                         |
| Catálogos   | `categorias`, `subcategorias`, `bancos`, `mediosPago`                                                                              |
| Dialogs     | `isDetailsDialogOpen`, `isStateDialogOpen`, `isDeleteDialogOpen`, `isNuevoMovimientoDialogOpen`, `selectedTransaction`, `isSaving` |
| Formulario  | `formData` (TransactionFormData), `nuevoEstado`                                                                                    |

**Fetchers:**

| Función                           | Descripción                                                 |
| --------------------------------- | ----------------------------------------------------------- |
| `fetchMovimientos()`              | Carga y clasifica movimientos en saldoReal / saldoNecesario |
| `fetchTotales()`                  | Carga parciales por banco                                   |
| `fetchCategorias()`               | Carga catálogo de categorías                                |
| `fetchSubcategorias(categoriaId)` | Carga subcategorías de una categoría                        |
| `fetchBancos()`                   | Carga catálogo de bancos                                    |
| `fetchMediosPago()`               | Carga catálogo de medios de pago                            |
| `initialize()`                    | Llama a todos los fetchers en paralelo                      |

**Handlers CRUD:**

| Función                    | Descripción                                   |
| -------------------------- | --------------------------------------------- |
| `handleOpenDetails(t)`     | Abre dialog de detalles y carga el formulario |
| `handleOpenStateChange(t)` | Abre dialog de cambio de estado               |
| `handleOpenDelete(t)`      | Abre dialog de eliminación                    |
| `handleSaveDetails()`      | PUT al endpoint de update                     |
| `handleSaveStateChange()`  | PUT al endpoint de updateEstado               |
| `handleDelete()`           | DELETE al endpoint de delete                  |

> 💡 Las subcategorías se recargan automáticamente vía `useEffect` cuando cambia `formData.categoria_id`.

---

## 7. Lib — Utilidades compartidas

### `lib/config.ts` — `API_ENDPOINTS`

Objeto central que centraliza **todos** los URLs de la API.  
La base se configura con la variable de entorno `NEXT_PUBLIC_API_URL` (default: `http://localhost:3001`).

### `lib/types.ts` — Interfaces TypeScript

| Interface       | Descripción                                   |
| --------------- | --------------------------------------------- |
| `Transaction`   | Movimiento de caja (efectivo o banco)         |
| `BancoParcial`  | Total por banco para caja banco               |
| `PagoPendiente` | Pago pendiente de aprobación                  |
| `Categoria`     | Categoría de movimiento                       |
| `Subcategoria`  | Subcategoría (dependiente de Categoría)       |
| `Sucursal`      | Datos de una sucursal                         |
| `Documento`     | Archivo adjunto a una sucursal                |
| `SelectOption`  | Opción genérica `{ id, nombre }` para selects |

### `lib/formatters.ts` — Funciones de formateo

| Función                        | Descripción                                |
| ------------------------------ | ------------------------------------------ |
| `formatFecha(iso)`             | ISO → `dd/mm/aaaa`                         |
| `formatMonto(n)`               | Número → moneda ARS (Intl.NumberFormat)    |
| `calcularTotal(arr)`           | Suma el campo `monto` de un array          |
| `getEstadoColor(estado)`       | Estado → clases CSS Tailwind para badge    |
| `getPrioridadColor(prioridad)` | Prioridad → clases CSS Tailwind para badge |
| `capitalize(str)`              | Primera letra mayúscula                    |

### `lib/utils.ts`

Utilidades mínimas (función `cn` de Shadcn para merge de clases).

---

## 8. Endpoints de la API

Base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`)

### Auth

| Método | Endpoint           | Descripción            |
| ------ | ------------------ | ---------------------- |
| POST   | `/api/auth/login`  | Login                  |
| GET    | `/api/auth/verify` | Verificar token activo |

### Sucursales

| Método | Endpoint                                        | Descripción         |
| ------ | ----------------------------------------------- | ------------------- |
| GET    | `/api/sucursales`                               | Listar todas        |
| GET    | `/api/sucursales/:id`                           | Obtener una         |
| POST   | `/api/sucursales`                               | Crear               |
| PUT    | `/api/sucursales/:id`                           | Actualizar          |
| DELETE | `/api/sucursales/:id`                           | Eliminar            |
| GET    | `/api/sucursales/:id/documentos`                | Listar documentos   |
| POST   | `/api/sucursales/:id/documentos`                | Subir documento     |
| GET    | `/api/sucursales/:sid/documentos/:did/download` | Descargar documento |
| DELETE | `/api/sucursales/:sid/documentos/:did`          | Eliminar documento  |

### Movimientos (Caja Efectivo)

| Método | Endpoint                                     | Descripción              |
| ------ | -------------------------------------------- | ------------------------ |
| GET    | `/api/movimientos/:sucursalId`               | Movimientos por sucursal |
| GET    | `/api/movimientos/:sucursalId/totales`       | Totales                  |
| POST   | `/api/movimientos/efectivo`                  | Crear movimiento         |
| PUT    | `/api/movimientos/:id`                       | Actualizar               |
| PUT    | `/api/movimientos/:id/estado`                | Cambiar estado           |
| PUT    | `/api/movimientos/efectivo/:id/mover-a-real` | Mover a saldo real       |
| DELETE | `/api/movimientos/:id`                       | Eliminar                 |

### Caja Banco

| Método | Endpoint                              | Descripción                   |
| ------ | ------------------------------------- | ----------------------------- |
| GET    | `/api/caja-banco/:sucursalId`         | Movimientos por sucursal      |
| GET    | `/api/caja-banco/:sucursalId/totales` | Totales + parciales por banco |
| POST   | `/api/caja-banco`                     | Crear movimiento              |
| PUT    | `/api/caja-banco/:id`                 | Actualizar                    |
| PUT    | `/api/caja-banco/:id/estado`          | Cambiar estado                |
| PUT    | `/api/caja-banco/:id/mover-a-real`    | Mover a saldo real            |
| DELETE | `/api/caja-banco/:id`                 | Eliminar                      |

### Pagos Pendientes

| Método | Endpoint                                  | Descripción                |
| ------ | ----------------------------------------- | -------------------------- |
| GET    | `/api/pagos-pendientes/all`               | Todos los pagos            |
| GET    | `/api/pagos-pendientes/:sucursalId`       | Por sucursal               |
| POST   | `/api/pagos-pendientes`                   | Crear                      |
| PUT    | `/api/pagos-pendientes/:id/aprobar`       | Aprobar                    |
| PUT    | `/api/pagos-pendientes/:id/rechazar`      | Rechazar (requiere motivo) |
| DELETE | `/api/pagos-pendientes/:id`               | Eliminar                   |
| GET    | `/api/pagos-pendientes/historial/:userId` | Historial por usuario      |

### Configuración

| Recurso        | Endpoints                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Categorías     | CRUD en `/api/configuracion/categorias`                                  |
| Subcategorías  | CRUD en `/api/configuracion/subcategorias` (filtro por `?categoria_id=`) |
| Bancos         | CRUD en `/api/configuracion/bancos`                                      |
| Medios de Pago | CRUD en `/api/configuracion/medios-pago`                                 |

---

## 9. Flujo de autenticación

```
Usuario → "/" (LoginPage)
    └─ POST /api/auth/login
        ├─ OK → authStore.login(token, user)
        │         └─ router.push("/sucursales")
        └─ Error → Muestra mensaje de error

Página protegida (ej: /sucursales)
    └─ useAuthGuard()
        ├─ Hidratando Zustand → render null (isGuardLoading: true)
        ├─ isAuthenticated: false → router.push("/")
        └─ isAuthenticated: true → render página

Navbar → GET /api/auth/verify (al montar)
    └─ 401 → authStore.logout() → router.push("/")

Logout → authStore.logout() → router.push("/")
    └─ Limpia localStorage ("auth-storage")
```

---

_Generado el 2026-03-02 · Versión actual del frontend_
