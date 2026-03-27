import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Withdraw from "./pages/Withdraw";
import TransactionHistory from "./pages/TransactionHistory";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          {/* Removed user routes as website is now admin-only */}
          <Route path="*" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
