import { useState } from 'react';
import { api } from '../api';
import { useToast } from '../toast';
import type { CheckResult } from '../types';

const CIRC = 339.3; // 2π × 54

const HANDLERS = [
  { key: 'non_fixed_voip', name: 'Non-Fixed VoIP', desc: 'Disposable VoIP with no physical address (TextNow, Google Voice). Highest risk.', contrib: '+40%', prefix: false },
  { key: 'fixed_voip', name: 'Fixed VoIP', desc: 'VoIP registered to a physical address (Vonage, magicJack). Lower risk.', contrib: '+20%', prefix: false },
  { key: 'spoofed_number', name: 'Spoofing Detection', desc: 'Checks STIR/SHAKEN data for number reassignment (Twilio mode only).', contrib: '+50%', prefix: false },
  { key: 'community_flagged', name: 'Community Blocklist', desc: 'Checks how many users have flagged this number.', contrib: '+30%', prefix: true },
  { key: 'high_risk_carrier', name: 'Carrier Risk', desc: 'Flags non-fixed VoIP and prepaid carrier types as higher risk.', contrib: '+20%', prefix: true },
];

interface Props {
  result: CheckResult;
  number: string;
  isAuthed: boolean;
  onRequireAuth: () => void;
  onRefresh: () => void;
}

export function DecisionCard({ result, number, isAuthed, onRequireAuth, onRefresh }: Props) {
  const toast = useToast();
  const [flagged, setFlagged] = useState(false);

  const { outcome, score, reasons, carrier, communityFlags } = result;
  const pct = Math.round(score * 100);
  const color = pct < 40 ? '#4ade80' : pct < 60 ? '#facc15' : '#f87171';

  async function flag() {
    if (!isAuthed) { onRequireAuth(); return; }
    try {
      await api.flag(number);
      setFlagged(true);
      toast('Number flagged as spam', 'success');
      onRefresh();
    } catch {
      toast('Could not flag number', 'error');
    }
  }

  return (
    <div className="card fade-up">
      {/* Gauge */}
      <div className="gauge-wrap">
        <svg viewBox="0 0 128 128" width="128" height="128">
          <circle className="gauge-track" cx="64" cy="64" r="54" />
          <circle className="gauge-fill" cx="64" cy="64" r="54" stroke={color}
            style={{ strokeDashoffset: CIRC * (1 - score) }} />
          <text x="64" y="60" textAnchor="middle" fill={color} fontSize="22" fontWeight="800" fontFamily="Inter,sans-serif">{pct}%</text>
          <text x="64" y="76" textAnchor="middle" fill="#5a5a5a" fontSize="10" fontFamily="Inter,sans-serif">spam score</text>
        </svg>
      </div>

      {/* Verdict */}
      <div className={`verdict-strip ${outcome}`}>
        <span className="verdict-icon">{outcome === 'allowed' ? '✅' : '🚫'}</span>
        <div className="verdict-text">
          <div className="verdict-label">Verdict</div>
          <div className={`verdict-value ${outcome}`}>{outcome.charAt(0).toUpperCase() + outcome.slice(1)}</div>
        </div>
        <span className={`badge ${outcome}`}>{outcome}</span>
      </div>

      {/* Chain */}
      <div className="card-title">How the decision was made</div>
      <div className="chain">
        {HANDLERS.map((h) => {
          const reason = reasons.find((r) => (h.prefix ? r.startsWith(h.key) : r === h.key));
          const hit = !!reason;
          return (
            <div className="chain-step" key={h.key}>
              <div className="chain-left">
                <div className={`chain-dot ${hit ? 'hit' : 'pass'}`} />
                <div className="chain-line" />
              </div>
              <div className="chain-body">
                <div className={`step-name ${hit ? '' : 'pass'}`}>{h.name}</div>
                <div className="step-desc">{hit && reason ? reason.replace(/_/g, ' ') : h.desc}</div>
                {hit && <div className="step-contrib">{h.contrib} to score</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Meta */}
      <div className="meta-grid">
        <div className="meta-item">
          <div className="meta-key">Carrier</div>
          <div className="meta-val">{carrier.carrierName && carrier.carrierName !== 'Unknown' ? carrier.carrierName : (carrier.carrierType || 'unknown')}</div>
        </div>
        <div className="meta-item">
          <div className="meta-key">VoIP</div>
          <div className={`meta-val ${carrier.isVoip ? 'flagged' : 'ok'}`}>{carrier.isVoip ? 'Yes' : 'No'}</div>
        </div>
        <div className="meta-item">
          <div className="meta-key">Spoofed</div>
          <div className={`meta-val ${carrier.isSpoofed ? 'flagged' : 'ok'}`}>{carrier.isSpoofed ? 'Yes' : 'No'}</div>
        </div>
        <div className="meta-item">
          <div className="meta-key">Community flags</div>
          <div className={`meta-val ${communityFlags >= 5 ? 'flagged' : 'ok'}`}>{communityFlags}</div>
        </div>
      </div>

      {/* Flag */}
      <button className="btn-ghost" onClick={flag} disabled={flagged}>🚩 Flag this number as spam</button>
      {flagged && <div className="flag-confirm">✓ Flagged — community score updated</div>}
    </div>
  );
}
