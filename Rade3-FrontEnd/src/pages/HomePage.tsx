import { useState, useMemo, useEffect } from 'react';
import Container from '../components/Container';
import ControlPanel from '../components/ControlPanel';
import StatsPanel from '../components/StatsPanel';
import GoogleMapView from '../components/GoogleMapView';
import EventsList from '../components/EventsList';
import SimulatorControl from '../components/SimulatorControl';
import { StatCardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { mockEvents } from '../data/mockData';
import { eventsApi } from '../api/eventsApi';
import { Event } from '../types';
import { Search } from 'lucide-react';

const HomePage = () => {
  const [filters, setFilters] = useState({
    timeRange: 'all',
    eventType: 'all',
    riskLevel: 'all'
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        console.log('🔄 HomePage - Starting fetch...');
        
        const data = await eventsApi.getEvents({
          eventType: filters.eventType === 'all' ? undefined : filters.eventType,
          riskLevel: filters.riskLevel === 'all' ? undefined : filters.riskLevel,
          timeRange: filters.timeRange === 'all' ? undefined : filters.timeRange
        });
        
        console.log('✅ HomePage - Data received:', {
          count: data.length,
          high: data.filter(e => e.riskLevel === 'high').length,
          medium: data.filter(e => e.riskLevel === 'medium').length,
          low: data.filter(e => e.riskLevel === 'low').length
        });
        
        setEvents(data);
        setApiConnected(true);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('⚠️ HomePage - فشل الاتصال بـ API:', error);
        setEvents(mockEvents);
        setApiConnected(false);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [filters, refreshKey]);

  useEffect(() => {
    if (!apiConnected) return;

    const autoRefreshInterval = setInterval(() => {
      console.log('🔄 Auto-refresh triggered at', new Date().toLocaleTimeString());
      setRefreshKey(prev => prev + 1);
    }, 5000);

    return () => clearInterval(autoRefreshInterval);
  }, [apiConnected]);

  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    if (filters.eventType !== 'all') {
      filtered = filtered.filter(e => e.eventType === filters.eventType);
    }

    if (filters.riskLevel !== 'all') {
      filtered = filtered.filter(e => e.riskLevel === filters.riskLevel);
    }

    if (filters.timeRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.timestamp);
        const diffInHours = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60);
        
        switch (filters.timeRange) {
          case 'hour':
            return diffInHours <= 1;
          case 'day':
            return diffInHours <= 24;
          case 'week':
            return diffInHours <= 168;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [events, filters]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6">
      <SimulatorControl />

      <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${apiConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <div className="flex flex-col">
            <span className="text-gray-300">
              {apiConnected ? '🌐 متصل بـ Backend API' : '⚠️ غير متصل - استخدام بيانات وهمية'}
            </span>
            <span className="text-xs text-gray-500">
              آخر تحديث: {lastUpdate.toLocaleTimeString('ar-SA')} • تحديث تلقائي كل 5 ثوان
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">عدد الأحداث:</span>
          <span className="text-blue-400 font-bold">{events.length}</span>
        </div>
      </div>

      <ControlPanel 
        onRefresh={handleRefresh}
        onFilterChange={handleFilterChange}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <StatsPanel events={events} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GoogleMapView events={filteredEvents} />
        </div>
        <div className="space-y-6">
          <Container>
            <h3 className="text-lg font-bold mb-4 text-white">معلومات سريعة</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <span className="text-gray-400">عدد المجسات النشطة</span>
                <span className="text-green-400 font-bold text-xl">8/8</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <span className="text-gray-400">آخر حدث</span>
                <span className="text-blue-400 font-medium text-sm">
                  {events.length > 0 
                    ? new Date(events[0].timestamp).toLocaleTimeString('ar-SA')
                    : 'لا يوجد'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <span className="text-gray-400">الأحداث النشطة</span>
                <span className="text-yellow-400 font-bold text-xl">
                  {filteredEvents.filter(e => e.riskLevel === 'high').length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <span className="text-gray-400">حالة API</span>
                <span className={`font-bold ${apiConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {apiConnected ? '✅ متصل' : '❌ غير متصل'}
                </span>
              </div>
            </div>
          </Container>

          <Container>
            <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              أحداث تتطلب انتباه
            </h3>
            <div className="space-y-2">
              {filteredEvents
                .filter(e => e.riskLevel === 'high')
                .slice(0, 3)
                .map(event => (
                  <div key={event.id} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer">
                    <div className="text-red-400 font-medium text-sm mb-1">{event.zone}</div>
                    <div className="text-gray-400 text-xs">{event.description}</div>
                  </div>
                ))}
              {filteredEvents.filter(e => e.riskLevel === 'high').length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  لا توجد أحداث عاجلة حالياً ✅
                </div>
              )}
            </div>
          </Container>
        </div>
      </div>

      <Container>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">الأحداث الأخيرة</h2>
          <div className="text-sm text-gray-400">
            عرض {filteredEvents.length} حدث
          </div>
        </div>
        {filteredEvents.length === 0 ? (
          <EmptyState
            icon={Search}
            title="لا توجد أحداث"
            description="جرب تغيير الفلاتر أو انتظر أحداث جديدة من المحاكاة"
            action={{
              label: 'إعادة التعيين',
              onClick: () => setFilters({ timeRange: 'all', eventType: 'all', riskLevel: 'all' })
            }}
          />
        ) : (
          <EventsList events={filteredEvents} />
        )}
      </Container>
    </div>
  );
};

export default HomePage;
