import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Event } from '../types';

interface EventsListProps {
  events: Event[];
}

const EventsList = ({ events }: EventsListProps) => {
  const { t } = useTranslation();

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [events]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'border-r-4 border-red-500 bg-red-500/5';
      case 'medium': return 'border-r-4 border-yellow-500 bg-yellow-500/5';
      case 'low': return 'border-r-4 border-green-500 bg-green-500/5';
      default: return '';
    }
  };

  const getRiskBadge = (risk: string) => {
    const styles = {
      high: 'bg-red-500 text-white',
      medium: 'bg-yellow-500 text-gray-900',
      low: 'bg-green-500 text-white'
    };
    const labels = {
      high: 'عالي',
      medium: 'متوسط',
      low: 'منخفض'
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[risk as keyof typeof styles]}`}>
      {labels[risk as keyof typeof labels]}
    </span>;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'human': return '👤';
      case 'vehicle': return '🚗';
      case 'animal': return '🦁';
      case 'noise': return '🔊';
      default: return '⚠️';
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels = {
      human: 'إنسان',
      vehicle: 'مركبة',
      animal: 'حيوان',
      noise: 'ضوضاء'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ar-SA', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-4 py-3 text-gray-400 font-medium">{t('timestamp')}</th>
              <th className="px-4 py-3 text-gray-400 font-medium">{t('sensorId')}</th>
              <th className="px-4 py-3 text-gray-400 font-medium">{t('eventType')}</th>
              <th className="px-4 py-3 text-gray-400 font-medium">{t('riskLevel')}</th>
              <th className="px-4 py-3 text-gray-400 font-medium">{t('zone')}</th>
              <th className="px-4 py-3 text-gray-400 font-medium">{t('suggestedAction')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedEvents.map((event, index) => (
              <tr
                key={event.id}
                className={`
                  ${getRiskColor(event.riskLevel)}
                  ${index % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-800/30'}
                  hover:bg-gray-700/50 transition-colors cursor-pointer
                `}
              >
                <td className="px-4 py-3 text-gray-300 text-sm">
                  {formatTime(event.timestamp)}
                </td>
                <td className="px-4 py-3 text-gray-400 font-mono text-sm">
                  {event.sensorId}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getEventIcon(event.eventType)}</span>
                    <span className="text-gray-300">{getEventTypeLabel(event.eventType)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {getRiskBadge(event.riskLevel)}
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {event.zone}
                </td>
                <td className="px-4 py-3 text-gray-400 text-sm">
                  {event.suggestedAction}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {sortedEvents.map((event) => (
          <div
            key={event.id}
            className={`${getRiskColor(event.riskLevel)} rounded-lg p-4 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getEventIcon(event.eventType)}</span>
                <span className="font-bold text-white">{getEventTypeLabel(event.eventType)}</span>
              </div>
              {getRiskBadge(event.riskLevel)}
            </div>
            <div className="text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <span className="font-bold">🕐</span>
                <span>{formatTime(event.timestamp)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">📍</span>
                <span>{event.zone}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">🎯</span>
                <span className="font-mono text-xs">{event.sensorId}</span>
              </div>
            </div>
            <div className="text-sm text-blue-400 pt-2 border-t border-gray-700">
              <strong>الإجراء المقترح:</strong> {event.suggestedAction}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default EventsList;
