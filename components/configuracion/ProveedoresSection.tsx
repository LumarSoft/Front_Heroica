'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '@/lib/config';
import { apiFetch } from '@/lib/api';
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
import { DeleteDialog } from '@/components/ui/delete-dialog';

interface ProveedorItem {
  id: number;
  nombre: string;
  activo: boolean; // Just in case, although active might not be on table initially
}

interface ProveedorForm {
  id: number;
  nombre: string;
}

const DEFAULT_FORM: ProveedorForm = {
  id: 0,
  nombre: '',
};

export function ProveedoresSection() {
  const [items, setItems] = useState<ProveedorItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<ProveedorForm>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    nombre: string;
  } | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.PROVEEDORES.GET_ALL);
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch {
      toast.error('Error al obtener proveedores');
    }
  };

  const handleOpenNew = () => {
    setForm(DEFAULT_FORM);
    setError('');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: ProveedorItem) => {
    setForm({
      id: item.id,
      nombre: item.nombre,
    });
    setError('');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const url = form.id
        ? API_ENDPOINTS.CONFIGURACION.PROVEEDORES.UPDATE(form.id)
        : API_ENDPOINTS.CONFIGURACION.PROVEEDORES.CREATE;
      const res = await apiFetch(url, {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setIsDialogOpen(false);
        await fetchItems();
      } else {
        setError(data.message);
      }
    } catch {
      setError('Error al guardar proveedor');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiFetch(
        API_ENDPOINTS.CONFIGURACION.PROVEEDORES.DELETE(deleteTarget.id),
        { method: 'DELETE' },
      );
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        await fetchItems();
      }
    } catch {
      toast.error('Error al eliminar proveedor');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Proveedores</CardTitle>
          <Button
            onClick={handleOpenNew}
            className="bg-[#002868] hover:bg-[#003d8f]"
          >
            + Nuevo Proveedor
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <h3 className="font-semibold text-[#002868]">
                    {item.nombre}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleOpenEdit(item)}
                    variant="outline"
                    size="sm"
                  >
                    Editar
                  </Button>
                  <Button
                    onClick={() =>
                      setDeleteTarget({ id: item.id, nombre: item.nombre })
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
                {form.id ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
                {form.id
                  ? 'Modifica los detalles de este proveedor'
                  : 'Agrega un nuevo proveedor al sistema'}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-8 py-6 space-y-4">
            <div>
              <Label
                htmlFor="prov-nombre"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Nombre *
              </Label>
              <Input
                id="prov-nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Distribuidora Oeste S.A."
                className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
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
                disabled={isSaving || !form.nombre.trim()}
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
