// src/services/operariosApi.ts
import { Operario } from "@/types";

const API_URL = "http://127.0.0.1:8000/api/operarios";

export const fetchOperarios = async (): Promise<Operario[]> => {
  const res = await fetch(API_URL);

  if (!res.ok) {
    throw new Error("Error al obtener operarios");
  }

  return res.json();
};



export const createOperario = async (
  data: Omit<Operario, "id">
): Promise<Operario> => {
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

  export const updateOperario = async (id: number, data: any) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  
    if (!res.ok) {
      const error = await res.json();
      throw error;
    }
  
    return res.json();
  };
  
  export const deleteOperario = async (id: number) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
  
    if (!res.ok) {
      throw new Error("Error al eliminar operario");
    }
  };