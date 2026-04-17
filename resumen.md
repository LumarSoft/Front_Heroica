# Mejoras Estéticas y Responsivas — Heroica Web

## 1. Navbar Global (`components/Navbar.tsx`)

- Rediseño completo a una sola fila `h-14 sm:h-16`
- Patrón: `[←] [HEROICA] | [contexto] ——— [👤 badge] | [🖩][📋][⚙] | [→]`
- Botones tipo ghost (sin bordes), íconos con tooltips instantáneos
- Logout con hover rojo (`text-[#9AA0AC] hover:text-red-600 hover:bg-red-50`)
- Sin segunda fila en mobile — el contexto siempre visible inline

## 2. Tooltips (`components/ui/tooltip.tsx`)

- Nuevo componente creado usando `radix-ui`
- `delayDuration=0` para aparición instantánea al hover
- Diseño: fondo `#1A1A1A`, flecha, animación fade-in/zoom-in
- Usado en todos los botones de acción de la navbar

## 3. Header de Sucursal (`app/sucursales/[id]/page.tsx`)

- Reemplazado header custom por diseño consistente con Navbar
- Logo HEROICA + divisor + contexto "SUCURSAL / {nombre}"
- Botones ghost con tooltips: Info (con badge de alertas) y BarChart2
- Cards del menú: íconos `w-20 h-20 md:w-28 md:h-28`, padding responsivo `p-6 md:p-10`
- Grid: `gap-4 md:gap-8`, títulos `text-xl md:text-3xl`

## 4. Sección Caja Efectivo — Tabs (`components/caja/CajaTabs.tsx`)

- Mobile: mini stats separada arriba mostrando "Saldo Real" y "Necesario" en columnas
- Montos ocultos dentro de los tabs en mobile (`hidden sm:block`)
- Panel total solo en desktop (sin duplicar info en mobile)
- Padding de tabs: `!px-3 sm:!px-5`

## 5. Sección Caja Efectivo — Filtros (`components/caja/EndDateFilter.tsx`)

- Dos filas: fecha (DESDE→HASTA siempre inline) + banco + toggle vista; búsqueda + limpiar
- Botones de fecha: `flex-1 min-w-0 max-w-[140px]` para no romperse en mobile
- Toggle vista: solo ícono en mobile (`hidden sm:inline` para labels)
- Limpiar integrado junto al buscador

## 6. Sección Caja Efectivo — Tabla (`components/caja/TransactionTable.tsx`)

- Título: `text-base sm:text-2xl`
- Monto total: `text-lg sm:text-2xl tabular-nums`, padding compacto responsivo

## 7. Sección Caja Efectivo — Header (`components/caja/PageHeader.tsx`)

- Título: `text-xl sm:text-3xl`
- Subtítulo: `text-xs sm:text-sm`
- Botones: `px-3 sm:px-5 py-2 sm:py-3`
- "Compra-Venta de Divisas" → "Divisas" en mobile

## 8. Página de Configuración (`app/configuracion/page.tsx`)

- Rediseño completo con sidebar en desktop y dropdown en mobile
- Header consistente con el resto: HEROICA + "Sistema / Configuración"
- 4 grupos organizados: Catálogo · Financiero · Equipo · Mi Cuenta
- Sidebar: item activo `bg-[#002868] text-white shadow-sm`
- Mobile: dropdown ChevronDown con grupos y ítems; standalone fuera del flex row
- Breadcrumb de grupo debajo de cada título de sección

## 9. Secciones de Configuración (general)

Aplicado a: Categorías, Subcategorías, Descripciones, Proveedores, Bancos, Medios de Pago

- CardHeader: `pb-4 border-b border-[#F0F0F0]`
- Botón "Nueva X": `text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4`
- Items de lista: `gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors`
- Botones Editar/Eliminar: `h-7 px-2.5 text-xs`
- Estado vacío: mensaje centrado en gris

## 10. Categorías (`components/configuracion/CategoriasSection.tsx`)

- Badge de tipo con color: `↑ Ingreso` (verde) / `↓ Egreso` (rojo)
- Nombre truncado con `truncate`, descripción secundaria en gris
- Estado vacío: "No hay categorías registradas"

## 11. Usuarios (`components/configuracion/UsuariosSection.tsx`)

- Layout de fila: `flex-col sm:flex-row` — info arriba, acciones abajo en mobile
- Acciones indentadas `pl-12` en mobile para alinear con nombre
- Select de rol: `w-[130px] sm:w-[150px] h-8`
- Botones de acción: `w-7 h-7 sm:w-8 sm:h-8`
- "Reset 2FA" oculto en mobile (`hidden sm:flex`)
- Badges: `text-[10px]` para no romper layout
- Corregido bug: badge 2FA se renderizaba dos veces
- "Debe cambiar clave" → "Cambiar clave"

## 12. Páginas con padding responsivo

- `app/sucursales/page.tsx`: `px-4 sm:px-6 py-8 sm:py-12`
- `app/sucursales/[id]/caja-banco/page.tsx`: `px-4 sm:px-6 py-6 sm:py-8`
- `app/sucursales/[id]/pagos-pendientes/page.tsx`: mismo patrón
- `app/sucursales/[id]/reportes/page.tsx`: header + controles con `flex-wrap`

---

*Todos los cambios siguen el sistema de diseño Heroica: azul `#002868`, grises `#F0F0F0`/`#E0E0E0`, tipografía compacta en mobile con escalado `sm:`.*
