'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Check, ChevronsUpDown, MapPin, RefreshCw, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCodigosPostales } from '@/hooks/use-codigos-postales'
import { cn } from '@/lib/utils'

interface CodigoPostalSelectorProps {
  title: string
  provinciaCodigo: string
  localidad: string
  codigoPostal: string
  required?: boolean
  onChange: (value: { provinciaCodigo: string; localidad: string; codigoPostal: string }) => void
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
}

export function CodigoPostalSelector({
  title,
  provinciaCodigo,
  localidad,
  codigoPostal,
  required = false,
  onChange,
}: CodigoPostalSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const { provincias, codigos, loadingProvincias, loadingCodigos, error, stale, retry } =
    useCodigosPostales(provinciaCodigo)

  const filtered = useMemo(() => {
    const query = normalizeSearch(search.trim())
    if (!query) return codigos
    return codigos.filter(item =>
      normalizeSearch(`${item.localidad} ${item.partido ?? ''} ${item.codigo_postal}`).includes(query),
    )
  }, [codigos, search])

  const selected = useMemo(
    () => codigos.find(item => item.localidad === localidad && item.codigo_postal === codigoPostal),
    [codigoPostal, codigos, localidad],
  )
  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 52,
    overscan: 6,
  })

  useEffect(() => {
    virtualizer.scrollToOffset(0)
  }, [search, virtualizer])

  useEffect(() => {
    if (!open) return
    const frameId = requestAnimationFrame(() => virtualizer.measure())
    return () => cancelAnimationFrame(frameId)
  }, [open, virtualizer])

  const selectProvince = (codigo: string) => {
    setSearch('')
    setOpen(false)
    onChange({
      provinciaCodigo: codigo,
      localidad: codigo === 'C' ? 'Ciudad Autónoma de Buenos Aires' : '',
      codigoPostal: '',
    })
  }

  const manualMode = provinciaCodigo === 'C' || Boolean(error)
  const selectedLabel = selected
    ? `${selected.localidad} · CP ${selected.codigo_postal}`
    : localidad && codigoPostal
      ? `${localidad} · CP ${codigoPostal}`
      : ''

  return (
    <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-[#DCE4F0] bg-[#F8FAFD] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="rounded-lg bg-[#E7EEFC] p-2 text-[#002868]" aria-hidden>
            <MapPin className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">{title}</p>
            <p className="text-[11px] leading-snug text-[#7A8493]">
              Elegí la provincia y buscá por localidad o por los 4 dígitos del código postal.
            </p>
          </div>
        </div>
        {!required && provinciaCodigo ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-2 text-xs text-[#7A8493]"
            onClick={() => onChange({ provinciaCodigo: '', localidad: '', codigoPostal: '' })}
          >
            <X className="mr-1 h-3 w-3" /> Quitar
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-[#444]">
            Provincia{required ? <span className="ml-0.5 text-rose-500">*</span> : null}
          </Label>
          <Select value={provinciaCodigo} onValueChange={selectProvince} disabled={loadingProvincias}>
            <SelectTrigger className="h-10 w-full bg-white">
              <SelectValue placeholder={loadingProvincias ? 'Cargando provincias…' : 'Seleccioná una provincia'} />
            </SelectTrigger>
            <SelectContent>
              {provincias.map(provincia => (
                <SelectItem key={provincia.codigo} value={provincia.codigo}>
                  {provincia.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-[#444]">
            Localidad y código postal{required ? <span className="ml-0.5 text-rose-500">*</span> : null}
          </Label>
          {loadingCodigos ? (
            <div className="flex h-10 items-center gap-2 rounded-md border bg-white px-3 text-sm text-[#7A8493]">
              <LoadingSpinner className="h-4 w-4" /> Cargando códigos postales…
            </div>
          ) : manualMode ? (
            <div className="grid grid-cols-[1fr_112px] gap-2">
              <Input
                value={localidad}
                onChange={event => onChange({ provinciaCodigo, localidad: event.target.value, codigoPostal })}
                placeholder="Localidad"
                maxLength={120}
                disabled={!provinciaCodigo || provinciaCodigo === 'C'}
              />
              <Input
                inputMode="numeric"
                value={codigoPostal}
                onChange={event =>
                  onChange({
                    provinciaCodigo,
                    localidad,
                    codigoPostal: event.target.value.replace(/\D/g, '').slice(0, 4),
                  })
                }
                placeholder="CP"
                maxLength={4}
                aria-label="Código postal"
                disabled={!provinciaCodigo}
              />
            </div>
          ) : (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  disabled={!provinciaCodigo}
                  className="h-10 w-full justify-between bg-white px-3 font-normal"
                >
                  <span className={cn('truncate', !selectedLabel && 'text-muted-foreground')}>
                    {selectedLabel || 'Buscá localidad o código postal'}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                <div className="flex items-center gap-2 border-b px-3">
                  <Search className="h-4 w-4 shrink-0 text-[#8A8F9C]" />
                  <Input
                    autoFocus
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    onKeyDown={event => {
                      if (event.key !== 'Enter' || !filtered[0]) return
                      event.preventDefault()
                      const firstItem = filtered[0]
                      onChange({
                        provinciaCodigo,
                        localidad: firstItem.localidad,
                        codigoPostal: firstItem.codigo_postal,
                      })
                      setOpen(false)
                      setSearch('')
                    }}
                    placeholder="Ej.: Córdoba o 5000"
                    className="h-11 border-0 px-0 shadow-none focus-visible:ring-0"
                  />
                </div>
                <p className="border-b px-3 py-1.5 text-[10px] text-[#8A8F9C]">
                  {filtered.length.toLocaleString('es-AR')} resultado{filtered.length === 1 ? '' : 's'}
                </p>
                <div
                  ref={listRef}
                  role="listbox"
                  aria-label="Localidades y códigos postales"
                  className="h-64 overflow-auto"
                >
                  {filtered.length === 0 ? (
                    <p className="px-4 py-10 text-center text-sm text-[#8A8F9C]">No encontramos coincidencias.</p>
                  ) : (
                    <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
                      {virtualizer.getVirtualItems().map(virtualRow => {
                        const item = filtered[virtualRow.index]
                        const isSelected = item.id === selected?.id
                        return (
                          <Button
                            key={item.id}
                            type="button"
                            variant="ghost"
                            role="option"
                            aria-selected={isSelected}
                            // La posición depende del cálculo dinámico del virtualizador.
                            style={{ transform: `translateY(${virtualRow.start}px)` }}
                            className="absolute left-0 top-0 h-[52px] w-full justify-start rounded-none px-3 text-left"
                            onClick={() => {
                              onChange({
                                provinciaCodigo,
                                localidad: item.localidad,
                                codigoPostal: item.codigo_postal,
                              })
                              setOpen(false)
                              setSearch('')
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{item.localidad}</span>
                              {item.partido ? (
                                <span className="block truncate text-[10px] text-[#8A8F9C]">{item.partido}</span>
                              ) : null}
                            </span>
                            <span className="ml-2 rounded-md bg-[#E7EEFC] px-2 py-1 font-mono text-xs font-semibold text-[#002868]">
                              {item.codigo_postal}
                            </span>
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {provinciaCodigo === 'C' ? (
        <p className="mt-2 text-[11px] text-amber-700">
          En CABA el código exacto depende de la calle y altura; ingresá los 4 dígitos correspondientes al domicilio.
        </p>
      ) : error ? (
        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-amber-700">
          <span>{error} Ingresá localidad y CP manualmente.</span>
          <Button type="button" variant="ghost" size="sm" className="h-7" onClick={retry}>
            <RefreshCw className="mr-1 h-3 w-3" /> Reintentar
          </Button>
        </div>
      ) : provinciaCodigo && codigos.length > 0 ? (
        <p className="mt-2 text-[11px] text-[#7A8493]">
          {codigos.length.toLocaleString('es-AR')} localidades disponibles · Fuente: Correo Argentino
          {stale ? ' (última copia disponible)' : ''}
        </p>
      ) : null}
    </div>
  )
}
