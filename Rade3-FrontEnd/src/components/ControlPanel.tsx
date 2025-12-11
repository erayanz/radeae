import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Power, Trash2 } from 'lucide-react';
import { eventsApi } from '../api/eventsApi';
import { useToast } from '../context/ToastContext';

interface ControlPanelProps {
  onRefresh: () => void;
  onFilterChange: (filters: any) => void;
  onClearEvents?: () => void;
}

const ControlPanel = ({ onRefresh, onFilterChange, onClearEvents }: ControlPanelProps) => {
  const { t: _t } = useTranslation()
  const { toast } = useToast();
  const [systemActive, setSystemActive] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [eventType, setEventType] = useState('all');
  const [riskLevel, setRiskLevel] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleFilterChange = (
    type: 'timeRange' | 'eventType' | 'riskLevel',
    value: string
  ) => {
    const newFilters = { timeRange, eventType, riskLevel };
    
    if (type === 'timeRange') {
      setTimeRange(value);
      newFilters.timeRange = value;
    } else if (type === 'eventType') {
      setEventType(value);
      newFilters.eventType = value;
    } else if (type === 'riskLevel') {
      setRiskLevel(value);
      newFilters.riskLevel = value;
    }

    onFilterChange(newFilters);
  };

  const handleClearEvents = async () => {
    if (!window.confirm('هل أنت متأكد من مسح جميع الأحداث؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    setClearing(true);
    try {
      await eventsApi.clearAllEvents();
      toast?.success('تم مسح جميع الأحداث بنجاح');
      onClearEvents?.();
      onRefresh();
    } catch (error) {
      toast?.error('فشل مسح الأحداث');
      console.error('Error clearing events:', error);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <h2 className="text-xl lg:text-2xl font-bold text-white">لوحة التحكم</h2>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>تحديث</span>
          </button>
          
          <button
            onClick={handleClearEvents}
            disabled={clearing}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span>{clearing ? 'جاري المسح...' : 'مسح الكل'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        {/* الصف الأول - حالة النظام */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSystemActive(!systemActive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm lg:text-base ${
              systemActive
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            <Power className="w-4 lg:w-5 h-4 lg:h-5" />
            <span className="hidden sm:inline">{systemActive ? 'النظام نشط' : 'النظام متوقف'}</span>
            <span className="sm:hidden">{systemActive ? 'نشط' : 'متوقف'}</span>
          </button>
        </div>

        {/* الصف الثاني - الفلاتر */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* مرشح النطاق الزمني */}
          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-xs">النطاق الزمني:</label>
            <select
              value={timeRange}
              onChange={(e) => handleFilterChange('timeRange', e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-sm"
            >
              <option value="all">كل الوقت</option>
              <option value="hour">آخر ساعة</option>
              <option value="day">آخر 24 ساعة</option>
              <option value="week">آخر أسبوع</option>
            </select>
          </div>

          {/* مرشح نوع الحدث */}
          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-xs">نوع الحدث:</label>
            <select
              value={eventType}
              onChange={(e) => handleFilterChange('eventType', e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-sm"
            >
              <option value="all">الكل</option>
              <option value="human">إنسان 👤</option>
              <option value="vehicle">مركبة 🚗</option>
              <option value="animal">حيوان 🦁</option>
              <option value="noise">ضوضاء 🔊</option>
            </select>
          </div>

          {/* مرشح مستوى الخطر */}
          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-xs">مستوى الخطر:</label>
            <select
              value={riskLevel}
              onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-sm"
            >
              <option value="all">الكل</option>
              <option value="high">عالي 🔴</option>
              <option value="medium">متوسط 🟡</option>
              <option value="low">منخفض 🟢</option>
            </select>
          </div>

          {/* زر التحديث */}
          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-xs opacity-0">تحديث</label>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm"
            >
              <RefreshCw className={`w-4 lg:w-5 h-4 lg:h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">تحديث الآن</span>
              <span className="sm:hidden">تحديث</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
