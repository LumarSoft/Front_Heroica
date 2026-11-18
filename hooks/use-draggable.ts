'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Posición de una ventana flotante (calculadora, proveedores) que se arrastra desde su barra
 * de título sin salirse de la pantalla.
 */
export function useDraggable(inicial: { x: number; y: number }) {
  const [position, setPosition] = useState(inicial)
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true
      dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y }
      e.preventDefault()
    },
    [position],
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const el = containerRef.current
      const w = el ? el.offsetWidth : 0
      const h = el ? el.offsetHeight : 0
      setPosition({
        x: Math.min(Math.max(0, e.clientX - dragOffset.current.x), window.innerWidth - w),
        y: Math.min(Math.max(0, e.clientY - dragOffset.current.y), window.innerHeight - h),
      })
    }
    const handleMouseUp = () => {
      dragging.current = false
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return { position, containerRef, handleMouseDown }
}
