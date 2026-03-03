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
import { CategoriaForm } from "@/hooks/configuracion/use-configuracion";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: CategoriaForm;
  onChange: (form: CategoriaForm) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function CategoriaDialog({
  open,
  onOpenChange,
  form,
  onChange,
  onSave,
  isSaving,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {form.id ? "Editar Categoría" : "Nueva Categoría"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input
              value={form.nombre}
              onChange={(e) => onChange({ ...form, nombre: e.target.value })}
              placeholder="Ej: Servicios"
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
            disabled={isSaving || !form.nombre}
            className="bg-[#002868] hover:bg-[#003d8f]"
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
