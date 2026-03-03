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

interface LoginFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  isLoading: boolean;
  error: string;
  handleSubmit: (e: React.FormEvent) => void;
  onOpenContact: () => void;
}

export function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isLoading,
  error,
  handleSubmit,
  onOpenContact,
}: LoginFormProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white lg:bg-gradient-to-br lg:from-[#002868] lg:to-[#003d8f] relative overflow-hidden">
      <div
        className="hidden lg:block absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, #FFFFFF 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo móvil */}
        <div className="lg:hidden text-center mb-8">
          <img src="/HEROICA.svg" alt="Heroica" className="h-12 mx-auto mb-2" />
          <p className="text-[#666666]">Sistema de Contabilidad</p>
        </div>

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
              {/* Error */}
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

              {/* Email */}
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

              {/* Password */}
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
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
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
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                  onClick={onOpenContact}
                  className="text-[#002868] hover:text-[#003d8f] font-semibold transition-colors cursor-pointer underline-offset-2 hover:underline"
                >
                  Contacta al administrador
                </button>
              </p>
            </CardFooter>
          </form>
        </Card>

        <p className="mt-8 text-center text-sm text-[#666666] lg:text-white/70">
          © 2026 Heroica. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
