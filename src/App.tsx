import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Calendar from "./pages/Calendar";
import Submit from "./pages/Submit";
import About from "./pages/About";
import PlanMyDay from "./pages/PlanMyDay";
import Admin from "./pages/Admin";
import PrivacyTerms from "./pages/PrivacyTerms";
import Unsubscribe from "./pages/Unsubscribe";
import Updates from "./pages/Updates";
import NotFound from "./pages/NotFound";
import { MyPlanProvider } from "./contexts/MyPlanContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <MyPlanProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/about" element={<About />} />
            <Route path="/my-plan" element={<PlanMyDay />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/privacy-terms" element={<PrivacyTerms />} />
            <Route path="/unsubscribe/:token" element={<Unsubscribe />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </MyPlanProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
