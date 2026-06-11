import { useEffect, useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string) => Promise<void>;
}

export function AuthModal({ open, onClose, onLogin, onRegister }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  async function submit() {
    if (!email || !password) { setError('Email and password are required'); return; }
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') await onLogin(email, password);
      else await onRegister(email, password);
      setEmail(''); setPassword('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-logo">
          <div className="logo-mark">🛡</div>
          <div>
            <div className="modal-title">Unspam</div>
            <div className="modal-sub">Sign in to flag numbers and send carrier complaints</div>
          </div>
        </div>
        <div className="modal-tabs">
          <button className={`modal-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>Sign in</button>
          <button className={`modal-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>Create account</button>
        </div>
        {error && <div className="auth-error">{error}</div>}
        <label className="field-label">Email</label>
        <input className="field-input" type="email" value={email} placeholder="you@example.com"
          onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <label className="field-label">Password</label>
        <input className="field-input" type="password" value={password} placeholder="••••••••"
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        <button className="btn-auth" onClick={submit} disabled={busy}>
          {busy ? '…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </div>
    </div>
  );
}
