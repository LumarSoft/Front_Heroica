import { LayoutList } from 'lucide-react'

export function EmptyColumn() {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center border-2 border-dashed border-slate-200 rounded-xl">
      <LayoutList className="w-7 h-7 text-slate-300 mb-2" />
      <p className="text-xs text-slate-400 font-medium">Sin tareas</p>
    </div>
  )
}
