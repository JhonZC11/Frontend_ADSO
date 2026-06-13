import { Proveedor } from "@/types";

const API_URL = "http://127.0.0.1:8000/api/proveedores";

export const fetchProveedores = async (): Promise<Proveedor[]> => {
  const res = await fetch(API_URL);

  if (!res.ok) {
    throw new Error("Error al obtener proveedores");
  }

  return res.json();
};


export const createProveedor = async (
  data: Omit<Proveedor, "id">
): Promise<Proveedor> => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw error;
  }

  return res.json();
};