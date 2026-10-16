import { createContext } from 'react';

export type AdminUser = { id: string; username: string; avatar: string | null };

type AuthContextType = {
  user: AdminUser | null;
  loading: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);