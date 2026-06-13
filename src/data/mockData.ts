import { Operario, Proveedor, Categoria, Producto, MovimientoInventario, Proceso } from "@/types";
import { getProductos } from "@/services/productoApi";
import { fetchProveedores } from "@/services/proveedorApi";
import { fetchMovimientos } from "@/services/movimientoApi";
import { fetchProcesos } from "@/services/procesoApi";
import { fetchOperarios } from "@/services/operarioApi";

let dataProcesos = await fetchProcesos();
let dataProductos = await getProductos();
let dataProveedores = await fetchProveedores();
let dataMovimiento = await fetchMovimientos();
let dataOperarios = await fetchOperarios();




export const initialOperarios: Operario[] = dataOperarios;

export const proveedores: Proveedor[] = dataProveedores;

export const motivos = [
  { codigo: "GM", descripcion: "Gastos Mantenimiento" },
  { codigo: "EAC", descripcion: "Entrada Almacén Compras" },
];

// Datos para Inventario
export const categorias: Categoria[] = [
  {
    id: "1",
    codigo: "MP",
    nombre: "Materia Prima",
    descripcion: "Materiales utilizados en la producción",
  },
  {
    id: "2",
    codigo: "INS",
    nombre: "Insumos",
    descripcion: "Insumos y consumibles",
  },
  {
    id: "3",
    codigo: "REP",
    nombre: "Repuestos",
    descripcion: "Repuestos para maquinaria y equipos",
  },
  {
    id: "4",
    codigo: "HER",
    nombre: "Herramientas",
    descripcion: "Herramientas de trabajo",
  },
  {
    id: "5",
    codigo: "EMB",
    nombre: "Embalaje",
    descripcion: "Materiales de embalaje y empaque",
  },
];

export const unidadesMedida = [
  { codigo: "KG", nombre: "Kilogramos" },
  { codigo: "LT", nombre: "Litros" },
  { codigo: "UN", nombre: "Unidades" },
  { codigo: "MT", nombre: "Metros" },
  { codigo: "CAJ", nombre: "Cajas" },
  { codigo: "PAQ", nombre: "Paquetes" },
  { codigo: "GL", nombre: "Galones" },
];

export const initialProductos: Producto[] = dataProductos;


export const initialProcesos: Proceso[] = dataProcesos;


export const initialMovimientosInventario: MovimientoInventario[] = dataMovimiento;
/*
[
  {
    id: "1",
    productoId: "1",
    tipo: "entrada",
    cantidad: 100,
    stockAnterior: 50,
    stockNuevo: 150,
    motivo: "Compra a proveedor",
    documento: "FAC-001234",
    fecha: "2024-12-20",
    usuario: "Admin",
    notas: "Recepción de materia prima",
  },
  {
    id: "2",
    productoId: "2",
    tipo: "salida",
    cantidad: 20,
    stockAnterior: 50,
    stockNuevo: 30,
    motivo: "Producción",
    documento: "OP-00567",
    fecha: "2024-12-18",
    usuario: "Admin",
    notas: "Uso en lote de producción #45",
  },
  {
    id: "3",
    productoId: "5",
    tipo: "entrada",
    cantidad: 200,
    stockAnterior: 300,
    stockNuevo: 500,
    motivo: "Compra a proveedor",
    documento: "FAC-001235",
    fecha: "2024-12-23",
    usuario: "Admin",
    notas: "Reposición de stock",
  },
];*/
