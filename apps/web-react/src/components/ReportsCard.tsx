import { useState } from 'react';
import { api } from '../api';
import { useToast } from '../toast';
import type { CarrierReport } from '../types';

interface Props {
  isAuthed: boolean;
  onRequireAuth: () => void;
}

export function ReportsCard({ isAuthed, onRequireAuth }: Props) {
  const toast = useToast();
  const [reports, setReports] = useState<CarrierReport[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [sent, setSent] = useState<Record<string, 'sending' | 'sent' | 'failed'>>({});

  async function load() {
    setLoading(true);
    try {
      setReports(await api.getReports());
    } catch {
      toast('Could not reach the API.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function send(carrier: string) {
    if (!isAuthed) { onRequireAuth(); return; }
    setSent((s) => ({ ...s, [carrier]: 'sending' }));
    try {
      await api.sendReport(carrier, testMode);
      setSent((s) => ({ ...s, [carrier]: 'sent' }));
      toast(`Complaint sent for ${carrier}`, 'success');
    } catch {
      setSent((s) => ({ ...s, [carrier]: 'failed' }));
      toast('Failed to send complaint', 'error');
    }
  }

  return (
    <div className="card">
      <div className="card-title">Carrier complaint reports</div>
      <p style={{ fontSize: '0.76rem', color: 'var(--muted)', marginBottom: '0.875rem', lineHeight: 1.5 }}>
        Groups intercepted numbers by carrier and generates a complaint email for each one.
      </p>
      <div className="test-mode-row">
        <input type="checkbox" id="test-mode" checked={testMode} onChange={(e) => setTestMode(e.target.checked)} />
        <label className="test-mode-label" htmlFor="test-mode">Test mode — redirect to my email only</label>
      </div>
      <button className="btn-secondary" onClick={load}>Generate carrier reports</button>

      <div style={{ marginTop: '0.875rem' }}>
        {loading && <p className="empty">Loading…</p>}
        {!loading && reports && reports.length === 0 && <p className="empty">No intercepted calls yet.</p>}
        {!loading && reports?.map((r) => {
          const status = sent[r.carrier];
          return (
            <div className="report-row" key={r.carrier}>
              <div>
                <div className={`report-carrier ${r.unmatched ? 'unmatched' : ''}`}>{r.carrier}</div>
                <div className="report-meta">{r.abuseEmail ?? 'No abuse contact found'}</div>
              </div>
              <div className="report-right">
                <span className="report-count">{r.numberCount} number{r.numberCount !== 1 ? 's' : ''}</span>
                {r.abuseEmail ? (
                  <button className="btn-report" onClick={() => send(r.carrier)}
                    disabled={status === 'sending' || status === 'sent'}
                    style={status === 'sent' ? { color: '#4ade80', borderColor: '#14532d' } : undefined}>
                    {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Sent ✓' : status === 'failed' ? 'Failed — retry' : 'Send complaint'}
                  </button>
                ) : (
                  <span className="btn-report no-contact">No contact</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
