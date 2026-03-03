import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BancoForm } from "@/hooks/configuracion/use-configuracion";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: BancoForm;
  onChange: (form: BancoForm) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function BancoDialog({
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
          <DialogTitle>{form.id ? "Editar Banco" : "Nuevo Banco"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input
              value={form.nombre}
              onChange={(e) => onChange({ ...form, nombre: e.target.value })}
              placeholder="Ej: Banco Galicia"
            />
          </div>
          <div>
            <Label>Código</Label>
            <Input
              value={form.codigo}
              onChange={(e) => onChange({ ...form, codigo: e.target.value })}
              placeholder="Ej: GALI"
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
