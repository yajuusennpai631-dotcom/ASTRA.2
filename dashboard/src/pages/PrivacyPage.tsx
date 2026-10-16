import { Shield } from 'lucide-react';

const sections = [
  {
    title: '第1条（はじめに）',
    body: 'ASTRA共同開発プロジェクト（以下「当プロジェクト」）は、本Botおよび本公式サイトの利用者（以下「ユーザー」）のプライバシーを尊重し、個人情報の保護に努めます。本ポリシーは、当プロジェクトが収集する情報とその利用目的、管理方法について定めるものです。',
  },
  {
    title: '第2条（収集する情報）',
    body: '当プロジェクトは、以下の情報を収集する場合があります。\n\n・DiscordのユーザーID、サーバーID、ユーザー名\n・本Botの利用に伴うコマンド実行履歴\n・本Botの機能提供に必要なサーバー設定情報\n\n当プロジェクトは、氏名、電話番号、住所などの個人情報を意図的に収集することはありません。',
  },
  {
    title: '第3条（情報の利用目的）',
    body: '収集した情報は、以下の目的で利用します。\n\n・本Botの機能提供および維持・改善\n・トラブルシューティングおよびサポート対応\n・利用状況の分析によるサービス品質の向上\n・メンテナンスやアップデートの通知',
  },
  {
    title: '第4条（情報の第三者提供）',
    body: '当プロジェクトは、以下の場合を除き、ユーザーの情報を第三者に提供することはありません。\n\n・ユーザーの同意がある場合\n・法令に基づき開示が要求された場合\n・人の生命、身体または財産の保護のために必要がある場合',
  },
  {
    title: '第5条（情報の管理）',
    body: '当プロジェクトは、収集した情報を適切に管理し、不正アクセス、紛失、改ざん、漏洩などを防止するための合理的な安全措置を講じます。',
  },
  {
    title: '第6条（Discordの規約）',
    body: '本BotはDiscordのAPIを利用して動作します。Discordが収集する情報およびその取り扱いについては、Discordのプライバシーポリシーおよび開発者規約をご確認ください。当プロジェクトはDiscord社およびその関連会社とは関係がありません。',
  },
  {
    title: '第7条（Cookieの使用）',
    body: '本サイトでは、利便性の向上およびアクセス分析のためにCookieを使用する場合があります。ユーザーはブラウザの設定によりCookieの使用を無効にすることができます。',
  },
  {
    title: '第8条（プライバシーポリシーの変更）',
    body: '当プロジェクトは、必要に応じて本ポリシーを変更することができます。変更後のポリシーは、本サイト上に掲載された時点で効力を生じるものとします。',
  },
  {
    title: '第9条（お問い合わせ）',
    body: '本ポリシーに関するご質問や、ご自身の情報の開示・削除をご希望の場合は、公式Discordサーバーまでお問い合わせください。合理的な期間内に対応いたします。',
  },
];

export function PrivacyPage() {
  return (
    <div className="max-w-[860px] mx-auto px-6 lg:px-8 py-16 lg:py-20">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-[#edf3ff] grid place-items-center">
          <Shield className="w-5 h-5 text-[#255cd0]" />
        </div>
        <span className="text-[11px] font-extrabold tracking-[0.19em] uppercase text-[#346bd2]">
          LEGAL
        </span>
      </div>
      <h1 className="text-3xl lg:text-4xl font-extrabold tracking-[-0.06em] mb-3">
        プライバシーポリシー
      </h1>
      <p className="text-sm text-[#8491a3] mb-10">
        最終更新日：2026年10月1日
      </p>

      <div className="bg-white rounded-[20px] border border-[#e6edf7] p-8 lg:p-10 space-y-8">
        {sections.map((section, i) => (
          <div key={i}>
            <h2 className="text-base font-extrabold tracking-[-0.02em] mb-3 text-[#1c2d4e]">
              {section.title}
            </h2>
            <p className="text-sm text-[#4c6079] leading-[2] whitespace-pre-wrap">
              {section.body}
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-[#8491a3] mt-8 text-center">
        本ポリシーに関するご質問は、公式Discordサーバーまでお問い合わせください。
      </p>
    </div>
  );
}
