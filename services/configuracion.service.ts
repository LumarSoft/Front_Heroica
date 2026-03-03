import { API_ENDPOINTS } from "@/lib/config";
import { Categoria, Subcategoria, Banco, MedioPago } from "@/lib/types";

// ── helpers internos ──────────────────────────────────────────

async function get<T>(url: string): Promise<T[]> {
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

async function save<T>(url: string, method: "POST" | "PUT", body: T) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

async function remove(url: string) {
  const res = await fetch(url, { method: "DELETE" });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

// ── categorías ────────────────────────────────────────────────

export const getCategorias = () =>
  get<Categoria>(API_ENDPOINTS.CONFIGURACION.CATEGORIAS.GET_ALL);

export const saveCategoria = (form: Omit<Categoria, "activo">) =>
  save(
    form.id
      ? API_ENDPOINTS.CONFIGURACION.CATEGORIAS.UPDATE(form.id)
      : API_ENDPOINTS.CONFIGURACION.CATEGORIAS.CREATE,
    form.id ? "PUT" : "POST",
    form,
  );

export const deleteCategoria = (id: number) =>
  remove(API_ENDPOINTS.CONFIGURACION.CATEGORIAS.DELETE(id));

// ── subcategorías ─────────────────────────────────────────────

export const getSubcategorias = () =>
  get<Subcategoria>(API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.GET_ALL);

export const saveSubcategoria = (
  form: Omit<Subcategoria, "activo" | "categoria_nombre">,
) =>
  save(
    form.id
      ? API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.UPDATE(form.id)
      : API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.CREATE,
    form.id ? "PUT" : "POST",
    form,
  );

export const deleteSubcategoria = (id: number) =>
  remove(API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.DELETE(id));

// ── bancos ────────────────────────────────────────────────────

export const getBancos = () =>
  get<Banco>(API_ENDPOINTS.CONFIGURACION.BANCOS.GET_ALL);

export const saveBanco = (form: Omit<Banco, "activo">) =>
  save(
    form.id
      ? API_ENDPOINTS.CONFIGURACION.BANCOS.UPDATE(form.id)
      : API_ENDPOINTS.CONFIGURACION.BANCOS.CREATE,
    form.id ? "PUT" : "POST",
    form,
  );

export const deleteBanco = (id: number) =>
  remove(API_ENDPOINTS.CONFIGURACION.BANCOS.DELETE(id));

// ── medios de pago ────────────────────────────────────────────

export const getMediosPago = () =>
  get<MedioPago>(API_ENDPOINTS.CONFIGURACION.MEDIOS_PAGO.GET_ALL);

export const saveMedioPago = (form: Omit<MedioPago, "activo">) =>
  save(
    form.id
      ? API_ENDPOINTS.CONFIGURACION.MEDIOS_PAGO.UPDATE(form.id)
      : API_ENDPOINTS.CONFIGURACION.MEDIOS_PAGO.CREATE,
    form.id ? "PUT" : "POST",
    form,
  );

export const deleteMedioPago = (id: number) =>
  remove(API_ENDPOINTS.CONFIGURACION.MEDIOS_PAGO.DELETE(id));
