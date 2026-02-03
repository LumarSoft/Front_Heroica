"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { API_ENDPOINTS } from "@/lib/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Tipos para las transacciones
interface Transaction {
  id: number;
  sucursal_id: number;
  fecha: string;
  concepto: string;
  monto: number | string; // Puede venir como string desde la API
  descripcion?: string;
  prioridad: 'baja' | 'media' | 'alta';
  tipo_movimiento: string;
  estado: string;
}

export default function CajaEfectivoPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Estados para los dialogs
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form data para el dialog de detalles
  const [formData, setFormData] = useState({
    fecha: "",
    concepto: "",
    monto: "",
    descripcion: "",
    prioridad: "media" as 'baja' | 'media' | 'alta',
  });

  // Estado para el cambio de estado
  const [nuevoEstado, setNuevoEstado] = useState("");

  // Datos de movimientos
  const [saldoReal, setSaldoReal] = useState<Transaction[]>([]);
  const [saldoNecesario, setSaldoNecesario] = useState<Transaction[]>([]);

  // Esperar a que Zustand se hidrate desde localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    // Cargar movimientos
    fetchMovimientos();
  }, [isAuthenticated, isHydrated, router, params.id]);

  // Función para cargar movimientos desde la API
  const fetchMovimientos = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(API_ENDPOINTS.MOVIMIENTOS.GET_BY_SUCURSAL(Number(params.id)));
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar movimientos');
      }

      setSaldoReal(data.data.saldo_real || []);
      setSaldoNecesario(data.data.saldo_necesario || []);

    } catch (err: any) {
      console.error('Error al cargar movimientos:', err);
      setError(err.message || 'Error al cargar movimientos');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para formatear fechas de ISO a dd/mm/aaaa
  const formatFecha = (fechaISO: string) => {
    const date = new Date(fechaISO);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Función para formatear montos
  const formatMonto = (monto: number | string) => {
    const montoNum = typeof monto === 'string' ? parseFloat(monto) : monto;
    const formatted = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(Math.abs(montoNum));
    
    return montoNum < 0 ? `-${formatted}` : formatted;
  };

  // Función para calcular el total de una tabla
  const calcularTotal = (transactions: Transaction[]) => {
    return transactions.reduce((sum, t) => {
      const monto = typeof t.monto === 'string' ? parseFloat(t.monto) : t.monto;
      return sum + monto;
    }, 0);
  };

  // Abrir dialog de detalles
  const handleOpenDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      fecha: transaction.fecha,
      concepto: transaction.concepto,
      monto: transaction.monto.toString(),
      descripcion: transaction.descripcion || "",
      prioridad: transaction.prioridad || "media",
    });
    setIsDetailsDialogOpen(true);
  };

  // Abrir dialog de cambio de estado
  const handleOpenStateChange = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setNuevoEstado(transaction.estado || "pendiente");
    setIsStateDialogOpen(true);
  };

  // Abrir dialog de confirmación de eliminación
  const handleOpenDelete = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  // Guardar cambios del dialog de detalles
  const handleSaveDetails = async () => {
    if (!selectedTransaction) return;

    try {
      setIsSaving(true);
      setError("");

      const response = await fetch(API_ENDPOINTS.MOVIMIENTOS.UPDATE(selectedTransaction.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: formData.fecha,
          concepto: formData.concepto,
          monto: parseFloat(formData.monto),
          descripcion: formData.descripcion,
          prioridad: formData.prioridad,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar movimiento');
      }

      setSuccessMessage("Movimiento actualizado exitosamente");
      setIsDetailsDialogOpen(false);
      
      // Recargar movimientos
      await fetchMovimientos();

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (err: any) {
      console.error('Error al actualizar movimiento:', err);
      setError(err.message || 'Error al actualizar movimiento');
    } finally {
      setIsSaving(false);
    }
  };

  // Guardar cambio de estado
  const handleSaveStateChange = async () => {
    if (!selectedTransaction) return;

    try {
      setIsSaving(true);
      setError("");

      const response = await fetch(API_ENDPOINTS.MOVIMIENTOS.UPDATE_ESTADO(selectedTransaction.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar estado');
      }

      setSuccessMessage("Estado actualizado exitosamente");
      setIsStateDialogOpen(false);
      
      // Recargar movimientos
      await fetchMovimientos();

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (err: any) {
      console.error('Error al cambiar estado:', err);
      setError(err.message || 'Error al cambiar estado');
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminar movimiento
  const handleDelete = async () => {
    if (!selectedTransaction) return;

    try {
      setIsSaving(true);
      setError("");

      const response = await fetch(API_ENDPOINTS.MOVIMIENTOS.DELETE(selectedTransaction.id), {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar movimiento');
      }

      setSuccessMessage("Movimiento eliminado exitosamente");
      setIsDeleteDialogOpen(false);
      
      // Recargar movimientos
      await fetchMovimientos();

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (err: any) {
      console.error('Error al eliminar movimiento:', err);
      setError(err.message || 'Error al eliminar movimiento');
    } finally {
      setIsSaving(false);
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D4C92] via-[#2E7DDF] to-[#0D4C92] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // Componente de tabla reutilizable
  const TransactionTable = ({ 
    title, 
    description, 
    transactions 
  }: { 
    title: string; 
    description: string; 
    transactions: Transaction[] 
  }) => {
    const total = calcularTotal(transactions);
    
    return (
      <Card className="border-white/20 bg-white/95 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-[#0D4C92]">
                {title}
              </CardTitle>
              <CardDescription className="text-[#A5A5A5]">
                {description}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#A5A5A5] font-medium">Total</p>
              <p className={`text-2xl font-bold ${total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatMonto(total)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-[#A5A5A5]/20">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#0D4C92]/5 hover:bg-[#0D4C92]/10">
                  <TableHead className="font-bold text-[#0D4C92]">Fecha</TableHead>
                  <TableHead className="font-bold text-[#0D4C92]">Concepto</TableHead>
                  <TableHead className="font-bold text-[#0D4C92] text-right">Monto</TableHead>
                  <TableHead className="font-bold text-[#0D4C92] text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-[#A5A5A5] py-8">
                      No hay movimientos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-[#0D4C92]/5">
                      <TableCell className="font-medium">{formatFecha(transaction.fecha)}</TableCell>
                      <TableCell>{transaction.concepto}</TableCell>
                      <TableCell className={`text-right font-semibold ${transaction.monto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatMonto(transaction.monto)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDetails(transaction)}
                            className="bg-[#0D4C92] text-white hover:bg-[#2E7DDF] border-none"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenStateChange(transaction)}
                            className="bg-[#2E7DDF] text-white hover:bg-[#0D4C92] border-none"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDelete(transaction)}
                            className="bg-red-500 text-white hover:bg-red-600 border-none"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D4C92] via-[#2E7DDF] to-[#0D4C92]">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push(`/sucursales/${params.id}`)}
              variant="outline"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Caja en Efectivo</h1>
              <p className="text-sm text-white/80">Gestión de movimientos de efectivo</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Mensajes de error y éxito */}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600 font-medium">⚠️ {error}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-600 font-medium">✓ {successMessage}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-[#0D4C92]/30 border-t-[#0D4C92] rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TransactionTable 
              title="Saldo Real" 
              description="Movimientos de efectivo confirmados"
              transactions={saldoReal}
            />
            
            <TransactionTable 
              title="Saldo Necesario" 
              description="Pagos y compromisos programados"
              transactions={saldoNecesario}
            />
          </div>
        )}
      </main>

      {/* Dialog de Detalles */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0D4C92]">Detalles del Movimiento</DialogTitle>
            <DialogDescription className="text-[#A5A5A5]">
              Edita la información del movimiento de caja
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fecha" className="text-[#0D4C92] font-semibold">Fecha</Label>
              <Input
                id="fecha"
                name="fecha"
                type="date"
                value={formData.fecha}
                onChange={handleInputChange}
                className="border-[#A5A5A5]/30 focus:border-[#2E7DDF]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="concepto" className="text-[#0D4C92] font-semibold">Concepto</Label>
              <Input
                id="concepto"
                name="concepto"
                value={formData.concepto}
                onChange={handleInputChange}
                className="border-[#A5A5A5]/30 focus:border-[#2E7DDF]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monto" className="text-[#0D4C92] font-semibold">Monto</Label>
              <Input
                id="monto"
                name="monto"
                type="number"
                value={formData.monto}
                onChange={handleInputChange}
                className="border-[#A5A5A5]/30 focus:border-[#2E7DDF]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion" className="text-[#0D4C92] font-semibold">Descripción</Label>
              <Input
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                className="border-[#A5A5A5]/30 focus:border-[#2E7DDF]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prioridad" className="text-[#0D4C92] font-semibold">Prioridad</Label>
              <select
                id="prioridad"
                name="prioridad"
                value={formData.prioridad}
                onChange={handleInputChange}
                className="w-full rounded-md border border-[#A5A5A5]/30 px-3 py-2 focus:border-[#2E7DDF] focus:outline-none focus:ring-1 focus:ring-[#2E7DDF]"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailsDialogOpen(false)}
              className="border-[#A5A5A5]/30"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveDetails}
              disabled={isSaving}
              className="bg-gradient-to-r from-[#0D4C92] to-[#2E7DDF] text-white hover:from-[#0D4C92]/90 hover:to-[#2E7DDF]/90"
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Cambio de Estado */}
      <Dialog open={isStateDialogOpen} onOpenChange={setIsStateDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0D4C92]">Cambiar Estado</DialogTitle>
            <DialogDescription className="text-[#A5A5A5]">
              Selecciona el nuevo estado para este movimiento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="estado" className="text-[#0D4C92] font-semibold">Nuevo Estado</Label>
              <select
                id="estado"
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value)}
                className="w-full rounded-md border border-[#A5A5A5]/30 px-3 py-2 focus:border-[#2E7DDF] focus:outline-none focus:ring-1 focus:ring-[#2E7DDF]"
              >
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
                <option value="completado">Completado</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStateDialogOpen(false)}
              className="border-[#A5A5A5]/30"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveStateChange}
              disabled={isSaving}
              className="bg-gradient-to-r from-[#0D4C92] to-[#2E7DDF] text-white hover:from-[#0D4C92]/90 hover:to-[#2E7DDF]/90"
            >
              {isSaving ? 'Guardando...' : 'Cambiar Estado'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmación de Eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600">Confirmar Eliminación</DialogTitle>
            <DialogDescription className="text-[#A5A5A5]">
              ¿Estás seguro de que deseas eliminar este movimiento? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-[#A5A5A5]/30"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isSaving}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isSaving ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
