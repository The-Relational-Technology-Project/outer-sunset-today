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
import NotFound from "./pages/NotFound";
import WorkInProgressBanner from "./components/WorkInProgressBanner";
import { MyPlanProvider } from "./contexts/MyPlanContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <MyPlanProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <WorkInProgressBanner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/about" element={<About />} />
            <Route path="/my-plan" element={<PlanMyDay />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </MyPlanProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
