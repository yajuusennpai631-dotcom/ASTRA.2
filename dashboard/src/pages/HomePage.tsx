import { type Page } from '@/types';
import { Star, Terminal, Bell, HelpCircle, ArrowRight, ArrowDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api, type NewsItem } from '@/lib/api';

type HomePageProps = {
  onNavigate: (page: Page) => void;
};

export function HomePage({ onNavigate }: HomePageProps) {
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLatestNews(await api.getNews(3));
      } catch {
        setLatestNews([]);
      }
    })();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_90%_10%,#eaf2ff,transparent_40%),#f8fafc]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16 lg:py-20 grid lg:grid-cols-[47%_53%] gap-10 items-center">
          <div>
            <div className="text-[11px] font-extrabold tracking-[0.09em] text-[#346bd2]">
              ASTRA OFFICIAL SERVICE
            </div>
            <h1 className="mt-5 text-4xl lg:text-5xl font-extrabold tracking-[-0.07em] leading-[1.23]">
              サーバー運営を
              <br />
              もっと、スマートに。
            </h1>
            <p className="mt-5 text-[13px] text-[#748399] leading-[2] max-w-[470px]">
              機能も、使い方も、お知らせも。
              <br />
              必要な情報がひとつにまとまったASTRA公式ポータル。
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[10px] bg-[#225bd1] text-white text-[13px] font-extrabold shadow-[0_10px_24px_#2464db23] hover:translate-y-[-2px] transition-transform"
              >
                ASTRAを導入 ↗
              </a>
              <button
                onClick={() => onNavigate('news')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[10px] border border-[#c7d3e3] text-[#294467] text-[13px] font-extrabold hover:bg-[#f0f4fa] transition-colors"
              >
                機能・お知らせを見る <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Console mockup */}
          <div className="hidden lg:block">
            <div
              className="min-h-[380px] bg-white rounded-[20px] border border-[#e1e8f3] shadow-[0_27px_60px_#3d608019] overflow-hidden ml-5"
              style={{ transform: 'perspective(900px) rotateY(-5deg) rotateX(2deg)' }}
            >
              <div className="px-5 py-4 flex items-center justify-between border-b border-[#eaf0f5] text-xs font-extrabold">
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-[#255cd0]" fill="currentColor" /> ASTRA / CONTROL CENTER
                </span>
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-[#d8e2ef] rounded-full" />
                  <span className="w-2 h-2 bg-[#d8e2ef] rounded-full" />
                  <span className="w-2 h-2 bg-[#d8e2ef] rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-[116px_1fr] min-h-[300px]">
                <div className="bg-[#f7f9fd] p-5 border-r border-[#eaf0f6]">
                  <div className="p-3 text-[10px] font-extrabold text-[#2459c5] bg-[#eaf1ff] rounded-lg">概要</div>
                  <div className="p-3 text-[10px] font-extrabold text-[#8e9cae]">機能</div>
                  <div className="p-3 text-[10px] font-extrabold text-[#8e9cae]">コマンド</div>
                  <div className="p-3 text-[10px] font-extrabold text-[#8e9cae]">お知らせ</div>
                </div>
                <div className="p-6 lg:p-7">
                  <h4 className="text-[17px] font-extrabold m-0">ようこそ、ASTRAへ。</h4>
                  <p className="text-[10px] text-[#93a0af] leading-[1.8] mt-2">
                    サーバーに必要な機能と情報へ、すばやくアクセスできます。
                  </p>
                  <div className="flex items-center gap-2 border border-[#e9eef5] bg-[#f8fafc] rounded-lg p-3 mt-5 text-[11px] text-[#4c6079]">
                    <span className="w-2 h-2 rounded-full bg-[#64cc99] shadow-[0_0_0_4px_#64cc9920]" />
                    ASTRAポータル
                    <span className="ml-auto text-[#8da0b8] text-[10px]">DEMO VIEW</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 mt-3">
                    <div className="bg-[#eff4fc] border border-[#e2ecfa] p-3.5 rounded-[9px]">
                      <span className="text-[10px] text-[#7a8eab]">基本ガイド</span>
                      <b className="block text-sm mt-1.5 text-[#284a7e]">はじめての方へ →</b>
                    </div>
                    <div className="bg-[#eff4fc] border border-[#e2ecfa] p-3.5 rounded-[9px]">
                      <span className="text-[10px] text-[#7a8eab]">コマンド一覧</span>
                      <b className="block text-sm mt-1.5 text-[#284a7e]">機能を探す →</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-20 max-w-[1190px] mx-auto px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-[11px] font-extrabold tracking-[0.19em] uppercase text-[#396fd0]">
            YOUR PORTAL
          </span>
          <h2 className="text-2xl lg:text-3xl font-extrabold tracking-[-0.05em] mt-2.5">
            必要な情報をすぐ見つける
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Terminal, title: 'コマンドを探す', desc: 'カテゴリごとに整理し、利用方法へすばやくアクセス。' },
            { icon: Bell, title: '最新のお知らせ', desc: '更新履歴やメンテナンス情報を掲載するエリア。' },
            { icon: HelpCircle, title: 'よくある質問', desc: '導入方法や困ったときの解決策をわかりやすく。' },
          ].map((card) => (
            <article
              key={card.title}
              className="p-7 border border-[#e6edf7] rounded-[15px] bg-white hover:border-[#a8c6f5] transition-colors"
            >
              <div className="h-11 w-11 rounded-xl bg-[#edf3ff] grid place-items-center mb-5">
                <card.icon className="w-5 h-5 text-[#255cd0]" />
              </div>
              <h3 className="text-base font-extrabold tracking-[-0.025em] mb-2.5">{card.title}</h3>
              <p className="text-xs text-[#708196] leading-[1.95]">{card.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Latest News Preview */}
      {latestNews.length > 0 && (
        <section className="py-12 lg:py-16 bg-[#f0f4fa]">
          <div className="max-w-[1190px] mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl lg:text-2xl font-extrabold tracking-[-0.04em]">最新のお知らせ</h2>
              <button
                onClick={() => onNavigate('news')}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#255cd0] hover:gap-2.5 transition-all"
              >
                すべて見る <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {latestNews.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate('news')}
                  className="text-left p-5 bg-white rounded-[15px] border border-[#e6edf7] hover:border-[#a8c6f5] transition-colors"
                >
                  <span className="inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#edf3ff] text-[#255cd0] mb-3">
                    {item.category}
                  </span>
                  <h3 className="text-sm font-extrabold leading-snug mb-2">{item.title}</h3>
                  <span className="text-xs text-[#8491a3]">
                    {new Date(item.published_at).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 text-center px-6">
        <div className="max-w-[700px] mx-auto">
          <h2 className="text-2xl font-extrabold tracking-[-0.04em] mb-3">あなたのサーバーにも、ASTRAを。</h2>
          <p className="text-sm text-[#8390a1] mb-7">
            共同開発から生まれる、新しいDiscord体験。
          </p>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[10px] bg-[#225bd1] text-white text-[13px] font-extrabold shadow-[0_10px_24px_#2464db23] hover:translate-y-[-2px] transition-transform"
          >
            Botを追加する ↗
          </a>
        </div>
      </section>
    </div>
  );
}
