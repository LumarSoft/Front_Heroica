"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { API_ENDPOINTS } from "@/lib/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import NuevoMovimientoDialog from "@/components/NuevoMovimientoDialog";

// Tipos para las transacciones
interface Transaction {
  id: number;
  sucursal_id: number;
  fecha: string;
  concepto: string;
  monto: number | string; // Puede venir como string desde la API
  descripcion?: string;
  prioridad: "baja" | "media" | "alta";
  tipo: "ingreso" | "egreso" | string;
  tipo_movimiento: string;
  estado: string;
  categoria_id?: number | string;
  subcategoria_id?: number | string;
}

interface Categoria {
  id: number;
  nombre: string;
}

interface Subcategoria {
  id: number;
  categoria_id: number;
  nombre: string;
}

export default function CajaEfectivoPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Estados para los dialogs
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isNuevoMovimientoDialogOpen, setIsNuevoMovimientoDialogOpen] =
    useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    fecha: "",
    concepto: "",
    monto: "",
    descripcion: "",
    prioridad: "media" as "baja" | "media" | "alta",
    tipo: "ingreso",
    categoria_id: "",
    subcategoria_id: "",
  });

  // Estado para el cambio de estado
  const [nuevoEstado, setNuevoEstado] = useState("");

  // Datos de movimientos
  const [saldoReal, setSaldoReal] = useState<Transaction[]>([]);
  const [saldoNecesario, setSaldoNecesario] = useState<Transaction[]>([]);

  // Categorías y Subcategorías
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);

  // Esperar a que Zustand se hidrate desde localStorage
  useEffect(() => {
    setIsHydrated(true);
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CONFIGURACION.CATEGORIAS.GET_ALL);
      const data = await response.json();
      if (response.ok) setCategorias(data.data || []);
    } catch (err) {
      console.error("Error al cargar categorías:", err);
    }
  };

  useEffect(() => {
    if (formData.categoria_id) {
      fetchSubcategorias(Number(formData.categoria_id));
    } else {
      setSubcategorias([]);
    }
  }, [formData.categoria_id]);

  const fetchSubcategorias = async (categoriaId: number) => {
    try {
      const response = await fetch(API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.GET_BY_CATEGORIA(categoriaId));
      const data = await response.json();
      if (response.ok) setSubcategorias(data.data || []);
    } catch (err) {
      console.error("Error al cargar subcategorías:", err);
    }
  };

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push("/");
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

      const response = await fetch(
        API_ENDPOINTS.MOVIMIENTOS.GET_BY_SUCURSAL(Number(params.id)),
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar movimientos");
      }

      // Filtrar movimientos según las reglas:
      // - No mostrar rechazados
      // - Completados van a saldo_real
      // - Aprobados van a saldo_necesario
      const allMovimientos = [
        ...(data.data.saldo_real || []),
        ...(data.data.saldo_necesario || []),
      ];

      // Filtrar rechazados y separar por estado
      const movimientosCompletados = allMovimientos.filter(
        (m: Transaction) => m.estado === "completado",
      );
      const movimientosAprobados = allMovimientos.filter(
        (m: Transaction) => m.estado === "aprobado",
      );

      setSaldoReal(movimientosCompletados);
      setSaldoNecesario(movimientosAprobados);
    } catch (err: any) {
      console.error("Error al cargar movimientos:", err);
      setError(err.message || "Error al cargar movimientos");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para formatear fechas de ISO a dd/mm/aaaa
  const formatFecha = (fechaISO: string) => {
    const date = new Date(fechaISO);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Función para formatear montos
  const formatMonto = (monto: number | string) => {
    const montoNum = typeof monto === "string" ? parseFloat(monto) : monto;
    const formatted = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(Math.abs(montoNum));

    return montoNum < 0 ? `-${formatted}` : formatted;
  };

  // Función para calcular el total de una tabla
  const calcularTotal = (transactions: Transaction[]) => {
    return transactions.reduce((sum, t) => {
      const monto = typeof t.monto === "string" ? parseFloat(t.monto) : t.monto;
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
      tipo: transaction.tipo || (Number(transaction.monto) < 0 ? "egreso" : "ingreso"),
      categoria_id: transaction.categoria_id ? transaction.categoria_id.toString() : "",
      subcategoria_id: transaction.subcategoria_id ? transaction.subcategoria_id.toString() : "",
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

      const response = await fetch(
        API_ENDPOINTS.MOVIMIENTOS.UPDATE(selectedTransaction.id),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fecha: formData.fecha,
            concepto: formData.concepto,
            monto: parseFloat(formData.monto),
            descripcion: formData.descripcion,
            prioridad: formData.prioridad,
            tipo: formData.tipo,
            categoria_id: formData.categoria_id ? Number(formData.categoria_id) : null,
            subcategoria_id: formData.subcategoria_id ? Number(formData.subcategoria_id) : null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al actualizar movimiento");
      }

      setSuccessMessage("Movimiento actualizado exitosamente");
      setIsDetailsDialogOpen(false);

      // Recargar movimientos
      await fetchMovimientos();

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Error al actualizar movimiento:", err);
      setError(err.message || "Error al actualizar movimiento");
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

      const response = await fetch(
        API_ENDPOINTS.MOVIMIENTOS.UPDATE_ESTADO(selectedTransaction.id),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: nuevoEstado }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al cambiar estado");
      }

      setSuccessMessage("Estado actualizado exitosamente");
      setIsStateDialogOpen(false);

      // Recargar movimientos
      await fetchMovimientos();

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Error al cambiar estado:", err);
      setError(err.message || "Error al cambiar estado");
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

      const response = await fetch(
        API_ENDPOINTS.MOVIMIENTOS.DELETE(selectedTransaction.id),
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al eliminar movimiento");
      }

      setSuccessMessage("Movimiento eliminado exitosamente");
      setIsDeleteDialogOpen(false);

      // Recargar movimientos
      await fetchMovimientos();

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Error al eliminar movimiento:", err);
      setError(err.message || "Error al eliminar movimiento");
    } finally {
      setIsSaving(false);
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin"></div>
      </div>
    );
  }

  // Componente de tabla reutilizable
  const TransactionTable = ({
    title,
    description,
    transactions,
    customTotal,
  }: {
    title: string;
    description: string;
    transactions: Transaction[];
    customTotal?: number;
  }) => {
    const total = customTotal !== undefined ? customTotal : calcularTotal(transactions);

    return (
      <Card className="border-[#E0E0E0] bg-white shadow-lg">
        <CardHeader className="border-b border-[#E0E0E0]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-[#002868]">
                {title}
              </CardTitle>
              <CardDescription className="text-[#666666]">
                {description}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#666666] font-medium mb-1">Total</p>
              <div
                className={`inline-flex items-center justify-center px-4 py-2 rounded-lg ${total >= 0 ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}
              >
                <p
                  className={`text-2xl font-bold ${total >= 0 ? "text-emerald-700" : "text-rose-700"}`}
                >
                  {formatMonto(total)}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-[#E0E0E0]">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F8F9FA] hover:bg-[#F8F9FA] border-b-2 border-[#E0E0E0]">
                  <TableHead className="font-bold text-[#002868] text-sm">
                    Fecha
                  </TableHead>
                  <TableHead className="font-bold text-[#002868] text-sm">
                    Concepto
                  </TableHead>
                  <TableHead className="font-bold text-[#002868] text-sm text-center">
                    Tipo
                  </TableHead>
                  <TableHead className="font-bold text-[#002868] text-sm text-right">
                    Monto
                  </TableHead>
                  <TableHead className="font-bold text-[#002868] text-sm text-center">
                    Prioridad
                  </TableHead>
                  <TableHead className="font-bold text-[#002868] text-sm text-center">
                    Estado
                  </TableHead>
                  <TableHead className="font-bold text-[#002868] text-sm text-center">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-[#666666] py-12"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-12 h-12 text-[#666666]/50"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                          />
                        </svg>
                        <p className="font-medium">
                          No hay movimientos registrados
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className="hover:bg-[#F8F9FA]/50 transition-colors border-b border-[#E0E0E0]/50"
                    >
                      <TableCell className="font-medium text-[#1A1A1A]">
                        {formatFecha(transaction.fecha)}
                      </TableCell>
                      <TableCell className="text-[#1A1A1A]">
                        {transaction.concepto}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.tipo === "egreso" || (!transaction.tipo && Number(transaction.monto) < 0)
                            ? "bg-rose-100 text-rose-800"
                            : "bg-emerald-100 text-emerald-800"
                            }`}
                        >
                          {transaction.tipo === "egreso" || (!transaction.tipo && Number(transaction.monto) < 0) ? "Egreso" : "Ingreso"}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold text-base ${Number(transaction.monto) >= 0 ? "text-emerald-700" : "text-rose-700"}`}
                      >
                        {formatMonto(transaction.monto)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.prioridad === "alta"
                            ? "bg-rose-100 text-rose-800"
                            : transaction.prioridad === "media"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {transaction.prioridad.charAt(0).toUpperCase() +
                            transaction.prioridad.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.estado === "completado"
                            ? "bg-emerald-100 text-emerald-800"
                            : transaction.estado === "aprobado"
                              ? "bg-blue-100 text-blue-800"
                              : transaction.estado === "rechazado"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                        >
                          {transaction.estado.charAt(0).toUpperCase() +
                            transaction.estado.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleOpenDetails(transaction)}
                            className="bg-[#002868] hover:bg-[#003d8f] text-white border-none cursor-pointer shadow-sm hover:shadow-md transition-all flex items-center justify-center"
                            title="Ver detalles"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleOpenStateChange(transaction)}
                            className="bg-[#002868] hover:bg-[#003d8f] text-white border-none cursor-pointer shadow-sm hover:shadow-md transition-all flex items-center justify-center"
                            title="Cambiar estado"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                              />
                            </svg>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleOpenDelete(transaction)}
                            className="bg-rose-500 hover:bg-rose-600 text-white border-none cursor-pointer shadow-sm hover:shadow-md transition-all flex items-center justify-center"
                            title="Eliminar movimiento"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                              />
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

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#E8EAED]">
      {/* Navbar */}
      <Navbar
        userName={user?.nombre}
        userRole={user?.rol}
        onLogout={handleLogout}
        showBackButton={true}
        backUrl={`/sucursales/${params.id}`}
      />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 flex flex-col h-full">
        {user?.rol === "empleado" ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-[#E0E0E0] shadow-sm flex-grow">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-rose-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#002868] mb-2">Acceso Denegado</h2>
            <p className="text-[#666666] text-center max-w-md">
              No tienes permisos para gestionar la caja de efectivo. Si crees que esto es un error, contacta con el administrador.
            </p>
            <Button
              onClick={() => router.push(`/sucursales/${params.id}`)}
              className="mt-8 bg-[#002868] hover:bg-[#003d8f] text-white"
            >
              Volver al inicio
            </Button>
          </div>
        ) : (
          <div className="flex flex-col space-y-6 flex-grow">
            {/* Mensajes de error y éxito */}
            {error && (
              <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600 font-medium">⚠️ {error}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-600 font-medium">
                  ✓ {successMessage}
                </p>
              </div>
            )}

            {/* Cabecera y Botón Nuevo Movimiento */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
              <div>
                <h1 className="text-3xl font-bold text-[#002868] mb-1">Caja Efectivo</h1>
                <p className="text-sm text-[#666666]">Gestión de saldos y movimientos en efectivo</p>
              </div>
              <Button
                onClick={() => setIsNuevoMovimientoDialogOpen(true)}
                className="bg-[#002868] flex-shrink-0 hover:bg-[#003d8f] text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Nuevo Movimiento
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16 flex-grow">
                <div className="w-12 h-12 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin"></div>
              </div>
            ) : (
              <Tabs defaultValue="real" className="w-full flex-grow flex flex-col">
                <TabsList className="mb-6 grid w-full md:w-[450px] grid-cols-2 bg-[#E8EAED] p-1.5 rounded-xl h-auto">
                  <TabsTrigger
                    value="real"
                    className="font-bold border-b-2 border-transparent data-[state=active]:border-[#002868] data-[state=active]:text-[#002868] data-[state=active]:bg-white rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 py-3 h-auto"
                  >
                    <span className="text-base">Saldo Real</span>
                    <span className={`text-sm font-medium ${calcularTotal(saldoReal) >= 0 ? "text-emerald-600" : "text-rose-600"} data-[state=active]:opacity-100 opacity-70`}>
                      ({formatMonto(calcularTotal(saldoReal))})
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="necesario"
                    className="font-bold border-b-2 border-transparent data-[state=active]:border-[#002868] data-[state=active]:text-[#002868] data-[state=active]:bg-white rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 py-3 h-auto"
                  >
                    <span className="text-base">Saldo Necesario</span>
                    <span className={`text-sm font-medium ${calcularTotal(saldoReal) - Math.abs(calcularTotal(saldoNecesario)) >= 0 ? "text-emerald-600" : "text-rose-600"} data-[state=active]:opacity-100 opacity-70`}>
                      ({formatMonto(calcularTotal(saldoReal) - Math.abs(calcularTotal(saldoNecesario)))})
                    </span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="real" className="mt-0 outline-none flex-grow">
                  <TransactionTable
                    title="Saldo Real"
                    description="Movimientos de efectivo confirmados"
                    transactions={saldoReal}
                  />
                </TabsContent>

                <TabsContent value="necesario" className="mt-0 outline-none flex-grow">
                  <TransactionTable
                    title="Saldo Necesario"
                    description="Pagos y compromisos programados"
                    transactions={saldoNecesario}
                    customTotal={calcularTotal(saldoReal) - Math.abs(calcularTotal(saldoNecesario))}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </main>
      {user?.rol !== "empleado" && (
        <>
          {/* Dialog de Detalles - MEJORADO */}
          <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
            <DialogContent className="sm:max-w-[500px] bg-white border-[#E0E0E0] shadow-2xl">
              <DialogHeader className="border-b border-[#E0E0E0] pb-4">
                <DialogTitle className="text-2xl font-bold text-[#002868] flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-[#002868]/10 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5 text-[#002868]"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                      />
                    </svg>
                  </div>
                  Detalles del Movimiento
                </DialogTitle>
                <DialogDescription className="text-[#666666] mt-2">
                  Edita la información del movimiento de caja
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha" className="text-[#002868] font-semibold">
                    Fecha
                  </Label>
                  <Input
                    id="fecha"
                    name="fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={handleInputChange}
                    className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="concepto"
                    className="text-[#002868] font-semibold"
                  >
                    Concepto
                  </Label>
                  <Input
                    id="concepto"
                    name="concepto"
                    value={formData.concepto}
                    onChange={handleInputChange}
                    className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monto" className="text-[#002868] font-semibold">
                      Monto
                    </Label>
                    <Input
                      id="monto"
                      name="monto"
                      type="number"
                      value={formData.monto}
                      onChange={handleInputChange}
                      className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo" className="text-[#002868] font-semibold">
                      Tipo
                    </Label>
                    <select
                      id="tipo"
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-[#E0E0E0] px-3 py-2 focus:border-[#002868] focus:outline-none focus:ring-1 focus:ring-[#002868]"
                    >
                      <option value="ingreso">Ingreso</option>
                      <option value="egreso">Egreso</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="descripcion"
                    className="text-[#002868] font-semibold"
                  >
                    Descripción
                  </Label>
                  <Input
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="prioridad"
                    className="text-[#002868] font-semibold"
                  >
                    Prioridad
                  </Label>
                  <select
                    id="prioridad"
                    name="prioridad"
                    value={formData.prioridad}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-[#E0E0E0] px-3 py-2 focus:border-[#002868] focus:outline-none focus:ring-1 focus:ring-[#002868]"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoria_id" className="text-[#002868] font-semibold">
                      Categoría
                    </Label>
                    <select
                      id="categoria_id"
                      name="categoria_id"
                      value={formData.categoria_id}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-[#E0E0E0] px-3 py-2 focus:border-[#002868] focus:outline-none focus:ring-1 focus:ring-[#002868]"
                    >
                      <option value="">Seleccione una categoría</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subcategoria_id" className="text-[#002868] font-semibold">
                      Subcategoría
                    </Label>
                    <select
                      id="subcategoria_id"
                      name="subcategoria_id"
                      value={formData.subcategoria_id}
                      onChange={handleInputChange}
                      disabled={!formData.categoria_id}
                      className="w-full rounded-md border border-[#E0E0E0] px-3 py-2 focus:border-[#002868] focus:outline-none focus:ring-1 focus:ring-[#002868] disabled:opacity-50 disabled:bg-gray-100"
                    >
                      <option value="">Seleccione una subcategoría</option>
                      {subcategorias.map((s) => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsDialogOpen(false)}
                  className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] hover:border-[#1A1A1A] cursor-pointer"
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveDetails}
                  disabled={isSaving}
                  className="bg-[#002868] text-white hover:bg-[#003d8f] cursor-pointer"
                >
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog >

          {/* Dialog de Cambio de Estado - MEJORADO */}
          < Dialog open={isStateDialogOpen} onOpenChange={setIsStateDialogOpen} >
            <DialogContent className="sm:max-w-[400px] bg-white border-[#E0E0E0] shadow-2xl">
              <DialogHeader className="border-b border-[#E0E0E0] pb-4">
                <DialogTitle className="text-2xl font-bold text-[#002868] flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-[#002868]/10 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5 text-[#002868]"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                      />
                    </svg>
                  </div>
                  Cambiar Estado
                </DialogTitle>
                <DialogDescription className="text-[#666666] mt-2">
                  Selecciona el nuevo estado para este movimiento
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="estado" className="text-[#002868] font-semibold">
                    Nuevo Estado
                  </Label>
                  <select
                    id="estado"
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    className="w-full rounded-md border border-[#E0E0E0] px-3 py-2 focus:border-[#002868] focus:outline-none focus:ring-1 focus:ring-[#002868]"
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
                  className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] hover:border-[#1A1A1A] cursor-pointer"
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveStateChange}
                  disabled={isSaving}
                  className="bg-[#002868] text-white hover:bg-[#003d8f] cursor-pointer"
                >
                  {isSaving ? "Guardando..." : "Cambiar Estado"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog >

          {/* Dialog de Confirmación de Eliminación - MEJORADO */}
          < Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} >
            <DialogContent className="sm:max-w-[400px] bg-white border-rose-200 shadow-2xl">
              <DialogHeader className="border-b border-rose-100 pb-4">
                <DialogTitle className="text-2xl font-bold text-rose-600 flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5 text-rose-600"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                  </div>
                  Confirmar Eliminación
                </DialogTitle>
                <DialogDescription className="text-[#666666] mt-2">
                  ¿Estás seguro de que deseas eliminar este movimiento? Esta acción
                  no se puede deshacer.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] hover:border-[#1A1A1A] cursor-pointer"
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="bg-rose-500 text-white hover:bg-rose-600 cursor-pointer"
                >
                  {isSaving ? "Eliminando..." : "Eliminar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog >

          <NuevoMovimientoDialog
            isOpen={isNuevoMovimientoDialogOpen}
            onClose={() => setIsNuevoMovimientoDialogOpen(false)}
            sucursalId={Number(params.id)}
            onSuccess={() => {
              setSuccessMessage("Movimiento creado exitosamente");
              fetchMovimientos();
              setTimeout(() => setSuccessMessage(""), 3000);
            }}
          />
        </>
      )}
    </div>
  );
}
