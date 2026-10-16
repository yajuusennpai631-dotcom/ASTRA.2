import { FileText } from 'lucide-react';

const sections = [
  {
    title: '第1条（本規約の適用）',
    body: '本規約は、ASTRA（以下「本Bot」）および本公式サイト（以下「本サイト」）の利用者（以下「ユーザー」）と、ASTRA共同開発プロジェクト（以下「当プロジェクト」）との間の利用条件を定めるものです。ユーザーは本Botおよび本サイトを利用することにより、本規約に同意したものとみなされます。',
  },
  {
    title: '第2条（利用の前提）',
    body: '本BotはDiscord上で動作するBotプログラムであり、本Botを利用するにはDiscordアカウントおよびDiscordサーバーの管理権限が必要です。本Botの利用にあたっては、Discordの利用規約およびコミュニティガイドラインを遵守してください。',
  },
  {
    title: '第3条（禁止事項）',
    body: 'ユーザーは、以下の行為を行ってはなりません。\n\n・本Botまたは本サイトの不正な改変、逆コンパイル、リバースエンジニアリング\n・本Botを用いたスパム行為、嫌がらせ、その他他のユーザーに不快感を与える行為\n・本Botのサーバーまたはネットワークに過度な負荷をかける行為\n・法令または公序良俗に反する行為\n・その他当プロジェクトが不適切と判断する行為',
  },
  {
    title: '第4条（サービスの提供および変更）',
    body: '当プロジェクトは、本Botおよび本サイトの内容を予告なく変更、追加、停止することがあります。これによりユーザーに生じた損害について、当プロジェクトは一切の責任を負いません。',
  },
  {
    title: '第5条（免責事項）',
    body: '本Botおよび本サイトは現状有姿で提供されるものであり、当プロジェクトはその完全性、正確性、有用性を保証しません。本Botおよび本サイトの利用により生じた損害について、当プロジェクトは一切の責任を負いません。',
  },
  {
    title: '第6条（利用料）',
    body: '本Botおよび本サイトの基本利用は無料です。ただし、将来的に有料機能を追加する場合、その際には事前に本サイト上で告知するものとします。',
  },
  {
    title: '第7条（規約の変更）',
    body: '当プロジェクトは、必要に応じて本規約を変更することができます。変更後の規約は、本サイト上に掲載された時点で効力を生じるものとします。',
  },
  {
    title: '第8条（準拠法および管轄）',
    body: '本規約は日本法に準拠し、本規約に関して紛争が生じた場合は、当プロジェクトの指定する裁判所を専属的合意管轄裁判所とします。',
  },
];

export function TermsPage() {
  return (
    <div className="max-w-[860px] mx-auto px-6 lg:px-8 py-16 lg:py-20">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-[#edf3ff] grid place-items-center">
          <FileText className="w-5 h-5 text-[#255cd0]" />
        </div>
        <span className="text-[11px] font-extrabold tracking-[0.19em] uppercase text-[#346bd2]">
          LEGAL
        </span>
      </div>
      <h1 className="text-3xl lg:text-4xl font-extrabold tracking-[-0.06em] mb-3">利用規約</h1>
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
        本規約に関するご質問は、公式Discordサーバーまでお問い合わせください。
      </p>
    </div>
  );
}
