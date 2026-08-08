import { useState, useMemo } from 'react';
import { Search, Download, Filter, X, Trash2 } from 'lucide-react';
import Container from '../components/Container';
import EventsList from '../components/EventsList';
import { EmptyState } from '../components/EmptyState';
import { eventsApi } from '../api/eventsApi';
import { useEventsFeed } from '../hooks/useEventsFeed';
import { useEventStatusHandler } from '../hooks/useEventStatusHandler';
import { useAssignableUsers } from '../hooks/useAssignableUsers';
import { useToast } from '../context/ToastContext';
import { useSite } from '../context/SiteContext';

const EventsPage = () => {
  const { currentSite } = useSite();
  const { events, setEvents, loading } = useEventsFeed(currentSite?.id ?? '');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    eventType: 'all',
    riskLevel: 'all',
    timeRange: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [clearing, setClearing] = useState(false);
  const { toast } = useToast();

  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.zone.toLowerCase().includes(q) ||
        e.sensorId.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q)
      );
    }

    // Filters
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
          case 'hour': return diffInHours <= 1;
          case 'day': return diffInHours <= 24;
          case 'week': return diffInHours <= 168;
          default: return true;
        }
      });
    }

    return filtered;
  }, [events, searchQuery, filters]);

  const handleExport = () => {
    const csv = [
      ['الوقت', 'المجس', 'النوع', 'الخطر', 'المنطقة', 'الإجراء المقترح'],
      ...filteredEvents.map(e => [
        e.timestamp,
        e.sensorId,
        e.eventType,
        e.riskLevel,
        e.zone,
        e.suggestedAction
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `events_${new Date().toISOString()}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setFilters({ eventType: 'all', riskLevel: 'all', timeRange: 'all' });
    setSearchQuery('');
  };

  const handleClearEvents = async () => {
    if (!window.confirm('هل أنت متأكد من مسح جميع الأحداث؟')) {
      return;
    }

    if (!currentSite) return;

    setClearing(true);
    try {
      await eventsApi.clearAllEvents(currentSite.id);
      setEvents([]);
      toast.success('تم مسح جميع الأحداث');
    } catch (error) {
      toast.error('فشل مسح الأحداث');
    } finally {
      setClearing(false);
    }
  };

  const handleStatusChange = useEventStatusHandler(currentSite?.id ?? '', setEvents);
  const assignableUsers = useAssignableUsers();

  const hasActiveFilters = filters.eventType !== 'all' || filters.riskLevel !== 'all' || filters.timeRange !== 'all' || searchQuery;

  if (!currentSite) {
    return <div className="flex items-center justify-center min-h-[60vh] text-white/50">جاري تحميل بيانات الموقع...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">الأحداث</h1>
        
        <div className="flex gap-3">
          <div className="relative flex-1 lg:flex-initial lg:w-64">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="بحث بالمعرف، المنطقة، المجس..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-navy text-white pr-10 pl-4 py-2 rounded-lg border border-brand-graphite focus:border-brand-gold focus:outline-none"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-brand-navy hover:bg-brand-navyLight text-white px-4 py-2 rounded-lg border border-brand-graphite transition-all"
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">تصفية</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-brand-gold hover:bg-brand-goldLight text-brand-deepNavy font-semibold px-4 py-2 rounded-lg transition-all"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">تصدير CSV</span>
          </button>

          <button
            onClick={handleClearEvents}
            disabled={clearing}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-brand-graphite text-white px-4 py-2 rounded-lg transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>{clearing ? 'جاري المسح...' : 'مسح الكل'}</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Container>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">الفلاتر</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
                مسح الكل
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-white/50 text-sm mb-2 block">نوع الحدث</label>
              <select
                value={filters.eventType}
                onChange={(e) => setFilters({...filters, eventType: e.target.value})}
                className="w-full bg-brand-navyLight text-white px-3 py-2 rounded-lg border border-brand-graphite"
              >
                <option value="all">الكل</option>
                <option value="human">إنسان</option>
                <option value="vehicle">مركبة</option>
                <option value="animal">حيوان</option>
                <option value="noise">ضوضاء</option>
              </select>
            </div>

            <div>
              <label className="text-white/50 text-sm mb-2 block">مستوى الخطر</label>
              <select
                value={filters.riskLevel}
                onChange={(e) => setFilters({...filters, riskLevel: e.target.value})}
                className="w-full bg-brand-navyLight text-white px-3 py-2 rounded-lg border border-brand-graphite"
              >
                <option value="all">الكل</option>
                <option value="high">عالي</option>
                <option value="medium">متوسط</option>
                <option value="low">منخفض</option>
              </select>
            </div>

            <div>
              <label className="text-white/50 text-sm mb-2 block">النطاق الزمني</label>
              <select
                value={filters.timeRange}
                onChange={(e) => setFilters({...filters, timeRange: e.target.value})}
                className="w-full bg-brand-navyLight text-white px-3 py-2 rounded-lg border border-brand-graphite"
              >
                <option value="all">كل الوقت</option>
                <option value="hour">آخر ساعة</option>
                <option value="day">آخر 24 ساعة</option>
                <option value="week">آخر أسبوع</option>
              </select>
            </div>
          </div>
        </Container>
      )}

      {/* Events Table */}
      <Container>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            النتائج ({filteredEvents.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-white/50">جاري التحميل...</div>
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            icon={Search}
            title="لا توجد نتائج"
            description="جرب تغيير معايير البحث أو الفلاتر"
            action={{
              label: 'مسح الفلاتر',
              onClick: clearFilters
            }}
          />
        ) : (
          <EventsList events={filteredEvents} onStatusChange={handleStatusChange} assignableUsers={assignableUsers} />
        )}
      </Container>
    </div>
  );
};

export default EventsPage;
