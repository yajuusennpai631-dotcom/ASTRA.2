import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AuthContext, type AdminUser } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const getSession = useCallback(async () => {
    const response = await fetch('/api/session', { credentials: 'same-origin' });
    if (!response.ok) throw new Error('Session request failed');
    const data = await response.json() as { user: AdminUser | null };
    return data.user;
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      setUser(await getSession());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [getSession]);

  useEffect(() => {
    void getSession()
      .then(setUser, () => setUser(null))
      .finally(() => setLoading(false));
  }, [getSession]);

  const signIn = () => { window.location.assign('/auth/discord'); };

  const signOut = async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}
