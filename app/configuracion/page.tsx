"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { API_ENDPOINTS } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Categoria {
    id: number;
    nombre: string;
    descripcion: string;
    activo: boolean;
}

interface Subcategoria {
    id: number;
    categoria_id: number;
    categoria_nombre: string;
    nombre: string;
    descripcion: string;
    activo: boolean;
}

interface Banco {
    id: number;
    nombre: string;
    codigo: string;
    activo: boolean;
}

interface MedioPago {
    id: number;
    nombre: string;
    descripcion: string;
    activo: boolean;
}

export default function ConfiguracionPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [isHydrated, setIsHydrated] = useState(false);
    const [activeTab, setActiveTab] = useState<"categorias" | "subcategorias" | "bancos" | "medios">("categorias");

    // Estados para datos
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
    const [bancos, setBancos] = useState<Banco[]>([]);
    const [mediosPago, setMediosPago] = useState<MedioPago[]>([]);

    // Estados de carga
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Estados de modales
    const [isCategoriaDialogOpen, setIsCategoriaDialogOpen] = useState(false);
    const [isSubcategoriaDialogOpen, setIsSubcategoriaDialogOpen] = useState(false);
    const [isBancoDialogOpen, setIsBancoDialogOpen] = useState(false);
    const [isMedioPagoDialogOpen, setIsMedioPagoDialogOpen] = useState(false);

    // Estados de formularios
    const [categoriaForm, setCategoriaForm] = useState({ id: 0, nombre: "", descripcion: "" });
    const [subcategoriaForm, setSubcategoriaForm] = useState({ id: 0, categoria_id: 0, nombre: "", descripcion: "" });
    const [bancoForm, setBancoForm] = useState({ id: 0, nombre: "", codigo: "" });
    const [medioPagoForm, setMedioPagoForm] = useState({ id: 0, nombre: "", descripcion: "" });

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (!isHydrated) return;

        if (!isAuthenticated || user?.rol !== "admin") {
            router.push("/");
            return;
        }

        fetchAllData();
    }, [isAuthenticated, isHydrated, router, user]);

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                fetchCategorias(),
                fetchSubcategorias(),
                fetchBancos(),
                fetchMediosPago(),
            ]);
        } catch (err) {
            console.error("Error al cargar datos:", err);
            setError("Error al cargar configuración");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategorias = async () => {
        const res = await fetch(API_ENDPOINTS.CONFIGURACION.CATEGORIAS.GET_ALL);
        const data = await res.json();
        if (data.success) setCategorias(data.data);
    };

    const fetchSubcategorias = async () => {
        const res = await fetch(API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.GET_ALL);
        const data = await res.json();
        if (data.success) setSubcategorias(data.data);
    };

    const fetchBancos = async () => {
        const res = await fetch(API_ENDPOINTS.CONFIGURACION.BANCOS.GET_ALL);
        const data = await res.json();
        if (data.success) setBancos(data.data);
    };

    const fetchMediosPago = async () => {
        const res = await fetch(API_ENDPOINTS.CONFIGURACION.MEDIOS_PAGO.GET_ALL);
        const data = await res.json();
        if (data.success) setMediosPago(data.data);
    };

    // ========== CATEGORÍAS ==========
    const handleSaveCategoria = async () => {
        setIsSaving(true);
        setError("");
        try {
            const url = categoriaForm.id
                ? API_ENDPOINTS.CONFIGURACION.CATEGORIAS.UPDATE(categoriaForm.id)
                : API_ENDPOINTS.CONFIGURACION.CATEGORIAS.CREATE;

            const res = await fetch(url, {
                method: categoriaForm.id ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(categoriaForm),
            });

            const data = await res.json();
            if (data.success) {
                setSuccessMessage(data.message);
                setIsCategoriaDialogOpen(false);
                setCategoriaForm({ id: 0, nombre: "", descripcion: "" });
                await fetchCategorias();
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Error al guardar categoría");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCategoria = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar esta categoría?")) return;

        try {
            const res = await fetch(API_ENDPOINTS.CONFIGURACION.CATEGORIAS.DELETE(id), {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                setSuccessMessage(data.message);
                await fetchCategorias();
                setTimeout(() => setSuccessMessage(""), 3000);
            }
        } catch (err) {
            setError("Error al eliminar categoría");
        }
    };

    // ========== SUBCATEGORÍAS ==========
    const handleSaveSubcategoria = async () => {
        setIsSaving(true);
        setError("");
        try {
            const url = subcategoriaForm.id
                ? API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.UPDATE(subcategoriaForm.id)
                : API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.CREATE;

            const res = await fetch(url, {
                method: subcategoriaForm.id ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(subcategoriaForm),
            });

            const data = await res.json();
            if (data.success) {
                setSuccessMessage(data.message);
                setIsSubcategoriaDialogOpen(false);
                setSubcategoriaForm({ id: 0, categoria_id: 0, nombre: "", descripcion: "" });
                await fetchSubcategorias();
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Error al guardar subcategoría");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSubcategoria = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar esta subcategoría?")) return;

        try {
            const res = await fetch(API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.DELETE(id), {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                setSuccessMessage(data.message);
                await fetchSubcategorias();
                setTimeout(() => setSuccessMessage(""), 3000);
            }
        } catch (err) {
            setError("Error al eliminar subcategoría");
        }
    };

    // ========== BANCOS ==========
    const handleSaveBanco = async () => {
        setIsSaving(true);
        setError("");
        try {
            const url = bancoForm.id
                ? API_ENDPOINTS.CONFIGURACION.BANCOS.UPDATE(bancoForm.id)
                : API_ENDPOINTS.CONFIGURACION.BANCOS.CREATE;

            const res = await fetch(url, {
                method: bancoForm.id ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bancoForm),
            });

            const data = await res.json();
            if (data.success) {
                setSuccessMessage(data.message);
                setIsBancoDialogOpen(false);
                setBancoForm({ id: 0, nombre: "", codigo: "" });
                await fetchBancos();
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Error al guardar banco");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteBanco = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar este banco?")) return;

        try {
            const res = await fetch(API_ENDPOINTS.CONFIGURACION.BANCOS.DELETE(id), {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                setSuccessMessage(data.message);
                await fetchBancos();
                setTimeout(() => setSuccessMessage(""), 3000);
            }
        } catch (err) {
            setError("Error al eliminar banco");
        }
    };

    // ========== MEDIOS DE PAGO ==========
    const handleSaveMedioPago = async () => {
        setIsSaving(true);
        setError("");
        try {
            const url = medioPagoForm.id
                ? API_ENDPOINTS.CONFIGURACION.MEDIOS_PAGO.UPDATE(medioPagoForm.id)
                : API_ENDPOINTS.CONFIGURACION.MEDIOS_PAGO.CREATE;

            const res = await fetch(url, {
                method: medioPagoForm.id ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(medioPagoForm),
            });

            const data = await res.json();
            if (data.success) {
                setSuccessMessage(data.message);
                setIsMedioPagoDialogOpen(false);
                setMedioPagoForm({ id: 0, nombre: "", descripcion: "" });
                await fetchMediosPago();
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Error al guardar medio de pago");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteMedioPago = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar este medio de pago?")) return;

        try {
            const res = await fetch(API_ENDPOINTS.CONFIGURACION.MEDIOS_PAGO.DELETE(id), {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                setSuccessMessage(data.message);
                await fetchMediosPago();
                setTimeout(() => setSuccessMessage(""), 3000);
            }
        } catch (err) {
            setError("Error al eliminar medio de pago");
        }
    };

    if (!isHydrated || isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#002868] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#666666]">Cargando configuración...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={() => router.push("/sucursales")}
                                variant="ghost"
                                className="text-[#002868] hover:bg-[#002868]/5"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className="w-5 h-5 mr-2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                                    />
                                </svg>
                                Volver
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-[#002868]">⚙️ Configuración</h1>
                                <p className="text-sm text-[#666666]">Gestión de categorías, bancos y medios de pago</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Messages */}
            {successMessage && (
                <div className="container mx-auto px-6 pt-4">
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg">
                        {successMessage}
                    </div>
                </div>
            )}
            {error && (
                <div className="container mx-auto px-6 pt-4">
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="container mx-auto px-6 py-6">
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab("categorias")}
                        className={`px-6 py-3 font-semibold transition-all ${activeTab === "categorias"
                            ? "text-[#002868] border-b-2 border-[#002868]"
                            : "text-[#666666] hover:text-[#002868]"
                            }`}
                    >
                        📁 Categorías
                    </button>
                    <button
                        onClick={() => setActiveTab("subcategorias")}
                        className={`px-6 py-3 font-semibold transition-all ${activeTab === "subcategorias"
                            ? "text-[#002868] border-b-2 border-[#002868]"
                            : "text-[#666666] hover:text-[#002868]"
                            }`}
                    >
                        📂 Subcategorías
                    </button>
                    <button
                        onClick={() => setActiveTab("bancos")}
                        className={`px-6 py-3 font-semibold transition-all ${activeTab === "bancos"
                            ? "text-[#002868] border-b-2 border-[#002868]"
                            : "text-[#666666] hover:text-[#002868]"
                            }`}
                    >
                        🏦 Bancos
                    </button>
                    <button
                        onClick={() => setActiveTab("medios")}
                        className={`px-6 py-3 font-semibold transition-all ${activeTab === "medios"
                            ? "text-[#002868] border-b-2 border-[#002868]"
                            : "text-[#666666] hover:text-[#002868]"
                            }`}
                    >
                        💳 Medios de Pago
                    </button>
                </div>

                {/* Content */}
                <div className="max-w-4xl">
                    {/* CATEGORÍAS */}
                    {activeTab === "categorias" && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Categorías</CardTitle>
                                <Button
                                    onClick={() => {
                                        setCategoriaForm({ id: 0, nombre: "", descripcion: "" });
                                        setIsCategoriaDialogOpen(true);
                                    }}
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
                                                <h3 className="font-semibold text-[#002868]">{cat.nombre}</h3>
                                                {cat.descripcion && (
                                                    <p className="text-sm text-[#666666]">{cat.descripcion}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => {
                                                        setCategoriaForm(cat);
                                                        setIsCategoriaDialogOpen(true);
                                                    }}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeleteCategoria(cat.id)}
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
                    )}

                    {/* SUBCATEGORÍAS */}
                    {activeTab === "subcategorias" && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Subcategorías</CardTitle>
                                <Button
                                    onClick={() => {
                                        setSubcategoriaForm({ id: 0, categoria_id: 0, nombre: "", descripcion: "" });
                                        setIsSubcategoriaDialogOpen(true);
                                    }}
                                    className="bg-[#002868] hover:bg-[#003d8f]"
                                >
                                    + Nueva Subcategoría
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {subcategorias.map((sub) => (
                                        <div
                                            key={sub.id}
                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                                        >
                                            <div>
                                                <h3 className="font-semibold text-[#002868]">{sub.nombre}</h3>
                                                <p className="text-xs text-[#666666]">Categoría: {sub.categoria_nombre}</p>
                                                {sub.descripcion && (
                                                    <p className="text-sm text-[#666666] mt-1">{sub.descripcion}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => {
                                                        setSubcategoriaForm({
                                                            id: sub.id,
                                                            categoria_id: sub.categoria_id,
                                                            nombre: sub.nombre,
                                                            descripcion: sub.descripcion,
                                                        });
                                                        setIsSubcategoriaDialogOpen(true);
                                                    }}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeleteSubcategoria(sub.id)}
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
                    )}

                    {/* BANCOS */}
                    {activeTab === "bancos" && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Bancos</CardTitle>
                                <Button
                                    onClick={() => {
                                        setBancoForm({ id: 0, nombre: "", codigo: "" });
                                        setIsBancoDialogOpen(true);
                                    }}
                                    className="bg-[#002868] hover:bg-[#003d8f]"
                                >
                                    + Nuevo Banco
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {bancos.map((banco) => (
                                        <div
                                            key={banco.id}
                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                                        >
                                            <div>
                                                <h3 className="font-semibold text-[#002868]">{banco.nombre}</h3>
                                                {banco.codigo && (
                                                    <p className="text-sm text-[#666666]">Código: {banco.codigo}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => {
                                                        setBancoForm(banco);
                                                        setIsBancoDialogOpen(true);
                                                    }}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeleteBanco(banco.id)}
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
                    )}

                    {/* MEDIOS DE PAGO */}
                    {activeTab === "medios" && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Medios de Pago</CardTitle>
                                <Button
                                    onClick={() => {
                                        setMedioPagoForm({ id: 0, nombre: "", descripcion: "" });
                                        setIsMedioPagoDialogOpen(true);
                                    }}
                                    className="bg-[#002868] hover:bg-[#003d8f]"
                                >
                                    + Nuevo Medio de Pago
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {mediosPago.map((medio) => (
                                        <div
                                            key={medio.id}
                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                                        >
                                            <div>
                                                <h3 className="font-semibold text-[#002868]">{medio.nombre}</h3>
                                                {medio.descripcion && (
                                                    <p className="text-sm text-[#666666]">{medio.descripcion}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => {
                                                        setMedioPagoForm(medio);
                                                        setIsMedioPagoDialogOpen(true);
                                                    }}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeleteMedioPago(medio.id)}
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
                    )}
                </div>
            </div>

            {/* DIALOG CATEGORÍA */}
            <Dialog open={isCategoriaDialogOpen} onOpenChange={setIsCategoriaDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {categoriaForm.id ? "Editar Categoría" : "Nueva Categoría"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="cat-nombre">Nombre *</Label>
                            <Input
                                id="cat-nombre"
                                value={categoriaForm.nombre}
                                onChange={(e) => setCategoriaForm({ ...categoriaForm, nombre: e.target.value })}
                                placeholder="Ej: Servicios"
                            />
                        </div>
                        <div>
                            <Label htmlFor="cat-desc">Descripción</Label>
                            <Textarea
                                id="cat-desc"
                                value={categoriaForm.descripcion}
                                onChange={(e) => setCategoriaForm({ ...categoriaForm, descripcion: e.target.value })}
                                placeholder="Descripción opcional"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCategoriaDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveCategoria}
                            disabled={isSaving || !categoriaForm.nombre}
                            className="bg-[#002868] hover:bg-[#003d8f]"
                        >
                            {isSaving ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG SUBCATEGORÍA */}
            <Dialog open={isSubcategoriaDialogOpen} onOpenChange={setIsSubcategoriaDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {subcategoriaForm.id ? "Editar Subcategoría" : "Nueva Subcategoría"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="subcat-categoria">Categoría *</Label>
                            <Select
                                value={subcategoriaForm.categoria_id.toString()}
                                onValueChange={(value) =>
                                    setSubcategoriaForm({ ...subcategoriaForm, categoria_id: parseInt(value) })
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
                            <Label htmlFor="subcat-nombre">Nombre *</Label>
                            <Input
                                id="subcat-nombre"
                                value={subcategoriaForm.nombre}
                                onChange={(e) => setSubcategoriaForm({ ...subcategoriaForm, nombre: e.target.value })}
                                placeholder="Ej: Luz"
                            />
                        </div>
                        <div>
                            <Label htmlFor="subcat-desc">Descripción</Label>
                            <Textarea
                                id="subcat-desc"
                                value={subcategoriaForm.descripcion}
                                onChange={(e) => setSubcategoriaForm({ ...subcategoriaForm, descripcion: e.target.value })}
                                placeholder="Descripción opcional"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsSubcategoriaDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveSubcategoria}
                            disabled={isSaving || !subcategoriaForm.nombre || !subcategoriaForm.categoria_id}
                            className="bg-[#002868] hover:bg-[#003d8f]"
                        >
                            {isSaving ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG BANCO */}
            <Dialog open={isBancoDialogOpen} onOpenChange={setIsBancoDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {bancoForm.id ? "Editar Banco" : "Nuevo Banco"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="banco-nombre">Nombre *</Label>
                            <Input
                                id="banco-nombre"
                                value={bancoForm.nombre}
                                onChange={(e) => setBancoForm({ ...bancoForm, nombre: e.target.value })}
                                placeholder="Ej: Banco Galicia"
                            />
                        </div>
                        <div>
                            <Label htmlFor="banco-codigo">Código</Label>
                            <Input
                                id="banco-codigo"
                                value={bancoForm.codigo}
                                onChange={(e) => setBancoForm({ ...bancoForm, codigo: e.target.value })}
                                placeholder="Ej: GALI"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsBancoDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveBanco}
                            disabled={isSaving || !bancoForm.nombre}
                            className="bg-[#002868] hover:bg-[#003d8f]"
                        >
                            {isSaving ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG MEDIO DE PAGO */}
            <Dialog open={isMedioPagoDialogOpen} onOpenChange={setIsMedioPagoDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {medioPagoForm.id ? "Editar Medio de Pago" : "Nuevo Medio de Pago"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="medio-nombre">Nombre *</Label>
                            <Input
                                id="medio-nombre"
                                value={medioPagoForm.nombre}
                                onChange={(e) => setMedioPagoForm({ ...medioPagoForm, nombre: e.target.value })}
                                placeholder="Ej: Transferencia"
                            />
                        </div>
                        <div>
                            <Label htmlFor="medio-desc">Descripción</Label>
                            <Textarea
                                id="medio-desc"
                                value={medioPagoForm.descripcion}
                                onChange={(e) => setMedioPagoForm({ ...medioPagoForm, descripcion: e.target.value })}
                                placeholder="Descripción opcional"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsMedioPagoDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveMedioPago}
                            disabled={isSaving || !medioPagoForm.nombre}
                            className="bg-[#002868] hover:bg-[#003d8f]"
                        >
                            {isSaving ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
