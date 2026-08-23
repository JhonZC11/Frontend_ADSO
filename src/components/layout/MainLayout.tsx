import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const handleLogout = () => {
    // Aquí también podrías limpiar el token/sesión, por ejemplo:
    // localStorage.removeItem("token");

    navigate("/login", { replace: true });
  };


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b border-border bg-card px-4 w-full">
            <SidebarTrigger className="mr-4" />
            <a href="/"><h1 className="text-lg font-semibold text-foreground">Sistema de Gestión CLEM</h1></a>
            <button
              onClick={handleLogout}
              className="flex items-right gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </header>
          <div className="flex-1 p-6 bg-background overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

