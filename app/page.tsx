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
import Image from "next/image";

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0D4C92] via-[#2E7DDF] to-[#0D4C92]">
      {/* Efectos de fondo animados */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-[#2E7DDF]/30 to-[#0D4C92]/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-[#B88B5C]/20 to-[#2E7DDF]/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Patrón de textura sutil */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(circle, #FFFFFF 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      ></div>

      {/* Contenedor principal */}
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo y título de la app */}
        <div className="mb-8 text-center">
          <Image
            src="/logo.png"
            alt="Logo"
            className="mx-auto mb-4"
            width={200}
            height={200}
          />
          <p className="text-white/90 text-lg font-medium">
            Sistema de Contabilidad
          </p>
        </div >

        {/* Card de login con efecto glassmorphism */}
        < Card className="border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl" >
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-[#0D4C92]">
              Iniciar Sesión
            </CardTitle>
            <CardDescription className="text-[#A5A5A5]">
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Mensaje de error */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600 font-medium">⚠️ {error}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#0D4C92] font-semibold">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-[#A5A5A5]/30 focus:border-[#2E7DDF] focus:ring-[#2E7DDF] transition-all h-11"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-[#0D4C92] font-semibold"
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
                  className="border-[#A5A5A5]/30 focus:border-[#2E7DDF] focus:ring-[#2E7DDF] transition-all h-11"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#0D4C92] to-[#2E7DDF] hover:from-[#0D4C92]/90 hover:to-[#2E7DDF]/90 text-white font-semibold shadow-lg shadow-[#0D4C92]/30 transition-all hover:shadow-xl hover:shadow-[#2E7DDF]/40 hover:scale-[1.02] h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Iniciando sesión...</span>
                  </div>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
              <p className="text-center text-sm text-[#A5A5A5]">
                ¿No tienes una cuenta?{" "}
                <a
                  href="#"
                  className="text-[#2E7DDF] hover:text-[#0D4C92] font-semibold transition-colors"
                >
                  Contacta al administrador
                </a>
              </p>
            </CardFooter>
          </form>
        </Card >

        {/* Detalle decorativo con color madera */}
        < div className="mt-6 flex items-center justify-center space-x-2" >
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#B88B5C]/50"></div>
          <div className="w-2 h-2 rounded-full bg-[#B88B5C]"></div>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#B88B5C]/50"></div>
        </div >

        {/* Footer */}
        < p className="mt-6 text-center text-sm text-white/70" >
          © 2026 Heroica.Todos los derechos reservados.
        </p >
      </div >
    </div >
  );
}
