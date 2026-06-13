// src/services/api.js
const API_URL = "http://127.0.0.1:8000/api";

export const getProductos = async () => {
  const res = await fetch(`${API_URL}/productos`);
  return res.json();
};
