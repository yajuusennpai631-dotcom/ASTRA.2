import { type Page } from '@/types';
import { Star, Menu, X } from 'lucide-react';
import { useState } from 'react';

type LayoutProps = {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
};

const navItems: { label: string; page: Page }[] = [
  { label: 'ホーム', page: 'home' },
  { label: '開発者紹介', page: 'developers' },
  { label: 'お知らせ', page: 'news' },
  { label: 'サーバー管理', page: 'server-dashboard' },
  { label: '利用規約', page: 'terms' },
  { label: 'プライバシーポリシー', page: 'privacy' },
];

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (page: Page) => {
    onNavigate(page);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#182134] flex flex-col">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e3e9f2]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="h-16 flex items-center justify-between">
            <button
              onClick={() => handleNav('home')}
              className="flex items-center gap-2.5 flex-none"
            >
              <span className="h-9 w-9 rounded-[10px] bg-[#202d41] text-white grid place-items-center">
                <Star className="w-5 h-5" fill="currentColor" />
              </span>
              <span className="leading-none">
                <span className="block text-xl font-extrabold tracking-[0.055em]">ASTRA</span>
                <span className="block text-[9px] font-bold tracking-[0.13em] text-[#7d8aa0] mt-1.5">
                  BOT SERVICE PORTAL
                </span>
              </span>
            </button>

            <nav className="hidden md:flex items-center gap-7">
              {navItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => handleNav(item.page)}
                  className={`text-xs font-bold transition-colors ${
                    currentPage === item.page
                      ? 'text-[#255cd0]'
                      : 'text-[#607085] hover:text-[#1261db]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="px-4 py-2.5 bg-[#255cd0] text-white rounded-lg text-xs font-bold hover:bg-[#1e4db8] transition-colors"
              >
                Botを導入 ↗
              </a>
            </nav>

            <button
              className="md:hidden p-2 text-[#202d41]"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="メニュー"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="md:hidden border-t border-[#e3e9f2] bg-white">
            <div className="max-w-[1280px] mx-auto px-6 py-4 flex flex-col gap-3">
              {navItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => handleNav(item.page)}
                  className={`text-sm font-bold text-left py-2 ${
                    currentPage === item.page ? 'text-[#255cd0]' : 'text-[#607085]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="px-4 py-2.5 bg-[#255cd0] text-white rounded-lg text-sm font-bold text-center mt-1"
              >
                Botを導入 ↗
              </a>
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#e5ebf2] bg-white py-8 px-6 lg:px-10">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-[#202d41] text-white grid place-items-center">
              <Star className="w-4 h-4" fill="currentColor" />
            </span>
            <span className="font-extrabold text-sm">ASTRA</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 justify-center">
            <button onClick={() => handleNav('terms')} className="text-xs text-[#8491a3] hover:text-[#255cd0] transition-colors">
              利用規約
            </button>
            <button onClick={() => handleNav('privacy')} className="text-xs text-[#8491a3] hover:text-[#255cd0] transition-colors">
              プライバシーポリシー
            </button>
            <button onClick={() => handleNav('developers')} className="text-xs text-[#8491a3] hover:text-[#255cd0] transition-colors">
              開発者紹介
            </button>
            <button onClick={() => handleNav('admin-login')} className="text-xs text-[#b8c2d0] hover:text-[#255cd0] transition-colors">
              管理者
            </button>
          </div>
          <p className="text-xs text-[#8491a3]">
            © 2026 ASTRA Joint Development Project
          </p>
        </div>
      </footer>
    </div>
  );
}
