import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, FileText, Package, ArrowRightLeft, Download, Filter, X, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { inventoryService } from "@/services/inventoryService";
import { initialOperarios } from "@/data/mockData";
import { Operario } from "@/types";

const InformesPage = () => {
  // Filtros de fecha
  const [operarios] = useState<Operario[]>(initialOperarios);
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(undefined);
  const [fechaFin, setFechaFin] = useState<Date | undefined>(undefined);
  
  // Filtros específicos
  const [tipoMovimiento, setTipoMovimiento] = useState<string>("all");
  const [productoFilter, setProductoFilter] = useState<string>("");

  // Obtener datos
  const movimientos = inventoryService.getMovimientos();
  const procesos = inventoryService.getProcesos();
  const productos = inventoryService.getProductos();

  // Filtrar movimientos (transacciones)
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter(mov => {
      // Filtro por fecha
      if (fechaInicio) {
        const fechaMov = new Date(mov.created_at);
        if (fechaMov < fechaInicio) return false;
      }
      if (fechaFin) {
        const fechaMov = new Date(mov.created_at);
        if (fechaMov > fechaFin) return false;
      }
      // Filtro por tipo
      if (tipoMovimiento !== "all" && mov.tipo !== tipoMovimiento) return false;
      // Filtro por producto
      if (productoFilter) {
        const producto = productos.find(p => p.id === mov.productoId);
        if (!producto) return false;
        const nombreCompleto = `${producto.codigo} ${producto.nombre}`.toLowerCase();
        if (!nombreCompleto.includes(productoFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [movimientos, fechaInicio, fechaFin, tipoMovimiento, productoFilter, productos]);

  // Filtrar procesos (producciones)
  const procesosFiltrados = useMemo(() => {
    return procesos.filter(proc => {
      // Filtro por fecha
      const [year, month, day] = proc.fecha_proceso.split('T')[0].split('-').map(Number);
      const fechaProc = new Date(year, month - 1, day);

      if (fechaInicio) {
        const inicio = new Date(fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        if (fechaProc < inicio) return false;
      }

      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        if (fechaProc > fin) return false;
      }

      // Filtro por producto
      if (productoFilter) {
        const prodOrigen = productos.find(p => p.id == proc.producto_procesar);
        const prodDestino = productos.find(p => p.id === proc.productoDestinoId);
        const textoOrigen = prodOrigen ? `${prodOrigen.codigo} ${prodOrigen.nombre}`.toLowerCase() : "";
        const textoDestino = prodDestino ? `${prodDestino.codigo} ${prodDestino.nombre}`.toLowerCase() : "";
        if (!textoOrigen.includes(productoFilter.toLowerCase()) && !textoDestino.includes(productoFilter.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [procesos, fechaInicio, fechaFin, productoFilter, productos]);
      
  // Estadísticas de transacciones
  const estadisticasTransacciones = useMemo(() => {
    const entradas = movimientosFiltrados.filter(m => m.tipo === 'entrada');
    const salidas = movimientosFiltrados.filter(m => m.tipo === 'salida');
    const ajustes = movimientosFiltrados.filter(m => m.tipo === 'ajuste');

    return {
      totalMovimientos: movimientosFiltrados.length,
      totalEntradas: entradas.length,
      totalSalidas: salidas.length,
      totalAjustes: ajustes.length,
      cantidadEntradas: entradas.reduce((sum, m) => sum + m.cantidad, 0),
      cantidadSalidas: salidas.reduce((sum, m) => sum + m.cantidad, 0),
    };
  }, [movimientosFiltrados]);

  // Estadísticas de producciones
  const estadisticasProducciones = useMemo(() => {
    return {
      totalProcesos: procesosFiltrados.length,
      totalKgEntrada: procesosFiltrados.reduce((sum, p) => sum + p.kg_procesar, 0),
      totalKgSalida: procesosFiltrados.reduce((sum, p) => sum + p.kg_resultado, 0),
      totalKgMerma: procesosFiltrados.reduce((sum, p) => sum + p.porcentaje_merma, 0),
      promedioMerma: procesosFiltrados.length > 0 
        ? procesosFiltrados.reduce((sum, p) => sum + p.porcentaje_merma, 0) / procesosFiltrados.length 
        : 0,
      costoTotal: procesosFiltrados.reduce((sum, p) => sum + p.costo_total_proceso, 0),
    };
  }, [procesosFiltrados]);

  const getProductoNombre = (id: string) => {
    const producto = productos.find(p => p.codigo == id);
    return producto ? producto.nombre : "N/A";
  };
  
  const getProductoNombreProc = (id: string) => {
    const producto = productos.find(p => p.id == id);
    return producto ? producto.nombre : "N/A";
  };

  const getOperarioNombre = (id: string) => {
    const operario = operarios.find(o => o.id == id);
    return operario ? `${operario.nombre} ${operario.apellidos}` : "N/A";
  };


  const limpiarFiltros = () => {
    setFechaInicio(undefined);
    setFechaFin(undefined);
    setTipoMovimiento("all");
    setProductoFilter("");
  };

  const tieneFiltrosActivos = fechaInicio || fechaFin || tipoMovimiento !== "all" || productoFilter;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Informes
            </h1>
            <p className="text-muted-foreground mt-1">
              Reportes de transacciones y producciones
            </p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Fecha Inicio */}
              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fechaInicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaInicio ? format(fechaInicio, "PPP", { locale: es }) : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fechaInicio}
                      onSelect={setFechaInicio}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Fecha Fin */}
              <div className="space-y-2">
                <Label>Fecha Fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fechaFin && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaFin ? format(fechaFin, "PPP", { locale: es }) : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fechaFin}
                      onSelect={setFechaFin}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Tipo de Movimiento */}
              <div className="space-y-2">
                <Label>Tipo de Movimiento</Label>
                <Select value={tipoMovimiento} onValueChange={setTipoMovimiento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="entrada">Entradas</SelectItem>
                    <SelectItem value="salida">Salidas</SelectItem>
                    <SelectItem value="ajuste">Ajustes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Producto */}
              <div className="space-y-2">
                <Label>Buscar Producto</Label>
                <Input
                  placeholder="Código o nombre..."
                  value={productoFilter}
                  onChange={(e) => setProductoFilter(e.target.value)}
                />
              </div>
            </div>

            {/* Badges de filtros activos */}
            {tieneFiltrosActivos && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">Filtros activos:</span>
                {fechaInicio && (
                  <Badge variant="secondary">
                    Desde: {format(fechaInicio, "dd/MM/yyyy")}
                  </Badge>
                )}
                {fechaFin && (
                  <Badge variant="secondary">
                    Hasta: {format(fechaFin, "dd/MM/yyyy")}
                  </Badge>
                )}
                {tipoMovimiento !== "all" && (
                  <Badge variant="secondary">
                    Tipo: {tipoMovimiento}
                  </Badge>
                )}
                {productoFilter && (
                  <Badge variant="secondary">
                    Producto: {productoFilter}
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                  <X className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs de Informes */}
        <Tabs defaultValue="transacciones" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transacciones" className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Transacciones
            </TabsTrigger>
            <TabsTrigger value="producciones" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Producciones
            </TabsTrigger>
          </TabsList>

          {/* Tab Transacciones */}
          <TabsContent value="transacciones" className="space-y-4">
            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{estadisticasTransacciones.totalMovimientos}</div>
                  <p className="text-sm text-muted-foreground">Total Movimientos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold text-green-600">{estadisticasTransacciones.totalEntradas}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Entradas ({estadisticasTransacciones.cantidadEntradas.toFixed(2)} kg)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    <span className="text-2xl font-bold text-red-600">{estadisticasTransacciones.totalSalidas}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Salidas ({estadisticasTransacciones.cantidadSalidas.toFixed(2)} kg)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-amber-600">{estadisticasTransacciones.totalAjustes}</div>
                  <p className="text-sm text-muted-foreground">Ajustes</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabla de Transacciones */}
            <Card>
              <CardHeader>
                <CardTitle>Detalle de Transacciones</CardTitle>
                <CardDescription>
                  {movimientosFiltrados.length} movimiento(s) encontrado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Stock Anterior</TableHead>
                        <TableHead className="text-right">Stock Nuevo</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Documento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimientosFiltrados.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No hay movimientos para mostrar
                          </TableCell>
                        </TableRow>
                      ) : (
                        movimientosFiltrados.map((mov) => (
                          
                          <TableRow key={mov.id}>
                            <TableCell>{mov.created_at}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={mov.tipo === 'entrada' ? 'default' : mov.tipo === 'salida' ? 'destructive' : 'secondary'}
                              >
                                {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{getProductoNombre(mov.productoId)}</TableCell>
                            <TableCell className="text-right font-medium">{mov.cantidad}</TableCell>
                            <TableCell className="text-right">{mov.stockAnterior}</TableCell>
                            <TableCell className="text-right">{mov.stockNuevo}</TableCell>
                            <TableCell>{mov.motivo}</TableCell>
                            <TableCell>{mov.documento || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Producciones */}
          <TabsContent value="producciones" className="space-y-4">
            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{estadisticasProducciones.totalProcesos}</div>
                  <p className="text-sm text-muted-foreground">Total Procesos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{estadisticasProducciones.totalKgEntrada.toFixed()}</div>
                  <p className="text-sm text-muted-foreground">Kg Entrada</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{estadisticasProducciones.totalKgSalida.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">Kg Salida</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">{estadisticasProducciones.totalKgMerma.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">Kg Merma ({estadisticasProducciones.promedioMerma.toFixed(1)}% prom)</p>
                </CardContent>
              </Card>
            </div>

            {/* Costo Total */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Costo Total de Producción</p>
                    <div className="text-3xl font-bold text-primary">{formatCurrency(estadisticasProducciones.costoTotal)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de Producciones */}
            <Card>
              <CardHeader>
                <CardTitle>Detalle de Producciones</CardTitle>
                <CardDescription>
                  {procesosFiltrados.length} proceso(s) encontrado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Operario</TableHead>
                        <TableHead>Producto Origen</TableHead>
                        <TableHead>Producto Destino</TableHead>
                        <TableHead className="text-right">Kg Entrada</TableHead>
                        <TableHead className="text-right">% Merma</TableHead>
                        <TableHead className="text-right">Kg Salida</TableHead>
                        <TableHead className="text-right">Costo/Kg</TableHead>
                        <TableHead className="text-right">Costo Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {procesosFiltrados.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No hay procesos para mostrar
                          </TableCell>
                        </TableRow>
                      ) : (
                        procesosFiltrados.map((proc) => (
                          <TableRow key={proc.id}>
                            <TableCell>{proc.fecha_proceso}</TableCell>
                            <TableCell>{getOperarioNombre(proc.identificacion_operario)}</TableCell>
                            <TableCell>{getProductoNombreProc(proc.producto_procesar)}</TableCell>
                            <TableCell>{getProductoNombreProc(proc.producto_procesado)}</TableCell>
                            <TableCell className="text-right">{proc.kg_procesar}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={proc.porcentajeMerma > 10 ? "destructive" : "secondary"}>
                                {proc.porcentaje_merma}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{proc.kg_resultado}</TableCell>
                            <TableCell className="text-right">{formatCurrency(proc.costo_kg)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(proc.costo_total_proceso)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default InformesPage;
