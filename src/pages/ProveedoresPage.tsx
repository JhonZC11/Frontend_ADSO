import { useState } from "react";
import { Proveedor } from "@/types";
import { proveedores as initialProveedores } from "@/data/mockData";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Edit, Plus } from "lucide-react";
import { toast } from "sonner";
import { createProveedor } from "@/services/proveedorApi";

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>(initialProveedores);
  const [activeTab, setActiveTab] = useState("consultar");
  
  // Form states
  const [formData, setFormData] = useState({
    nit: "",
    nombre: "",
  });
  
  // Edit states
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [editFormData, setEditFormData] = useState({
    nit: "",
    nombre: "",
  });
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"error" | "success">("error");
  const [dialogMessage, setDialogMessage] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [proveedorToDelete, setProveedorToDelete] = useState<Proveedor | null>(null);

  const showDialog = (type: "error" | "success", message: string) => {
    setDialogType(type);
    setDialogMessage(message);
    setDialogOpen(true);
  };

  const validateForm = (data: typeof formData): string | null => {
    if (!data.nit || !data.nombre) {
      return "Campos vacíos, intenta nuevamente";
    }

    if (!/^[\d-]+$/.test(data.nit)) {
      return "NIT inválido, debe contener solo números y guiones";
    }

    if (data.nombre.trim().length < 2) {
      return "El nombre debe tener al menos 2 caracteres";
    }

    return null;
  };

  const handleAddProveedor = async () => {
    const error = validateForm(formData);
    if (error) {
      showDialog("error", error);
      return;
    }
  
    try {
      const newOperario = await createProveedor({
        nit: formData.nit,
        nombre: formData.nombre
      });
  
      setProveedores(prev => [...prev, newOperario]);
      setFormData({ nit: "", nombre: ""});
  
      showDialog("success", "Operario registrado correctamente");
    } catch (error: any) {
      if (error?.errors?.identificacion) {
        showDialog("error", "La identificación ya está registrada");
      } else {
        showDialog("error", "Error al registrar el operario");
      }
    }
  };

  const handleDeleteClick = (proveedor: Proveedor) => {
    setProveedorToDelete(proveedor);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (proveedorToDelete) {
      setProveedores(proveedores.filter(p => p.id !== proveedorToDelete.id));
      toast.success("Proveedor eliminado correctamente");
    }
    setDeleteConfirmOpen(false);
    setProveedorToDelete(null);
  };

  const handleEditClick = (proveedor: Proveedor) => {
    setEditingProveedor(proveedor);
    setEditFormData({
      nit: proveedor.nit,
      nombre: proveedor.nombre,
    });
    setActiveTab("editar");
  };

  const handleUpdateProveedor = () => {
    if (!editingProveedor) return;

    const error = validateForm(editFormData);
    if (error) {
      showDialog("error", error);
      return;
    }

    setProveedores(proveedores.map(p => 
      p.id === editingProveedor.id 
        ? {
            ...p,
            nit: editFormData.nit,
            nombre: editFormData.nombre,
          }
        : p
    ));
    
    setEditingProveedor(null);
    setEditFormData({ nit: "", nombre: "" });
    showDialog("success", "Proveedor actualizado correctamente");
    setActiveTab("consultar");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Gestionar Proveedores</h2>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="consultar">Consultar/Borrar</TabsTrigger>
                <TabsTrigger value="agregar">Agregar</TabsTrigger>
                <TabsTrigger value="editar">Editar</TabsTrigger>
              </TabsList>

              <TabsContent value="consultar" className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>NIT</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="w-24">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proveedores.map((proveedor) => (
                        <TableRow key={proveedor.id}>
                          <TableCell>{proveedor.nit}</TableCell>
                          <TableCell>{proveedor.nombre}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(proveedor)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(proveedor)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="agregar" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="nit">NIT</Label>
                    <Input
                      id="nit"
                      value={formData.nit}
                      onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                      placeholder="Ej: 800551984-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Nombre del proveedor"
                    />
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>NIT</TableHead>
                        <TableHead>Nombre</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proveedores.map((proveedor) => (
                        <TableRow key={proveedor.id}>
                          <TableCell>{proveedor.nit}</TableCell>
                          <TableCell>{proveedor.nombre}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleAddProveedor} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar Proveedor
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="editar" className="space-y-4">
                {editingProveedor ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 items-end">
                      <div className="space-y-2">
                        <Label htmlFor="edit-nit">NIT</Label>
                        <Input
                          id="edit-nit"
                          value={editFormData.nit}
                          onChange={(e) => setEditFormData({ ...editFormData, nit: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-nombre">Nombre</Label>
                        <Input
                          id="edit-nombre"
                          value={editFormData.nombre}
                          onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {
                        setEditingProveedor(null);
                        setActiveTab("consultar");
                      }}>
                        Cancelar
                      </Button>
                      <Button onClick={handleUpdateProveedor}>
                        Guardar Cambios
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Seleccione un proveedor desde la pestaña "Consultar/Borrar" para editarlo
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Error/Success Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={dialogType === "error" ? "text-destructive" : "text-primary"}>
              {dialogType === "error" ? "Error" : "Éxito"}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>¿Está seguro de eliminar al proveedor {proveedorToDelete?.nombre}?</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
