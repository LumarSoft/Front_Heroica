import { CheckCircle2, Wallet } from 'lucide-react';
import { formatMonto } from '@/lib/formatters';
import type { ReportDeuda } from './types';

// =============================================
// Calcula la antigüedad de un crédito y su color
// =============================================

function getAntiguedad(fechaStr: string): {
  label: string;
  colorClass: string;
  dotClass: string;
} {
  const fecha = new Date(fechaStr);
  const hoy = new Date();
  const dias = Math.floor(
    (hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dias <= 7)
    return {
      label: 'Esta semana',
      colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      dotClass: 'bg-indigo-400',
    };
  if (dias <= 30)
    return {
      label: `Hace ${dias}d`,
      colorClass: 'text-blue-600 bg-blue-50 border-blue-200',
      dotClass: 'bg-blue-400',
    };
  if (dias <= 90)
    return {
      label: `Hace ${dias}d`,
      colorClass: 'text-cyan-600 bg-cyan-50 border-cyan-200',
      dotClass: 'bg-cyan-400',
    };
  return {
    label: `Hace ${dias}d`,
    colorClass: 'text-slate-600 bg-slate-50 border-slate-200',
    dotClass: 'bg-slate-400',
  };
}

// =============================================
// Panel de listado de créditos activos a cobrar
// =============================================

interface CreditoPanelProps {
  creditos: ReportDeuda[];
  moneda?: 'ARS' | 'USD';
}

export function CreditoPanel({ creditos, moneda = 'ARS' }: CreditoPanelProps) {
  const total = creditos.reduce((acc, c) => acc + Math.abs(c.monto), 0);

  if (creditos.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center gap-3">
        <CheckCircle2 className="w-12 h-12 text-slate-300" />
        <p className="text-slate-500 font-medium">Sin créditos registrados</p>
        <p className="text-slate-400 text-sm">
          No hay créditos a favor pendientes en este período.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="w-7 h-7 text-indigo-500" />
          <div>
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              Total a cobrar
            </p>
            <p className="text-2xl font-extrabold text-indigo-600 tabular-nums">
              {formatMonto(total, moneda)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-indigo-500 font-medium">
            {creditos.length} crédito{creditos.length !== 1 ? 's' : ''} pendiente{creditos.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2 mt-1.5 justify-end flex-wrap">
            <span className="flex items-center gap-1 text-xs text-indigo-600">
              <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
              ≤7 días
            </span>
            <span className="flex items-center gap-1 text-xs text-blue-600">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
              ≤30 días
            </span>
            <span className="flex items-center gap-1 text-xs text-cyan-600">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              ≤90 días
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
              90+ días
            </span>
          </div>
        </div>
      </div>

      {/* Creditos cards */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
        {creditos.map((credito, i) => {
          const antig = getAntiguedad(credito.fecha);
          return (
            <div
              key={credito.id ?? i}
              className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors print:break-inside-avoid"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${antig.dotClass}`}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">
                  {credito.concepto || 'Sin concepto'}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-slate-400">
                    {new Date(credito.fecha).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  {credito.categoria_nombre && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500 font-medium">
                        {credito.categoria_nombre}
                      </span>
                    </>
                  )}
                  {credito.subcategoria_nombre && (
                    <>
                      <span className="text-slate-300">/</span>
                      <span className="text-xs text-slate-400">
                        {credito.subcategoria_nombre}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full border flex-shrink-0 ${antig.colorClass}`}
              >
                {antig.label}
              </span>
              <div className="text-right flex-shrink-0 w-28">
                <span className="font-bold text-indigo-600 tabular-nums text-sm">
                  {formatMonto(Math.abs(credito.monto), moneda)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
