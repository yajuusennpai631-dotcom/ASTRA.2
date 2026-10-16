import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { type Page } from '@/types';
import { Star, ArrowLeft, AlertCircle, Loader2, MessageCircle } from 'lucide-react';

type AdminLoginPageProps = {
  onNavigate: (page: Page) => void;
  oauthError: string | null;
};

export function AdminLoginPage({ onNavigate, oauthError }: AdminLoginPageProps) {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="min-h-[calc(100vh-64px-97px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-[#202d41] text-white grid place-items-center mx-auto mb-4">
            <Star className="w-7 h-7" fill="currentColor" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-[-0.04em]">
            管理者ログイン
          </h1>
          <p className="text-sm text-[#748399] mt-2">
            ASTRA管理ポータルにDiscordでサインイン
          </p>
        </div>

        <div className="bg-white rounded-[20px] border border-[#e6edf7] p-8 space-y-5">
          {(error || oauthError) && (
            <div className="flex items-start gap-2.5 p-3.5 bg-[#fff0f0] border border-[#f5c6c6] rounded-lg text-xs text-[#c0392b]">
              <AlertCircle className="w-4 h-4 flex-none mt-0.5" />
              <span>{error || (oauthError === 'not_admin' ? 'このDiscordアカウントには管理者権限がありません。' : 'Discord認証に失敗しました。もう一度お試しください。')}</span>
            </div>
          )}

          <button
            type="button"
            disabled={submitting}
            onClick={() => { setError(null); setSubmitting(true); signIn(); }}
            className="w-full py-3.5 rounded-[10px] bg-[#5865f2] text-white text-sm font-extrabold hover:bg-[#4752c4] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Discordへ移動中...</>
            ) : (
              <><MessageCircle className="w-4 h-4" /> Discordでログイン</>
            )}
          </button>
          <p className="text-center text-xs leading-relaxed text-[#8491a3]">ログイン可能なアカウントは管理者ID設定で許可されたDiscordユーザーのみです。</p>
        </div>

        <button
          onClick={() => onNavigate('home')}
          className="mt-6 mx-auto flex items-center gap-1.5 text-xs font-bold text-[#8491a3] hover:text-[#255cd0] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> トップページに戻る
        </button>
      </div>
    </div>
  );
}
