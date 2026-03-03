import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubcategoriaForm } from "@/hooks/configuracion/use-configuracion";
import { Categoria } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: SubcategoriaForm;
  onChange: (form: SubcategoriaForm) => void;
  categorias: Categoria[];
  onSave: () => void;
  isSaving: boolean;
}

export function SubcategoriaDialog({
  open,
  onOpenChange,
  form,
  onChange,
  categorias,
  onSave,
  isSaving,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {form.id ? "Editar Subcategoría" : "Nueva Subcategoría"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Categoría *</Label>
            <Select
              value={form.categoria_id ? form.categoria_id.toString() : ""}
              onValueChange={(value) =>
                onChange({ ...form, categoria_id: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nombre *</Label>
            <Input
              value={form.nombre}
              onChange={(e) => onChange({ ...form, nombre: e.target.value })}
              placeholder="Ej: Luz"
            />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea
              value={form.descripcion}
              onChange={(e) =>
                onChange({ ...form, descripcion: e.target.value })
              }
              placeholder="Descripción opcional"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving || !form.nombre || !form.categoria_id}
            className="bg-[#002868] hover:bg-[#003d8f]"
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
