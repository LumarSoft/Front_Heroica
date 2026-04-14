'use client';

import { formatMonto } from '@/lib/formatters';

export interface CategoryDataPoint {
  mes: string;
  categoria: string;
  tipo: 'ingreso' | 'egreso';
  total: number;
}

interface Props {
  data: CategoryDataPoint[];
  moneda: 'ARS' | 'USD';
}

const MESES_ES: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
};

function formatMes(mes: string) {
  const [year, month] = mes.split('-');
  return `${MESES_ES[month] ?? month} '${year.slice(2)}`;
}

function formatAbrev(value: number): string {
  if (value === 0) return '';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(Math.round(value));
}

// Devuelve clases de fondo según la intensidad (0–1)
function bgFromIntensity(intensity: number): string {
  if (intensity === 0) return 'bg-slate-50';
  if (intensity < 0.15) return 'bg-indigo-50';
  if (intensity < 0.30) return 'bg-indigo-100';
  if (intensity < 0.45) return 'bg-indigo-200';
  if (intensity < 0.60) return 'bg-indigo-300';
  if (intensity < 0.75) return 'bg-indigo-400';
  if (intensity < 0.90) return 'bg-indigo-500';
  return 'bg-indigo-600';
}

function textFromIntensity(intensity: number): string {
  return intensity >= 0.60 ? 'text-white' : 'text-slate-700';
}

export function MonthlyCategoryBarChart({ data, moneda }: Props) {
  if (!data || data.length === 0) {
    return (
      <p className="text-center italic text-slate-400 py-10 text-sm">
        No hay datos de categorías disponibles.
      </p>
    );
  }

  // Agrupar: { categoria -> { mes -> total } }
  const matrix: Record<string, Record<string, number>> = {};
  const mesSet = new Set<string>();

  data.forEach(({ mes, categoria, total }) => {
    mesSet.add(mes);
    if (!matrix[categoria]) matrix[categoria] = {};
    matrix[categoria][mes] = (matrix[categoria][mes] ?? 0) + total;
  });

  const meses = Array.from(mesSet).sort();

  // Ordenar categorías por total acumulado desc
  const categorias = Object.entries(matrix)
    .map(([cat, byMes]) => ({
      cat,
      total: Object.values(byMes).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.total - a.total)
    .map(({ cat }) => cat);

  // Valor máximo global para escala de color
  const maxVal = Math.max(
    ...categorias.flatMap((cat) => meses.map((mes) => matrix[cat][mes] ?? 0)),
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            {/* Columna categoría */}
            <th className="sticky left-0 z-10 bg-slate-50 border-b border-r border-gray-200 px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[140px]">
              Categoría
            </th>
            {meses.map((mes) => (
              <th
                key={mes}
                className="border-b border-gray-200 px-2 py-2 text-center font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[72px]"
              >
                {formatMes(mes)}
              </th>
            ))}
            <th className="border-b border-l border-gray-200 px-3 py-2 text-right font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((cat, rowIdx) => {
            const catTotal = Object.values(matrix[cat]).reduce((a, b) => a + b, 0);
            return (
              <tr
                key={cat}
                className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
              >
                {/* Nombre categoría sticky */}
                <td className="sticky left-0 z-10 border-r border-gray-100 px-3 py-2 font-medium text-slate-700 whitespace-nowrap truncate max-w-[160px]"
                  style={{ backgroundColor: rowIdx % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.5)' }}
                  title={cat}
                >
                  {cat}
                </td>

                {/* Celdas por mes */}
                {meses.map((mes) => {
                  const val = matrix[cat][mes] ?? 0;
                  const intensity = maxVal > 0 ? val / maxVal : 0;
                  return (
                    <td
                      key={mes}
                      title={val > 0 ? formatMonto(val, moneda) : '—'}
                      className={`px-2 py-2 text-center tabular-nums font-medium transition-colors ${bgFromIntensity(intensity)} ${textFromIntensity(intensity)}`}
                    >
                      {val > 0 ? formatAbrev(val) : (
                        <span className="text-slate-300">·</span>
                      )}
                    </td>
                  );
                })}

                {/* Total fila */}
                <td className="border-l border-gray-100 px-3 py-2 text-right font-semibold text-slate-600 tabular-nums whitespace-nowrap">
                  {formatAbrev(catTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>

        {/* Fila totales por mes */}
        <tfoot>
          <tr className="border-t-2 border-gray-200 bg-slate-100">
            <td className="sticky left-0 z-10 bg-slate-100 border-r border-gray-200 px-3 py-2 font-bold text-slate-600 uppercase tracking-wider text-xs">
              Total mes
            </td>
            {meses.map((mes) => {
              const mesTotal = categorias.reduce(
                (acc, cat) => acc + (matrix[cat][mes] ?? 0),
                0,
              );
              return (
                <td
                  key={mes}
                  className="px-2 py-2 text-center font-bold text-slate-700 tabular-nums"
                >
                  {formatAbrev(mesTotal)}
                </td>
              );
            })}
            <td className="border-l border-gray-200 px-3 py-2 text-right font-bold text-slate-700 tabular-nums">
              {formatAbrev(
                categorias.reduce(
                  (acc, cat) =>
                    acc + Object.values(matrix[cat]).reduce((a, b) => a + b, 0),
                  0,
                ),
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
