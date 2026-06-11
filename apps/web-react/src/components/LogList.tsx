import { useState } from 'react';
import { useToast } from '../toast';
import type { CallLog } from '../types';

const FILTERS = ['all', 'blocked', 'allowed'] as const;
type Filter = (typeof FILTERS)[number];

export function LogList({ logs }: { logs: CallLog[] }) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = logs.filter((c) => {
    if (filter !== 'all' && c.outcome !== filter) return false;
    if (search && !c.callerNumber.includes(search)) return false;
    return true;
  });

  function exportCSV() {
    if (!logs.length) { toast('No data to export', 'info'); return; }
    const headers = ['Number', 'Score', 'Outcome', 'Carrier', 'VoIP', 'Spoofed', 'Mode', 'Checked At'];
    const rows = logs.map((c) => [
      c.callerNumber,
      Math.round(c.spamScore * 100) + '%',
      c.outcome,
      c.carrierName || c.carrierType || '',
      c.isVoip ? 'Yes' : 'No',
      c.isSpoofed ? 'Yes' : 'No',
      c.mode || '',
      c.createdAt ? new Date(c.createdAt).toLocaleString() : '',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `unspam-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast('Export downloaded', 'success');
  }

  const barClass = (pct: number) => (pct < 40 ? 'low' : pct < 60 ? 'mid' : 'high');
  const pctColor = (pct: number) => (pct < 40 ? '#4ade80' : pct < 60 ? '#facc15' : '#f87171');

  return (
    <div className="card">
      <div className="log-controls">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" type="text" placeholder="Search numbers…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-pills">
          {FILTERS.map((f) => (
            <button key={f} className={`filter-pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn-export" onClick={exportCSV}>↓ CSV</button>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">{logs.length === 0 ? 'No calls logged yet.' : 'No matching calls.'}</p>
      ) : (
        filtered.map((c) => {
          const pct = Math.round(c.spamScore * 100);
          const open = openId === c.id;
          return (
            <div className="log-item" key={c.id}>
              <div className="log-entry" onClick={() => setOpenId(open ? null : c.id)}>
                <span className="log-number">{c.callerNumber}</span>
                <div className="log-right">
                  <span className="log-score">{pct}%</span>
                  <span className={`badge-sm ${c.outcome}`}>{c.outcome}</span>
                  <span className={`log-chevron ${open ? 'open' : ''}`}>▼</span>
                </div>
              </div>
              {open && (
                <div className="log-detail-inner">
                  <div className="mini-bar-row">
                    <span className="mini-bar-label">Spam score</span>
                    <div className="mini-bar-track"><div className={`mini-bar-fill ${barClass(pct)}`} style={{ width: `${pct}%` }} /></div>
                    <span className="mini-pct" style={{ color: pctColor(pct) }}>{pct}%</span>
                  </div>
                  <div className="detail-grid">
                    <div className="detail-cell">
                      <div className="detail-key">Carrier</div>
                      <div className="detail-val">{c.carrierName && c.carrierName !== 'Unknown' ? c.carrierName : (c.carrierType || '—')}</div>
                    </div>
                    <div className="detail-cell">
                      <div className="detail-key">VoIP</div>
                      <div className={`detail-val ${c.isVoip ? 'flagged' : 'ok'}`}>{c.isVoip ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="detail-cell">
                      <div className="detail-key">Spoofed</div>
                      <div className={`detail-val ${c.isSpoofed ? 'flagged' : 'ok'}`}>{c.isSpoofed ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="detail-cell">
                      <div className="detail-key">Mode</div>
                      <div className="detail-val">{c.mode || '—'}</div>
                    </div>
                    <div className="detail-cell" style={{ gridColumn: 'span 2' }}>
                      <div className="detail-key">Checked at</div>
                      <div className="detail-val" style={{ fontSize: '0.72rem', fontWeight: 500 }}>{c.createdAt ? new Date(c.createdAt).toLocaleString() : '—'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
