import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { useAuth } from './useAuth';
import { useToast } from './toast';
import type { CallLog, CheckResult, Stats } from './types';
import { Header } from './components/Header';
import { ThreatBanner } from './components/ThreatBanner';
import { AuthModal } from './components/AuthModal';
import { CheckCard } from './components/CheckCard';
import { DecisionCard } from './components/DecisionCard';
import { TrendChart } from './components/TrendChart';
import { LogList } from './components/LogList';
import { ReportsCard } from './components/ReportsCard';

export function App() {
  const auth = useAuth();
  const toast = useToast();

  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [checkedNumber, setCheckedNumber] = useState('');
  const [authOpen, setAuthOpen] = useState(false);

  const loadStats = useCallback(async () => {
    try { setStats(await api.getStats()); } catch { /* ignore */ }
  }, []);

  const loadLogs = useCallback(async () => {
    try { setLogs((await api.getCalls(20)).data); } catch { /* ignore */ }
  }, []);

  const refresh = useCallback(() => { loadLogs(); loadStats(); }, [loadLogs, loadStats]);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleLogin(email: string, password: string) {
    await auth.login(email, password);
    setAuthOpen(false);
    toast('Signed in', 'success');
  }

  async function handleRegister(email: string, password: string) {
    await auth.register(email, password);
    setAuthOpen(false);
    toast('Account created', 'success');
  }

  return (
    <>
      <Header
        stats={stats}
        email={auth.email}
        onSignIn={() => setAuthOpen(true)}
        onSignOut={() => { auth.logout(); toast('Signed out', 'info'); }}
      />
      <ThreatBanner stats={stats} />

      <main>
        <CheckCard
          onChecked={(r, number) => { setResult(r); setCheckedNumber(number); }}
          onRefresh={refresh}
        />

        {result && (
          <DecisionCard
            result={result}
            number={checkedNumber}
            isAuthed={auth.isAuthed}
            onRequireAuth={() => setAuthOpen(true)}
            onRefresh={refresh}
          />
        )}

        <TrendChart stats={stats} />
        <LogList logs={logs} />
        <ReportsCard isAuthed={auth.isAuthed} onRequireAuth={() => setAuthOpen(true)} />
      </main>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </>
  );
}
