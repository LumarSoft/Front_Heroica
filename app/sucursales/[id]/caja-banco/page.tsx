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
import Navbar from "@/components/Navbar";

export default function CajaBancoPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, logout } = useAuthStore();
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#E8EAED]">
      {/* Navbar */}
      <Navbar
        userName={user?.nombre}
        userRole={user?.rol}
        onLogout={handleLogout}
        showBackButton={true}
        backUrl={`/sucursales/${params.id}`}
      />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Card className="border-[#E0E0E0] bg-white shadow-lg">
          <CardContent>
            <div className="flex items-center justify-center py-24">
              <div className="text-center space-y-6 max-w-md">
                {/* Icono de banco con estilo premium */}
                <div className="relative">
                  <div className="w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br from-[#002868]/10 to-[#002868]/5 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-16 h-16 text-[#002868]"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
                      />
                    </svg>
                  </div>
                  {/* Badge "Próximamente" */}
                  <div className="absolute -top-2 -right-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      Próximamente
                    </span>
                  </div>
                </div>

                {/* Texto informativo */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-[#002868]">
                    Funcionalidad en Desarrollo
                  </h3>
                  <p className="text-[#666666] leading-relaxed">
                    Estamos trabajando en esta sección para brindarte la mejor
                    experiencia en la gestión de tus cuentas bancarias y
                    transacciones.
                  </p>
                </div>

                {/* Lista de características futuras */}
                <div className="bg-[#F8F9FA] rounded-lg p-6 text-left">
                  <p className="text-sm font-semibold text-[#002868] mb-3">
                    Características próximas:
                  </p>
                  <ul className="space-y-2 text-sm text-[#666666]">
                    <li className="flex items-start gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4 text-[#002868] mt-0.5 flex-shrink-0"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      <span>Gestión de cuentas bancarias</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4 text-[#002868] mt-0.5 flex-shrink-0"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      <span>Registro de transacciones bancarias</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4 text-[#002868] mt-0.5 flex-shrink-0"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      <span>Conciliación bancaria</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4 text-[#002868] mt-0.5 flex-shrink-0"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      <span>Reportes y análisis de movimientos</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
