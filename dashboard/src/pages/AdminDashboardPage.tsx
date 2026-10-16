import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/useAuth';
import { type Page } from '@/types';
import { api, type NewsItem } from '@/lib/api';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  LogOut,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Calendar,
} from 'lucide-react';

type AdminDashboardPageProps = {
  onNavigate: (page: Page) => void;
};

const categories = ['お知らせ', 'アップデート', 'メンテナンス'];

type EditState = {
  id?: string;
  title: string;
  body: string;
  category: string;
  published_at: string;
};

const emptyForm: EditState = {
  title: '',
  body: '',
  category: 'お知らせ',
  published_at: new Date().toISOString().slice(0, 10),
};

export function AdminDashboardPage({ onNavigate }: AdminDashboardPageProps) {
  const { user, signOut, loading } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EditState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      onNavigate('admin-login');
    }
  }, [loading, user, onNavigate]);

  const fetchNews = useCallback(async () => {
    setDataLoading(true);
    setError(null);
    try {
      setNews(await api.getNews());
    } catch {
      setError('お知らせの読み込みに失敗しました。');
    }
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (user) void Promise.resolve().then(() => fetchNews());
  }, [user, fetchNews]);

  const openCreate = () => {
    setForm(emptyForm);
    setActionError(null);
    setShowForm(true);
  };

  const openEdit = (item: NewsItem) => {
    setForm({
      id: item.id,
      title: item.title,
      body: item.body,
      category: item.category,
      published_at: item.published_at.slice(0, 10),
    });
    setActionError(null);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setActionError(null);

    const payload = {
      title: form.title,
      body: form.body,
      category: form.category,
      published_at: new Date(form.published_at).toISOString(),
    };

    try {
      if (form.id) await api.updateNews(form.id, payload);
      else await api.createNews(payload);
    } catch {
      setActionError(form.id ? '更新に失敗しました。' : '追加に失敗しました。');
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowForm(false);
    fetchNews();
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteNews(id);
    } catch {
      setActionError('削除に失敗しました。');
      return;
    }
    setDeleteId(null);
    fetchNews();
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate('home');
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center py-24 text-[#8491a3]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.04em]">お知らせ管理</h1>
          <p className="text-xs text-[#8491a3] mt-1.5">
            Discord: {user.username} としてログイン中
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#225bd1] text-white rounded-lg text-xs font-extrabold hover:bg-[#1e4db8] transition-colors"
          >
            <Plus className="w-4 h-4" /> 新規追加
          </button>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#e3e9f2] text-[#607085] rounded-lg text-xs font-bold hover:bg-[#f0f4fa] transition-colors"
          >
            <LogOut className="w-4 h-4" /> ログアウト
          </button>
        </div>
      </div>

      {actionError && (
        <div className="flex items-center gap-2.5 p-3.5 bg-[#fff0f0] border border-[#f5c6c6] rounded-lg text-xs text-[#c0392b] mb-5">
          <AlertCircle className="w-4 h-4 flex-none" />
          {actionError}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-[#fff0f0] border border-[#f5c6c6] rounded-lg text-xs text-[#c0392b] mb-5">
          <AlertCircle className="w-4 h-4 flex-none" />
          {error}
        </div>
      )}

      {/* Table */}
      {dataLoading ? (
        <div className="flex items-center justify-center py-16 text-[#8491a3]">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-16 text-[#8491a3]">
          <p className="text-sm">お知らせがまだありません。「新規追加」から作成してください。</p>
        </div>
      ) : (
        <div className="bg-white rounded-[15px] border border-[#e6edf7] overflow-hidden">
          <div className="hidden md:grid grid-cols-[110px_120px_1fr_auto] gap-4 px-6 py-3.5 border-b border-[#e6edf7] text-[11px] font-extrabold text-[#8491a3] uppercase tracking-wider">
            <span>日付</span>
            <span>カテゴリ</span>
            <span>タイトル</span>
            <span>操作</span>
          </div>
          {news.map((item) => (
            <div
              key={item.id}
              className="grid md:grid-cols-[110px_120px_1fr_auto] gap-2 md:gap-4 px-6 py-4 border-b border-[#f0f4fa] last:border-0 items-center hover:bg-[#f9fbfd] transition-colors"
            >
              <span className="text-xs text-[#8491a3] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 md:hidden" />
                {new Date(item.published_at).toLocaleDateString('ja-JP', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <span className="inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#edf3ff] text-[#255cd0] w-fit">
                {item.category}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{item.title}</p>
                <p className="text-xs text-[#8491a3] truncate mt-0.5">{item.body}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEdit(item)}
                  className="p-2 rounded-lg text-[#607085] hover:bg-[#edf3ff] hover:text-[#255cd0] transition-colors"
                  aria-label="編集"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(item.id)}
                  className="p-2 rounded-lg text-[#607085] hover:bg-[#fff0f0] hover:text-[#c0392b] transition-colors"
                  aria-label="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => onNavigate('home')}
        className="mt-6 flex items-center gap-1.5 text-xs font-bold text-[#8491a3] hover:text-[#255cd0] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> トップページに戻る
      </button>

      {/* Create/Edit Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-6"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-[20px] max-w-[560px] w-full max-h-[85vh] overflow-y-auto p-7 lg:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-extrabold tracking-[-0.03em]">
                {form.id ? 'お知らせを編集' : '新しいお知らせ'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg text-[#8491a3] hover:bg-[#f0f4fa] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4c6079] mb-2">タイトル</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="お知らせのタイトル"
                  className="w-full px-4 py-3 rounded-[10px] border border-[#e3e9f2] text-sm bg-[#f9fbfd] focus:outline-none focus:border-[#255cd0] focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#4c6079] mb-2">カテゴリ</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-[10px] border border-[#e3e9f2] text-sm bg-[#f9fbfd] focus:outline-none focus:border-[#255cd0] focus:bg-white transition-colors"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4c6079] mb-2">公開日</label>
                  <input
                    type="date"
                    required
                    value={form.published_at}
                    onChange={(e) => setForm({ ...form, published_at: e.target.value })}
                    className="w-full px-4 py-3 rounded-[10px] border border-[#e3e9f2] text-sm bg-[#f9fbfd] focus:outline-none focus:border-[#255cd0] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4c6079] mb-2">本文</label>
                <textarea
                  required
                  rows={6}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="お知らせの内容を入力してください..."
                  className="w-full px-4 py-3 rounded-[10px] border border-[#e3e9f2] text-sm bg-[#f9fbfd] focus:outline-none focus:border-[#255cd0] focus:bg-white transition-colors resize-y"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-[10px] bg-[#225bd1] text-white text-sm font-extrabold hover:bg-[#1e4db8] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> 保存中...
                    </>
                  ) : form.id ? (
                    '更新する'
                  ) : (
                    '追加する'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 rounded-[10px] border border-[#e3e9f2] text-[#607085] text-sm font-bold hover:bg-[#f0f4fa] transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-6"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="bg-white rounded-[20px] max-w-[400px] w-full p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-12 w-12 rounded-xl bg-[#fff0f0] grid place-items-center mb-4">
              <Trash2 className="w-6 h-6 text-[#c0392b]" />
            </div>
            <h3 className="text-base font-extrabold mb-2">このお知らせを削除しますか？</h3>
            <p className="text-xs text-[#748399] leading-relaxed mb-6">
              削除すると元に戻せません。本当によろしいですか？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-3 rounded-[10px] bg-[#c0392b] text-white text-sm font-extrabold hover:bg-[#a52a1a] transition-colors"
              >
                削除する
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="px-6 py-3 rounded-[10px] border border-[#e3e9f2] text-[#607085] text-sm font-bold hover:bg-[#f0f4fa] transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
