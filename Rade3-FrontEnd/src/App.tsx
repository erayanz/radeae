import { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import StatisticsPage from './pages/StatisticsPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <ErrorBoundary>
      <ToastProvider>
        <div dir="rtl" className="dark">
          <div className="bg-gray-900 text-white min-h-screen">
            <Header />
            <div className="flex relative">
              <Sidebar activeItem={currentPage} onNavigate={setCurrentPage} />
              <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
                {currentPage === 'dashboard' && <HomePage />}
                {currentPage === 'events' && <EventsPage />}
                {currentPage === 'statistics' && <StatisticsPage />}
                {currentPage === 'settings' && (
                  <div className="text-center text-gray-400 mt-20">
                    <div className="text-6xl mb-4">⚙️</div>
                    <h2 className="text-2xl font-bold mb-2">صفحة الإعدادات</h2>
                    <p>قيد التطوير...</p>
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
