import { useTranslation } from 'react-i18next';
import { User, Clock, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير النظام',
  operator: 'مشغّل'
};

const Header = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { sites, currentSite, setCurrentSiteId } = useSite();
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
    <header className="bg-brand-navy border-b border-brand-gold/20 px-4 lg:px-6 py-4">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <img
            src="/logo/radei-symbol-gold.png"
            alt="RADEI"
            className="w-9 lg:w-11 h-9 lg:h-11 object-contain"
          />
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-wide">{t('appName')}</h1>
            <p className="text-xs lg:text-sm text-brand-steel font-display uppercase tracking-widest">{t('appSubtitle')}</p>
          </div>
        </div>

        {/* Site Switcher */}
        {sites.length > 1 && (
          <select
            value={currentSite?.id ?? ''}
            onChange={(e) => setCurrentSiteId(e.target.value)}
            className="bg-brand-navyLight text-white px-3 py-2 rounded-lg border border-brand-graphite focus:border-brand-gold focus:outline-none text-sm"
          >
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.nameAr}</option>
            ))}
          </select>
        )}

        {/* Center - Time and Date */}
        <div className="flex items-center gap-2 text-white/70">
          <Clock className="w-4 lg:w-5 h-4 lg:h-5 text-brand-gold" />
          <div className="text-center">
            <div className="text-lg lg:text-xl font-bold font-tactical text-brand-goldLight">{formatTime(currentTime)}</div>
            <div className="text-xs text-white/40 hidden lg:block">{formatDate(currentTime)}</div>
          </div>
        </div>

        {/* Right - User and Status */}
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
            <span className="text-xs lg:text-sm text-white/70 hidden lg:inline">
              {t('systemStatus')}: {t('active')}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-brand-navyLight border border-brand-gold/10 px-3 lg:px-4 py-2 rounded-lg">
            <User className="w-4 lg:w-5 h-4 lg:h-5 text-brand-gold" />
            <div className="hidden lg:block">
              <div className="text-sm font-medium text-white">{user ? ROLE_LABELS[user.role] || user.role : t('admin')}</div>
              <div className="text-xs text-white/40">{user?.username}</div>
            </div>
            <button
              onClick={logout}
              title="تسجيل الخروج"
              className="text-white/40 hover:text-red-400 transition-colors mr-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
