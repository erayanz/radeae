import { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import StatisticsPage from './pages/StatisticsPage';
import SimulationPage from './pages/SimulationPage';
import UsersPage from './pages/UsersPage';
import LoginPage from './pages/LoginPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SiteProvider } from './context/SiteContext';

function DashboardShell() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <div className="bg-brand-deepNavy text-white/90 min-h-screen">
      <Header />
      <div className="flex relative">
        <Sidebar activeItem={currentPage} onNavigate={setCurrentPage} />
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {currentPage === 'dashboard' && <HomePage />}
          {currentPage === 'events' && <EventsPage />}
          {currentPage === 'statistics' && <StatisticsPage />}
          {currentPage === 'simulation' && <SimulationPage />}
          {currentPage === 'settings' && <UsersPage />}
        </main>
      </div>
    </div>
  );
}

function AppContent() {
  const { user } = useAuth();
  return user ? <SiteProvider><DashboardShell /></SiteProvider> : <LoginPage />;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <div dir="rtl" className="dark">
            <AppContent />
          </div>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
