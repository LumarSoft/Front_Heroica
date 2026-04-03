"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-800">Algo salió mal</h1>
          <p className="text-slate-500 text-sm">
            Ocurrió un error inesperado. Por favor, intentá nuevamente o volvé
            al inicio.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400 font-mono mt-2">
              Ref: {error.digest}
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="border-slate-300 text-slate-600 hover:bg-slate-100"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir al inicio
          </Button>
          <Button
            onClick={reset}
            className="bg-[#002868] hover:bg-[#003d8f] text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    </div>
  );
}
