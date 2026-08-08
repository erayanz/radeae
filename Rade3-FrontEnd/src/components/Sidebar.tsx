import { useTranslation } from 'react-i18next';
import { LayoutDashboard, AlertCircle, BarChart3, Gamepad2, Settings, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeItem: string;
  onNavigate: (page: string) => void;
}

const Sidebar = ({ activeItem, onNavigate }: SidebarProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { id: 'events', icon: AlertCircle, label: t('events') },
    { id: 'statistics', icon: BarChart3, label: t('statistics') },
    // Simulator control is admin-only (backend enforces this too) — hide the
    // nav entry entirely for non-admins rather than showing a dead-end page.
    ...(isAdmin ? [{ id: 'simulation', icon: Gamepad2, label: t('simulation') }] : []),
    { id: 'settings', icon: Settings, label: t('settings') }
  ];

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 bg-brand-navy p-2 rounded-lg border border-brand-gold/20"
      >
        {isOpen ? <X className="w-6 h-6 text-brand-gold" /> : <Menu className="w-6 h-6 text-brand-gold" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 right-0 z-40
        w-64 bg-brand-navy border-l border-brand-gold/10
        min-h-[calc(100vh-73px)] lg:min-h-[calc(100vh-73px)]
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-gradient-to-l from-brand-gold to-brand-goldLight text-brand-deepNavy font-bold shadow-gold'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
