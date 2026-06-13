import { MovimientoInventario } from "@/types";

const API_URL = "http://127.0.0.1:8000/api/movimientos";

export const fetchMovimientos = async (): Promise<MovimientoInventario[]> => {
  const res = await fetch(API_URL);

  if (!res.ok) {
    throw new Error("Error al obtener movimientos");
  }

  return res.json();
};

// types/movimiento.ts
export interface CreateMovimientoDTO {
    motivo: string;
    documento?: string;
    fecha_actual: string;
  
    proveedor?: string | null;
    nombre_proveedor?: string | null;
  
    fecha_factura?: string;
  
    productoId: string;
    descripcion_item?: string;
  
    cantidad: number;
    valor_unitario: number;
    tipo: "entrada" | "salida";
    notas?: string;
  }
  

  export const createMovimiento = async (
    movimiento: CreateMovimientoDTO
  ): Promise<MovimientoInventario> => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(movimiento),
    });
  
    if (!res.ok) {
      const error = await res.json();
      throw error;
    }
  
    return res.json();
  };
  