import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDialog({ open, onOpenChange }: ContactDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#002868]">
            Contactar Administrador
          </DialogTitle>
          <DialogDescription className="text-[#666666]">
            Ponte en contacto con el equipo de soporte para solicitar acceso al
            sistema
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

          {/* Info adicional */}
          <div className="pt-4 border-t border-[#E0E0E0] space-y-2 text-sm">
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
      </DialogContent>
    </Dialog>
  );
}
