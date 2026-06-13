import { useState, useEffect, useMemo, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { inventoryService } from "@/services/inventoryService";
import { initialOperarios } from "@/data/mockData";
import { Proceso, Operario, Producto } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Calendar, 
  Scale, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Filter, 
  Calculator,
  Factory,
  ClipboardList,
  Check,
  X
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ResumenOperario {
  operarioId: string;
  operario: Operario;
  totalProcesos: number;
  totalKgProcesados: number;
  totalKgResultantes: number;
  totalCostoManoObra: number;
  procesos: Proceso[];
}

const AnalisisNominaPage = () => {
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [operarios] = useState<Operario[]>(initialOperarios);
  console.log(initialOperarios)
  // Filtros
  const [operarioFilter, setOperarioFilter] = useState<string>("");
  const [selectedOperarioId, setSelectedOperarioId] = useState<string | null>(null);
  const [operarioInputOpen, setOperarioInputOpen] = useState(false);
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(undefined);
  const [fechaFin, setFechaFin] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setProcesos(inventoryService.getProcesos());
    setProductos(inventoryService.getProductos());
    
    const unsubscribe = inventoryService.subscribe(() => {
      setProcesos(inventoryService.getProcesos());
      setProductos(inventoryService.getProductos());
    });
    
    return () => { unsubscribe(); };
  }, []);

  // Filtrar procesos por operario y rango de fechas
  const procesosFiltrados = useMemo(() => {
    return procesos.filter(proceso => {
      // Filtro por operario (por ID seleccionado)
      if (selectedOperarioId) {
        if (proceso.operarioId !== selectedOperarioId) {
          return false;
        }
      }
      
      // Filtro por fecha inicio
      if (fechaInicio) {
        const fechaProceso = new Date(proceso.fecha);
        if (fechaProceso < fechaInicio) return false;
      }
      
      // Filtro por fecha fin
      if (fechaFin) {
        const fechaProceso = new Date(proceso.fecha);
        const fechaFinAjustada = new Date(fechaFin);
        fechaFinAjustada.setHours(23, 59, 59, 999);
        if (fechaProceso > fechaFinAjustada) return false;
      }
      
      return true;
    });
  }, [procesos, selectedOperarioId, fechaInicio, fechaFin]);

  // Calcular resumen por operario
  const resumenPorOperario = useMemo((): Operario[] => {
    const resumenMap = new Map<string, Operario>();
    
    procesosFiltrados.forEach(proceso => {
      const operario = operarios.find(o => o.id === proceso.identifiacion_operario);
      if (!operario) return;
      
      if (!resumenMap.has(proceso.operarioId)) {
        resumenMap.set(proceso.operarioId, {
          operarioId: proceso.operarioId,
          operario,
          totalProcesos: 0,
          totalKgProcesados: 0,
          totalKgResultantes: 0,
          totalCostoManoObra: 0,
          procesos: [],
        });
      }
      
      const resumen = resumenMap.get(proceso.operarioId)!;
      resumen.totalProcesos += 1;
      resumen.totalKgProcesados += proceso.kgEntrada;
      resumen.totalKgResultantes += proceso.kgSalida;
      resumen.totalCostoManoObra += proceso.costoTotal;
      resumen.procesos.push(proceso);
    });
    
    return Array.from(resumenMap.values());
  }, [procesosFiltrados, operarios]);

  // Totales generales
  const totalesGenerales = useMemo(() => {
    return {
      totalProcesos: procesosFiltrados.length,
      totalKgProcesados: procesosFiltrados.reduce((acc, p) => acc + p.kg_procesar, 0),
      totalKgResultantes: procesosFiltrados.reduce((acc, p) => acc + p.kg_resultado, 0),
      totalCostoManoObra: procesosFiltrados.reduce((acc, p) => acc + p.costo_total_proceso, 0),
      totalOperarios: initialOperarios.length,
    };
  }, [procesosFiltrados, resumenPorOperario]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      minimumFractionDigits: 0 
    }).format(value);
  };

  const getProductoNombre = (id: string) => {
    const producto = productos.find(p => p.id === id);
    return producto ? producto.nombre : "N/A";
  };

  const limpiarFiltros = () => {
    setOperarioFilter("");
    setSelectedOperarioId(null);
    setFechaInicio(undefined);
    setFechaFin(undefined);
  };

  const tienesFiltrosActivos = selectedOperarioId !== null || fechaInicio || fechaFin;

  // Operarios filtrados por texto de búsqueda
  const operariosFiltrados = useMemo(() => {
    if (operarioFilter.trim() === "") return operarios;
    return operarios.filter(operario => {
      const nombreCompleto = `${operario.nombre} ${operario.apellidos}`.toLowerCase();
      return nombreCompleto.includes(operarioFilter.toLowerCase());
    });
  }, [operarios, operarioFilter]);

  const handleSelectOperario = (operarioId: string) => {
    const operario = operarios.find(o => o.id === operarioId);
    if (operario) {
      setSelectedOperarioId(operarioId);
      setOperarioFilter(`${operario.nombre} ${operario.apellidos}`);
      setOperarioInputOpen(false);
    }
  };

  const handleClearOperario = () => {
    setOperarioFilter("");
    setSelectedOperarioId(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8" />
            Análisis de Mano de Obra
          </h1>
          <p className="text-muted-foreground">
            Relación entre operarios y producción - Liquidación de nómina
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Búsqueda
            </CardTitle>
            <CardDescription>
              Filtre por operario y rango de fechas para liquidar nómina
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Filtro por operario con autocompletado */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Operario
                </Label>
                <Popover open={operarioInputOpen} onOpenChange={setOperarioInputOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Input
                        placeholder="Buscar operario..."
                        value={operarioFilter}
                        onChange={(e) => {
                          setOperarioFilter(e.target.value);
                          setSelectedOperarioId(null);
                          if (!operarioInputOpen) setOperarioInputOpen(true);
                        }}
                        onFocus={() => setOperarioInputOpen(true)}
                        className={cn(selectedOperarioId && "pr-8")}
                      />
                      {selectedOperarioId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearOperario();
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0" align="start">
                    <Command>
                      <CommandList>
                        <CommandEmpty>No se encontraron operarios</CommandEmpty>
                        <CommandGroup>
                          {operariosFiltrados.map((operario) => (
                            <CommandItem
                              key={operario.id}
                              value={`${operario.nombre} ${operario.apellidos}`}
                              onSelect={() => handleSelectOperario(operario.id)}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedOperarioId === operario.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div>
                                <p className="font-medium">{operario.nombre} {operario.apellidos}</p>
                                <p className="text-xs text-muted-foreground">{operario.identificacion}</p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Fecha inicio */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Fecha Inicio
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fechaInicio && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {fechaInicio ? format(fechaInicio, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={fechaInicio}
                      onSelect={setFechaInicio}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Fecha fin */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Fecha Fin
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fechaFin && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {fechaFin ? format(fechaFin, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={fechaFin}
                      onSelect={setFechaFin}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Botón limpiar */}
              <div className="space-y-2">
                <Label className="invisible">Acciones</Label>
                <Button 
                  variant="outline" 
                  onClick={limpiarFiltros}
                  disabled={!tienesFiltrosActivos}
                  className="w-full"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>

            {tienesFiltrosActivos && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedOperarioId && (
                  <Badge variant="secondary">
                    Operario: {operarios.find(o => o.id === selectedOperarioId)?.nombre} {operarios.find(o => o.id === selectedOperarioId)?.apellidos}
                  </Badge>
                )}
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen de Liquidación */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Resumen de Liquidación
              {fechaInicio && fechaFin && (
                <Badge variant="outline" className="ml-2">
                  {format(fechaInicio, "dd/MM/yyyy")} - {format(fechaFin, "dd/MM/yyyy")}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Totales del período seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-background rounded-lg p-4 text-center border">
                <p className="text-sm text-muted-foreground">Operarios</p>
                <p className="text-2xl font-bold text-foreground">{totalesGenerales.totalOperarios}</p>
              </div>
              <div className="bg-background rounded-lg p-4 text-center border">
                <p className="text-sm text-muted-foreground">Procesos</p>
                <p className="text-2xl font-bold text-foreground">{totalesGenerales.totalProcesos}</p>
              </div>
              <div className="bg-background rounded-lg p-4 text-center border">
                <p className="text-sm text-muted-foreground">Kg Procesados</p>
                <p className="text-2xl font-bold text-foreground">{totalesGenerales.totalKgProcesados.toFixed(2)}</p>
              </div>
              <div className="bg-background rounded-lg p-4 text-center border">
                <p className="text-sm text-muted-foreground">Kg Resultantes</p>
                <p className="text-2xl font-bold text-foreground">{totalesGenerales.totalKgResultantes.toFixed(2)}</p>
              </div>
              <div className="bg-primary/10 rounded-lg p-4 text-center border border-primary/30">
                <p className="text-sm text-muted-foreground">Total Nómina</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalesGenerales.totalCostoManoObra)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen por Operario */}
        {resumenPorOperario.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Detalle por Operario
            </h2>
            
            {resumenPorOperario.map((resumen) => (
              <Card key={resumen.identificacion_operario}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {resumen.operario.nombre} {resumen.operario.apellidos}
                      </CardTitle>
                      <CardDescription>
                        ID: {resumen.operario.operario_identificacion} | {resumen.totalProcesos} proceso(s) en el período
                      </CardDescription>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Kg Procesados</p>
                        <p className="text-lg font-semibold">{resumen.totalKgProcesados.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Kg Resultantes</p>
                        <p className="text-lg font-semibold">{resumen.totalKgResultantes.toFixed(2)}</p>
                      </div>
                      <div className="text-center bg-primary/10 rounded-lg px-4 py-2">
                        <p className="text-sm text-muted-foreground">Total a Pagar</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(resumen.totalCostoManoObra)}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Producto Origen</TableHead>
                        <TableHead>Producto Destino</TableHead>
                        <TableHead className="text-right">Kg Entrada</TableHead>
                        <TableHead className="text-right">Merma %</TableHead>
                        <TableHead className="text-right">Kg Salida</TableHead>
                        <TableHead className="text-right">Costo/Kg</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resumen.procesos.map((proceso) => (
                        <TableRow key={proceso.id}>
                          <TableCell>{proceso.fecha_proceso}</TableCell>
                          <TableCell>{getProductoNombre(proceso.productoOrigenId)}</TableCell>
                          <TableCell>{getProductoNombre(proceso.productoDestinoId)}</TableCell>
                          <TableCell className="text-right">{proceso.kgEntrada.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{proceso.porcentajeMerma}%</Badge>
                          </TableCell>
                          <TableCell className="text-right">{proceso.kgSalida.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(proceso.costoPorKg)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(proceso.costoTotal)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell colSpan={3}>Subtotal {resumen.operario.nombre}</TableCell>
                        <TableCell className="text-right">{resumen.totalKgProcesados.toFixed(2)}</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right">{resumen.totalKgResultantes.toFixed(2)}</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right text-primary font-bold">
                          {formatCurrency(resumen.totalCostoManoObra)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Factory className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No hay procesos registrados</p>
                <p className="text-sm">
                  {tienesFiltrosActivos 
                    ? "No se encontraron procesos con los filtros seleccionados. Intente ajustar los criterios de búsqueda."
                    : "Registre procesos en el módulo de Producción para ver el análisis de mano de obra aquí."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default AnalisisNominaPage;
