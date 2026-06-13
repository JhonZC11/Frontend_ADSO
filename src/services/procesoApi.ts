import { Proceso } from "@/types";

const API_URL = "http://127.0.0.1:8000/api/procesos";

export const fetchProcesos = async (): Promise<Proceso[]> => {
  const res = await fetch(API_URL);

  if (!res.ok) {
    throw new Error("Error al obtener movimientos");
  }

  return res.json();
};




export const createProceso = async (data: Omit<Proceso, "id">): Promise<Proceso> => {
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