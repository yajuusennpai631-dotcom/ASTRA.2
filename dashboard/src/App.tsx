import { useState, useEffect } from 'react';
import { type Page } from '@/types';
import { AuthProvider } from '@/lib/auth';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { DevelopersPage } from '@/pages/DevelopersPage';
import { NewsPage } from '@/pages/NewsPage';
import { TermsPage } from '@/pages/TermsPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { AdminLoginPage } from '@/pages/AdminLoginPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { ServerDashboardPage } from '@/pages/ServerDashboardPage';

function pageFromLocation(): Page {
  const params = new URLSearchParams(window.location.search);
  if (params.has('error')) return 'admin-login';
  if (window.location.pathname === '/dashboard') return 'server-dashboard';
  if (params.has('dashboard_error')) return 'home';

  const hash = window.location.hash.slice(1);
  const validPages: Page[] = [
    'home', 'developers', 'news', 'terms', 'privacy',
    'admin-login', 'admin-dashboard',
  ];
  return validPages.includes(hash as Page) ? hash as Page : 'home';
}

function App() {
  const [page, setPage] = useState<Page>(pageFromLocation);
  const [oauthError] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get('error'),
  );

  const handleNavigate = (next: Page) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (oauthError) {
      window.history.replaceState(null, '', `${window.location.pathname}#admin-login`);
    }
  }, [oauthError]);

  useEffect(() => {
    const nextUrl = page === 'server-dashboard' ? '/dashboard' : `/#${page}`;
    if (`${window.location.pathname}${window.location.hash}` !== nextUrl) {
      window.history.pushState(null, '', nextUrl);
    }
  }, [page]);

  useEffect(() => {
    const syncPage = () => setPage(pageFromLocation());
    window.addEventListener('popstate', syncPage);
    window.addEventListener('hashchange', syncPage);
    return () => {
      window.removeEventListener('popstate', syncPage);
      window.removeEventListener('hashchange', syncPage);
    };
  }, []);

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'developers':
        return <DevelopersPage />;
      case 'news':
        return <NewsPage />;
      case 'terms':
        return <TermsPage />;
      case 'privacy':
        return <PrivacyPage />;
      case 'server-dashboard':
        return <ServerDashboardPage />;
      case 'admin-login':
        return <AdminLoginPage onNavigate={handleNavigate} oauthError={oauthError} />;
      case 'admin-dashboard':
        return <AdminDashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <AuthProvider>
      <Layout currentPage={page} onNavigate={handleNavigate}>
        {renderPage()}
      </Layout>
    </AuthProvider>
  );
}

export default App;
