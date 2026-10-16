import { useState, useEffect } from 'react';
import { api, type NewsItem } from '@/lib/api';
import { Bell, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

const categoryColors: Record<string, string> = {
  'お知らせ': 'bg-[#edf3ff] text-[#255cd0]',
  'アップデート': 'bg-[#e8f9f0] text-[#2ba572]',
  'メンテナンス': 'bg-[#fff4e6] text-[#d97706]',
};

export function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        setNews(await api.getNews());
      } catch {
        setError('お知らせの読み込みに失敗しました。しばらくしてからもう一度お試しください。');
      }
      setLoading(false);
    })();
  }, []);

  const categories = ['all', ...Array.from(new Set(news.map((n) => n.category)))];
  const filteredNews = selectedCategory === 'all'
    ? news
    : news.filter((n) => n.category === selectedCategory);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div className="max-w-[1190px] mx-auto px-6 lg:px-8 py-16 lg:py-20">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-[#edf3ff] grid place-items-center">
            <Bell className="w-5 h-5 text-[#255cd0]" />
          </div>
          <span className="text-[11px] font-extrabold tracking-[0.19em] uppercase text-[#346bd2]">
            ANNOUNCEMENTS
          </span>
        </div>
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-[-0.06em]">お知らせ</h1>
        <p className="text-sm text-[#748399] mt-3">
          ASTRAの最新情報、アップデート、メンテナンスのお知らせをお届けします。
        </p>
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#1c2d4e] text-white'
                  : 'bg-white border border-[#e3e9f2] text-[#607085] hover:bg-[#f0f4fa]'
              }`}
            >
              {cat === 'all' ? 'すべて' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-[#8491a3]">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-[#255cd0]" />
          <p className="text-sm">読み込み中...</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-5 bg-[#fff0f0] border border-[#f5c6c6] rounded-xl text-sm text-[#c0392b]">
          <AlertCircle className="w-5 h-5 flex-none" />
          {error}
        </div>
      )}

      {!loading && !error && filteredNews.length === 0 && (
        <div className="text-center py-20 text-[#8491a3]">
          <p className="text-sm">該当するお知らせはありません。</p>
        </div>
      )}

      {!loading && !error && filteredNews.length > 0 && (
        <div className="space-y-3">
          {filteredNews.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedNews(item)}
              className="w-full text-left p-5 lg:p-6 bg-white rounded-[15px] border border-[#e6edf7] hover:border-[#a8c6f5] hover:shadow-[0_8px_20px_#182d4c06] transition-all flex items-center gap-4 lg:gap-6"
            >
              <div className="flex-none text-center min-w-[80px]">
                <span className="text-xs text-[#8491a3] block">
                  {formatDate(item.published_at)}
                </span>
              </div>
              <div className="flex-none">
                <span
                  className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                    categoryColors[item.category] || 'bg-[#f0f4fa] text-[#607085]'
                  }`}
                >
                  {item.category}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-extrabold truncate">{item.title}</h3>
                <p className="text-xs text-[#8491a3] mt-1.5 line-clamp-1">{item.body}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#c7d3e3] flex-none" />
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedNews && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-6"
          onClick={() => setSelectedNews(null)}
        >
          <div
            className="bg-white rounded-[20px] max-w-[600px] w-full max-h-[80vh] overflow-y-auto p-8 lg:p-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <span
                className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                  categoryColors[selectedNews.category] || 'bg-[#f0f4fa] text-[#607085]'
                }`}
              >
                {selectedNews.category}
              </span>
              <span className="text-xs text-[#8491a3]">
                {formatDate(selectedNews.published_at)}
              </span>
            </div>
            <h2 className="text-xl lg:text-2xl font-extrabold tracking-[-0.04em] mb-4">
              {selectedNews.title}
            </h2>
            <p className="text-sm text-[#4c6079] leading-[2] whitespace-pre-wrap">
              {selectedNews.body}
            </p>
            <button
              onClick={() => setSelectedNews(null)}
              className="mt-7 w-full py-3 rounded-[10px] bg-[#f0f4fa] text-[#4c6079] text-sm font-bold hover:bg-[#e3e9f2] transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
