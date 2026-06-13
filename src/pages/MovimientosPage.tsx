import { useState } from "react";
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
import { CalendarIcon, X, Plus, Trash2, TicketPlusIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { proveedores, motivos } from "@/data/mockData";
import { MovimientoItem, Proveedor } from "@/types";
import { toast } from "sonner";
import { inventoryService } from "@/services/inventoryService";
import { createMovimiento } from "@/services/movimientoApi";
// Obtener productos del servicio de inventario
const getProductosFromInventory = () => {
  return inventoryService.getProductos().map(p => ({
    codigo: p.codigo,
    descripcion: p.nombre,
    productoId: p.id,
  }));
};

export default function MovimientosPage() {
  const [formData, setFormData] = useState({
    productoId: "",
    motivo: "",
    documento: "",
    fecha_actual: null as Date | null,
  
    proveedor: "",
    nombre_proveedor: "",
  
    fecha_factura: null as Date | null,
  
    descripcion_item: "",
    cantidad: 0,
    valor_unitario: 0,
  
    tipo: "entrada" as "entrada" | "salida",
    notas: "",
  });

  const [items, setItems] = useState<MovimientoItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    codigo: "",
    descripcion: "",
    cantidad: "",
    valorKg: "",
    valorDescuento: "",

  });

  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"error" | "success" | "alert">("error");
  const [dialogMessage, setDialogMessage] = useState("");
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const showDialog = (type: "error" | "success" | "alert", message: string) => {
    setDialogType(type);
    setDialogMessage(message);
    setDialogOpen(true);
  };

  const handleProveedorChange = (nit: string) => {
    setFormData({ ...formData, proveedor: nit });
    const foundProveedor = proveedores.find(p => p.nit === nit);
    if (foundProveedor) {
      setProveedor(foundProveedor);
      setFormData(prev => ({ ...prev, proveedorNombre: foundProveedor.nombre }));
    } else {
      setProveedor(null);
      setFormData(prev => ({ ...prev, proveedorNombre: "" }));
    }
  };

  const handleMotivoChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setFormData({ ...formData, motivo: upperValue });
  };

  const handleItemCodigoChange = (codigo: string, descripcion: string) => {
    // 🔹 1. Actualizar formData (esto es lo que faltaba)
    setFormData((prev) => ({
      ...prev,
      productoId: codigo,
      descripcion_item: descripcion, // Limpiar descripción al cambiar el código 
    }));
  
    // 🔹 2. Actualizar currentItem
    setCurrentItem((prev) => ({
      ...prev,
      codigo,
      descripcion
    }));
  
    const productos = getProductosFromInventory();
    const foundProducto = productos.find(p => p.codigo === codigo);
  
    if (foundProducto) {
      setCurrentItem((prev) => ({
        ...prev,
        descripcion: foundProducto.descripcion,
      }));
    } else {
      setCurrentItem((prev) => ({
        ...prev,
        descripcion: "No hay nada",
      }));
    }
  };
  

  const calculateItemTotal = () => {
    const cantidad = parseFloat(currentItem.cantidad) || 0;
    const valorKg = parseFloat(currentItem.valorKg) || 0;
    const descuento = parseFloat(currentItem.valorDescuento) || 0;
    return cantidad * valorKg - descuento;
  };

  const calculateTotalGeneral = () => {
    return formData.valor_unitario * formData.cantidad;
    //return items.reduce((acc, item) => acc + item.valorTotal, 0);
  };

  /*const addItem = () => {
    if (!currentItem.codigo) {
      showDialog("error", "El producto no existe");
      return;
    }

    const productos = getProductosFromInventory();
    const foundProducto = productos.find(p => p.codigo === currentItem.codigo);
    if (!foundProducto) {
      showDialog("error", "El producto no existe");
      return;
    }

    if (!currentItem.cantidad || parseFloat(currentItem.cantidad) <= 0) {
      showDialog("error", "La cantidad debe ser mayor a 0");
      return;
    }

    if (!/^\d+(\.\d+)?$/.test(currentItem.cantidad)) {
      showDialog("error", "Datos errados, intenta nuevamente");
      return;
    }

    const newItem: MovimientoItem = {
      id: Date.now().toString(),
      codigo: currentItem.codigo,
      descripcion: currentItem.descripcion || foundProducto.descripcion,
      cantidad: parseFloat(currentItem.cantidad),
      valorKg: parseFloat(currentItem.valorKg) || 0,
      valorDescuento: parseFloat(currentItem.valorDescuento) || 0,
      valorTotal: calculateItemTotal(),
    };

    setItems([...items, newItem]);
    setCurrentItem({ codigo: "", descripcion: "", cantidad: "", valorKg: "", valorDescuento: "" });
    toast.success("Ítem agregado");
  };*/

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const validateForm = (): string | null => {
    if (!formData.motivo || !formData.documento || !formData.proveedor) {
      return "Campos vacíos, intente nuevamente";
    }

    const foundMotivo = motivos.find(m => m.codigo === formData.motivo);
    if (!foundMotivo) {
      return "El motivo no existe, intenta nuevamente";
    }

    if (!proveedor) {
      return "El proveedor no existe o el dato es errado";
    }

    if (formData.fecha_actual > new Date()) {
      return "La fecha debe ser de hoy o días anteriores";
    }

    if (formData.fecha_factura > new Date()) {
      return "La fecha debe ser de hoy o días anteriores";
    }
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      showDialog("error", error);
      return;
    }

    try {
      // 🔥 LLAMADA REAL AL BACKEND
      await createMovimiento({
        motivo: formData.motivo,
        documento: formData.documento,
        fecha_actual: formData.fecha_actual.toISOString(),
      
        proveedor: proveedor?.id ?? null,
        nombre_proveedor: proveedor?.nombre ?? null,
      
        fecha_factura: formData.fecha_factura.toISOString(),
      
        productoId: (formData.productoId),
        descripcion_item: formData.descripcion_item,
      
        cantidad: Number(formData.cantidad),
        valor_unitario: Number(formData.valor_unitario),
      
        tipo: formData.tipo as "entrada" | "salida",
        notas: formData.notas,
      });
      

      const payload = {
        motivo: formData.motivo,
        documento: formData.documento,
        fecha_actual: formData.fecha_factura,
        productoId: formData.productoId,
        cantidad: formData.cantidad,
        valor_unitario: formData.valor_unitario,
        tipo: formData.tipo,
        notas: formData.notas,
      };
    
 
      showDialog("success", "Los datos se han registrado satisfactoriamente");
      handleClearAll();
  
    } catch (error) {
      console.error(error);
      showDialog("error", "Error al registrar el movimiento");
    }
  };
  

  const handleClearAll = () => {
    setFormData({
      productoId: "",
      motivo: "",
      documento: "",
      fecha_factura: undefined,
      proveedor: "",
      nombre_proveedor: "",
      fecha_actual: undefined,
      notas: "",
      descripcion_item:"",
      cantidad: 0,
      valor_unitario: 0,
      tipo: "entrada", // o "salida"
    });
    setItems([]);
    setCurrentItem({ codigo: "", descripcion: "", cantidad: "", valorKg: "", valorDescuento: "" });
    setProveedor(null);
    setConfirmClearOpen(false);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Movimientos</h2>
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Header Form */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo:</Label>
                <Input
                  id="motivo"
                  value={formData.motivo}
                  onChange={(e) => handleMotivoChange(e.target.value)}
                  placeholder="GM, EAC..."
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numeroFactura">N° Factura</Label>
                <Input
                  id="numeroFactura"
                  value={formData.documento}
                  onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                  placeholder="F20230420"
                />
              </div>
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label>Fecha</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.fecha_actual && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.fecha_actual ? format(formData.fecha_actual, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.fecha_actual ?? undefined}
                    onSelect={(date) =>
                      setFormData({ ...formData, fecha_actual: date ?? null })
                    }
                  />

                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Proveedor */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proveedor">Proveedor</Label>
                <Input
                  id="proveedor"
                  value={formData.proveedor}
                  onChange={(e) => handleProveedorChange(e.target.value)}
                  placeholder="NIT"
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre Proveedor</Label>
                <Input
                  value={proveedor?.nombre || ""}
                  readOnly
                  className="bg-muted"
                  placeholder="Automático"
                />
              </div>
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label>Fecha Factura</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.fecha_factura && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.fecha_factura ? format(formData.fecha_factura, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.fecha_factura ?? undefined}
                    onSelect={(date) =>
                      setFormData({ ...formData, fecha_factura: date ?? null })
                    }
                  />

                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Ítems</Label>
              
              <div className="grid grid-cols-5 gap-2 items-end">
                <div className="space-y-2">
                  <Label htmlFor="item-codigo">Item</Label>
                  <Input
                    value={formData.productoId ?? ""}
                    onChange={(e) => handleItemCodigoChange(e.target.value, currentItem.descripcion)}
                    placeholder="01"
                  />

                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="item-descripcion">Descripción</Label>
                  <Input
                    id="item-descripcion"
                    value={currentItem.descripcion}
                    readOnly
                    className="bg-muted"
                    placeholder="Automático"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-cantidad">Cantidad (kg)</Label>
                  <Input
                  value={formData.cantidad}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cantidad: Number(e.target.value),
                    })
                  }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-valor">Valor $</Label>
                  <Input
                    id="number"
                    value={formData.valor_unitario}
                    onChange={(e) => 
                      setFormData({ 
                        ...formData,
                        valor_unitario: Number(e.target.value) })}
                    placeholder="1200"
                  />
                </div>
              </div>

              {items.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Item</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Valor kg</TableHead>
                        <TableHead>Valor D.</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.codigo}</TableCell>
                          <TableCell>{item.descripcion}</TableCell>
                          <TableCell>{item.cantidad} kg</TableCell>
                          <TableCell>${item.valorKg}</TableCell>
                          <TableCell>${item.valorDescuento}</TableCell>
                          <TableCell>${item.valorTotal}</TableCell>
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

            {/* Notes and Total */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="notas">Notas:</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </div>
              <div className="flex flex-col items-end justify-end space-y-4">
                <div className="text-right">
                  <Label className="text-muted-foreground">Valor Total</Label>
                  <p className="text-2xl font-bold text-foreground">
                    ${calculateTotalGeneral().toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setConfirmClearOpen(true)}>
                    Limpiar
                  </Button>
                  <Button onClick={handleSubmit}>
                    Agregar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error/Success Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={
              dialogType === "error" ? "text-destructive" : 
              dialogType === "success" ? "text-primary" : 
              "text-foreground"
            }>
              {dialogType === "error" ? "Error" : dialogType === "success" ? "Éxito" : "Alerta"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{dialogMessage}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Clear Dialog */}
      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alerta</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>¿Desea eliminar todos los campos?</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmClearOpen(false)}>No</Button>
            <Button onClick={handleClearAll}>Sí</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
