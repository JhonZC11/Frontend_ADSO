export interface Operario {
  id: number;
  identificacion: string;
  nombre: string;
  apellidos: string;
  edad: number;
}

export interface Users {
  id: number;
  name: string;
  email: string;
  password: string;
}

export interface Proveedor {
  id: string;
  nit: string;
  nombre: string;
}

export interface Movimiento {
  id: string;
  motivo: string;
  numeroFactura: string;
  fecha: string;
  proveedor: Proveedor | null;
  fechaFactura: string;
  items: MovimientoItem[];
  notas: string;
  valorTotal: number;
}

export interface MovimientoItem {
  id: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
  valorKg: number;
  valorDescuento: number;
  valorTotal: number;
}

// Tipos para Inventario
export interface Categoria {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
}

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoriaId: string;
  unidadMedida: string;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  precioUnitario: number;
  ubicacion: string;
  fechaCreacion: string;
  ultimaActualizacion: string;
  activo: boolean;
}

export interface MovimientoInventario {
  id: string;
  productoId: string;
  descripcionItem: string;
  tipo: string;
  cantidadKg: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo: string;
  documento: string;
  created_at: string;
  usuario: string;
  notas: string;
  proveedor: string;
  proveedorNombre: string;
  fechaFactura: string;
  valor_unitario: number;
}

// Tipos para Procesos
export interface Proceso {
  id: string;
  fecha: string;
  productoOrigenId: number;
  productoDestinoId: number;
  operarioId: string;
  kgEntrada: number;
  porcentajeMerma: number;
  kgMerma: number;
  kgSalida: number;
  costoPorKg: number;
  costoTotal: number;
  valorFinalKg: number;
  notas: string;
}


// Tipos para Ventas
export interface Venta {
  id: string;
  numeroVenta: string;
  fecha: string;
  cliente: string;
  items: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  descuento: number;
  total: number;
  notas: string;
}

export interface VentaItem {
  id: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  total: number;
}
