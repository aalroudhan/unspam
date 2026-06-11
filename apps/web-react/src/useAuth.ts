import { useCallback, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';

export function useAuth() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) return;
    api.auth.me()
      .then((u) => setEmail(u.email))
      .catch(() => setToken(null));
  }, []);

  const login = useCallback(async (e: string, p: string) => {
    const { token } = await api.auth.login(e, p);
    setToken(token);
    setEmail(e);
  }, []);

  const register = useCallback(async (e: string, p: string) => {
    const { token } = await api.auth.register(e, p);
    setToken(token);
    setEmail(e);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setEmail(null);
  }, []);

  return { email, isAuthed: !!email, login, register, logout };
}
