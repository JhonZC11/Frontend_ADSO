import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Proceso, Producto, Operario } from "@/types";
import { inventoryService } from "@/services/inventoryService";
import { initialOperarios, categorias } from "@/data/mockData";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Factory, Package, User, Calendar, Scale, TrendingDown, DollarSign, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { create } from "domain";
import axios from 'axios';
import { createProceso, fetchProcesos } from "@/services/procesoApi";
import { getProductos } from "@/services/productoApi";
// Configuración de mermas por tipo de fruta (porcentaje)
const mermasPorTipo: Record<string, number> = {
  "guanabana": 45,
  "mango": 35,
  "maracuya": 50,
  "fresa": 15,
  "mora": 20,
  "lulo": 40,
  "default": 30,
};







const ProcesosPage = () => {
  const { toast } = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [operarios] = useState<Operario[]>(initialOperarios);

  console.log(productos)
  
  // Form state
  const [productoOrigenId, setProductoOrigenId] = useState("");
  const [productoDestinoId, setProductoDestinoId] = useState("");
  const [operarioId, setOperarioId] = useState("");
  const [kgEntrada, setKgEntrada] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [costoPorKg, setCostoPorKg] = useState("200");
  const [notas, setNotas] = useState("");
  
  // Calculated values
  const [porcentajeMerma, setPorcentajeMerma] = useState(30);
  const [kgMerma, setKgMerma] = useState(0);
  const [kgSalida, setKgSalida] = useState(0);
  const [costoTotal, setCostoTotal] = useState(0);
  const [valorFinalKg, setValorFinalKg] = useState(0);
  
  // UI state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [detalleProcesoOpen, setDetalleProcesoOpen] = useState(false);
  const [procesoSeleccionado, setProcesoSeleccionado] = useState<Proceso | null>(null);

  useEffect(() => {
    setProductos(inventoryService.getProductos());
    setProcesos(inventoryService.getProcesos());
    
    const unsubscribe = inventoryService.subscribe(() => {
      setProductos(inventoryService.getProductos());
      setProcesos(inventoryService.getProcesos());
    });
    
    return () => { unsubscribe(); };
  }, []);

  // Calcular valores cuando cambian los inputs
  useEffect(() => {
    const kgEntradaNum = parseFloat(kgEntrada) || 0;
    const costoPorKgNum = parseFloat(costoPorKg) || 200;
    
    const merma = (kgEntradaNum * porcentajeMerma) / 100;
    const salida = kgEntradaNum - merma;
    const costo = kgEntradaNum * costoPorKgNum;
    const valorKg = salida > 0 ? costo / salida : 0;
    
    setKgMerma(merma);
    setKgSalida(salida);
    setCostoTotal(costo);
    setValorFinalKg(valorKg);
  }, [kgEntrada, porcentajeMerma, costoPorKg]);

  // Actualizar merma cuando cambia el producto origen
  useEffect(() => {
    if (productoOrigenId) {
      const producto = productos.find(p => p.id === productoOrigenId);
      if (producto) {
        const nombreLower = producto.nombre.toLowerCase();
        let mermaEncontrada = mermasPorTipo.default;
        
        for (const [fruta, merma] of Object.entries(mermasPorTipo)) {
          if (nombreLower.includes(fruta)) {
            mermaEncontrada = merma;
            break;
          }
        }
        
        setPorcentajeMerma(mermaEncontrada);
      }
    }
  }, [productoOrigenId, productos]);

  const productoOrigen = productos.find(p => p.id === productoOrigenId);
  const productoDestino = productos.find(p => p.id === productoDestinoId);
  const operarioSeleccionado = operarios.find(o => o.id === operarioId);

  // Filtrar productos de materia prima (categoría MP)
  const productosMateriaPrima = productos.filter(p => p.categoriaId === "1" && p.activo);
  
  // Filtrar productos procesados (para destino)
  const productosDestino = productos.filter(p => p.activo);

  const validarFormulario = (): boolean => {
    if (!productoOrigenId) {
      toast({ title: "Error", description: "Debe seleccionar un producto de origen", variant: "destructive" });
      return false;
    }
    if (!productoDestinoId) {
      toast({ title: "Error", description: "Debe seleccionar un producto de destino", variant: "destructive" });
      return false;
    }
    if (!operarioId) {
      toast({ title: "Error", description: "Debe seleccionar un operario", variant: "destructive" });
      return false;
    }
    if (!kgEntrada || parseFloat(kgEntrada) <= 0) {
      toast({ title: "Error", description: "Debe ingresar una cantidad válida de kg", variant: "destructive" });
      return false;
    }
    if (productoOrigen && parseFloat(kgEntrada) > productoOrigen.stockActual) {
      toast({ title: "Error", description: `Stock insuficiente. Disponible: ${productoOrigen.stockActual} kg`, variant: "destructive" });
      return false;
    }
    if (!fecha) {
      toast({ title: "Error", description: "Debe seleccionar una fecha", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validarFormulario()) return;
    setConfirmDialogOpen(true);
  };

// Función síncrona para construir el JSON del proceso (sin 'id', ya que el backend lo genera)
  const construirNuevoProceso = (): Omit<Proceso, "id"> => {
    return {
      fecha_proceso: fecha,
      producto_procesar: productoOrigenId,
      producto_procesado: productoDestinoId,
      identificacion_operario: operarioId,
      kg_procesar: parseFloat(kgEntrada),
      costo_kg: parseFloat(costoPorKg),
      porcentaje_merma: porcentajeMerma,
      kg_merma: kgMerma,
      kg_resultado: kgSalida,
      costo_total_proceso: costoTotal,
      valor_final_kg: valorFinalKg,
      notas: notas,
    };
  };

  // Función asíncrona para enviar el JSON al backend usando tu createProceso
  const enviarProcesoAlBackend = (proceso: Omit<Proceso, "id">) => {
    createProceso(proceso)
      .then((respuesta) => {
        console.log("Proceso enviado al backend exitosamente:", respuesta);
        // Opcional: Muestra un toast de éxito si quieres confirmar el envío
        toast({
          title: "Envío confirmado",
          description: "El proceso se registró en el servidor.",
        });
      })
      .catch((error) => {
        console.error("Error al enviar proceso al backend:", error);
        toast({
          title: "Error",
          description: "No se pudo registrar el proceso en el servidor. Verifica la conexión.",
          variant: "destructive"
        });
      });
  };

  // Función principal (síncrona)
  const confirmarProceso = () => {
    // Construir el JSON síncronamente (sin 'id')
    const nuevoProcesoSinId = construirNuevoProceso();
    console.log(enviarProcesoAlBackend)
    
    // Generar 'id' localmente para operaciones (stock, etc.) - no se envía al backend
    const idLocal = Date.now().toString();
    const nuevoProcesoCompleto: Proceso = { ...nuevoProcesoSinId, id: idLocal };
    
    console.log("Nuevo proceso a registrar (local):", nuevoProcesoCompleto);

    // Reducir stock del producto origen
    const resultadoSalida = inventoryService.removeStock(
      productoOrigenId,
      parseFloat(kgEntrada),
      "Proceso de producción",
      `PROC-${idLocal}`,
      `Procesado por ${operarioSeleccionado?.nombre} ${operarioSeleccionado?.apellidos}`
    );

    if (!resultadoSalida) {
      toast({ title: "Error", description: "No se pudo reducir el stock del producto origen", variant: "destructive" });
      setConfirmDialogOpen(false);
      return;
    }

    // Agregar stock al producto destino
    inventoryService.addStock(
      productoDestinoId,
      kgSalida,
      "Resultado de proceso",
      `PROC-${idLocal}`,
      `Procesado desde ${productoOrigen?.nombre}. Operario: ${operarioSeleccionado?.nombre} ${operarioSeleccionado?.apellidos}`
    );

    // Registrar el proceso localmente
    //inventoryService.addProceso(nuevoProcesoCompleto);

    toast({
      title: "Proceso registrado",
      description: `Se procesaron ${kgEntrada} kg de ${productoOrigen?.nombre} → ${kgSalida.toFixed(2)} kg de ${productoDestino?.nombre}`,
    });

    // Enviar el JSON al backend (asíncrono, no bloquea)
    enviarProcesoAlBackend(nuevoProcesoSinId);

    // Limpiar formulario
    setProductoOrigenId("");
    setProductoDestinoId("");
    setOperarioId("");
    setKgEntrada("");
    setCostoPorKg("200");
    setNotas("");
    setConfirmDialogOpen(false);
  };

  const verDetalleProceso = (proceso: Proceso) => {
    setProcesoSeleccionado(proceso);
    setDetalleProcesoOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  };

  const getProductoNombre = (id: string) => {
    const producto = productos.find(p => p.id == id);
    return producto ? `${producto.nombre}` : "N/A";
  };

  const getOperarioNombre = (id: string) => {
    const operario = operarios.find(o => o.id == id);
    return operario ? `${operario.nombre} ${operario.apellidos}` : "N/A";
  };



  return (
    <MainLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Factory className="h-8 w-8" />
          Módulo de Procesos
        </h1>
        <p className="text-muted-foreground">
          Procesa materia prima y registra los resultados en el inventario
        </p>
      </div>

      <Tabs defaultValue="nuevo" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="nuevo">Nuevo Proceso</TabsTrigger>
          <TabsTrigger value="historial">Historial de Procesos</TabsTrigger>
        </TabsList>

        <TabsContent value="nuevo" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulario */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Datos del Proceso
                </CardTitle>
                <CardDescription>
                  Seleccione el producto a procesar y configure los parámetros
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha" className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Fecha del Proceso
                    </Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="operario" className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Operario
                    </Label>
                    <Select value={operarioId} onValueChange={setOperarioId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar operario" />
                      </SelectTrigger>
                      <SelectContent>
                        {operarios.map((operario) => (
                          <SelectItem key={operario.id} value={operario.id}>
                            {operario.nombre} {operario.apellidos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="productoOrigen" className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    Producto a Procesar (Materia Prima)
                  </Label>
                  <Select value={productoOrigenId} onValueChange={setProductoOrigenId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar materia prima" />
                    </SelectTrigger>
                    <SelectContent>
                      {productosMateriaPrima.map((producto) => (
                        <SelectItem key={producto.id} value={producto.id}>
                          {producto.codigo} - {producto.nombre} (Stock: {producto.stockActual} {producto.unidadMedida})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {productoOrigen && (
                    <p className="text-sm text-muted-foreground">
                      Stock disponible: <span className="font-medium">{productoOrigen.stockActual} {productoOrigen.unidadMedida}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productoDestino" className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    Producto Resultante
                  </Label>
                  <Select value={productoDestinoId} onValueChange={setProductoDestinoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {productosDestino.map((producto) => (
                        <SelectItem key={producto.id} value={producto.id}>
                          {producto.codigo} - {producto.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kgEntrada" className="flex items-center gap-1">
                      <Scale className="h-4 w-4" />
                      Kg a Procesar
                    </Label>
                    <Input
                      id="kgEntrada"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={kgEntrada}
                      onChange={(e) => setKgEntrada(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="costoPorKg" className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Costo por Kg
                    </Label>
                    <Input
                      id="costoPorKg"
                      type="number"
                      step="1"
                      min="0"
                      placeholder="200"
                      value={costoPorKg}
                      onChange={(e) => setCostoPorKg(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="porcentajeMerma" className="flex items-center gap-1">
                    <TrendingDown className="h-4 w-4" />
                    Porcentaje de Merma (%)
                  </Label>
                  <Input
                    id="porcentajeMerma"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={porcentajeMerma}
                    onChange={(e) => setPorcentajeMerma(parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    La merma se calcula automáticamente según el tipo de fruta
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notas" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Notas
                  </Label>
                  <Textarea
                    id="notas"
                    placeholder="Observaciones del proceso..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button onClick={handleSubmit} className="w-full" size="lg">
                  <Factory className="mr-2 h-4 w-4" />
                  Registrar Proceso
                </Button>
              </CardContent>
            </Card>

            {/* Resumen de cálculos */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Resumen del Proceso
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Kg Entrada</p>
                      <p className="text-2xl font-bold text-foreground">
                        {parseFloat(kgEntrada) || 0} kg
                      </p>
                    </div>
                    <div className="bg-destructive/10 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Merma ({porcentajeMerma}%)</p>
                      <p className="text-2xl font-bold text-destructive">
                        -{kgMerma.toFixed(2)} kg
                      </p>
                    </div>
                  </div>

                  <div className="bg-primary/10 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Kg Resultantes</p>
                    <p className="text-3xl font-bold text-primary">
                      {kgSalida.toFixed(2)} kg
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Costo por Kg:</span>
                      <span className="font-medium">{formatCurrency(parseFloat(costoPorKg) || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Costo Total del Proceso:</span>
                      <span className="font-bold text-lg">{formatCurrency(costoTotal)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center bg-accent/50 p-3 rounded-lg">
                      <span className="text-foreground font-medium">Valor Final por Kg:</span>
                      <span className="font-bold text-xl text-primary">{formatCurrency(valorFinalKg)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información del proceso */}
              {productoOrigen && productoDestino && operarioSeleccionado && (
                <Card className="border-primary/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      Resumen de la Operación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p><strong>Fecha:</strong> {fecha}</p>
                    <p><strong>Operario:</strong> {operarioSeleccionado.nombre} {operarioSeleccionado.apellidos}</p>
                    <p><strong>Origen:</strong> {productoOrigen.codigo} - {productoOrigen.nombre}</p>
                    <p><strong>Destino:</strong> {productoDestino.codigo} - {productoDestino.nombre}</p>
                    <p><strong>Proceso:</strong> {kgEntrada || 0} kg → {kgSalida.toFixed(2)} kg</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Procesos</CardTitle>
              <CardDescription>
                Registro de todos los procesos realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {procesos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Factory className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay procesos registrados</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Producto Origen</TableHead>
                      <TableHead>Producto Destino</TableHead>
                      <TableHead>Operario</TableHead>
                      <TableHead className="text-right">Kg Entrada</TableHead>
                      <TableHead className="text-right">Kg Salida</TableHead>
                      <TableHead className="text-right">Costo Total</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {procesos.map((proceso) => (
                      <TableRow key={proceso.id}>
                        <TableCell>{proceso.fecha_proceso}</TableCell>
                        <TableCell>{getProductoNombre(proceso.producto_procesar)}</TableCell>
                        <TableCell>{getProductoNombre(proceso.producto_procesado)}</TableCell>
                        <TableCell>{getOperarioNombre(proceso.identificacion_operario)}</TableCell>
                        <TableCell className="text-right">{proceso.kg_procesar} kg</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{proceso.kg_resultado} kg</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(proceso.costo_total_proceso)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => verDetalleProceso(proceso)}>
                            Ver Detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmación */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Confirmar Proceso
            </DialogTitle>
            <DialogDescription>
              Esta acción modificará el inventario. ¿Desea continuar?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-muted-foreground">Producto origen:</p>
              <p className="font-medium">{productoOrigen?.nombre}</p>
              
              <p className="text-muted-foreground">Kg a reducir:</p>
              <p className="font-medium text-destructive">-{kgEntrada} kg</p>
              
              <p className="text-muted-foreground">Producto destino:</p>
              <p className="font-medium">{productoDestino?.nombre}</p>
              
              <p className="text-muted-foreground">Kg a agregar:</p>
              <p className="font-medium text-primary">+{kgSalida.toFixed(2)} kg</p>
              
              <p className="text-muted-foreground">Costo total:</p>
              <p className="font-medium">{formatCurrency(costoTotal)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarProceso}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de detalle de proceso */}
      <Dialog open={detalleProcesoOpen} onOpenChange={setDetalleProcesoOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del Proceso</DialogTitle>
          </DialogHeader>
          {procesoSeleccionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p className="text-muted-foreground">ID:</p>
                <p className="font-mono">{procesoSeleccionado.id}</p>
                
                <p className="text-muted-foreground">Fecha:</p>
                <p>{procesoSeleccionado.fecha_proceso}</p>
                
                <p className="text-muted-foreground">Operario:</p>
                <p>{getOperarioNombre(procesoSeleccionado.identificacion_operario)}</p>
                
                <p className="text-muted-foreground">Producto Origen:</p>
                <p>{getProductoNombre(procesoSeleccionado.producto_procesar)}</p>
                
                <p className="text-muted-foreground">Producto Destino:</p>
                <p>{getProductoNombre(procesoSeleccionado.producto_procesado)}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p className="text-muted-foreground">Kg Entrada:</p>
                <p>{procesoSeleccionado.kg_procesar} kg</p>
                
                <p className="text-muted-foreground">Merma ({procesoSeleccionado.porcentaje_merma}%):</p>
                <p className="text-destructive">-{(Number(procesoSeleccionado.kg_procesar) * Number(procesoSeleccionado.porcentaje_merma) / 100).toFixed(2)} kg</p>                
                <p className="text-muted-foreground">Kg Salida:</p>
                <p className="font-bold text-primary">{procesoSeleccionado.kg_resultado} kg</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p className="text-muted-foreground">Costo por Kg:</p>
                <p>{formatCurrency(procesoSeleccionado.costo_kg)}</p>
                
                <p className="text-muted-foreground">Costo Total:</p>
                <p className="font-bold">{formatCurrency(Number(procesoSeleccionado.costo_kg)*Number(procesoSeleccionado.kg_procesar))}</p>
                
                <p className="text-muted-foreground">Valor Final por Kg:</p>
                <p className="font-bold text-primary">{formatCurrency(procesoSeleccionado.costo_total_proceso)}</p>
              </div>
              
              {procesoSeleccionado.notas && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">Notas:</p>
                    <p className="text-sm">{procesoSeleccionado.notas}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </MainLayout>
    
  );
};
  //let dbCostoTotal = procesoSeleccionado.costo_kg * procesoSeleccionado.kg_procesar;


export default ProcesosPage;
