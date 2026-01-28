import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { PageLoader } from "@/components/ui/page-loader";
import Home from "./pages/Home";
import About from "./pages/About";
import CorporateCare from "./pages/CorporateCare";
import LegalResources from "./pages/LegalResources";
import Volunteer from "./pages/Volunteer";
import Donate from "./pages/Donate";
import Contact from "./pages/Contact";
import Games from "./pages/Games";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOverview from "./pages/admin/Overview";
import AdminMessages from "./pages/admin/Messages";
import AdminReports from "./pages/admin/Reports";
import AdminVolunteers from "./pages/admin/Volunteers";
import AdminPartners from "./pages/admin/Partners";
import AdminDonations from "./pages/admin/Donations";
import AdminProjectsEvents from "./pages/admin/ProjectsEvents";
import AdminSettings from "./pages/admin/Settings";
import AdminTeamManagement from "./pages/admin/TeamManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <PageLoader />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/corporate-care" element={<CorporateCare />} />
          <Route path="/legal-resources" element={<LegalResources />} />
          <Route path="/volunteer" element={<Volunteer />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/games" element={<Games />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />}>
            <Route index element={<AdminOverview />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="volunteers" element={<AdminVolunteers />} />
            <Route path="partners" element={<AdminPartners />} />
            <Route path="donations" element={<AdminDonations />} />
            <Route path="projects" element={<AdminProjectsEvents />} />
            <Route path="team" element={<AdminTeamManagement />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
