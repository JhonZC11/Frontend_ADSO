import { Producto, MovimientoInventario, Proceso } from "@/types";
import { initialProductos, initialMovimientosInventario, initialProcesos } from "@/data/mockData";

// Estado global compartido del inventario
let productos: Producto[] = [...initialProductos];
let movimientosInventario: MovimientoInventario[] = [...initialMovimientosInventario];
let procesos: Proceso[] = [...initialProcesos];

// Listeners para notificar cambios
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const inventoryService = {
  // Obtener productos
  getProductos: (): Producto[] => [...productos],
  
  // Obtener movimientos
  getMovimientos: (): MovimientoInventario[] => [...movimientosInventario],
  
  // Obtener procesos
  getProcesos: (): Proceso[] => [...procesos],
  
  // Buscar producto por código
  findProductoByCodigo: (codigo: string): Producto | undefined => {
    return productos.find(p => p.codigo === codigo && p.activo);
  },
  
  // Buscar producto por ID
  findProductoById: (id: string): Producto | undefined => {
    return productos.find(p => p.id === id);
  },
  
  // Actualizar stock de un producto (entrada)
  addStock: (
    productoId: string,
    cantidad: number,
    motivo: string,
    documento: string,
    notas: string = ""
  ): boolean => {
    const productoIndex = productos.findIndex(p => p.id === productoId);
    if (productoIndex === -1) return false;
    
    const producto = productos[productoIndex];
    const stockAnterior = producto.stockActual;
    const stockNuevo = stockAnterior + cantidad;
    
    // Actualizar producto
    productos[productoIndex] = {
      ...producto,
      stockActual: stockNuevo,
      ultimaActualizacion: new Date().toISOString().split('T')[0],
    };
    
    // Registrar movimiento
    const nuevoMovimiento: MovimientoInventario = {
      id: Date.now().toString(),
      productoId,
      tipo: 'entrada',
      cantidad,
      stockAnterior,
      stockNuevo,
      motivo,
      documento,
      fecha: new Date().toISOString().split('T')[0],
      usuario: "Sistema",
      notas,
    };
    
    movimientosInventario = [...movimientosInventario, nuevoMovimiento];
    notifyListeners();
    return true;
  },
  
  // Reducir stock de un producto (salida)
  removeStock: (
    productoId: string,
    cantidad: number,
    motivo: string,
    documento: string,
    notas: string = ""
  ): boolean => {
    const productoIndex = productos.findIndex(p => p.id === productoId);
    if (productoIndex === -1) return false;
    
    const producto = productos[productoIndex];
    const stockAnterior = producto.stockActual;
    
    if (stockAnterior < cantidad) return false;
    
    const stockNuevo = stockAnterior - cantidad;
    
    // Actualizar producto
    productos[productoIndex] = {
      ...producto,
      stockActual: stockNuevo,
      ultimaActualizacion: new Date().toISOString().split('T')[0],
    };
    
    // Registrar movimiento
    const nuevoMovimiento: MovimientoInventario = {
      id: Date.now().toString(),
      productoId,
      tipo: 'salida',
      cantidad,
      stockAnterior,
      stockNuevo,
      motivo,
      documento,
      fecha: new Date().toISOString().split('T')[0],
      usuario: "Sistema",
      notas,
    };
    
    movimientosInventario = [...movimientosInventario, nuevoMovimiento];
    notifyListeners();
    return true;
  },
  
  // Agregar proceso
  addProceso: (proceso: Proceso): void => {
    procesos = [...procesos, proceso];
    notifyListeners();
  },
  
  // Actualizar productos (para el módulo de inventarios)
  setProductos: (newProductos: Producto[]) => {
    productos = [...newProductos];
    notifyListeners();
  },
  
  // Actualizar movimientos (para el módulo de inventarios)
  setMovimientos: (newMovimientos: MovimientoInventario[]) => {
    movimientosInventario = [...newMovimientos];
    notifyListeners();
  },
  
  // Actualizar procesos
  setProcesos: (newProcesos: Proceso[]) => {
    procesos = [...newProcesos];
    notifyListeners();
  },
  
  // Suscribirse a cambios
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

function notifyListeners() {
  listeners.forEach(listener => listener());
}
