import { Producto } from "@/types";

  

const API_URL = "http://127.0.0.1:8000/api/productos";

export const getProductos = async (): Promise<Producto[]> => {
  const res = await fetch(API_URL);

  if (!res.ok) {
    throw new Error("Error al obtener productos");
  }

  const data = await res.json();

  return data.map((p: any) => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    descripcion: p.descripcion,
    categoriaId: p.categoria_id,
    unidadMedida: p.unidad_medida,
    stockActual: Number(p.stock_actual),
    stockMinimo: Number(p.stock_minimo),
    stockMaximo: Number(p.stock_maximo),
    precioUnitario: Number(p.precio_unitario),
    ubicacion: p.ubicacion,
    activo: p.activo,
  }));
};

export interface CreateProductoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria_id: number;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
  precio_unitario: number;
  ubicacion?: string;
  activo: boolean;
}

export const createProducto = async (
  data: CreateProductoDTO
) => {
  const res = await fetch("http://127.0.0.1:8000/api/productos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw await res.json();
  }

  return res.json();
};