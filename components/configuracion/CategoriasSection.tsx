'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '@/lib/config';
import { apiFetch } from '@/lib/api';
import { categoriaSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeleteDialog } from '@/components/ui/delete-dialog';

interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  tipo: 'ingreso' | 'egreso';
}

interface CategoriaForm {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: 'ingreso' | 'egreso';
}

const DEFAULT_FORM: CategoriaForm = {
  id: 0,
  nombre: '',
  descripcion: '',
  tipo: 'egreso',
};

export function CategoriasSection() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<CategoriaForm>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    nombre: string;
  } | null>(null);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.CATEGORIAS.GET_ALL);
    const data = await res.json();
    if (data.success) setCategorias(data.data);
  };

  const handleOpenNew = () => {
    setForm(DEFAULT_FORM);
    setError('');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (cat: Categoria) => {
    setForm({
      id: cat.id,
      nombre: cat.nombre,
      descripcion: cat.descripcion || '',
      tipo: cat.tipo,
    });
    setError('');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const validation = categoriaSchema.safeParse(form);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Error de validación');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const url = form.id
        ? API_ENDPOINTS.CONFIGURACION.CATEGORIAS.UPDATE(form.id)
        : API_ENDPOINTS.CONFIGURACION.CATEGORIAS.CREATE;
      const res = await apiFetch(url, {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setIsDialogOpen(false);
        await fetchCategorias();
      } else {
        setError(data.message);
      }
    } catch {
      setError('Error al guardar categoría');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiFetch(
        API_ENDPOINTS.CONFIGURACION.CATEGORIAS.DELETE(deleteTarget.id),
        { method: 'DELETE' },
      );
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        await fetchCategorias();
      }
    } catch {
      toast.error('Error al eliminar categoría');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Categorías</CardTitle>
          <Button
            onClick={handleOpenNew}
            className="bg-[#002868] hover:bg-[#003d8f]"
          >
            + Nueva Categoría
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categorias.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <h3 className="font-semibold text-[#002868]">
                    {cat.nombre}
                    <span
                      className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        cat.tipo === 'ingreso'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {cat.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                    </span>
                  </h3>
                  {cat.descripcion && (
                    <p className="text-sm text-[#666666]">{cat.descripcion}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleOpenEdit(cat)}
                    variant="outline"
                    size="sm"
                  >
                    Editar
                  </Button>
                  <Button
                    onClick={() =>
                      setDeleteTarget({ id: cat.id, nombre: cat.nombre })
                    }
                    variant="outline"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
          <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0]">
            <DialogHeader className="p-0 border-0">
              <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                {form.id ? 'Editar Categoría' : 'Nueva Categoría'}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
                {form.id
                  ? 'Modifica los detalles de esta categoría'
                  : 'Agrega una nueva categoría al sistema'}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-8 py-6 space-y-4">
            <div>
              <Label
                htmlFor="cat-nombre"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Nombre *
              </Label>
              <Input
                id="cat-nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Servicios"
                className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
              />
            </div>
            <div>
              <Label
                htmlFor="cat-desc"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Descripción
              </Label>
              <Textarea
                id="cat-desc"
                value={form.descripcion || ''}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
                placeholder="Descripción opcional"
                className="min-h-[80px] rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
              />
            </div>
            <div>
              <Label
                htmlFor="cat-tipo"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Tipo *
              </Label>
              <Select
                value={form.tipo || 'egreso'}
                onValueChange={(value: 'ingreso' | 'egreso') =>
                  setForm({ ...form, tipo: value })
                }
              >
                <SelectTrigger className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]">
                  <SelectValue placeholder="Seleccione el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingreso">Ingreso</SelectItem>
                  <SelectItem value="egreso">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
          </div>
          <div className="px-8 py-5 border-t border-[#F0F0F0] bg-[#FAFBFC]">
            <DialogFooter className="sm:justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="h-10 px-5 rounded-lg border-[#E0E0E0] text-[#5A6070] font-medium hover:bg-[#F0F0F0] hover:text-[#1A1A1A] transition-all"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !form.nombre}
                className="h-10 px-6 rounded-lg bg-[#002868] text-white font-semibold hover:bg-[#003d8f] shadow-sm transition-all"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={!!deleteTarget}
        nombre={deleteTarget?.nombre ?? ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
