'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '@/lib/config';
import { apiFetch } from '@/lib/api';
import { subcategoriaSchema } from '@/lib/schemas';
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
}

interface Subcategoria {
  id: number;
  categoria_id: number;
  categoria_nombre: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

interface SubcategoriaForm {
  id: number;
  categoria_id: number;
  nombre: string;
  descripcion: string;
}

const DEFAULT_FORM: SubcategoriaForm = {
  id: 0,
  categoria_id: 0,
  nombre: '',
  descripcion: '',
};

export function SubcategoriasSection() {
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<SubcategoriaForm>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    nombre: string;
  } | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');

  useEffect(() => {
    fetchSubcategorias();
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.CATEGORIAS.GET_ALL);
    const data = await res.json();
    if (data.success) setCategorias(data.data);
  };

  const fetchSubcategorias = async () => {
    const res = await apiFetch(
      API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.GET_ALL,
    );
    const data = await res.json();
    if (data.success) setSubcategorias(data.data);
  };

  const handleOpenNew = () => {
    setForm(DEFAULT_FORM);
    setError('');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (sub: Subcategoria) => {
    setForm({
      id: sub.id,
      categoria_id: sub.categoria_id,
      nombre: sub.nombre,
      descripcion: sub.descripcion || '',
    });
    setError('');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const validation = subcategoriaSchema.safeParse(form);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Error de validación');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const url = form.id
        ? API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.UPDATE(form.id)
        : API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.CREATE;
      const res = await apiFetch(url, {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setIsDialogOpen(false);
        await fetchSubcategorias();
      } else {
        setError(data.message);
      }
    } catch {
      setError('Error al guardar subcategoría');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiFetch(
        API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.DELETE(deleteTarget.id),
        { method: 'DELETE' },
      );
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        await fetchSubcategorias();
      }
    } catch {
      toast.error('Error al eliminar subcategoría');
    } finally {
      setDeleteTarget(null);
    }
  };

  const subcategoriasFiltradas =
    filtroCategoria === 'todas'
      ? subcategorias
      : subcategorias.filter(
          (sub) => sub.categoria_id.toString() === filtroCategoria,
        );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <CardTitle>Subcategorías</CardTitle>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-[200px] h-9 text-sm bg-white border-[#E0E0E0]">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleOpenNew}
            className="bg-[#002868] hover:bg-[#003d8f] w-full sm:w-auto"
          >
            + Nueva Subcategoría
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {subcategoriasFiltradas.length === 0 ? (
              <p className="text-center text-[#666666] py-8">
                No hay subcategorías para mostrar
              </p>
            ) : (
              subcategoriasFiltradas.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <h3 className="font-semibold text-[#002868]">
                      {sub.nombre}
                    </h3>
                    <p className="text-xs text-[#666666]">
                      Categoría: {sub.categoria_nombre}
                    </p>
                    {sub.descripcion && (
                      <p className="text-sm text-[#666666] mt-1">
                        {sub.descripcion}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleOpenEdit(sub)}
                      variant="outline"
                      size="sm"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() =>
                        setDeleteTarget({ id: sub.id, nombre: sub.nombre })
                      }
                      variant="outline"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
          <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0]">
            <DialogHeader className="p-0 border-0">
              <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                {form.id ? 'Editar Subcategoría' : 'Nueva Subcategoría'}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
                {form.id
                  ? 'Modifica los detalles de esta subcategoría'
                  : 'Agrega una nueva subcategoría a una categoría existente'}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-8 py-6 space-y-4">
            <div>
              <Label
                htmlFor="subcat-categoria"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Categoría *
              </Label>
              <Select
                value={form.categoria_id ? form.categoria_id.toString() : ''}
                onValueChange={(value) =>
                  setForm({ ...form, categoria_id: parseInt(value) })
                }
              >
                <SelectTrigger className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]">
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
              <Label
                htmlFor="subcat-nombre"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Nombre *
              </Label>
              <Input
                id="subcat-nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Luz"
                className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
              />
            </div>
            <div>
              <Label
                htmlFor="subcat-desc"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Descripción
              </Label>
              <Textarea
                id="subcat-desc"
                value={form.descripcion || ''}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
                placeholder="Descripción opcional"
                className="min-h-[80px] rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
              />
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
                disabled={isSaving || !form.nombre || !form.categoria_id}
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
