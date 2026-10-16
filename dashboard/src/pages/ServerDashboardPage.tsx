import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, Loader2, LogOut, RefreshCw, Server, Settings2, ShieldCheck, X } from 'lucide-react';
import { api, type DashboardGuild, type DashboardUser, type GuildProfile } from '@/lib/api';

export function ServerDashboardPage() {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [guilds, setGuilds] = useState<DashboardGuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DashboardGuild | null>(null);
  const [profile, setProfile] = useState<GuildProfile | null>(null);
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await api.getDashboardSession();
      setUser(session.user);
      if (session.user) {
        try {
          setGuilds(await api.getDashboardGuilds());
        } catch {
          setGuilds([]);
          setError('サーバー一覧を読み込めませんでした。Bot APIの接続設定をご確認ください。');
        }
      } else setGuilds([]);
    } catch {
      setUser(null);
      setGuilds([]);
      setError('サーバー一覧を読み込めませんでした。しばらくしてから再試行してください。');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => { void api.getDashboardConfig().then((config) => setClientId(config.clientId)).catch(() => setClientId(null)); }, []);

  const openGuild = async (guild: DashboardGuild) => {
    setSelected(guild);
    setProfile(null);
    setNotice(null);
    try {
      const current = await api.getGuildProfile(guild.id);
      setProfile(current);
      setNickname(current.nickname || '');
    } catch {
      if (await api.getDashboardSession().then((session) => !session.user).catch(() => true)) {
        setUser(null);
        setGuilds([]);
      }
      setNotice('サーバー設定を読み込めませんでした。Botの状態を確認してください。');
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setNotice(null);
    try {
      await api.updateGuildProfile(selected.id, { nickname });
      setNotice('サーバー設定を保存しました。');
      setGuilds((items) => items.map((item) => item.id === selected.id ? { ...item, nickname: nickname || null } : item));
    } catch {
      setNotice('保存に失敗しました。Botの権限や設定内容をご確認ください。');
    } finally { setSaving(false); }
  };

  const signOut = async () => {
    try { await api.dashboardSignOut(); } finally {
      setUser(null); setGuilds([]); setSelected(null);
    }
  };

  if (loading) return <div className="flex justify-center py-28 text-[#8491a3]"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <section className="max-w-[1000px] mx-auto px-6 py-14 lg:py-20">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[#255cd0] mb-3"><Server className="w-5 h-5" /><span className="text-xs font-extrabold tracking-wider">SERVER DASHBOARD</span></div>
          <h1 className="text-3xl font-extrabold tracking-tight">サーバー管理</h1>
          <p className="text-sm text-[#748399] mt-2">Discordサーバーに導入されたASTRA Botの設定を管理できます。</p>
        </div>
        {user && <button onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-lg border border-[#e3e9f2] bg-white px-4 py-2.5 text-sm font-bold text-[#607085] hover:bg-[#f0f4fa]"><LogOut className="w-4 h-4" />ログアウト</button>}
      </div>

      {error && <div className="mb-6 flex items-center gap-2 rounded-xl border border-[#f5c6c6] bg-[#fff0f0] p-4 text-sm text-[#a52a1a]"><AlertCircle className="w-4 h-4 flex-none" />{error}<button onClick={() => void load()} className="ml-auto inline-flex items-center gap-1 font-bold"><RefreshCw className="w-4 h-4" />再試行</button></div>}

      {!user ? (
        <div className="rounded-2xl border border-[#e3e9f2] bg-white p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-10 w-10 text-[#255cd0]" />
          <h2 className="mt-4 text-xl font-extrabold">Discordでログイン</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-[#748399]">ログインすると、あなたが所有するサーバーまたは管理権限を持つサーバーを表示します。サーバー管理の権限確認にのみDiscord情報を利用します。</p>
          {new URLSearchParams(window.location.search).has('dashboard_error') && <p className="mt-3 text-sm text-[#c0392b]">Discord認証に失敗しました。もう一度お試しください。</p>}
          <a href="/auth/dashboard/discord" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#5865f2] px-6 py-3.5 text-sm font-extrabold text-white hover:bg-[#4752c4]">Discordでログイン</a>
        </div>
      ) : selected ? (
        <div className="rounded-2xl border border-[#e3e9f2] bg-white p-6 shadow-sm sm:p-8">
          <button onClick={() => { setSelected(null); setNotice(null); }} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#607085] hover:text-[#255cd0]"><ArrowLeft className="w-4 h-4" />サーバー一覧へ戻る</button>
          <div className="flex items-center gap-4 border-b border-[#e9eef5] pb-6">
            {selected.icon_url ? <img src={selected.icon_url} alt="" className="h-14 w-14 rounded-2xl object-cover" /> : <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#eaf0fb] font-extrabold text-[#255cd0]">{selected.initials}</div>}
            <div><h2 className="text-xl font-extrabold">{selected.name}</h2><p className="mt-1 text-xs text-[#8491a3]">Botの外観設定</p></div>
          </div>
          {notice && <p className="mt-5 rounded-lg bg-[#f0f5ff] p-3 text-sm text-[#255cd0]">{notice}</p>}
          {profile ? <form onSubmit={(event) => void save(event)} className="mt-6 space-y-6">
            <label className="block"><span className="mb-2 block text-sm font-bold">サーバー内ニックネーム</span><input maxLength={32} value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="空欄にすると既定の名前に戻します" className="w-full rounded-xl border border-[#dce4ef] bg-[#fbfcfe] px-4 py-3 text-sm outline-none focus:border-[#255cd0]" /><span className="mt-1 block text-xs text-[#8491a3]">最大32文字</span></label>
            <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#255cd0] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#1e4db8] disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? '保存中...' : '変更を保存'}</button>
          </form> : !notice && <div className="py-10 text-center text-[#8491a3]"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>}
        </div>
      ) : (
        <>
          <div className="mb-5 flex items-center justify-between"><h2 className="text-sm font-extrabold text-[#4c6079]">管理可能なサーバー</h2><button onClick={() => void load()} className="inline-flex items-center gap-1 text-xs font-bold text-[#607085] hover:text-[#255cd0]"><RefreshCw className="h-3.5 w-3.5" />更新</button></div>
          {guilds.length ? <div className="grid gap-3">{guilds.map((guild) => <article key={guild.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e3e9f2] bg-white p-4 shadow-sm sm:p-5"><div className="flex min-w-0 items-center gap-3">{guild.icon_url ? <img src={guild.icon_url} alt="" className="h-12 w-12 rounded-xl object-cover" /> : <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-[#eaf0fb] text-sm font-extrabold text-[#255cd0]">{guild.initials}</div>}<div className="min-w-0"><h3 className="truncate font-extrabold">{guild.name}</h3><p className="mt-1 text-xs text-[#8491a3]">{guild.is_bot_installed ? `Bot導入済み${guild.nickname ? ` · ${guild.nickname}` : ''}` : 'Bot未導入'}</p></div></div>{guild.is_bot_installed ? <button onClick={() => void openGuild(guild)} className="inline-flex items-center gap-2 rounded-lg bg-[#edf3ff] px-4 py-2.5 text-sm font-bold text-[#255cd0] hover:bg-[#dfeaff]"><Settings2 className="h-4 w-4" />設定</button> : <a target="_blank" rel="noreferrer" href={`https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId || '')}&scope=bot&permissions=8&guild_id=${encodeURIComponent(guild.id)}`} className="rounded-lg bg-[#255cd0] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1e4db8]">Botを追加 ↗</a>}</article>)}</div> : <div className="rounded-2xl border border-dashed border-[#d5deea] bg-white p-10 text-center text-sm text-[#748399]">管理可能なサーバーが見つかりませんでした。</div>}
        </>
      )}
      <p className="mt-8 flex items-start gap-2 text-xs leading-6 text-[#8491a3]"><X className="mt-1 h-3.5 w-3.5 flex-none" />ニックネーム変更にはBotがサーバーに導入されていることと、Botにニックネーム変更の権限が必要です。</p>
    </section>
  );
}