import { useState, useEffect } from 'react';
import { Play, Square, User, Car, Volume2, PawPrint } from 'lucide-react';

const SIMULATOR_API = import.meta.env.VITE_SIMULATOR_URL || 'http://localhost:5001';

console.log('🎮 Simulator URL:', SIMULATOR_API);

interface SimulatorState {
  isRunning: boolean;
  totalEventsGenerated: number;
  lastEventTime: string | null;
}

const SimulatorControl = () => {
  const [state, setState] = useState<SimulatorState | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchState = async () => {
    try {
      const response = await fetch(`${SIMULATOR_API}/api/simulator/state`);
      const data = await response.json();
      setState(data.data);
    } catch (error) {
      console.error('خطأ في جلب حالة المحاكاة:', error);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    setLoading(true);
    try {
      await fetch(`${SIMULATOR_API}/api/simulator/start`, { method: 'POST' });
      await fetchState();
    } catch (error) {
      console.error('خطأ في بدء المحاكاة:', error);
    }
    setLoading(false);
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await fetch(`${SIMULATOR_API}/api/simulator/stop`, { method: 'POST' });
      await fetchState();
    } catch (error) {
      console.error('خطأ في إيقاف المحاكاة:', error);
    }
    setLoading(false);
  };

  const triggerEvent = async (eventType: string, riskLevel: string) => {
    try {
      await fetch(`${SIMULATOR_API}/api/simulator/trigger-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, riskLevel })
      });
      await fetchState();
    } catch (error) {
      console.error('خطأ في إرسال الحدث:', error);
    }
  };

  if (!state) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <div className="text-center text-gray-400">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6 mb-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white mb-2">
            🎮 لوحة تحكم محاكي المجسات
          </h2>
          <p className="text-gray-400 text-sm">
            التحكم في المحاكاة وتوليد الأحداث التجريبية
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleStart}
            disabled={state.isRunning || loading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium transition-all disabled:cursor-not-allowed text-sm lg:text-base"
          >
            <Play className="w-4 lg:w-5 h-4 lg:h-5" />
            <span className="hidden sm:inline">بدء المحاكاة</span>
            <span className="sm:hidden">بدء</span>
          </button>
          
          <button
            onClick={handleStop}
            disabled={!state.isRunning || loading}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium transition-all disabled:cursor-not-allowed text-sm lg:text-base"
          >
            <Square className="w-4 lg:w-5 h-4 lg:h-5" />
            <span className="hidden sm:inline">إيقاف المحاكاة</span>
            <span className="sm:hidden">إيقاف</span>
          </button>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-6 mt-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
          <h3 className="text-base lg:text-lg font-bold text-white flex items-center gap-2">
            🎯 توليد أحداث محددة (للعرض التوضيحي)
          </h3>
          
          {/* ⚠️ الملاحظة المطلوبة بالأحمر */}
          <div className="bg-red-900/30 border-2 border-red-600 rounded-lg px-4 py-2 max-w-full lg:max-w-md">
            <p className="text-red-400 text-xs lg:text-sm font-semibold flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>
                اضغط على عناصر المحاكاة لتظهر على الخريطة 
                <span className="block mt-1 text-red-300">
                  (سيتم استبدال المحاكاة بالمستشعر الفعلي المزروع في مناطق المحميات)
                </span>
              </span>
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
          <button
            onClick={() => triggerEvent('human', 'high')}
            className="flex flex-col items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white p-3 lg:p-4 rounded-lg transition-all disabled:cursor-not-allowed"
          >
            <User className="w-6 lg:w-8 h-6 lg:h-8" />
            <span className="text-xs lg:text-sm font-medium">إنسان (عالي)</span>
          </button>
          
          <button
            onClick={() => triggerEvent('vehicle', 'high')}
            className="flex flex-col items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white p-3 lg:p-4 rounded-lg transition-all disabled:cursor-not-allowed"
          >
            <Car className="w-6 lg:w-8 h-6 lg:h-8" />
            <span className="text-xs lg:text-sm font-medium">مركبة (عالي)</span>
          </button>
          
          <button
            onClick={() => triggerEvent('animal', 'low')}
            className="flex flex-col items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white p-3 lg:p-4 rounded-lg transition-all disabled:cursor-not-allowed"
          >
            <PawPrint className="w-6 lg:w-8 h-6 lg:h-8" />
            <span className="text-xs lg:text-sm font-medium">حيوان (منخفض)</span>
          </button>
          
          <button
            onClick={() => triggerEvent('noise', 'medium')}
            className="flex flex-col items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white p-3 lg:p-4 rounded-lg transition-all disabled:cursor-not-allowed"
          >
            <Volume2 className="w-6 lg:w-8 h-6 lg:h-8" />
            <span className="text-xs lg:text-sm font-medium">ضوضاء (متوسط)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulatorControl;
