import { AlertTriangle } from "lucide-react";

interface ErrorBannerProps {
  error: string;
}

/** Banner de error rojo reutilizable con ícono AlertTriangle */
export function ErrorBanner({ error }: ErrorBannerProps) {
  if (!error) return null;
  return (
    <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200">
      <p className="text-sm text-red-600 font-medium flex items-center gap-1.5">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        {error}
      </p>
    </div>
  );
}
