import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Users, Package, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const modules = [
    {
      title: "Gestionar Operarios",
      description: "Administra los operarios de tu empresa: agregar, editar, consultar y eliminar.",
      icon: Users,
      href: "/nomina/operarios",
      color: "bg-primary",
    },
    {
      title: "Movimientos",
      description: "Registra gastos de mantenimiento y entradas de materia prima.",
      icon: ArrowRightLeft,
      href: "/transacciones/movimientos",
      color: "bg-secondary",
    },
    {
      title: "Inventarios",
      description: "Control de productos y existencias en almacén.",
      icon: Package,
      href: "/inventarios/productos",
      color: "bg-muted-foreground",
    },
    {
      title: "Informes",
      description: "Genera reportes y análisis de la información del sistema.",
      icon: FileText,
      href: "/informes",
      color: "bg-accent-foreground",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bienvenido al Sistema de Gestión</h1>
          <p className="text-muted-foreground mt-2">
            SENA - Centro Latinoamericano de Especies Menores (CLEM)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((module) => (
            <Card 
              key={module.title} 
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => navigate(module.href)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <module.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full group-hover:bg-accent">
                  Acceder
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate("/nomina/operarios")}>
                <Users className="h-4 w-4 mr-2" />
                Nómina → Gestionar operarios (Alt+1)
              </Button>
              <Button variant="outline" onClick={() => navigate("/transacciones/movimientos")}>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transacciones → Movimientos (Alt+1)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Index;
