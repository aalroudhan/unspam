import { useState } from 'react';
import { api } from '../api';
import { useToast } from '../toast';
import type { CheckResult } from '../types';

interface BatchRow {
  number: string;
  pct: number;
  carrier: string;
  isVoip: boolean;
  outcome: string;
  error?: boolean;
}

interface Props {
  onChecked: (result: CheckResult, number: string) => void;
  onRefresh: () => void;
}

export function CheckCard({ onChecked, onRefresh }: Props) {
  const toast = useToast();
  const [tab, setTab] = useState<'single' | 'batch'>('single');

  const [phone, setPhone] = useState('');
  const [checking, setChecking] = useState(false);

  const [batchInput, setBatchInput] = useState('');
  const [batchRunning, setBatchRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [rows, setRows] = useState<BatchRow[]>([]);

  async function checkSingle() {
    if (!phone.trim()) return;
    setChecking(true);
    try {
      const number = phone.trim();
      const result = await api.check(number);
      onChecked(result, number);
      onRefresh();
    } catch {
      toast('Could not reach the API. Is it running?', 'error');
    } finally {
      setChecking(false);
    }
  }

  async function runBatch() {
    const numbers = batchInput.split('\n').map((n) => n.trim()).filter(Boolean);
    if (!numbers.length) return;
    setBatchRunning(true);
    setRows([]);
    setProgress({ done: 0, total: numbers.length });

    const collected: BatchRow[] = [];
    for (let i = 0; i < numbers.length; i++) {
      setProgress({ done: i, total: numbers.length });
      try {
        const d = await api.check(numbers[i]);
        collected.push({
          number: numbers[i],
          pct: Math.round((d.score ?? 0) * 100),
          carrier: d.carrier?.carrierName || d.carrier?.carrierType || '—',
          isVoip: d.carrier?.isVoip ?? false,
          outcome: d.outcome,
        });
      } catch {
        collected.push({ number: numbers[i], pct: 0, carrier: '—', isVoip: false, outcome: 'error', error: true });
      }
      setRows([...collected]);
    }
    setProgress({ done: numbers.length, total: numbers.length });
    setBatchRunning(false);
    onRefresh();
  }

  const barClass = (pct: number) => (pct < 40 ? 'low' : pct < 60 ? 'mid' : 'high');

  return (
    <div className="card">
      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'single' ? 'active' : ''}`} onClick={() => setTab('single')}>Single check</button>
        <button className={`tab-btn ${tab === 'batch' ? 'active' : ''}`} onClick={() => setTab('batch')}>Batch check</button>
      </div>

      {tab === 'single' ? (
        <>
          <div className="input-wrap">
            <span className="input-icon">📞</span>
            <input type="tel" value={phone} placeholder="+1 555 000 0000"
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') checkSingle(); }} />
          </div>
          <button className="btn-primary" onClick={checkSingle} disabled={checking}>
            {checking ? 'Checking…' : 'Check number'}
          </button>
        </>
      ) : (
        <>
          <textarea value={batchInput} onChange={(e) => setBatchInput(e.target.value)}
            placeholder={'Paste numbers, one per line:\n+1 555 000 0001\n+1 555 000 0002\n+1 555 000 0003'} />
          <button className="btn-primary" onClick={runBatch} disabled={batchRunning}>
            {batchRunning ? 'Checking…' : 'Check all numbers'}
          </button>

          {progress.total > 0 && (
            <div className="batch-progress">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
              </div>
              <div className="progress-label">
                {progress.done === progress.total ? `Done — ${progress.total} checked` : `${progress.done} of ${progress.total}`}
              </div>
            </div>
          )}

          {rows.length > 0 && (
            <div className="batch-results">
              <table className="batch-table">
                <thead>
                  <tr><th>Number</th><th>Score</th><th>Carrier</th><th>VoIP</th><th>Outcome</th></tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td className="batch-num">{r.number}</td>
                      <td>
                        {r.error ? <span style={{ color: 'var(--muted)' }}>Error</span> : (
                          <div className="tscore-wrap">
                            <div className="tscore-bar"><div className={`tscore-fill ${barClass(r.pct)}`} style={{ width: `${r.pct}%` }} /></div>
                            <span className="tscore-pct">{r.pct}%</span>
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: '#ccc' }}>{r.carrier}</td>
                      <td style={{ fontSize: '0.78rem', color: r.isVoip ? '#f87171' : '#4ade80' }}>{r.isVoip ? 'Yes' : 'No'}</td>
                      <td><span className={`badge-sm ${r.outcome}`}>{r.outcome}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
