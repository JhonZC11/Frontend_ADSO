import {Users} from "@/types";

const API_URL = "http://127.0.0.1:8000/api/users";

export const fetchUsuarios = async (): Promise<Users[]> => {
  const res = await fetch(API_URL);

  if (!res.ok) {
    throw new Error("Error al obtener Usuarios");
  }
  
  return res.json();
};