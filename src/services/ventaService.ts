import {Venta} from "@/types";

const API_URL = "http://127.0.0.1:8000/api/ventas";

export const fetchVentas = async (): Promise<Venta[]> => {
  const res = await fetch(API_URL);

  if (!res.ok) {
    throw new Error("Error al obtener ventas");
  }
  
  return res.json();
};

export const createVenta = async (data: Omit<Venta, "id">): Promise<Venta> => {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const error = await res.json();
        throw error;
    }

    return res.json();
}

