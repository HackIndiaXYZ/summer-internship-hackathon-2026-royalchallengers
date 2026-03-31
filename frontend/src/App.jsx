import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ScanPage from './pages/ScanPage';
import AnalysisReport from './pages/AnalysisReport';
import ProfileSetup from './pages/ProfileSetup';
import HistoryPage from './pages/HistoryPage';
import ProtectedRoute from './components/ProtectedRoute';

import Sidebar from './components/Sidebar';
import { useLocation } from 'react-router-dom';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(window.innerWidth >= 1024);
  const location = useLocation();

  // Pages that should show the sidebar
  const internalPages = ['/dashboard', '/scan', '/history', '/profile-setup', '/analysis'];
  const showSidebar = internalPages.some(path => location.pathname.startsWith(path));

  // Auto-close on small screens
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on navigation (mobile only)
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary/10 selection:text-primary" style={{ width: '100%', maxWidth: '100%', position: 'relative', overscrollBehaviorX: 'none' }}>
      <Navbar
        onLogoClick={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <Toaster position="top-right" />

      <div className="flex" style={{ width: '100%', maxWidth: '100%', position: 'relative', overscrollBehaviorX: 'none' }}>
        {showSidebar && (
          <Sidebar
            isOpen={isSidebarOpen}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        )}

        <main
          className={`flex-1 transition-all duration-300 pt-20 min-w-0 ${showSidebar
            ? `px-4 sm:px-6 md:px-8 ${isSidebarOpen ? 'lg:pl-[280px]' : 'lg:pl-[88px]'}`
            : ''
            }`}
          style={{ width: '100%', maxWidth: '100%', position: 'relative', overscrollBehaviorX: 'none' }}
        >
          <div className="w-full max-w-full min-h-[calc(100vh-80px)]">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/analysis/:id" element={<AnalysisReport />} />
              <Route path="/analysis" element={<AnalysisReport />} />
              <Route path="/report/:id" element={<AnalysisReport />} />
              <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

const AppWrapper = () => (
  <AuthProvider>
    <Router>
      <App />
    </Router>
  </AuthProvider>
);

export default AppWrapper;


