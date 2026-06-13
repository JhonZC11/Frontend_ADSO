import { useState, useMemo, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Trash2, 
  Edit, 
  Plus, 
  Search, 
  AlertTriangle, 
  Package, 
  TrendingUp, 
  TrendingDown,
  ArrowUpDown,
  Filter,
  History,
  BarChart3
} from "lucide-react";
import { Producto, MovimientoInventario, Categoria } from "@/types";
import { categorias, unidadesMedida } from "@/data/mockData";
import { inventoryService } from "@/services/inventoryService";
import { getProductos, createProducto} from "@/services/productoApi";

import type { CreateProductoDTO } from "@/services/productoApi";

export default function InventariosPage() {
  // Estado principal - sincronizado con el servicio
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>(inventoryService.getMovimientos());

  // Sincronizar con el servicio cuando cambie

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProductos();
        // Ajuste temporal para corregir stock de producto con unidad UN (solo para demo, eliminar cuando se corrija en backend)
        if(data[4].unidadMedida === "UN"){data[4].stockActual/=10;}
        setProductos(data);
      } catch (e) {
        console.error(e);
      }
    };
  
    load();
  }, []);
  

  // Sincronizar cambios locales con el servicio
  useEffect(() => {
    inventoryService.setProductos(productos);
  }, [productos]);

  useEffect(() => {
    inventoryService.setMovimientos(movimientos);
  }, [movimientos]);
  
  // Estado para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);
  
  // Estado para formulario de producto
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    categoriaId: "",
    unidadMedida: "",
    stockActual: "",
    stockMinimo: "",
    stockMaximo: "",
    precioUnitario: "",
    ubicacion: "",
  });
  
  // Estado para movimiento de inventario
  const [movimientoForm, setMovimientoForm] = useState({
    productoId: "",
    tipo: "entrada" as "entrada" | "salida" | "ajuste",
    cantidad: "",
    motivo: "",
    documento: "",
    notas: "",
  });
  
  // Estado para diálogos
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"success" | "error" | "confirm" | "movimiento">("success");
  const [dialogMessage, setDialogMessage] = useState("");
  const [productoToDelete, setProductoToDelete] = useState<string | null>(null);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [movimientoDialogOpen, setMovimientoDialogOpen] = useState(false);
  const [historialDialogOpen, setHistorialDialogOpen] = useState(false);
  const [selectedProductoHistorial, setSelectedProductoHistorial] = useState<Producto | null>(null);
  
  // Errores de validación
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Estadísticas
  const stats = useMemo(() => {
    const total = productos.filter(p => p.activo).length;
    const stockBajo = productos.filter(p => p.activo && p.stockActual < p.stockMinimo).length;
    const stockCritico = productos.filter(p => p.activo && p.stockActual === 0).length;
    const valorTotal = productos.filter(p => p.activo).reduce((acc, p) => acc + (p.stockActual * p.precioUnitario), 0);
    
    return { total, stockBajo, stockCritico, valorTotal };
  }, [productos]);
  
  // Productos filtrados
  const filteredProductos = useMemo(() => {
    return productos.filter(producto => {
      // Filtro de búsqueda
      const matchesSearch = 
        producto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        //producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro de categoría
      const matchesCategoria = categoriaFilter === "all" || producto.categoriaId === categoriaFilter;
      
      // Filtro de stock
      let matchesStock = true;
      if (stockFilter === "bajo") {
        matchesStock = producto.stockActual < producto.stockMinimo && producto.stockActual > 0;
      } else if (stockFilter === "critico") {
        matchesStock = producto.stockActual === 0;
      } else if (stockFilter === "normal") {
        matchesStock = producto.stockActual >= producto.stockMinimo;
      }
      
      // Filtro de activos
      const matchesActive = showInactive || producto.activo;
      
      return matchesSearch && matchesCategoria && matchesStock && matchesActive;
    });
  }, [productos, searchTerm, categoriaFilter, stockFilter, showInactive]);
  
  // Validación de formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.codigo.trim()) {
      newErrors.codigo = "El código es obligatorio";
    } else if (!/^[A-Z]{2,4}-\d{3,4}$/.test(formData.codigo.trim())) {
      newErrors.codigo = "Formato inválido (ej: MP-001)";
    } else {
      const exists = productos.some(p => 
        p.codigo.toLowerCase() === formData.codigo.trim().toLowerCase() && 
        p.id !== editingProducto?.id
      );
      if (exists) {
        newErrors.codigo = "Este código ya existe";
      }
    }
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = "Mínimo 3 caracteres";
    }
    
    if (!formData.categoriaId) {
      newErrors.categoriaId = "Seleccione una categoría";
    }
    
    if (!formData.unidadMedida) {
      newErrors.unidadMedida = "Seleccione una unidad";
    }
    
    const stockActual = parseFloat(formData.stockActual);
    if (isNaN(stockActual) || stockActual < 0) {
      newErrors.stockActual = "Stock debe ser un número positivo";
    }
    
    const stockMinimo = parseFloat(formData.stockMinimo);
    if (isNaN(stockMinimo) || stockMinimo < 0) {
      newErrors.stockMinimo = "Ingrese un valor válido";
    }
    
    const stockMaximo = parseFloat(formData.stockMaximo);
    if (isNaN(stockMaximo) || stockMaximo <= 0) {
      newErrors.stockMaximo = "Ingrese un valor válido";
    }
    
    if (stockMinimo >= stockMaximo) {
      newErrors.stockMaximo = "Stock máximo debe ser mayor al mínimo";
    }
    
    const precio = parseFloat(formData.precioUnitario);
    if (isNaN(precio) || precio <= 0) {
      newErrors.precioUnitario = "Ingrese un precio válido";
    }
    
    if (!formData.ubicacion.trim()) {
      newErrors.ubicacion = "La ubicación es obligatoria";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Validación de movimiento
  const validateMovimiento = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!movimientoForm.productoId) {
      newErrors.productoId = "Seleccione un producto";
    }
    
    const cantidad = parseFloat(movimientoForm.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      newErrors.cantidad = "Ingrese una cantidad válida";
    } else if (movimientoForm.tipo === "salida") {
      const producto = productos.find(p => p.id === movimientoForm.productoId);
      if (producto && cantidad > producto.stockActual) {
        newErrors.cantidad = `Stock insuficiente (disponible: ${producto.stockActual})`;
      }
    }
    
    if (!movimientoForm.motivo.trim()) {
      newErrors.motivo = "El motivo es obligatorio";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleAddProducto = async () => {
    if (!validateForm()) return;
  
    const nuevoProducto : CreateProductoDTO = {
      codigo: formData.codigo.trim().toUpperCase(),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      categoria_id: Number(formData.categoriaId),
      unidad_medida: formData.unidadMedida,
      stock_actual: Number(formData.stockActual),
      stock_minimo: Number(formData.stockMinimo),
      stock_maximo: Number(formData.stockMaximo),
      precio_unitario: Number(formData.precioUnitario),
      ubicacion: formData.ubicacion.trim(),
      activo: true,
    };
  
    try {
      // 🔥 POST a Laravel
      await createProducto(nuevoProducto);
  
      // 🔄 Volver a cargar productos desde backend
      //await inventoryService.loadProductos();
  
      resetForm();
      showDialog("success", "Producto agregado exitosamente");
  
    } catch (error) {
      console.error("❌ Error al crear producto:", error);
      showDialog("error", "No se pudo guardar el producto");
    }
  };
  // Editar producto
  const handleEditProducto = () => {
    if (!editingProducto || !validateForm()) return;
    
    setProductos(productos.map(p => 
      p.id === editingProducto.id 
        ? {
            ...p,
            codigo: formData.codigo.trim().toUpperCase(),
            nombre: formData.nombre.trim(),
            descripcion: formData.descripcion.trim(),
            categoriaId: formData.categoriaId,
            unidadMedida: formData.unidadMedida,
            stockActual: parseFloat(formData.stockActual),
            stockMinimo: parseFloat(formData.stockMinimo),
            stockMaximo: parseFloat(formData.stockMaximo),
            precioUnitario: parseFloat(formData.precioUnitario),
            ubicacion: formData.ubicacion.trim(),
            ultimaActualizacion: new Date().toISOString().split('T')[0],
          }
        : p
    ));
    
    setEditingProducto(null);
    resetForm();
    showDialog("success", "Producto actualizado exitosamente");
  };
  
  // Eliminar producto
  const handleDeleteProducto = () => {
    if (!productoToDelete) return;
    
    setProductos(productos.map(p => 
      p.id === productoToDelete ? { ...p, activo: false } : p
    ));
    
    setProductoToDelete(null);
    setDialogOpen(false);
    showDialog("success", "Producto desactivado exitosamente");
  };
  
  // Registrar movimiento
  const handleRegistrarMovimiento = () => {
    if (!validateMovimiento()) return;
    
    const producto = productos.find(p => p.id === movimientoForm.productoId);
    if (!producto) return;
    
    const cantidad = parseFloat(movimientoForm.cantidad);
    let stockNuevo = producto.stockActual;
    
    if (movimientoForm.tipo === "entrada") {
      stockNuevo = producto.stockActual + cantidad;
    } else if (movimientoForm.tipo === "salida") {
      stockNuevo = producto.stockActual - cantidad;
    } else {
      stockNuevo = cantidad; // Ajuste establece el valor directamente
    }
    
    const nuevoMovimiento: MovimientoInventario = {
      id: Date.now().toString(),
      productoId: movimientoForm.productoId,
      tipo: movimientoForm.tipo,
      cantidad: movimientoForm.tipo === "ajuste" ? Math.abs(stockNuevo - producto.stockActual) : cantidad,
      stockAnterior: producto.stockActual,
      stockNuevo,
      motivo: movimientoForm.motivo.trim(),
      documento: movimientoForm.documento.trim(),
      fecha: new Date().toISOString().split('T')[0],
      usuario: "Admin",
      notas: movimientoForm.notas.trim(),
    };
    
    setMovimientos([nuevoMovimiento, ...movimientos]);
    setProductos(productos.map(p => 
      p.id === movimientoForm.productoId 
        ? { ...p, stockActual: stockNuevo, ultimaActualizacion: new Date().toISOString().split('T')[0] }
        : p
    ));
    
    setMovimientoForm({
      productoId: "",
      tipo: "entrada",
      cantidad: "",
      motivo: "",
      documento: "",
      notas: "",
    });
    setMovimientoDialogOpen(false);
    setErrors({});
    showDialog("success", "Movimiento registrado exitosamente");
  };
  
  // Funciones auxiliares
  const resetForm = () => {
    setFormData({
      codigo: "",
      nombre: "",
      descripcion: "",
      categoriaId: "",
      unidadMedida: "",
      stockActual: "",
      stockMinimo: "",
      stockMaximo: "",
      precioUnitario: "",
      ubicacion: "",
    });
    setErrors({});
  };
  
  const loadProductoForEdit = (producto: Producto) => {
    setEditingProducto(producto);
    setFormData({
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      categoriaId: producto.categoriaId,
      unidadMedida: producto.unidadMedida,
      stockActual: producto.stockActual.toString(),
      stockMinimo: producto.stockMinimo.toString(),
      stockMaximo: producto.stockMaximo.toString(),
      precioUnitario: producto.precioUnitario.toString(),
      ubicacion: producto.ubicacion,
    });
  };
  
  const showDialog = (type: "success" | "error" | "confirm", message: string) => {
    setDialogType(type);
    setDialogMessage(message);
    setDialogOpen(true);
  };
  
  const confirmDelete = (id: string) => {
    setProductoToDelete(id);
    setDialogType("confirm");
    setDialogMessage("¿Está seguro de desactivar este producto? Podrá reactivarlo posteriormente.");
    setDialogOpen(true);
  };
  
  const getCategoriaNombre = (categoriaId: string) => {
    return categorias.find(c => c.id === categoriaId)?.nombre || "Sin categoría";
  };
  
  const getUnidadNombre = (codigo: string) => {
    return unidadesMedida.find(u => u.codigo === codigo)?.nombre || codigo;
  };
  
  const getStockBadge = (producto: Producto) => {
    if (producto.stockActual === 0) {
      return <Badge variant="destructive">Sin Stock</Badge>;
    }
    if (producto.stockActual < producto.stockMinimo) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">Stock Bajo</Badge>;
    }
    if (producto.stockActual > producto.stockMaximo) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">Exceso Stock</Badge>;
    }
    return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Normal</Badge>;
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  };
  
  const getProductoHistorial = (productoId: string) => {
    return movimientos.filter(m => m.productoId === productoId);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Inventario</h1>
            <p className="text-muted-foreground">Control de productos, stock y movimientos</p>
          </div>
          {/*
          <Button 
            onClick={() => setMovimientoDialogOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Registrar Movimiento
          </Button>*/}
        </div>
        
        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Productos activos en inventario</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
              <TrendingDown className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.stockBajo}</div>
              <p className="text-xs text-muted-foreground">Productos por debajo del mínimo</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.stockCritico}</div>
              <p className="text-xs text-muted-foreground">Productos agotados</p>
            </CardContent>
          </Card>
          {        /*  
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(stats.valorTotal)}</div>
              <p className="text-xs text-muted-foreground">Valor del inventario actual</p>
            </CardContent>
          </Card>*/}
        </div>
        
        {/* Alertas de stock bajo */}
        {stats.stockBajo > 0 && (
          <Card className="border-yellow-300 bg-yellow-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                Alertas de Stock Bajo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {productos
                  .filter(p => p.activo && p.stockActual < p.stockMinimo)
                  .map(p => (
                    <Badge key={p.id} variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-400">
                      {p.nombre}: {p.stockActual} {p.unidadMedida} (Mín: {p.stockMinimo})
                    </Badge>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Pestañas principales */}
        <Tabs defaultValue="consultar" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="consultar">Consultar</TabsTrigger>
            <TabsTrigger value="agregar">Agregar</TabsTrigger>
            <TabsTrigger value="editar">Editar</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>
          
          {/* Tab Consultar */}
          <TabsContent value="consultar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por código, nombre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categorias.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={stockFilter} onValueChange={setStockFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado de Stock" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="normal">Stock Normal</SelectItem>
                      <SelectItem value="bajo">Stock Bajo</SelectItem>
                      <SelectItem value="critico">Sin Stock</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-inactive"
                      checked={showInactive}
                      onCheckedChange={setShowInactive}
                    />
                    <Label htmlFor="show-inactive">Mostrar inactivos</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead>Unidad</TableHead>{/*
                        <TableHead className="text-right">Precio Unit.</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>*/}
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProductos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No se encontraron productos
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProductos.map((producto) => (
                          <TableRow key={producto.id} className={!producto.activo ? "opacity-50" : ""}>
                            <TableCell className="font-mono font-medium">{producto.codigo}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{producto.nombre}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {producto.descripcion}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{getCategoriaNombre(producto.categoriaId)}</TableCell>
                            <TableCell className="text-right font-medium">{producto.stockActual}</TableCell>
                            <TableCell>{producto.unidadMedida}</TableCell>{/*
                            <TableCell className="text-right">{formatCurrency(producto.precioUnitario)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(producto.stockActual * producto.precioUnitario)}
                            </TableCell>*/}
                            <TableCell>{getStockBadge(producto)}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedProductoHistorial(producto);
                                    setHistorialDialogOpen(true);
                                  }}
                                  title="Ver historial"
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => loadProductoForEdit(producto)}
                                  disabled={!producto.activo}
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => confirmDelete(producto.id)}
                                  disabled={!producto.activo}
                                  className="text-destructive hover:text-destructive"
                                  title="Desactivar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab Agregar */}
          <TabsContent value="agregar">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Agregar Nuevo Producto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código *</Label>
                    <Input
                      id="codigo"
                      placeholder="Ej: MP-001"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                      className={errors.codigo ? "border-destructive" : ""}
                    />
                    {errors.codigo && <p className="text-xs text-destructive">{errors.codigo}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      placeholder="Nombre del producto"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className={errors.nombre ? "border-destructive" : ""}
                    />
                    {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría *</Label>
                    <Select 
                      value={formData.categoriaId} 
                      onValueChange={(value) => setFormData({ ...formData, categoriaId: value })}
                    >
                      <SelectTrigger className={errors.categoriaId ? "border-destructive" : ""}>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoriaId && <p className="text-xs text-destructive">{errors.categoriaId}</p>}
                  </div>
                  
                  <div className="space-y-2 md:col-span-2 lg:col-span-3">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      placeholder="Descripción del producto..."
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="unidadMedida">Unidad de Medida *</Label>
                    <Select 
                      value={formData.unidadMedida} 
                      onValueChange={(value) => setFormData({ ...formData, unidadMedida: value })}
                    >
                      <SelectTrigger className={errors.unidadMedida ? "border-destructive" : ""}>
                        <SelectValue placeholder="Seleccionar unidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {unidadesMedida.map(u => (
                          <SelectItem key={u.codigo} value={u.codigo}>{u.nombre} ({u.codigo})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.unidadMedida && <p className="text-xs text-destructive">{errors.unidadMedida}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stockActual">Stock Actual *</Label>
                    <Input
                      id="stockActual"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.stockActual}
                      onChange={(e) => setFormData({ ...formData, stockActual: e.target.value })}
                      className={errors.stockActual ? "border-destructive" : ""}
                    />
                    {errors.stockActual && <p className="text-xs text-destructive">{errors.stockActual}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stockMinimo">Stock Mínimo *</Label>
                    <Input
                      id="stockMinimo"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.stockMinimo}
                      onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                      className={errors.stockMinimo ? "border-destructive" : ""}
                    />
                    {errors.stockMinimo && <p className="text-xs text-destructive">{errors.stockMinimo}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stockMaximo">Stock Máximo *</Label>
                    <Input
                      id="stockMaximo"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.stockMaximo}
                      onChange={(e) => setFormData({ ...formData, stockMaximo: e.target.value })}
                      className={errors.stockMaximo ? "border-destructive" : ""}
                    />
                    {errors.stockMaximo && <p className="text-xs text-destructive">{errors.stockMaximo}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="precioUnitario">Precio Unitario (COP) *</Label>
                    <Input
                      id="precioUnitario"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.precioUnitario}
                      onChange={(e) => setFormData({ ...formData, precioUnitario: e.target.value })}
                      className={errors.precioUnitario ? "border-destructive" : ""}
                    />
                    {errors.precioUnitario && <p className="text-xs text-destructive">{errors.precioUnitario}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ubicacion">Ubicación *</Label>
                    <Input
                      id="ubicacion"
                      placeholder="Ej: Bodega A - Estante 1"
                      value={formData.ubicacion}
                      onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                      className={errors.ubicacion ? "border-destructive" : ""}
                    />
                    {errors.ubicacion && <p className="text-xs text-destructive">{errors.ubicacion}</p>}
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button onClick={handleAddProducto} className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Producto
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Limpiar Formulario
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab Editar */}
          <TabsContent value="editar">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Editar Producto
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!editingProducto ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Seleccione un producto de la tabla en "Consultar" para editarlo</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 p-3 bg-accent rounded-lg">
                      <p className="text-sm">
                        Editando: <span className="font-semibold">{editingProducto.nombre}</span> ({editingProducto.codigo})
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="edit-codigo">Código *</Label>
                        <Input
                          id="edit-codigo"
                          placeholder="Ej: MP-001"
                          value={formData.codigo}
                          onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                          className={errors.codigo ? "border-destructive" : ""}
                        />
                        {errors.codigo && <p className="text-xs text-destructive">{errors.codigo}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-nombre">Nombre *</Label>
                        <Input
                          id="edit-nombre"
                          placeholder="Nombre del producto"
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          className={errors.nombre ? "border-destructive" : ""}
                        />
                        {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-categoria">Categoría *</Label>
                        <Select 
                          value={formData.categoriaId} 
                          onValueChange={(value) => setFormData({ ...formData, categoriaId: value })}
                        >
                          <SelectTrigger className={errors.categoriaId ? "border-destructive" : ""}>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.categoriaId && <p className="text-xs text-destructive">{errors.categoriaId}</p>}
                      </div>
                      
                      <div className="space-y-2 md:col-span-2 lg:col-span-3">
                        <Label htmlFor="edit-descripcion">Descripción</Label>
                        <Textarea
                          id="edit-descripcion"
                          placeholder="Descripción del producto..."
                          value={formData.descripcion}
                          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                          rows={2}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-unidadMedida">Unidad de Medida *</Label>
                        <Select 
                          value={formData.unidadMedida} 
                          onValueChange={(value) => setFormData({ ...formData, unidadMedida: value })}
                        >
                          <SelectTrigger className={errors.unidadMedida ? "border-destructive" : ""}>
                            <SelectValue placeholder="Seleccionar unidad" />
                          </SelectTrigger>
                          <SelectContent>
                            {unidadesMedida.map(u => (
                              <SelectItem key={u.codigo} value={u.codigo}>{u.nombre} ({u.codigo})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.unidadMedida && <p className="text-xs text-destructive">{errors.unidadMedida}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-stockActual">Stock Actual *</Label>
                        <Input
                          id="edit-stockActual"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={formData.stockActual}
                          onChange={(e) => setFormData({ ...formData, stockActual: e.target.value })}
                          className={errors.stockActual ? "border-destructive" : ""}
                        />
                        {errors.stockActual && <p className="text-xs text-destructive">{errors.stockActual}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-stockMinimo">Stock Mínimo *</Label>
                        <Input
                          id="edit-stockMinimo"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={formData.stockMinimo}
                          onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                          className={errors.stockMinimo ? "border-destructive" : ""}
                        />
                        {errors.stockMinimo && <p className="text-xs text-destructive">{errors.stockMinimo}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-stockMaximo">Stock Máximo *</Label>
                        <Input
                          id="edit-stockMaximo"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={formData.stockMaximo}
                          onChange={(e) => setFormData({ ...formData, stockMaximo: e.target.value })}
                          className={errors.stockMaximo ? "border-destructive" : ""}
                        />
                        {errors.stockMaximo && <p className="text-xs text-destructive">{errors.stockMaximo}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-precioUnitario">Precio Unitario (COP) *</Label>
                        <Input
                          id="edit-precioUnitario"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={formData.precioUnitario}
                          onChange={(e) => setFormData({ ...formData, precioUnitario: e.target.value })}
                          className={errors.precioUnitario ? "border-destructive" : ""}
                        />
                        {errors.precioUnitario && <p className="text-xs text-destructive">{errors.precioUnitario}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-ubicacion">Ubicación *</Label>
                        <Input
                          id="edit-ubicacion"
                          placeholder="Ej: Bodega A - Estante 1"
                          value={formData.ubicacion}
                          onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                          className={errors.ubicacion ? "border-destructive" : ""}
                        />
                        {errors.ubicacion && <p className="text-xs text-destructive">{errors.ubicacion}</p>}
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                      <Button onClick={handleEditProducto} className="bg-primary hover:bg-primary/90">
                        <Edit className="h-4 w-4 mr-2" />
                        Guardar Cambios
                      </Button>
                      <Button variant="outline" onClick={() => { setEditingProducto(null); resetForm(); }}>
                        Cancelar
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab Historial */}
          <TabsContent value="historial">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historial de Movimientos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Stock Ant.</TableHead>
                        <TableHead className="text-right">Stock Nuevo</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Usuario</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimientos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No hay movimientos registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        movimientos.map((mov) => {
                          const producto = productos.find(p => p.id === mov.productoId);
                          return (
                            <TableRow key={mov.id}>
                              <TableCell>{mov.fecha}</TableCell>
                              <TableCell className="font-medium">{producto?.nombre || "Producto eliminado"}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={mov.tipo === "entrada" ? "default" : mov.tipo === "salida" ? "destructive" : "secondary"}
                                  className={mov.tipo === "entrada" ? "bg-primary" : ""}
                                >
                                  {mov.tipo === "entrada" && <TrendingUp className="h-3 w-3 mr-1" />}
                                  {mov.tipo === "salida" && <TrendingDown className="h-3 w-3 mr-1" />}
                                  {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {mov.tipo === "entrada" ? "+" : mov.tipo === "salida" ? "-" : "±"}{mov.cantidad}
                              </TableCell>
                              <TableCell className="text-right">{mov.stockAnterior}</TableCell>
                              <TableCell className="text-right font-medium">{mov.stockNuevo}</TableCell>
                              <TableCell>{mov.motivo}</TableCell>
                              <TableCell className="font-mono text-xs">{mov.documento || "-"}</TableCell>
                              <TableCell>{mov.usuario}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Diálogo de Movimiento */}
        <Dialog open={movimientoDialogOpen} onOpenChange={setMovimientoDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Registrar Movimiento de Inventario
              </DialogTitle>
              <DialogDescription>
                Registre entradas, salidas o ajustes de stock
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Producto *</Label>
                <Select 
                  value={movimientoForm.productoId} 
                  onValueChange={(value) => setMovimientoForm({ ...movimientoForm, productoId: value })}
                >
                  <SelectTrigger className={errors.productoId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productos.filter(p => p.activo).map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.codigo} - {p.nombre} (Stock: {p.stockActual})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.productoId && <p className="text-xs text-destructive">{errors.productoId}</p>}
              </div>
              
              <div className="space-y-2">
                <Label>Tipo de Movimiento *</Label>
                <Select 
                  value={movimientoForm.tipo} 
                  onValueChange={(value) => setMovimientoForm({ ...movimientoForm, tipo: value as "entrada" | "salida" | "ajuste" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Entrada (aumenta stock)
                      </span>
                    </SelectItem>
                    <SelectItem value="salida">
                      <span className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-destructive" />
                        Salida (reduce stock)
                      </span>
                    </SelectItem>
                    <SelectItem value="ajuste">
                      <span className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4" />
                        Ajuste (establece stock)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>
                  {movimientoForm.tipo === "ajuste" ? "Nuevo Stock *" : "Cantidad *"}
                </Label>
                <Input
                  type="number"
                  min="0"
                  placeholder={movimientoForm.tipo === "ajuste" ? "Nuevo valor de stock" : "Cantidad"}
                  value={movimientoForm.cantidad}
                  onChange={(e) => setMovimientoForm({ ...movimientoForm, cantidad: e.target.value })}
                  className={errors.cantidad ? "border-destructive" : ""}
                />
                {errors.cantidad && <p className="text-xs text-destructive">{errors.cantidad}</p>}
              </div>
              
              <div className="space-y-2">
                <Label>Motivo *</Label>
                <Input
                  placeholder="Ej: Compra a proveedor, Producción, Ajuste inventario..."
                  value={movimientoForm.motivo}
                  onChange={(e) => setMovimientoForm({ ...movimientoForm, motivo: e.target.value })}
                  className={errors.motivo ? "border-destructive" : ""}
                />
                {errors.motivo && <p className="text-xs text-destructive">{errors.motivo}</p>}
              </div>
              
              <div className="space-y-2">
                <Label>Documento de Referencia</Label>
                <Input
                  placeholder="Ej: FAC-001234, OP-00567"
                  value={movimientoForm.documento}
                  onChange={(e) => setMovimientoForm({ ...movimientoForm, documento: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  placeholder="Observaciones adicionales..."
                  value={movimientoForm.notas}
                  onChange={(e) => setMovimientoForm({ ...movimientoForm, notas: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => { setMovimientoDialogOpen(false); setErrors({}); }}>
                Cancelar
              </Button>
              <Button onClick={handleRegistrarMovimiento} className="bg-primary hover:bg-primary/90">
                Registrar Movimiento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo de Historial de Producto */}
        <Dialog open={historialDialogOpen} onOpenChange={setHistorialDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historial de Movimientos
              </DialogTitle>
              {selectedProductoHistorial && (
                <DialogDescription>
                  {selectedProductoHistorial.codigo} - {selectedProductoHistorial.nombre}
                </DialogDescription>
              )}
            </DialogHeader>
            
            <div className="overflow-x-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Stock Ant.</TableHead>
                    <TableHead className="text-right">Stock Nuevo</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProductoHistorial && getProductoHistorial(selectedProductoHistorial.id).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay movimientos para este producto
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedProductoHistorial && getProductoHistorial(selectedProductoHistorial.id).map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell>{mov.fecha}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={mov.tipo === "entrada" ? "default" : mov.tipo === "salida" ? "destructive" : "secondary"}
                            className={mov.tipo === "entrada" ? "bg-primary" : ""}
                          >
                            {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {mov.tipo === "entrada" ? "+" : mov.tipo === "salida" ? "-" : "±"}{mov.cantidad}
                        </TableCell>
                        <TableCell className="text-right">{mov.stockAnterior}</TableCell>
                        <TableCell className="text-right font-medium">{mov.stockNuevo}</TableCell>
                        <TableCell>{mov.motivo}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setHistorialDialogOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo general */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogType === "success" && "Operación Exitosa"}
                {dialogType === "error" && "Error"}
                {dialogType === "confirm" && "Confirmar Acción"}
              </DialogTitle>
              <DialogDescription>{dialogMessage}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              {dialogType === "confirm" ? (
                <>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteProducto}>
                    Confirmar
                  </Button>
                </>
              ) : (
                <Button onClick={() => setDialogOpen(false)}>Aceptar</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
