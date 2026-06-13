import { 
  ArrowRightLeft, 
  Package, 
  Settings, 
  FileText, 
  Search, 
  FolderOpen, 
  Users, 
  HelpCircle,
  LogOut,
  ChevronDown,
  ShoppingCart
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const menuItems = [
  { 
    title: "Transacciones", 
    icon: ArrowRightLeft,
    items: [
      { title: "Movimientos", url: "/transacciones/movimientos" },
      { title: "Proveedores", url: "/transacciones/proveedores" },
    ]
  },
  {
    title: "Inventarios", 
    icon: Package,
    items: [
      { title: "Gestión de Inventario", url: "/inventarios/productos" },
    ]
  },
  { 
    title: "Procesos", 
    icon: Settings,
    items: [
      { title: "Producción", url: "/procesos/produccion" },
    ]
  },
  { 
    title: "Informes", 
    icon: FileText,
    items: [
      { title: "Reportes", url: "/informes/reportes" },
    ]
  },
  {
    title: "Ventas",
    icon: ShoppingCart,
    items: [
      { title: "Registro de Ventas", url: "/ventas/registro" },
    ]
  },
  { 
    title: "Consulta", 
    icon: Search,
    items: []
  },
  { 
    title: "Documentos", 
    icon: FolderOpen,
    items: []
  },
  { 
    title: "Nómina", 
    icon: Users,
    items: [
      { title: "Gestionar mis operarios", url: "/nomina/operarios" },
      { title: "Análisis de mano de obra", url: "/nomina/analisis" },
    ]
  },
  { 
    title: "Ayuda", 
    icon: HelpCircle,
    items: []
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">G</span>
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-foreground">Gestión</h2>
              <p className="text-xs text-muted-foreground">SENA - CLEM</p>
            </div>
          )}
        </div>
      </div>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <Collapsible key={item.title} defaultOpen={item.items.some(i => location.pathname.includes(i.url))}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full justify-between hover:bg-accent">
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </div>
                        {!collapsed && item.items.length > 0 && (
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {item.items.length > 0 && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <NavLink 
                                to={subItem.url}
                                className={({ isActive }) => 
                                  `block px-4 py-2 text-sm rounded-md transition-colors ${
                                    isActive 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'text-foreground hover:bg-accent'
                                  }`
                                }
                              >
                                {subItem.title}
                              </NavLink>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}