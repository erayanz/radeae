import { useTranslation } from 'react-i18next';
import { Shield, User, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

const Header = () => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-4 lg:px-6 py-4">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-lg">
            <Shield className="w-6 lg:w-8 h-6 lg:h-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white">{t('appName')}</h1>
            <p className="text-xs lg:text-sm text-gray-400">{t('appSubtitle')}</p>
          </div>
        </div>

        {/* Center - Time and Date */}
        <div className="flex items-center gap-2 text-gray-300">
          <Clock className="w-4 lg:w-5 h-4 lg:h-5" />
          <div className="text-center">
            <div className="text-lg lg:text-xl font-bold">{formatTime(currentTime)}</div>
            <div className="text-xs text-gray-400 hidden lg:block">{formatDate(currentTime)}</div>
          </div>
        </div>

        {/* Right - User and Status */}
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs lg:text-sm text-gray-300 hidden lg:inline">
              {t('systemStatus')}: {t('active')}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-gray-700 px-3 lg:px-4 py-2 rounded-lg">
            <User className="w-4 lg:w-5 h-4 lg:h-5 text-gray-300" />
            <div className="hidden lg:block">
              <div className="text-sm font-medium text-white">{t('admin')}</div>
              <div className="text-xs text-gray-400">أحمد السعيد</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
