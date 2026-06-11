import type { Stats } from '../types';

export function TrendChart({ stats }: { stats: Stats | null }) {
  if (!stats) return null;

  // Build a contiguous 7-day series, filling gaps with zeros.
  const days: { label: string; total: number; blocked: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    const found = stats.dailyStats.find((x) => x.date?.slice(0, 10) === key);
    days.push({
      label: d.toLocaleDateString('en', { weekday: 'short' }),
      total: found?.total ?? 0,
      blocked: found?.blocked ?? 0,
    });
  }

  const rates = days.map((d) => (d.total > 0 ? Math.round((d.blocked / d.total) * 100) : 0));
  const avg = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;

  const W = 520, H = 80, PAD = 8;
  const maxRate = Math.max(...rates, 1);
  const pts = rates.map((r, i) => {
    const x = PAD + (i / (days.length - 1)) * (W - PAD * 2);
    const y = H - PAD - (r / maxRate) * (H - PAD * 2);
    return { x, y, r };
  });
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const polygon = `${PAD},${H} ${polyline} ${W - PAD},${H}`;

  return (
    <div className="card">
      <div className="trend-header">
        <div className="card-title" style={{ margin: 0 }}>7-day trend</div>
        <div className="trend-meta">
          <div className="tmeta">
            <div className="tmeta-val red">{stats.blocked}</div>
            <div className="tmeta-label">Blocked</div>
          </div>
          <div className="tmeta">
            <div className="tmeta-val">{avg}%</div>
            <div className="tmeta-label">Avg rate</div>
          </div>
        </div>
      </div>

      <svg className="trend-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="tgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e63946" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#e63946" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={polygon} fill="url(#tgrad)" />
        <polyline points={polyline} fill="none" stroke="#e63946" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#e63946" />
            {p.r > 0 && <text x={p.x} y={p.y - 7} textAnchor="middle" fill="#5a5a5a" fontSize="9" fontFamily="Inter,sans-serif">{p.r}%</text>}
          </g>
        ))}
      </svg>

      <div className="trend-labels">
        {days.map((d, i) => <span key={i}>{d.label}</span>)}
      </div>
    </div>
  );
}
