import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import OperariosPage from "./pages/OperariosPage";
import MovimientosPage from "./pages/MovimientosPage";
import ProveedoresPage from "./pages/ProveedoresPage";
import InventariosPage from "./pages/InventariosPage";
import ProcesosPage from "./pages/ProcesosPage";
import AnalisisNominaPage from "./pages/AnalisisNominaPage";
import InformesPage from "./pages/InformesPage";
import VentasPage from "./pages/VentasPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Index />} />
          <Route path="/nomina/operarios" element={<OperariosPage />} />
          <Route path="/nomina/analisis" element={<AnalisisNominaPage />} />
          <Route path="/transacciones/movimientos" element={<MovimientosPage />} />
          <Route path="/transacciones/proveedores" element={<ProveedoresPage />} />
          <Route path="/inventarios/productos" element={<InventariosPage />} />
          <Route path="/procesos/produccion" element={<ProcesosPage />} />
          <Route path="/informes/reportes" element={<InformesPage />} />
          <Route path="/ventas/registro" element={<VentasPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
