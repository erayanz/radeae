import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { Event } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface EventsListProps {
  events: Event[];
  onStatusChange?: (id: string, status: 'acknowledged' | 'resolved', assignedTo?: string) => void | Promise<void>;
  assignableUsers?: { id: string; username: string; role: string }[];
}

const EventsList = ({ events, onStatusChange, assignableUsers = [] }: EventsListProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [selectedAssignee, setSelectedAssignee] = useState<Record<string, string>>({});

  const copyEventId = (id: string) => {
    navigator.clipboard.writeText(id)
      .then(() => toast.success('تم نسخ المعرف'))
      .catch(() => toast.error('فشل نسخ المعرف'));
  };

  const handleAction = async (id: string, status: 'acknowledged' | 'resolved', assignedTo?: string) => {
    if (pendingIds.has(id)) return;
    setPendingIds(prev => new Set(prev).add(id));
    try {
      await onStatusChange?.(id, status, assignedTo);
      // event leaves the assignable ('new') state after this succeeds, so the
      // per-row selection is no longer needed — drop it instead of letting
      // selectedAssignee grow unbounded over a long-running session.
      setSelectedAssignee(prev => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } finally {
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

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
    return <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${styles[risk as keyof typeof styles]}`}>
      {labels[risk as keyof typeof labels]}
    </span>;
  };

  const getStatusBadge = (event: Event) => {
    const status = event.status;
    const styles = {
      new: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
      acknowledged: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      resolved: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
    };
    const labels = { new: 'جديد', acknowledged: 'تم الإسناد', resolved: 'تم الحل' };
    const label = labels[status] ?? labels.new;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${styles[status] ?? styles.new}`}>
        {label}
        {status === 'acknowledged' && event.assignedTo && ` — ${event.assignedTo}`}
        {status === 'resolved' && event.resolvedBy && `: ${event.resolvedBy}`}
      </span>
    );
  };

  const getStatusActions = (event: Event) => {
    if (!onStatusChange || event.status === 'resolved') return null;
    const isPending = pendingIds.has(event.id);
    // Defaults the dropdown to the current assignee when reassigning an
    // already-acknowledged event, so admin sees who it's assigned to now
    // rather than an empty selector.
    const selected = selectedAssignee[event.id] ?? (event.status === 'acknowledged' ? event.assignedTo ?? '' : '');
    // Assignment/reassignment is admin-only (backend enforces this too —
    // this is UI affordance, not the security boundary). A non-admin only
    // ever sees events already assigned to them (the backend filters the
    // list), so the resolve action just needs to confirm that ownership
    // defensively.
    const canResolve = isAdmin || event.assignedTo === user?.username;
    const canAssign = (event.status === 'new' || event.status === 'acknowledged') && isAdmin;
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {canAssign && (
          <>
            <select
              value={selected}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                setSelectedAssignee(prev => ({ ...prev, [event.id]: e.target.value }));
              }}
              className="bg-brand-navyLight text-white px-2 py-1 rounded-lg border border-brand-graphite focus:border-brand-gold focus:outline-none text-xs whitespace-nowrap max-w-[110px]"
            >
              <option value="">اختر مستخدم</option>
              {assignableUsers.map(u => (
                <option key={u.id} value={u.username}>{u.username}</option>
              ))}
            </select>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!selected || selected === event.assignedTo) return;
                handleAction(event.id, 'acknowledged', selected);
              }}
              disabled={isPending || !selected || selected === event.assignedTo}
              className="px-3 py-1 text-xs rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {event.status === 'acknowledged' ? 'تغيير الإسناد' : 'إسناد'}
            </button>
          </>
        )}
        {canResolve && (
          <button
            onClick={(e) => { e.stopPropagation(); handleAction(event.id, 'resolved'); }}
            disabled={isPending}
            className="px-3 py-1 text-xs rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            حل
          </button>
        )}
      </div>
    );
  };

  const getRiskDotColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
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

  const getMapsUrl = (event: Event) =>
    `https://www.google.com/maps?q=${event.latitude},${event.longitude}`;

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
            <tr className="border-b border-brand-gold/15">
              <th className="px-4 py-3 text-brand-steel font-medium text-sm uppercase tracking-wide">{t('eventId')}</th>
              <th className="px-4 py-3 text-brand-steel font-medium text-sm uppercase tracking-wide">{t('timestamp')}</th>
              <th className="px-4 py-3 text-brand-steel font-medium text-sm uppercase tracking-wide">{t('sensorId')}</th>
              <th className="px-4 py-3 text-brand-steel font-medium text-sm uppercase tracking-wide">{t('eventType')}</th>
              <th className="px-4 py-3 text-brand-steel font-medium text-sm uppercase tracking-wide">{t('riskLevel')}</th>
              <th className="px-4 py-3 text-brand-steel font-medium text-sm uppercase tracking-wide">{t('location')}</th>
              <th className="px-4 py-3 text-brand-steel font-medium text-sm uppercase tracking-wide">الحالة</th>
              <th className="px-4 py-3 text-brand-steel font-medium text-sm uppercase tracking-wide">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {sortedEvents.map((event, index) => (
              <tr
                key={event.id}
                className={`
                  ${getRiskColor(event.riskLevel)}
                  ${index % 2 === 0 ? 'bg-brand-navyLight/40' : 'bg-transparent'}
                  hover:bg-brand-navyLight/70 transition-colors cursor-pointer
                `}
              >
                <td className="px-4 py-3 text-white/50 text-xs font-tactical">
                  <button
                    onClick={(e) => { e.stopPropagation(); copyEventId(event.id); }}
                    title={`${event.id} — انقر للنسخ`}
                    className="hover:text-brand-gold transition-colors"
                  >
                    {event.id.slice(0, 8)}
                  </button>
                </td>
                <td className="px-4 py-3 text-white/70 text-sm font-tactical">
                  {formatTime(event.timestamp)}
                </td>
                <td className="px-4 py-3 text-brand-goldLight font-tactical text-sm">
                  {event.sensorId}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full shrink-0 ${getRiskDotColor(event.riskLevel)}`}
                      title={event.riskLevel}
                    />
                    <span className="text-white/80">{getEventTypeLabel(event.eventType)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {getRiskBadge(event.riskLevel)}
                </td>
                <td className="px-4 py-3 text-white/80">
                  <a
                    href={getMapsUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center text-brand-goldLight hover:text-brand-gold transition-colors"
                    title={event.zone}
                    aria-label={event.zone}
                  >
                    <MapPin className="w-5 h-5" />
                  </a>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {getStatusBadge(event)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {getStatusActions(event)}
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
            className={`${getRiskColor(event.riskLevel)} bg-brand-navyLight/40 rounded-lg p-4 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full shrink-0 ${getRiskDotColor(event.riskLevel)}`}
                  title={event.riskLevel}
                />
                <span className="font-bold text-white">{getEventTypeLabel(event.eventType)}</span>
              </div>
              <div className="flex items-center gap-2">
                {getRiskBadge(event.riskLevel)}
                {getStatusBadge(event)}
              </div>
            </div>
            <div className="text-sm text-white/50">
              <div className="flex items-center gap-2">
                <span className="font-bold">🆔</span>
                <button
                  onClick={(e) => { e.stopPropagation(); copyEventId(event.id); }}
                  title={`${event.id} — انقر للنسخ`}
                  className="font-tactical text-xs hover:text-brand-gold transition-colors"
                >
                  {event.id.slice(0, 8)}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">🕐</span>
                <span className="font-tactical">{formatTime(event.timestamp)}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getMapsUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center text-brand-goldLight hover:text-brand-gold transition-colors"
                  title={event.zone}
                  aria-label={event.zone}
                >
                  <MapPin className="w-4 h-4" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">🎯</span>
                <span className="font-tactical text-xs text-brand-goldLight">{event.sensorId}</span>
              </div>
            </div>
            {onStatusChange && event.status !== 'resolved' && (
              <div className="pt-2 border-t border-brand-gold/15">
                {getStatusActions(event)}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default EventsList;
