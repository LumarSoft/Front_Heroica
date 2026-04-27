'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, Globe2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function RecursosHumanosCalendarioPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F8F9FA] to-[#EEF3FF]">
      <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 gap-3">
            <Button
              onClick={() => router.push('/recursos-humanos')}
              variant="ghost"
              size="icon"
              className="w-9 h-9 text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8 cursor-pointer rounded-lg"
              aria-label="Volver a recursos humanos"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] leading-none mb-1">
                Recursos Humanos
              </p>
              <h1 className="text-sm sm:text-base font-semibold text-[#002868] truncate leading-none">
                Calendario general
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8 sm:mb-10 flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#002868] flex items-center justify-center flex-shrink-0 shadow-sm">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7A93BB] mb-1">General</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#002868]">Calendario de RRHH</h2>
            <p className="text-[#666666] text-base sm:text-lg mt-1">
              Vista transversal del módulo, compartida por todas las sucursales.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 max-w-6xl">
          <Card className="bg-white border-[#D8E3F8] shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#002868] flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Seleccionar fecha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="mx-auto"
                buttonVariant="outline"
              />
            </CardContent>
          </Card>

          <Card className="bg-white border-[#D8E3F8] shadow-sm overflow-hidden">
            <CardContent className="p-8 sm:p-10 h-full flex flex-col justify-center">
              <div className="w-16 h-16 rounded-3xl bg-[#EAF0FF] flex items-center justify-center mb-6">
                <Globe2 className="w-8 h-8 text-[#002868]" />
              </div>
              <h3 className="text-2xl font-bold text-[#002868] mb-3">Calendario inherente a todas las sucursales</h3>
              <p className="text-[#666666] leading-relaxed max-w-xl">
                Esta sección vive fuera de la gestión individual por sucursal. Desde acá se centralizarán feriados,
                vencimientos, novedades y eventos generales de Recursos Humanos.
              </p>
              <div className="mt-6 rounded-2xl border border-dashed border-[#D8E3F8] bg-[#F8FAFF] p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#9AA0AC] mb-1">Fecha seleccionada</p>
                <p className="text-lg font-semibold text-[#1A1A1A]">
                  {selectedDate
                    ? selectedDate.toLocaleDateString('es-AR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Sin fecha seleccionada'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
