'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, FileText, X } from 'lucide-react'
import type { NuevoMovimientoContext } from '@/lib/types'
interface Props {
  context: NuevoMovimientoContext
}
export function MovimientoComprobantes({ context }: Props) {
  const { fileInputRef, handleFileSelect, selectedFiles, handleRemoveFile } = context
  return (
    <div className="px-8 py-4 border-t border-dashed border-[#E8E8E8] flex-shrink-0">
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-[#002868] uppercase tracking-widest flex items-center gap-2">
          <span className="w-1 h-4 bg-[#002868] rounded-full" />
          Adjuntar comprobantes
        </h4>
        <p className="text-xs text-[#8A8F9C]">
          Podés adjuntar facturas u órdenes de pago en formato PDF o JPG (máx. 10MB cada uno)
        </p>

        <Input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/jpg"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-10 border-dashed border-2 border-[#E0E0E0] text-[#5A6070] hover:border-[#002868] hover:text-[#002868] hover:bg-[#F0F8FF] transition-all cursor-pointer"
        >
          <Upload className="w-4 h-4 mr-2" />
          Seleccionar archivos
        </Button>

        {selectedFiles.length > 0 && (
          <div className="space-y-2 mt-3">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg bg-[#F8F9FA] border border-[#E0E0E0]"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="w-4 h-4 text-[#002868] flex-shrink-0" />
                  <span className="text-sm text-[#1A1A1A] truncate">{file.name}</span>
                  <span className="text-xs text-[#8A8F9C] flex-shrink-0">({(file.size / 1024).toFixed(0)} KB)</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(index)}
                  className="h-6 w-6 p-0 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
