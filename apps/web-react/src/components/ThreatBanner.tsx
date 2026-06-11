import type { Stats } from '../types';

export function ThreatBanner({ stats }: { stats: Stats | null }) {
  if (!stats) return null;

  const level = stats.blockedRate >= 50 ? 'high' : stats.blockedRate >= 20 ? 'elevated' : 'low';
  const icon = { low: '🟢', elevated: '🟡', high: '🔴' }[level];
  const label = {
    low: 'Low threat environment',
    elevated: 'Elevated threat — above-average spam activity',
    high: 'High threat — majority of calls are spam',
  }[level];

  return (
    <div className={`threat-banner ${level}`}>
      <span>{icon}</span> {label}
      <span className="threat-sub">&nbsp;{stats.today} calls today</span>
    </div>
  );
}
