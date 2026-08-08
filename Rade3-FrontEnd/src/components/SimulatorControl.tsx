import { useState, useEffect } from 'react';
import { Play, Square, User, Car, Volume2, PawPrint } from 'lucide-react';
import { httpClient } from '../api/httpClient';
import { useAuth } from '../context/AuthContext';

// Routed through the main backend's /api/v1/simulator/* proxy (not this
// service's own port directly) so requireRole('admin') on the backend can
// gate access — httpClient automatically attaches the logged-in user's JWT.
// See Rade3-backend/src/controllers/simulatorController.ts.

interface SimulatorState {
  isRunning: boolean;
  totalEventsGenerated: number;
  lastEventTime: string | null;
}

const SimulatorControl = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [state, setState] = useState<SimulatorState | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchState = async () => {
    try {
      const response = await httpClient.get('/simulator/state');
      setState(response.data.data);
    } catch (error) {
      console.error('خطأ في جلب حالة المحاكاة:', error);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleStart = async () => {
    setLoading(true);
    try {
      await httpClient.post('/simulator/start');
      await fetchState();
    } catch (error) {
      console.error('خطأ في بدء المحاكاة:', error);
    }
    setLoading(false);
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await httpClient.post('/simulator/stop');
      await fetchState();
    } catch (error) {
      console.error('خطأ في إيقاف المحاكاة:', error);
    }
    setLoading(false);
  };

  const triggerEvent = async (eventType: string, riskLevel: string) => {
    try {
      await httpClient.post('/simulator/trigger-event', { eventType, riskLevel });
      await fetchState();
    } catch (error) {
      console.error('خطأ في إرسال الحدث:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-brand-navy border border-brand-graphite/60 rounded-lg p-6 mb-6 text-center text-white/50">
        هذه الصفحة متاحة للمدير فقط
      </div>
    );
  }

  if (!state) {
    return (
      <div className="bg-brand-navy border border-brand-graphite/60 rounded-lg p-6 mb-6">
        <div className="text-center text-white/50">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="bg-brand-navy border border-brand-graphite/60 rounded-lg p-4 lg:p-6 mb-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white mb-2">
            🎮 لوحة تحكم محاكي المجسات
          </h2>
          <p className="text-white/50 text-sm">
            التحكم في المحاكاة وتوليد الأحداث التجريبية
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleStart}
            disabled={state.isRunning || loading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-brand-graphite text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium transition-all disabled:cursor-not-allowed text-sm lg:text-base"
          >
            <Play className="w-4 lg:w-5 h-4 lg:h-5" />
            <span className="hidden sm:inline">بدء المحاكاة</span>
            <span className="sm:hidden">بدء</span>
          </button>

          <button
            onClick={handleStop}
            disabled={!state.isRunning || loading}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-brand-graphite text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium transition-all disabled:cursor-not-allowed text-sm lg:text-base"
          >
            <Square className="w-4 lg:w-5 h-4 lg:h-5" />
            <span className="hidden sm:inline">إيقاف المحاكاة</span>
            <span className="sm:hidden">إيقاف</span>
          </button>
        </div>
      </div>

      <div className="border-t border-brand-gold/10 pt-6 mt-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
          <h3 className="text-base lg:text-lg font-bold text-white flex items-center gap-2">
            🎯 توليد أحداث محددة (للعرض التوضيحي)
          </h3>

          {/* ⚠️ الملاحظة المطلوبة بالأحمر */}
          <div className="bg-red-950/40 border-2 border-red-600/60 rounded-lg px-4 py-2 max-w-full lg:max-w-md">
            <p className="text-red-400 text-xs lg:text-sm font-semibold flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>
                اضغط على عناصر المحاكاة لتظهر على الخريطة
                <span className="block mt-1 text-red-300/80">
                  (سيتم استبدال المحاكاة بالمستشعر الفعلي المزروع في مناطق المحميات)
                </span>
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
          <button
            onClick={() => triggerEvent('human', 'high')}
            className="flex flex-col items-center gap-2 bg-brand-navyLight hover:bg-brand-graphite border border-brand-gold/10 hover:border-brand-gold/30 text-white p-3 lg:p-4 rounded-lg transition-all"
          >
            <User className="w-6 lg:w-8 h-6 lg:h-8 text-brand-goldLight" />
            <span className="text-xs lg:text-sm font-medium">إنسان (عالي)</span>
          </button>

          <button
            onClick={() => triggerEvent('vehicle', 'high')}
            className="flex flex-col items-center gap-2 bg-brand-navyLight hover:bg-brand-graphite border border-brand-gold/10 hover:border-brand-gold/30 text-white p-3 lg:p-4 rounded-lg transition-all"
          >
            <Car className="w-6 lg:w-8 h-6 lg:h-8 text-brand-goldLight" />
            <span className="text-xs lg:text-sm font-medium">مركبة (عالي)</span>
          </button>

          <button
            onClick={() => triggerEvent('animal', 'low')}
            className="flex flex-col items-center gap-2 bg-brand-navyLight hover:bg-brand-graphite border border-brand-gold/10 hover:border-brand-gold/30 text-white p-3 lg:p-4 rounded-lg transition-all"
          >
            <PawPrint className="w-6 lg:w-8 h-6 lg:h-8 text-brand-goldLight" />
            <span className="text-xs lg:text-sm font-medium">حيوان (منخفض)</span>
          </button>

          <button
            onClick={() => triggerEvent('noise', 'medium')}
            className="flex flex-col items-center gap-2 bg-brand-navyLight hover:bg-brand-graphite border border-brand-gold/10 hover:border-brand-gold/30 text-white p-3 lg:p-4 rounded-lg transition-all"
          >
            <Volume2 className="w-6 lg:w-8 h-6 lg:h-8 text-brand-goldLight" />
            <span className="text-xs lg:text-sm font-medium">ضوضاء (متوسط)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulatorControl;
