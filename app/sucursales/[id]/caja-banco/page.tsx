"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CajaBancoPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Esperar a que Zustand se hidrate desde localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push("/");
      return;
    }
  }, [isAuthenticated, isHydrated, router]);

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D4C92] via-[#2E7DDF] to-[#0D4C92] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D4C92] via-[#2E7DDF] to-[#0D4C92]">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push(`/sucursales/${params.id}`)}
              variant="outline"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 mr-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Caja en Banco</h1>
              <p className="text-sm text-white/80">
                Gestión de cuentas bancarias y transacciones
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card className="border-white/20 bg-white/95 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#0D4C92]">
              Caja en Banco
            </CardTitle>
            <CardDescription className="text-[#A5A5A5]">
              Contenido en desarrollo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-24 h-24 mx-auto text-[#0D4C92]/30"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
                  />
                </svg>
                <p className="text-[#A5A5A5] text-lg">
                  Esta sección está en desarrollo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
