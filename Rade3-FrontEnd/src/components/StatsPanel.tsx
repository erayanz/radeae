import { useTranslation } from 'react-i18next';
import { AlertTriangle, AlertCircle, CheckCircle, Activity } from 'lucide-react';
import StatCard from './StatCard';
import { Event } from '../types';

interface StatsPanelProps {
  events: Event[];
}

const StatsPanel = ({ events }: StatsPanelProps) => {
  const { t } = useTranslation();

  const totalEvents = events.length;
  const highRiskEvents = events.filter(e => e.riskLevel === 'high').length;
  const mediumRiskEvents = events.filter(e => e.riskLevel === 'medium').length;
  const lowRiskEvents = events.filter(e => e.riskLevel === 'low').length;

  console.log('📊 StatsPanel - Rendering with:', {
    totalEvents,
    highRiskEvents,
    mediumRiskEvents,
    lowRiskEvents,
    eventsArray: events.length,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        label={t('totalEvents')}
        value={totalEvents}
        color="info"
        icon={Activity}
      />
      <StatCard
        label={t('highRiskEvents')}
        value={highRiskEvents}
        color="danger"
        icon={AlertTriangle}
      />
      <StatCard
        label={t('mediumRiskEvents')}
        value={mediumRiskEvents}
        color="warning"
        icon={AlertCircle}
      />
      <StatCard
        label={t('lowRiskEvents')}
        value={lowRiskEvents}
        color="success"
        icon={CheckCircle}
      />
    </div>
  );
};

export default StatsPanel;
