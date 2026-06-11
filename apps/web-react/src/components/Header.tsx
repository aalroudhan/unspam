import type { Stats } from '../types';
import { CountUp } from './CountUp';

interface Props {
  stats: Stats | null;
  email: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function Header({ stats, email, onSignIn, onSignOut }: Props) {
  return (
    <header>
      <div className="logo">
        <div className="logo-mark">🛡</div>
        Unspam
      </div>

      {stats && (
        <div className="header-stats">
          <div className="hstat">
            <div className="hstat-val blue"><CountUp value={stats.total} /></div>
            <div className="hstat-label">Checked</div>
          </div>
          <div className="hstat">
            <div className="hstat-val red"><CountUp value={stats.blocked} /></div>
            <div className="hstat-label">Blocked</div>
          </div>
          <div className="hstat">
            <div className="hstat-val">{stats.blockedRate}%</div>
            <div className="hstat-label">Block rate</div>
          </div>
        </div>
      )}

      <div className="header-right">
        <span className="mode-pill">Mode A</span>
        {email ? (
          <div className="user-pill">
            <div className="user-avatar">{email[0].toUpperCase()}</div>
            <span>{email}</span>
            <button className="btn-signout" onClick={onSignOut}>Sign out</button>
          </div>
        ) : (
          <button className="btn-signin" onClick={onSignIn}>Sign in</button>
        )}
      </div>
    </header>
  );
}
