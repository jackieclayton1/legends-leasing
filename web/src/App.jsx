import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import ChoosePath from '@/pages/ChoosePath';
import ListWizard from '@/pages/ListWizard';
import Browse from '@/pages/Browse';
import ListingDetail from '@/pages/ListingDetail';
import Dashboard from '@/pages/Dashboard';
import AppShell from '@/components/AppShell';
import RequireAccess from '@/components/RequireAccess';
import { AuthProvider } from '@/lib/AuthContext';
import { AppProvider } from '@/lib/AppContext';

const AppRoutes = () => {
  return (
    <Routes>
    {/* Add your page Route elements here */}
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Navigate to="/login" replace />} />
    <Route element={<AppShell />}>
      <Route path="/browse" element={<Browse />} />
      <Route path="/listings/:id" element={<ListingDetail />} />
      <Route path="/choose" element={<RequireAccess><ChoosePath /></RequireAccess>} />
      <Route path="/list" element={<RequireAccess><ListWizard /></RequireAccess>} />
      <Route path="/dashboard" element={<RequireAccess><Dashboard /></RequireAccess>} />
    </Route>
    <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <AppProvider>
          <Router>
            <ScrollToTop />
            <AppRoutes />
          </Router>
          <Toaster />
        </AppProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App