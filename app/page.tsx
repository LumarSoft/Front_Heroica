"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { API_ENDPOINTS } from "@/lib/config";
import { useAuthStore } from "@/store/authStore";
import { loginSchema } from "@/lib/schemas";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }

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

      login(data.data.token, data.data.user);
      router.push("/sucursales");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al conectar con el servidor";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Lado izquierdo - Branding CON FONDO BLANCO */}
      <div className="hidden lg:flex lg:w-1/2 bg-white relative overflow-hidden">
        {/* Patrón decorativo */}
        <div className="absolute inset-0 opacity-5 login-pattern-primary" />

        {/* Contenido del branding */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-16">
          <div className="max-w-lg text-center">
            {/* Logo SVG */}
            <Image
              src="/HEROICA.svg"
              alt="Heroica"
              width={200}
              height={80}
              className="h-20 mb-6 mx-auto"
              priority
            />

            {/* Separador */}
            <div className="h-[1px] w-32 bg-gradient-to-r from-[#002868]/20 via-[#002868]/50 to-[#002868]/20 mb-10 mx-auto"></div>

            <div className="space-y-4">
              {/* Título del módulo */}
              <h2 className="text-sm uppercase tracking-[0.3em] font-semibold text-[#002868]/70 font-sans">
                Sistema administrativo
              </h2>

              {/* La frase */}
              <p className="text-3xl font-light leading-tight max-w-sm mx-auto text-[#002868] border-l-2 border-[#002868]/20 pl-6 italic">
                "Claridad en las cuentas, <br />
                <span className="opacity-60">integridad en los resultados."</span>
              </p>
            </div>
          </div>
        </div>
        {/* Elemento decorativo inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#002868]/5 to-transparent"></div>
      </div>

      {/* Lado derecho - Formulario de login - AZUL en Desktop, BLANCO en Mobile */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white lg:bg-gradient-to-br lg:from-[#002868] lg:to-[#003d8f] relative overflow-hidden">
        {/* Patrón decorativo - Solo visible en Desktop */}
        <div className="hidden lg:block absolute inset-0 opacity-10 login-pattern-light" />
        <div className="w-full max-w-md relative z-10">
          {/* Logo móvil */}
          <div className="lg:hidden text-center mb-8">
            <Image src="/HEROICA.svg" alt="Heroica" width={120} height={48} className="h-12 mx-auto mb-2" />
            <p className="text-[#666666]">Sistema de Contabilidad</p>
          </div>

          {/* Card de login */}
          <Card className="border-[#E0E0E0] lg:border-white/20 bg-white lg:bg-white/95 lg:backdrop-blur-sm shadow-xl lg:shadow-2xl">
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
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868] transition-all text-base pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#002868] transition-colors cursor-pointer"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
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
                  <button
                    type="button"
                    onClick={() => setIsContactDialogOpen(true)}
                    className="text-[#002868] hover:text-[#003d8f] font-semibold transition-colors cursor-pointer underline-offset-2 hover:underline"
                  >
                    Contacta al administrador
                  </button>
                </p>
              </CardFooter>
            </form>
          </Card>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-[#666666] lg:text-white/70">
            © 2026 Heroica. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Dialog de Contacto con Administrador */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#002868]">
              Contactar Administrador
            </DialogTitle>
            <DialogDescription className="text-[#666666]">
              Ponte en contacto con el equipo de soporte para solicitar acceso al sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Email */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#002868]/10 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-[#002868]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[#666666] uppercase tracking-wide">
                    Correo Electrónico
                  </p>
                  <p className="text-sm font-medium text-[#1A1A1A]">
                    lumarsoftarg@gmail.com
                  </p>
                </div>
              </div>
              <a
                href="mailto:lumarsoftarg@gmail.com?subject=Solicitud de acceso al sistema&body=Hola, me gustaría solicitar acceso al sistema de contabilidad Heroica."
                className="block w-full"
              >
                <Button
                  variant="outline"
                  className="w-full border-[#002868] text-[#002868] hover:bg-[#002868] hover:text-white transition-all cursor-pointer"
                >
                  Enviar Email
                </Button>
              </a>
            </div>

            {/* WhatsApp */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[#666666] uppercase tracking-wide">
                    WhatsApp
                  </p>
                  <p className="text-sm font-medium text-[#1A1A1A]">
                    +54 341 277-6893
                  </p>
                </div>
              </div>
              <a
                href="https://wa.me/5493412776893?text=Hola,%20me%20gustaría%20solicitar%20acceso%20al%20sistema%20de%20contabilidad%20Heroica."
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white transition-all cursor-pointer">
                  Abrir WhatsApp
                </Button>
              </a>
            </div>

            {/* Información adicional */}
            <div className="pt-4 border-t border-[#E0E0E0]">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-[#002868] mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-[#002868]">
                      Horario de atención
                    </p>
                    <p className="text-[#666666]">
                      Lunes a Viernes: 9:00 - 18:00 hs
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-[#002868] mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-[#002868]">Departamento</p>
                    <p className="text-[#666666]">
                      Soporte Técnico y Administración
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
