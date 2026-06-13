//import { useState } from "react";
import { Operario } from "@/types";
//import { initialOperarios } from "@/data/mockData";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Trash2, Edit, Plus } from "lucide-react";
import { toast } from "sonner";

import { useEffect, useState } from "react";


import { fetchOperarios } from "@/services/operarioApi";
import { createOperario } from "@/services/operarioApi";
import { updateOperario } from "@/services/operarioApi";
import { deleteOperario } from "@/services/operarioApi";


export default function OperariosPage() {
  const [operarios, setOperarios] = useState<Operario[]>([]);
  const [activeTab, setActiveTab] = useState("consultar");
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadOperarios = async () => {
      try {
        const data = await fetchOperarios();
        setOperarios(data);
      } catch (error) {
        toast.error("Error al cargar los operarios");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
  
    loadOperarios();
  }, []);
  

  // Form states
  const [formData, setFormData] = useState({
    identificacion: "",
    nombre: "",
    apellidos: "",
    edad: "",
  });
  
  // Edit states
  const [editingOperario, setEditingOperario] = useState<Operario | null>(null);
  const [editFormData, setEditFormData] = useState({
    identificacion: "",
    nombre: "",
    apellidos: "",
    edad: "",
  });
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"error" | "success">("error");
  const [dialogMessage, setDialogMessage] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [operarioToDelete, setOperarioToDelete] = useState<Operario | null>(null);

  const showDialog = (type: "error" | "success", message: string) => {
    setDialogType(type);
    setDialogMessage(message);
    setDialogOpen(true);
  };

  const validateForm = (data: typeof formData): string | null => {
    if (!data.identificacion || !data.nombre || !data.apellidos || !data.edad) {
      return "Campos vacíos, intenta nuevamente";
    }

    if (!/^\d+$/.test(data.identificacion)) {
      return "Datos erróneos, intenta nuevamente";
    }

    const edad = parseInt(data.edad);
    if (isNaN(edad) || edad < 18 || edad > 60) {
      return "Nuestros operarios deben tener mínimo 18 o máximo 60 para ser inscritos";
    }

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(data.nombre) || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(data.apellidos)) {
      return "Datos erróneos, intenta nuevamente";
    }

    return null;
  };
  const handleAddOperario = async () => {
    const error = validateForm(formData);
    if (error) {
      showDialog("error", error);
      return;
    }
  
    try {
      const newOperario = await createOperario({
        identificacion: formData.identificacion,
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        edad: parseInt(formData.edad),
      });
  
      setOperarios(prev => [...prev, newOperario]);
      setFormData({ identificacion: "", nombre: "", apellidos: "", edad: "" });
  
      showDialog("success", "Operario registrado correctamente");
    } catch (error: any) {
      if (error?.errors?.identificacion) {
        showDialog("error", "La identificación ya está registrada");
      } else {
        showDialog("error", "Error al registrar el operario");
      }
    }
  };
  
  const handleDeleteClick = (operario: Operario) => {
    setOperarioToDelete(operario);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!operarioToDelete) return;
  
    try {
      await deleteOperario(operarioToDelete.id);
  
      setOperarios(prev =>
        prev.filter(op => op.id !== operarioToDelete.id)
      );
  
      toast.success("Operario eliminado correctamente");
    } catch (error) {
      toast.error("Error al eliminar el operario");
    } finally {
      setDeleteConfirmOpen(false);
      setOperarioToDelete(null);
    }
  };
  const handleEditClick = (operario: Operario) => {
    setEditingOperario(operario);
    setEditFormData({
      identificacion: operario.identificacion,
      nombre: operario.nombre,
      apellidos: operario.apellidos,
      edad: operario.edad.toString(),
    });
    setActiveTab("editar");
  };

  const handleUpdateOperario = async () => {
    if (!editingOperario || !editingOperario.id) {
      showDialog("error", "Operario no válido para actualizar");
      return;
    }
  
    const error = validateForm(editFormData);
    if (error) {
      showDialog("error", error);
      return;
    }
    console.log("Editing operario:", editingOperario);

    try {
      const updated = await updateOperario(editingOperario.id, {
        identificacion: editFormData.identificacion,
        nombre: editFormData.nombre,
        apellidos: editFormData.apellidos,
        edad: parseInt(editFormData.edad),
      });
  
      setOperarios(prev =>
        prev.map(op => (op.id === updated.id ? updated : op))
      );
  
      setEditingOperario(null);
      setActiveTab("consultar");
      showDialog("success", "Operario actualizado correctamente");
    } catch (error) {
      showDialog("error", "Error al actualizar el operario");
    }
  };
  
  

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Gestionar mis operarios</h2>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-1 mb-6">
                <TabsTrigger value="consultar">Consultar/Borrar/Editar</TabsTrigger>                               
              </TabsList>

              <TabsContent value="consultar" className="space-y-9">
              <div className="grid grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="identificacion">Identificación</Label>
                    <Input
                      id="identificacion"
                      value={formData.identificacion}
                      onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                      placeholder="Ingrese identificación"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ingrese nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellidos">Apellidos</Label>
                    <Input
                      id="apellidos"
                      value={formData.apellidos}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                      placeholder="Ingrese apellidos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edad">Edad</Label>
                    <Input
                      id="edad"
                      type="number"
                      value={formData.edad}
                      onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                      placeholder="Edad"
                    />
                  </div>
              </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Identificación</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Apellidos</TableHead>
                        <TableHead>Edad</TableHead>
                        <TableHead className="w-24">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operarios.map((operario) => (
                        <TableRow key={operario.id}>
                          <TableCell>{operario.identificacion}</TableCell>
                          <TableCell>{operario.nombre}</TableCell>
                          <TableCell>{operario.apellidos}</TableCell>
                          <TableCell>{operario.edad}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(operario)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(operario)}
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
                  <div className="flex justify-end">
                  <Button onClick={handleAddOperario} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar Operario
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="agregar" className="space-y-4">
                <div className="grid grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="identificacion">Identificación</Label>
                    <Input
                      id="identificacion"
                      value={formData.identificacion}
                      onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                      placeholder="Ingrese identificación"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ingrese nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellidos">Apellidos</Label>
                    <Input
                      id="apellidos"
                      value={formData.apellidos}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                      placeholder="Ingrese apellidos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edad">Edad</Label>
                    <Input
                      id="edad"
                      type="number"
                      value={formData.edad}
                      onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                      placeholder="Edad"
                    />
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Identificación</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Apellidos</TableHead>
                        <TableHead>Edad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operarios.map((operario) => (
                        <TableRow key={operario.id}>
                          <TableCell>{operario.identificacion}</TableCell>
                          <TableCell>{operario.nombre}</TableCell>
                          <TableCell>{operario.apellidos}</TableCell>
                          <TableCell>{operario.edad}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleAddOperario} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar Operario
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="editar" className="space-y-4">
                {editingOperario ? (
                  <>
                    <div className="grid grid-cols-4 gap-4 items-end">
                      <div className="space-y-2">
                        <Label htmlFor="edit-identificacion">Identificación</Label>
                        <Input
                          id="edit-identificacion"
                          value={editFormData.identificacion}
                          onChange={(e) => setEditFormData({ ...editFormData, identificacion: e.target.value })}
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
                      <div className="space-y-2">
                        <Label htmlFor="edit-apellidos">Apellidos</Label>
                        <Input
                          id="edit-apellidos"
                          value={editFormData.apellidos}
                          onChange={(e) => setEditFormData({ ...editFormData, apellidos: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-edad">Edad</Label>
                        <Input
                          id="edit-edad"
                          type="number"
                          value={editFormData.edad}
                          onChange={(e) => setEditFormData({ ...editFormData, edad: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {
                        setEditingOperario(null);
                        setActiveTab("consultar");
                      }}>
                        Cancelar
                      </Button>
                      <Button type="button" onClick={handleUpdateOperario}>
                        Guardar Cambios
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Seleccione un operario desde la pestaña "Consultar/Borrar" para editarlo
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
            <p>¿Está seguro de eliminar al operario {operarioToDelete?.nombre} {operarioToDelete?.apellidos}?</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button variant="destructive" type="button" onClick={confirmDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
