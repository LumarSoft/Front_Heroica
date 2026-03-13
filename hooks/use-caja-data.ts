"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch } from "@/lib/api";
import type {
    Transaction,
    BancoParcial,
    Categoria,
    Subcategoria,
    SelectOption,
} from "@/lib/types";

// =============================================
// Tipos internos del hook
// =============================================

interface TransactionFormData {
    fecha: string;
    concepto: string;
    monto: string;
    descripcion: string;
    prioridad: "baja" | "media" | "alta";
    tipo: string;
    categoria_id: string;
    subcategoria_id: string;
    comprobante: string;
    banco_id: string;
    medio_pago_id: string;
}

const INITIAL_FORM: TransactionFormData = {
    fecha: "",
    concepto: "",
    monto: "",
    descripcion: "",
    prioridad: "media",
    tipo: "ingreso",
    categoria_id: "",
    subcategoria_id: "",
    comprobante: "",
    banco_id: "",
    medio_pago_id: "",
};

// =============================================
// Normaliza un movimiento recibido de la API, coerciendo monto a number
// =============================================

function normalizeTransaction(m: Omit<Transaction, "monto" | "es_deuda"> & { monto?: number | string; es_deuda?: number }): Transaction {
    return {
        ...m,
        monto: Number(m.monto),
        es_deuda: m.es_deuda === 1,
    };
}

// =============================================
// Selección de endpoints según tipo de caja
// =============================================

function getEndpoints(tipo: "efectivo" | "banco") {
    if (tipo === "banco") {
        return {
            getMovimientos: API_ENDPOINTS.CAJA_BANCO.GET_BY_SUCURSAL,
            getTotales: API_ENDPOINTS.CAJA_BANCO.GET_TOTALES,
            update: API_ENDPOINTS.CAJA_BANCO.UPDATE,
            updateEstado: API_ENDPOINTS.CAJA_BANCO.UPDATE_ESTADO,
            toggleDeuda: API_ENDPOINTS.CAJA_BANCO.TOGGLE_DEUDA,
            deleteMovimiento: API_ENDPOINTS.CAJA_BANCO.DELETE,
        };
    }
    return {
        getMovimientos: API_ENDPOINTS.MOVIMIENTOS.GET_BY_SUCURSAL,
        getTotales: API_ENDPOINTS.MOVIMIENTOS.GET_TOTALES,
        update: API_ENDPOINTS.MOVIMIENTOS.UPDATE,
        updateEstado: API_ENDPOINTS.MOVIMIENTOS.UPDATE_ESTADO,
        toggleDeuda: API_ENDPOINTS.MOVIMIENTOS.TOGGLE_DEUDA,
        deleteMovimiento: API_ENDPOINTS.MOVIMIENTOS.DELETE,
    };
}

// =============================================
// Hook principal
// =============================================

/**
 * Hook que centraliza la lógica de datos para caja-efectivo y caja-banco.
 * Maneja fetch de movimientos, totales, categorías, bancos, medios de pago,
 * y operaciones CRUD sobre movimientos.
 */
export function useCajaData(tipo: "efectivo" | "banco") {
    const params = useParams();
    const sucursalId = useMemo(() => Number(params.id), [params.id]);
    const endpoints = useMemo(() => getEndpoints(tipo), [tipo]);

    // --- Estado principal ---
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // --- Datos de movimientos ---
    const [saldoReal, setSaldoReal] = useState<Transaction[]>([]);
    const [saldoNecesario, setSaldoNecesario] = useState<Transaction[]>([]);
    const [parciales, setParciales] = useState<BancoParcial[]>([]);

    // --- Filtro por fechas ---
    const [fechaHasta, setFechaHasta] = useState("");

    // --- Catálogos ---
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
    const [bancos, setBancos] = useState<SelectOption[]>([]);
    const [mediosPago, setMediosPago] = useState<SelectOption[]>([]);

    // --- Estado de dialogs ---
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeudaDialogOpen, setIsDeudaDialogOpen] = useState(false);
    const [isNuevoMovimientoDialogOpen, setIsNuevoMovimientoDialogOpen] =
        useState(false);
    const [selectedTransaction, setSelectedTransaction] =
        useState<Transaction | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // --- Formulario de detalles ---
    const [formData, setFormData] = useState<TransactionFormData>(INITIAL_FORM);
    const [nuevoEstado, setNuevoEstado] = useState("");

    // =============================================
    // Fetchers
    // =============================================

    const fetchTotales = useCallback(async () => {
        try {
            const response = await apiFetch(endpoints.getTotales(sucursalId));
            const data = await response.json();
            if (response.ok) {
                setParciales(data.data?.parciales || []);
            }
        } catch {
            // Non-critical background refresh
        }
    }, [endpoints, sucursalId]);

    const fetchMovimientos = useCallback(async () => {
        try {
            setIsLoading(true);
            setError("");

            const response = await apiFetch(endpoints.getMovimientos(sucursalId));
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error al cargar movimientos");
            }

            const allMovimientos: Transaction[] = [
                ...(data.data.saldo_real || []),
                ...(data.data.saldo_necesario || []),
            ].map(normalizeTransaction);

            const movimientosCompletados = allMovimientos
                .filter((m) => m.estado === "completado")
                .sort(
                    (a, b) =>
                        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
                );

            const movimientosAprobados = allMovimientos
                .filter(
                    (m) =>
                        m.estado === "aprobado" || m.estado === "pendiente"
                )
                .sort(
                    (a, b) =>
                        new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
                );

            setSaldoReal(movimientosCompletados);
            // Saldo necesario incluye TODOS los aprobados/pendientes (incluyendo deuda),
            // pero la deuda se identifica con es_deuda=1 para excluirla del total en UI
            setSaldoNecesario(movimientosAprobados);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Error al cargar movimientos";
            setError(message);
        } finally {
            setIsLoading(false);
        }
        // Refrescar totales/parciales del API al finalizar
        fetchTotales();
    }, [endpoints, sucursalId, fetchTotales]);


    const fetchCategorias = useCallback(async () => {
        try {
            const response = await apiFetch(API_ENDPOINTS.CONFIGURACION.CATEGORIAS.GET_ALL);
            const data = await response.json();
            if (response.ok) setCategorias(data.data || []);
        } catch {
            // Catalogue fetch failure is non-critical
        }
    }, []);

    const fetchSubcategorias = useCallback(async (categoriaId: number) => {
        try {
            const response = await apiFetch(
                API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.GET_BY_CATEGORIA(categoriaId)
            );
            const data = await response.json();
            if (response.ok) setSubcategorias(data.data || []);
        } catch {
            // Non-critical
        }
    }, []);

    const fetchBancos = useCallback(async () => {
        try {
            const response = await apiFetch(API_ENDPOINTS.CONFIGURACION.BANCOS.GET_ALL);
            const data = await response.json();
            if (response.ok) setBancos(data.data || []);
        } catch {
            // Non-critical
        }
    }, []);

    const fetchMediosPago = useCallback(async () => {
        try {
            const response = await apiFetch(API_ENDPOINTS.CONFIGURACION.MEDIOS_PAGO.GET_ALL);
            const data = await response.json();
            if (response.ok) setMediosPago(data.data || []);
        } catch {
            // Non-critical
        }
    }, []);

    // --- Carga subcategorías cuando cambia la categoría seleccionada ---
    useEffect(() => {
        if (formData.categoria_id) {
            fetchSubcategorias(Number(formData.categoria_id));
        } else {
            setSubcategorias([]);
        }
    }, [formData.categoria_id, fetchSubcategorias]);

    // =============================================
    // Handlers de dialogs
    // =============================================

    const handleOpenDetails = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setFormData({
            fecha: transaction.fecha ? transaction.fecha.split("T")[0] : "",
            concepto: transaction.concepto,
            monto: transaction.monto.toString(),
            descripcion: transaction.descripcion || "",
            prioridad: transaction.prioridad || "media",
            tipo:
                transaction.tipo ||
                (Number(transaction.monto) < 0 ? "egreso" : "ingreso"),
            categoria_id: transaction.categoria_id
                ? transaction.categoria_id.toString()
                : "",
            subcategoria_id: transaction.subcategoria_id
                ? transaction.subcategoria_id.toString()
                : "",
            comprobante: transaction.comprobante || "",
            banco_id: transaction.banco_id
                ? transaction.banco_id.toString()
                : "",
            medio_pago_id: transaction.medio_pago_id
                ? transaction.medio_pago_id.toString()
                : "",
        });
        setIsDetailsDialogOpen(true);
    };

    const handleOpenStateChange = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setNuevoEstado(transaction.estado || "pendiente");
        setIsStateDialogOpen(true);
    };

    const handleOpenDelete = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsDeleteDialogOpen(true);
    };

    const handleOpenDeuda = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsDeudaDialogOpen(true);
    };

    // =============================================
    // Operaciones CRUD
    // =============================================

    const handleSaveDetails = async () => {
        if (!selectedTransaction) return;

        try {
            setIsSaving(true);
            setError("");

            const response = await apiFetch(
                endpoints.update(selectedTransaction.id),
                {
                    method: "PUT",
                    body: JSON.stringify({
                        fecha: formData.fecha,
                        concepto: formData.concepto,
                        monto: parseFloat(formData.monto),
                        descripcion: formData.descripcion,
                        prioridad: formData.prioridad,
                        tipo: formData.tipo,
                        categoria_id: formData.categoria_id
                            ? Number(formData.categoria_id)
                            : null,
                        subcategoria_id: formData.subcategoria_id
                            ? Number(formData.subcategoria_id)
                            : null,
                        comprobante: formData.comprobante,
                        banco_id: formData.banco_id ? Number(formData.banco_id) : null,
                        medio_pago_id: formData.medio_pago_id
                            ? Number(formData.medio_pago_id)
                            : null,
                    }),
                }
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Error al actualizar movimiento");
            }

            toast.success("Movimiento actualizado exitosamente");
            setIsDetailsDialogOpen(false);
            await fetchMovimientos();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Error al actualizar movimiento";
            setError(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveStateChange = async () => {
        if (!selectedTransaction) return;

        try {
            setIsSaving(true);
            setError("");

            const response = await apiFetch(
                endpoints.updateEstado(selectedTransaction.id),
                {
                    method: "PUT",
                    body: JSON.stringify({ estado: nuevoEstado }),
                }
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Error al cambiar estado");
            }

            toast.success("Estado actualizado exitosamente");
            setIsStateDialogOpen(false);
            await fetchMovimientos();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Error al cambiar estado";
            setError(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedTransaction) return;

        try {
            setIsSaving(true);
            setError("");

            const response = await apiFetch(
                endpoints.deleteMovimiento(selectedTransaction.id),
                { method: "DELETE" }
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Error al eliminar movimiento");
            }

            toast.success("Movimiento eliminado exitosamente");
            setIsDeleteDialogOpen(false);
            await fetchMovimientos();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Error al eliminar movimiento";
            setError(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveDeuda = async (esDeuda: boolean, fechaOriginalVencimiento?: string) => {
        if (!selectedTransaction) return;

        try {
            setIsSaving(true);
            setError("");

            const body: Record<string, unknown> = { es_deuda: esDeuda ? 1 : 0 };
            if (esDeuda && fechaOriginalVencimiento) {
                body.fecha_original_vencimiento = fechaOriginalVencimiento;
            }

            const response = await apiFetch(
                endpoints.toggleDeuda(selectedTransaction.id),
                {
                    method: "PUT",
                    body: JSON.stringify(body),
                }
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Error al actualizar deuda");
            }

            toast.success(esDeuda ? "Deuda activada exitosamente" : "Deuda desactivada exitosamente");
            setIsDeudaDialogOpen(false);
            await fetchMovimientos();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Error al actualizar deuda";
            setError(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        if (name === "tipo") {
            setFormData((prev) => ({ ...prev, [name]: value, categoria_id: "", subcategoria_id: "" }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    // =============================================
    // Inicialización
    // =============================================

    const initialize = useCallback(() => {
        fetchMovimientos(); // fetchMovimientos ya llama fetchTotales al finalizar
        fetchCategorias();
        fetchBancos();
        fetchMediosPago();
    }, [fetchMovimientos, fetchCategorias, fetchBancos, fetchMediosPago]);

    // =============================================
    // Filtro por fechas (client-side)
    // =============================================

    const { saldoNecesarioFiltrado, saldoNecesarioSinDeudaFiltrado } = useMemo(() => {
        const filtered = !fechaHasta
            ? saldoNecesario
            : saldoNecesario.filter((m) => {
                  const fechaMov = m.fecha ? m.fecha.split("T")[0] : "";
                  return fechaMov <= fechaHasta;
              });
        return {
            saldoNecesarioFiltrado: filtered,
            saldoNecesarioSinDeudaFiltrado: filtered.filter((m) => !m.es_deuda),
        };
    }, [saldoNecesario, fechaHasta]);

    // Parciales filtrados: agrupar saldoReal + saldoNecesarioSinDeudaFiltrado por banco_id
    const parcialesFiltrados = useMemo<BancoParcial[]>(() => {
        const map = new Map<number | string, BancoParcial>();
        const addToBanco = (m: Transaction, tipoEntry: "real" | "necesario") => {
            const key = m.banco_id ?? "otros";
            if (!map.has(key)) {
                map.set(key, {
                    banco_id: m.banco_id ?? 0,
                    banco_nombre: m.banco_nombre ?? "OTROS",
                    total_real: 0,
                    total_necesario: 0,
                });
            }
            const entry = map.get(key)!;
            if (tipoEntry === "real") entry.total_real += m.monto;
            else entry.total_necesario += m.monto;
        };
        saldoReal.forEach((m) => addToBanco(m, "real"));
        saldoNecesarioSinDeudaFiltrado.forEach((m) => addToBanco(m, "necesario"));
        return Array.from(map.values());
    }, [saldoReal, saldoNecesarioSinDeudaFiltrado]);

    const limpiarFiltros = () => {
        setFechaHasta("");
    };

    return {
        // Estado
        isLoading,
        error,
        sucursalId,

        // Datos (todos los movimientos, sin filtro)
        saldoReal,
        saldoNecesario,
        saldoNecesarioSinDeuda: saldoNecesario.filter((m) => !m.es_deuda),
        parciales,
        categorias,
        subcategorias,
        bancos,
        mediosPago,

        // Datos filtrados por fecha
        saldoNecesarioFiltrado,
        saldoNecesarioSinDeudaFiltrado,
        parcialesFiltrados,

        // Filtro de fechas
        fechaHasta,
        setFechaHasta,
        limpiarFiltros,
        hayFiltroActivo: fechaHasta !== "",

        // Estado de dialogs
        isDetailsDialogOpen,
        setIsDetailsDialogOpen,
        isStateDialogOpen,
        setIsStateDialogOpen,
        isDeleteDialogOpen,
        setIsDeleteDialogOpen,
        isDeudaDialogOpen,
        setIsDeudaDialogOpen,
        isNuevoMovimientoDialogOpen,
        setIsNuevoMovimientoDialogOpen,
        selectedTransaction,
        isSaving,

        // Formulario
        formData,
        nuevoEstado,
        setNuevoEstado,
        handleInputChange,

        // Acciones
        handleOpenDetails,
        handleOpenStateChange,
        handleOpenDelete,
        handleOpenDeuda,
        handleSaveDetails,
        handleSaveStateChange,
        handleDelete,
        handleSaveDeuda,

        // Fetchers
        initialize,
        fetchMovimientos,
    };
}
