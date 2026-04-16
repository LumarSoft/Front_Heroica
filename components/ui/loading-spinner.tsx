/**
 * Spinner reutilizable con tres variantes de contenedor.
 */

export function LoadingSpinner() {
  return <div className="w-12 h-12 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin" />
}

/** Spinner de página completa (usado mientras carga el auth guard) */
export function PageLoadingSpinner() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}

/** Spinner de contenido dentro de una sección (usado mientras cargan datos) */
export function ContentLoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16 flex-grow">
      <LoadingSpinner />
    </div>
  )
}
