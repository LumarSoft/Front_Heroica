'use client';

import { capitalize } from '@/lib/formatters';

interface StatusBadgeProps {
  value: string;
  colorMap: Record<string, string>;
}

/**
 * Badge reutilizable para mostrar estados, prioridades, tipos, etc.
 * Recibe el valor y un mapa de colores (valor → clases CSS).
 */
export function StatusBadge({ value, colorMap }: StatusBadgeProps) {
  const color = colorMap[value] || 'bg-gray-100 text-gray-800';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      {capitalize(value)}
    </span>
  );
}
