import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, X, Trash2, ShoppingCart, DollarSign, Package, FileText, Pause } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { VentaItem, Venta } from "@/types";
import { toast } from "sonner";
import { inventoryService } from "@/services/inventoryService";
import { createVenta, fetchVentas } from "@/services/ventaService";


const getProductosFromInventory = () => {
  return inventoryService.getProductos().map(p => ({
    codigo: p.codigo,
    descripcion: p.nombre,
    productoId: p.id,
    unidadMedida: p.unidadMedida,
    stockActual: p.stockActual,
    precioUnitario: p.precioUnitario,
  }));
};



export default function VentasPage() {
  const [formData, setFormData] = useState({
    numeroVenta: `V-${Date.now().toString().slice(-6)}`,
    fecha: new Date(),
    cliente: "",
    codigo: "",
    subtotal: 0,
    descuento: 0,
    total: 0,
    notas: "",
  });

  const [items, setItems] = useState<VentaItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    codigo: "",
    descripcion: "",
    cantidad: "",
    precioUnitario: "",
    descuento: "",
  });
  const [stockDisponible, setStockDisponible] = useState<number | null>(null);

  const [ventas, setVentas] = useState<Venta[]>([]);
  const [showHistorial, setShowHistorial] = useState(false);

  // Filtros del historial de ventas
  const [filtroHistorial, setFiltroHistorial] = useState({
    numeroVenta: "",
    cliente: "",
    codigo: "",
    fechaDesde: undefined as Date | undefined,
    fechaHasta: undefined as Date | undefined,
  });

  const limpiarFiltrosHistorial = () => {
    setFiltroHistorial({
      numeroVenta: "",
      cliente: "",
      codigo: "",
      fechaDesde: undefined,
      fechaHasta: undefined,
    });
  };

  const ventasFiltradas = ventas.filter((venta) => {
    const fechaVenta = venta.fecha ? new Date(venta.fecha) : null;

    const matchNumero = filtroHistorial.numeroVenta
      ? venta.numero_venta?.toLowerCase().includes(filtroHistorial.numeroVenta.toLowerCase())
      : true;

    const matchCliente = filtroHistorial.cliente
      ? venta.cliente?.toLowerCase().includes(filtroHistorial.cliente.toLowerCase())
      : true;

    const matchCodigo = filtroHistorial.codigo
      ? venta.producto_codigo?.toLowerCase().includes(filtroHistorial.codigo.toLowerCase())
      : true;

    const matchDesde = filtroHistorial.fechaDesde && fechaVenta
      ? fechaVenta >= filtroHistorial.fechaDesde
      : true;

    const matchHasta = filtroHistorial.fechaHasta && fechaVenta
      ? fechaVenta <= filtroHistorial.fechaHasta
      : true;

    return matchNumero && matchCliente && matchCodigo && matchDesde && matchHasta;
  });


  useEffect(() => {
    const cargar = async () => {
      const resultado = await fetchVentas(); // tu función del backend
      setVentas(resultado);
      console.log(resultado)
      return resultado;
    };
    cargar();
  }, []);





  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"error" | "success" | "alert">("error");
  const [dialogMessage, setDialogMessage] = useState("");
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const [, setRefresh] = useState(0);

  useEffect(() => {
    const unsub = inventoryService.subscribe(() => setRefresh(r => r + 1));
    return () => { unsub(); };
  }, []);

  const showDialog = (type: "error" | "success" | "alert", message: string) => {
    setDialogType(type);
    setDialogMessage(message);
    setDialogOpen(true);
  };

  const handleItemCodigoChange = (codigo: string) => {
    setCurrentItem({ ...currentItem, codigo });
    const productos = getProductosFromInventory();
    const found = productos.find(p => p.codigo === codigo);
    if (found) {
      setCurrentItem(prev => ({
        ...prev,
        descripcion: found.descripcion,
        precioUnitario: found.precioUnitario.toString(),
      }));
      if(found.unidadMedida === "UN"){found.stockActual/=10;}
      setStockDisponible(found.stockActual);
      console.log(found.stockActual)
    } else {
      setCurrentItem(prev => ({ ...prev, descripcion: "", precioUnitario: "" }));
      setStockDisponible(null);
    }
  };

  const calculateItemTotal = () => {
    const cantidad = parseFloat(currentItem.cantidad) || 0;
    const precio = parseFloat(currentItem.precioUnitario) || 0;
    const descuento = parseFloat(currentItem.descuento) || 0;
    return cantidad * 10 * precio - descuento;
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + ((item.cantidad * item.precioUnitario) * 10), 0) +
      (parseFloat(currentItem.cantidad) || 0) * (parseFloat(currentItem.precioUnitario) || 0) * 10;
  };

  const calculateTotalDescuentos = () => {
    return items.reduce((acc, item) => acc + item.descuento * 10, 0) +
      (parseFloat(currentItem.descuento) || 0);
  };

  const calculateTotalGeneral = () => {
    const itemsTotal = items.reduce((acc, item) => acc + item.total, 0);
    const currentTotal = calculateItemTotal();
    return itemsTotal + currentTotal;
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSubmit = async () => {
    // Validaciones del formulario
    if (!formData.numeroVenta) {
      showDialog("error", "El número de venta es requerido");
      return;
    }
    if (!formData.cliente.trim()) {
      showDialog("error", "El cliente es requerido");
      return;
    }
    if (formData.fecha > new Date()) {
      showDialog("error", "La fecha no puede ser futura");
      return;
    }
  
    // Validaciones del producto
    if (!currentItem.codigo) {
      showDialog("error", "Debe seleccionar un producto");
      return;
    }
    if (!currentItem.cantidad) {
      showDialog("error", "La cantidad es requerida");
      return;
    }
  
    const productos = getProductosFromInventory();
    const found = productos.find(p => p.codigo === currentItem.codigo);
    if (!found) {
      showDialog("error", "El producto no existe en el inventario");
      return;
    }
  
    const cantidad = parseFloat(currentItem.cantidad);
    if (!cantidad || cantidad <= 0) {
      showDialog("error", "La cantidad debe ser mayor a 0");
      return;
    }
    if (cantidad > found.stockActual) {
      showDialog("error", `Stock insuficiente. Disponible: ${found.stockActual} - Solicitado: ${cantidad}`);
      return;
    }
  
    // Descontar del inventario
    const success = inventoryService.removeStock(
      found.productoId,
      cantidad,
      "Venta",
      formData.numeroVenta,
      `Cliente: ${formData.cliente} - ${formData.notas}`
    );
    if (!success) {
      toast.warning(`Error al descontar inventario: ${currentItem.codigo}`);
    }
  
    // Construir payload para la API
    const precioUnitario = parseFloat(currentItem.precioUnitario) || found.precioUnitario;
    const descuento = parseInt(currentItem.descuento) || 0;
    const total = cantidad * 10 * precioUnitario - descuento;
  
    const payload = {
      numero_venta: formData.numeroVenta,
      fecha: format(formData.fecha, "yyyy-MM-dd"),
      cliente: formData.cliente,
      notas: formData.notas,
      producto_codigo: currentItem.codigo,
      cantidad,
      precio_unitario: precioUnitario,
      descuento,
      total,
    };
  
    try {
      const ventaCreada = await createVenta(payload);
      setVentas(prev => [...prev, ventaCreada]);
      toast.success("Inventario actualizado correctamente");
      showDialog("success", "La venta se ha registrado satisfactoriamente");
      handleClearAll();
    } catch (error: any) {
      showDialog("error", error?.message || "Error al registrar la venta en el servidor");
    }
  };
  const handleClearAll = () => {
    setFormData({
      numeroVenta: `V-${Date.now().toString().slice(-6)}`,
      fecha: new Date(),
      cliente: "",
      notas: "",
    });
    setItems([]);
    setCurrentItem({ codigo: "", descripcion: "", cantidad: "", precioUnitario: "", descuento: "" });
    setStockDisponible(null);
    setConfirmClearOpen(false);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Ventas</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowHistorial(!showHistorial)}>
              <FileText className="h-4 w-4 mr-2" />
              {showHistorial ? "Nueva Venta" : "Historial"}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Resumen cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ventas Hoy</p>
                <p className="text-lg font-bold text-foreground">
                  {ventas.filter(v => v.fecha?.slice(0,10) === format(new Date(), "yyyy-MM-dd")).length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Hoy</p>
                <p className="text-lg font-bold text-foreground">
                  ${ventas.filter(v => v.fecha?.slice(0, 10) === format(new Date(), "yyyy-MM-dd")).reduce((a, v) => a + (Number(v.total)), 0).toLocaleString('es-CO')}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ítems Actuales</p>
                <p className="text-lg font-bold text-foreground">1</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Venta</p>
                <p className="text-lg font-bold text-primary">${calculateTotalGeneral().toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {!showHistorial ? (
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Header Form */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroVenta">N° Venta</Label>
                  <Input
                    id="numeroVenta"
                    value={formData.numeroVenta}
                    onChange={(e) => setFormData({ ...formData, numeroVenta: e.target.value })}
                    placeholder="V-000001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Input
                    id="cliente"
                    value={formData.cliente}
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.fecha && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.fecha ? format(formData.fecha, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.fecha}
                        onSelect={(date) => date && setFormData({ ...formData, fecha: date })}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notas">Notas</Label>
                  <Input
                    id="notas"
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    placeholder="Observaciones"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Ítems de Venta</Label>
                
                <div className="grid grid-cols-6 gap-2 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="item-codigo">Código</Label>
                    <Input
                      id="item-codigo"
                      value={currentItem.codigo}
                      onChange={(e) => handleItemCodigoChange(e.target.value)}
                      placeholder="MP-001"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="item-descripcion">Descripción</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="item-descripcion"
                        value={currentItem.descripcion}
                        readOnly
                        className="bg-muted"
                        placeholder="Automático"
                      />
                      {stockDisponible !== null && (
                        <Badge variant={stockDisponible > 0 ? "default" : "destructive"} className="whitespace-nowrap">
                          Stock: {stockDisponible}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-cantidad">Cantidad</Label>
                    <Input
                      id="item-cantidad"
                      value={currentItem.cantidad}
                      onChange={(e) => setCurrentItem({ ...currentItem, cantidad: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-precio">Precio Unit. $</Label>
                    <Input
                      id="item-precio"
                      value={currentItem.precioUnitario}
                      onChange={(e) => setCurrentItem({ ...currentItem, precioUnitario: e.target.value })}
                      placeholder="8500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-descuento">Descuento $</Label>
                    <Input
                      id="item-descuento"
                      value={currentItem.descuento}
                      onChange={(e) => setCurrentItem({ ...currentItem, descuento: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Código</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio Unit.</TableHead>
                          <TableHead>Descuento</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.codigo}</TableCell>
                            <TableCell>{item.descripcion}</TableCell>
                            <TableCell>{item.cantidad}</TableCell>
                            <TableCell>${item.precioUnitario.toLocaleString()}</TableCell>
                            <TableCell>${item.descuento.toLocaleString()}</TableCell>
                            <TableCell className="font-medium">${item.total.toLocaleString()}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(item.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Totales */}
              <div className="flex justify-end">
                <div className="w-72 space-y-2 bg-muted/30 p-4 rounded-lg border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">${calculateSubtotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuentos:</span>
                    <span className="font-medium text-destructive">-${calculateTotalDescuentos().toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-lg text-primary">${calculateTotalGeneral().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setConfirmClearOpen(true)}>
                  Limpiar
                </Button>
                <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Registrar Venta
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Historial de Ventas */
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Historial de Ventas</h3>

              {/* Filtros de búsqueda */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="filtro-numero">N° Venta</Label>
                  <Input
                    id="filtro-numero"
                    value={filtroHistorial.numeroVenta}
                    onChange={(e) => setFiltroHistorial({ ...filtroHistorial, numeroVenta: e.target.value })}
                    placeholder="V-000001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filtro-cliente">Cliente</Label>
                  <Input
                    id="filtro-cliente"
                    value={filtroHistorial.cliente}
                    onChange={(e) => setFiltroHistorial({ ...filtroHistorial, cliente: e.target.value })}
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filtro-codigo">Código Producto</Label>
                  <Input
                    id="filtro-codigo"
                    value={filtroHistorial.codigo}
                    onChange={(e) => setFiltroHistorial({ ...filtroHistorial, codigo: e.target.value })}
                    placeholder="MP-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Desde</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filtroHistorial.fechaDesde && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filtroHistorial.fechaDesde
                          ? format(filtroHistorial.fechaDesde, "dd/MM/yyyy", { locale: es })
                          : "Seleccionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filtroHistorial.fechaDesde}
                        onSelect={(date) => setFiltroHistorial({ ...filtroHistorial, fechaDesde: date })}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Hasta</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filtroHistorial.fechaHasta && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filtroHistorial.fechaHasta
                          ? format(filtroHistorial.fechaHasta, "dd/MM/yyyy", { locale: es })
                          : "Seleccionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filtroHistorial.fechaHasta}
                        onSelect={(date) => setFiltroHistorial({ ...filtroHistorial, fechaHasta: date })}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex justify-end mb-4">
                <Button variant="outline" size="sm" onClick={limpiarFiltrosHistorial}>
                  <X className="h-4 w-4 mr-2" />
                  Limpiar filtros
                </Button>
              </div>

              {ventasFiltradas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No hay ventas que coincidan con los filtros</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>N° Venta</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Ítems</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio Unidad</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead>Descuento</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ventasFiltradas.map((venta) => (
                        <TableRow key={venta.id}>
                          <TableCell className="font-medium">{venta.numero_venta}</TableCell>
                          <TableCell>{venta.fecha?.slice(0,10)}</TableCell>
                          <TableCell>{venta.cliente}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{venta.producto_codigo}</Badge>
                          </TableCell>
                          <TableCell>{venta.cantidad}</TableCell>
                          <TableCell>${Number(venta.precio_unitario).toLocaleString('es-CO')}</TableCell>
                          <TableCell>${Number(venta.cantidad * venta.precio_unitario*10).toLocaleString('es-CO')}</TableCell>
                          <TableCell className="text-destructive">-${venta.descuento.toLocaleString()}</TableCell>
                          <TableCell className="font-bold text-primary">${Number(venta.total).toLocaleString('es-CO')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de mensajes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={dialogType === "error" ? "text-destructive" : "text-primary"}>
              {dialogType === "error" ? "⚠️ Error" : dialogType === "success" ? "✅ Éxito" : "ℹ️ Información"}
            </DialogTitle>
          </DialogHeader>
          <p className="py-4">{dialogMessage}</p>
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>Aceptar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Clear */}
      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar limpieza</DialogTitle>
          </DialogHeader>
          <p className="py-4">¿Está seguro de limpiar todos los campos? Se perderán los datos ingresados.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmClearOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleClearAll}>Limpiar todo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
