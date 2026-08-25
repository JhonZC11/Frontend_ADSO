// src/services/clienteApi.ts

// NOTA: Si ya tienes (o vas a tener) un tipo "Cliente" centralizado en "@/types",
// puedes borrar esta interfaz y en su lugar hacer:
//   import { Cliente } from "@/types";
// Se dejó definida aquí para que el archivo funcione sin depender de cambios
// adicionales en tu carpeta de tipos.

import {Cliente} from "@/types";

const API_URL = "http://127.0.0.1:8000/api/clientes";

export const fetchClientes = async (): Promise<Cliente[]> => {
  const res = await fetch(API_URL);

  if (!res.ok) {
    throw new Error("Error al obtener clientes");
  }

  return res.json();
};

export const createCliente = async (
  data: Omit<Cliente, "id">
): Promise<Cliente> => {
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

export const updateCliente = async (id: number, data: any) => {
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

export const deleteCliente = async (id: number) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Error al eliminar cliente");
  }
};
