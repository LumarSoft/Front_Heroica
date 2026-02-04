"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { API_ENDPOINTS } from "@/lib/config";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Llamada a la API de login
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión");
      }

      // Login exitoso
      console.log("Login exitoso:", data);

      // Guardar en Zustand (que también guarda en localStorage)
      login(data.data.token, data.data.user);

      // Redirigir a sucursales
      router.push("/sucursales");
    } catch (err: any) {
      console.error("Error en login:", err);
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Lado izquierdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#002868] to-[#003d8f] relative overflow-hidden">
        {/* Patrón decorativo */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, #FFFFFF 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        ></div>

        {/* Contenido del branding */}
        <div className="relative z-10 flex flex-col justify-center items-start w-full px-16 text-white font-serif">
          <div className="max-w-lg">
            {/* Logotipo: Usamos tracking-widest y una fuente con serifa para imitar el logo */}
            <h1 className="text-7xl font-medium mb-2 tracking-[0.2em] uppercase leading-none italic">
              Heroica
            </h1>

            {/* Separador más elegante: más fino y con un ancho que equilibre el texto */}
            <div className="h-[1px] w-32 bg-gradient-to-r from-white/80 to-transparent mb-10"></div>

            <div className="space-y-4">
              {/* Título del módulo: Fuente Sans para contraste y profesionalismo */}
              <h2 className="text-sm uppercase tracking-[0.3em] font-semibold text-white/90 font-sans">
                Módulo de Tesorería
              </h2>

              {/* La frase que elegiste, con un estilo más editorial */}
              <p className="text-3xl font-light leading-tight max-w-sm border-l border-white/20 pl-6 italic">
                "Claridad en las cuentas, <br />
                <span className="opacity-70">integridad en los resultados."</span>
              </p>
            </div>
          </div>
        </div>
        {/* Elemento decorativo inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>

      {/* Lado derecho - Formulario de login */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#F5F5F5]">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-4xl font-bold text-[#002868] mb-2">HEROICA</h1>
            <p className="text-[#666666]">Sistema de Contabilidad</p>
          </div>

          {/* Card de login */}
          <Card className="border-[#E0E0E0] bg-white shadow-xl">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-3xl font-bold text-[#002868]">
                Iniciar Sesión
              </CardTitle>
              <CardDescription className="text-[#666666] text-base">
                Ingresa tus credenciales para acceder al sistema
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-5">
                {/* Mensaje de error */}
                {error && (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                  </div>
                )}

                {/* Campo de email */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-[#002868] font-semibold text-sm"
                  >
                    Correo Electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868] transition-all text-base"
                  />
                </div>

                {/* Campo de contraseña */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-[#002868] font-semibold text-sm"
                  >
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868] transition-all text-base"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 pt-2">
                <Button
                  type="submit"
                  className="w-full h-12 bg-[#002868] hover:bg-[#003d8f] text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Iniciando sesión...</span>
                    </div>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>

                <p className="text-center text-sm text-[#666666]">
                  ¿No tienes una cuenta?{" "}
                  <a
                    href="#"
                    className="text-[#002868] hover:text-[#003d8f] font-semibold transition-colors cursor-pointer"
                  >
                    Contacta al administrador
                  </a>
                </p>
              </CardFooter>
            </form>
          </Card>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-[#666666]">
            © 2026 Heroica. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
