import { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Container from '../components/Container';
import { eventsApi } from '../api/eventsApi';
import { mockEvents } from '../data/mockData';
import { Event } from '../types';
import { TrendingUp, TrendingDown, Copy, Check } from 'lucide-react';

const COLORS = {
  high: '#DC2626',
  medium: '#F59E0B',
  low: '#10B981',
  human: '#3B82F6',
  vehicle: '#8B5CF6',
  animal: '#10B981',
  noise: '#F59E0B'
};

const StatisticsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  
  const lineChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  
  const [copiedChart, setCopiedChart] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const data = await eventsApi.getEvents();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents(mockEvents);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const riskDistribution = useMemo(() => {
    const high = events.filter(e => e.riskLevel === 'high').length;
    const medium = events.filter(e => e.riskLevel === 'medium').length;
    const low = events.filter(e => e.riskLevel === 'low').length;

    return [
      { name: 'عالي', value: high, color: COLORS.high },
      { name: 'متوسط', value: medium, color: COLORS.medium },
      { name: 'منخفض', value: low, color: COLORS.low }
    ];
  }, [events]);

  const typeDistribution = useMemo(() => {
    const human = events.filter(e => e.eventType === 'human').length;
    const vehicle = events.filter(e => e.eventType === 'vehicle').length;
    const animal = events.filter(e => e.eventType === 'animal').length;
    const noise = events.filter(e => e.eventType === 'noise').length;

    return [
      { name: 'إنسان', value: human, color: COLORS.human },
      { name: 'مركبة', value: vehicle, color: COLORS.vehicle },
      { name: 'حيوان', value: animal, color: COLORS.animal },
      { name: 'ضوضاء', value: noise, color: COLORS.noise }
    ];
  }, [events]);

  const timelineData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' }),
        high: 0,
        medium: 0,
        low: 0,
        total: 0
      };
    });

    events.forEach(event => {
      const eventDate = new Date(event.timestamp);
      const daysDiff = Math.floor((new Date().getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff < 7) {
        const index = 6 - daysDiff;
        if (index >= 0 && index < 7) {
          last7Days[index].total++;
          if (event.riskLevel === 'high') last7Days[index].high++;
          if (event.riskLevel === 'medium') last7Days[index].medium++;
          if (event.riskLevel === 'low') last7Days[index].low++;
        }
      }
    });

    return last7Days;
  }, [events]);

  const kpis = useMemo(() => {
    const today = events.filter(e => {
      const eventDate = new Date(e.timestamp).toDateString();
      return eventDate === new Date().toDateString();
    }).length;

    const yesterday = events.filter(e => {
      const eventDate = new Date(e.timestamp);
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      return eventDate.toDateString() === yesterdayDate.toDateString();
    }).length;

    const trend = today - yesterday;
    const avgPerDay = events.length / 7;
    const highRiskRate = (events.filter(e => e.riskLevel === 'high').length / events.length * 100).toFixed(1);

    return { today, yesterday, trend, avgPerDay: avgPerDay.toFixed(1), highRiskRate };
  }, [events]);

  const copyChartToClipboard = async (chartRef: React.RefObject<HTMLDivElement>, chartName: string) => {
    if (!chartRef.current) return;

    try {
      // استخدام html2canvas لنسخ الرسم البياني
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#1F2937',
        scale: 2
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          const item = new ClipboardItem({ 'image/png': blob });
          navigator.clipboard.write([item]).then(() => {
            setCopiedChart(chartName);
            setTimeout(() => setCopiedChart(null), 2000);
          });
        }
      });
    } catch (error) {
      console.error('فشل نسخ الرسم البياني:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">جاري تحميل الإحصائيات...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">الإحصائيات والتقارير</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700"
        >
          <option value="day">آخر 24 ساعة</option>
          <option value="week">آخر أسبوع</option>
          <option value="month">آخر شهر</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Container className="text-center">
          <div className="text-gray-400 text-sm mb-2">أحداث اليوم</div>
          <div className="text-4xl font-bold text-blue-400">{kpis.today}</div>
          <div className="flex items-center justify-center gap-2 mt-2">
            {kpis.trend > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">+{kpis.trend}</span>
              </>
            ) : kpis.trend < 0 ? (
              <>
                <TrendingDown className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm">{kpis.trend}</span>
              </>
            ) : (
              <span className="text-gray-400 text-sm">لا تغيير</span>
            )}
          </div>
        </Container>

        <Container className="text-center">
          <div className="text-gray-400 text-sm mb-2">متوسط يومي</div>
          <div className="text-4xl font-bold text-purple-400">{kpis.avgPerDay}</div>
          <div className="text-gray-500 text-sm mt-2">حدث/يوم</div>
        </Container>

        <Container className="text-center">
          <div className="text-gray-400 text-sm mb-2">نسبة الخطر العالي</div>
          <div className="text-4xl font-bold text-red-400">{kpis.highRiskRate}%</div>
          <div className="text-gray-500 text-sm mt-2">من الأحداث</div>
        </Container>

        <Container className="text-center">
          <div className="text-gray-400 text-sm mb-2">إجمالي الأحداث</div>
          <div className="text-4xl font-bold text-green-400">{events.length}</div>
          <div className="text-gray-500 text-sm mt-2">في آخر 7 أيام</div>
        </Container>
      </div>

      {/* Line Chart - Timeline */}
      <Container>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">الأحداث عبر الوقت</h2>
          <button
            onClick={() => copyChartToClipboard(lineChartRef, 'timeline')}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all text-sm"
            title="نسخ الرسم البياني"
          >
            {copiedChart === 'timeline' ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-green-400">تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>نسخ</span>
              </>
            )}
          </button>
        </div>
        <div ref={lineChartRef}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Line type="monotone" dataKey="high" stroke={COLORS.high} name="عالي" strokeWidth={2} />
              <Line type="monotone" dataKey="medium" stroke={COLORS.medium} name="متوسط" strokeWidth={2} />
              <Line type="monotone" dataKey="low" stroke={COLORS.low} name="منخفض" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Container>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Risk Distribution */}
        <Container>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">توزيع مستويات الخطر</h2>
            <button
              onClick={() => copyChartToClipboard(pieChartRef, 'pie')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all text-sm"
              title="نسخ الرسم البياني"
            >
              {copiedChart === 'pie' ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ</span>
                </>
              )}
            </button>
          </div>
          <div ref={pieChartRef}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Container>

        {/* Bar Chart - Type Distribution */}
        <Container>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">توزيع أنواع الأحداث</h2>
            <button
              onClick={() => copyChartToClipboard(barChartRef, 'bar')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all text-sm"
              title="نسخ الرسم البياني"
            >
              {copiedChart === 'bar' ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ</span>
                </>
              )}
            </button>
          </div>
          <div ref={barChartRef}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#3B82F6">
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default StatisticsPage;
