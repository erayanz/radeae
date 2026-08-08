import { useState, useMemo } from 'react';
import Container from '../components/Container';
import StatsPanel from '../components/StatsPanel';
import GoogleMapView from '../components/GoogleMapView';
import EventsList from '../components/EventsList';
import { StatCardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { useEventsFeed } from '../hooks/useEventsFeed';
import { useEventStatusHandler } from '../hooks/useEventStatusHandler';
import { useAssignableUsers } from '../hooks/useAssignableUsers';
import { useSite } from '../context/SiteContext';
import { Search } from 'lucide-react';

const HomePage = () => {
  const { currentSite } = useSite();
  const [filters, setFilters] = useState({
    timeRange: 'all',
    eventType: 'all',
    riskLevel: 'all'
  });

  const { events, setEvents, loading, apiConnected } = useEventsFeed(currentSite?.id ?? '', {
    eventType: filters.eventType === 'all' ? undefined : filters.eventType,
    riskLevel: filters.riskLevel === 'all' ? undefined : filters.riskLevel,
    timeRange: filters.timeRange === 'all' ? undefined : filters.timeRange
  });

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

  const handleStatusChange = useEventStatusHandler(currentSite?.id ?? '', setEvents);
  const assignableUsers = useAssignableUsers();

  if (!currentSite) {
    return <div className="flex items-center justify-center min-h-[60vh] text-white/50">جاري تحميل بيانات الموقع...</div>;
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <StatsPanel events={events} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GoogleMapView events={filteredEvents} site={currentSite} />
        </div>
        <div className="space-y-6">
          <Container>
            <h3 className="text-lg font-bold mb-4 text-white">معلومات سريعة</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-brand-deepNavy/60 rounded-lg">
                <span className="text-white/50">عدد المجسات النشطة</span>
                <span className="text-emerald-400 font-bold text-xl font-tactical">8/8</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-brand-deepNavy/60 rounded-lg">
                <span className="text-white/50">آخر حدث</span>
                <span className="text-brand-goldLight font-medium text-sm font-tactical">
                  {events.length > 0
                    ? new Date(events[0].timestamp).toLocaleTimeString('ar-SA')
                    : 'لا يوجد'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-brand-deepNavy/60 rounded-lg">
                <span className="text-white/50">الأحداث النشطة</span>
                <span className="text-amber-400 font-bold text-xl font-tactical">
                  {filteredEvents.filter(e => e.riskLevel === 'high' && e.status !== 'resolved').length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-brand-deepNavy/60 rounded-lg">
                <span className="text-white/50">حالة API</span>
                <span className={`font-bold ${apiConnected ? 'text-emerald-400' : 'text-red-400'}`}>
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
                .filter(e => e.riskLevel === 'high' && e.status !== 'resolved')
                .slice(0, 3)
                .map(event => (
                  <div key={event.id} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-red-400 font-medium text-sm">{event.zone}</div>
                      {event.status === 'acknowledged' && (
                        <span className="text-xs text-amber-400">
                          {event.assignedTo
                            ? `مسند إلى ${event.assignedTo}`
                            : event.acknowledgedBy
                              ? `قيد المعالجة — ${event.acknowledgedBy}`
                              : 'قيد المعالجة'}
                        </span>
                      )}
                    </div>
                    <div className="text-white/50 text-xs">{event.description}</div>
                  </div>
                ))}
              {filteredEvents.filter(e => e.riskLevel === 'high' && e.status !== 'resolved').length === 0 && (
                <div className="text-center text-white/30 py-4">
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
          <div className="text-sm text-white/50">
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
          <EventsList events={filteredEvents} onStatusChange={handleStatusChange} assignableUsers={assignableUsers} />
        )}
      </Container>
    </div>
  );
};

export default HomePage;
