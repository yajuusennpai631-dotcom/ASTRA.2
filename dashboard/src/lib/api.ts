export type NewsItem = {
  id: string;
  title: string;
  body: string;
  category: string;
  published_at: string;
  created_at: string;
};

export type NewsInput = Pick<NewsItem, 'title' | 'body' | 'category' | 'published_at'>;

export type DashboardUser = { id: string; username: string; avatar: string | null };
export type DashboardGuild = {
  id: string; name: string; icon_url: string | null; initials: string;
  is_bot_installed: boolean; nickname: string | null;
};
export type GuildProfile = { nickname: string | null };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  getNews: (limit?: number) => request<NewsItem[]>(`/api/news${limit ? `?limit=${limit}` : ''}`),
  createNews: (input: NewsInput) => request<NewsItem>('/api/news', { method: 'POST', body: JSON.stringify(input) }),
  updateNews: (id: string, input: NewsInput) => request<{ ok: true }>(`/api/news/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteNews: (id: string) => request<{ ok: true }>(`/api/news/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getDashboardSession: () => request<{ user: DashboardUser | null }>('/api/dashboard/session'),
  getDashboardConfig: () => request<{ clientId: string | null }>('/api/dashboard/config'),
  getDashboardGuilds: () => request<DashboardGuild[]>('/api/dashboard/guilds'),
  getGuildProfile: (id: string) => request<GuildProfile>(`/api/dashboard/guilds/${encodeURIComponent(id)}/profile`),
  updateGuildProfile: (id: string, input: { nickname: string }) => request<{ ok: true }>(`/api/dashboard/guilds/${encodeURIComponent(id)}/profile`, { method: 'PATCH', body: JSON.stringify(input) }),
  dashboardSignOut: () => fetch('/auth/dashboard/logout', { method: 'POST', credentials: 'same-origin' }),
};