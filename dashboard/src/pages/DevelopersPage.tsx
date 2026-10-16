import { Star, Users, Code2, Palette, MessageCircle } from 'lucide-react';

const developers = [
  {
    name: 'みらぐ',
    role: 'デベロッパー / アーキテクト',
    icon: Code2,
    color: '#255cd0',
    desc: 'ASTRAの全体設計とDiscord Botの中核実装を担当。システムの安定性と拡張性を最優先に考えています。',
    tags: ['ダッシュボード', 'Discord.py', 'アーキテクチャ'],
  },
  {
    name: '𝓜𝓚',
    role: 'デベロッパー / 淫夢厨',
    icon: Palette,
    color: '#3774be',
    desc: '仲が良かった女子と同じ中学校を受験したが自分だけ不合格となり、淫夢厨となった。ASTRAの実装を担当。',
    tags: ['Discord.py', 'Claude', 'アーキテクチャ'],
  },
  {
    name: 'おじいちゃん（佐藤）',
    role: 'デベロッパー / コントリビューター',
    icon: MessageCircle,
    color: '#4675bc',
    desc: 'ASTRAの開発に貢献しているコントリビューター。',
    tags: ['Discord.py', 'Web', 'コントリビューター'],
  },
];

export function DevelopersPage() {
  return (
    <div className="max-w-[1190px] mx-auto px-6 lg:px-8 py-16 lg:py-24">
      {/* Header */}
      <div className="text-center mb-14">
        <span className="text-[11px] font-extrabold tracking-[0.19em] uppercase text-[#346bd2]">
          DEVELOPMENT TEAM
        </span>
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-[-0.06em] mt-3">
          ASTRAをつくる人びと
        </h1>
        <p className="text-sm text-[#748399] leading-[2] max-w-[560px] mx-auto mt-5">
          ASTRAは、複数のチームが協力して開発するDiscord Botプロジェクトです。
          それぞれのメンバーが得意な分野で力を発揮し、 함께新しいDiscord体験をつくっています。
        </p>
      </div>

      {/* Developer cards */}
      <div className="grid sm:grid-cols-2 gap-5">
        {developers.map((dev) => (
          <article
            key={dev.name}
            className="p-7 bg-white rounded-[15px] border border-[#e6edf7] hover:border-[#a8c6f5] hover:shadow-[0_12px_26px_#182d4c07] transition-all"
          >
            <div className="flex items-start gap-5">
              <div
                className="h-14 w-14 rounded-2xl grid place-items-center flex-none"
                style={{ background: `${dev.color}15` }}
              >
                <dev.icon className="w-6 h-6" style={{ color: dev.color }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-extrabold tracking-[-0.025em]">{dev.name}</h3>
                <p className="text-xs font-bold text-[#255cd0] mt-1">{dev.role}</p>
                <p className="text-xs text-[#708196] leading-[1.95] mt-3">{dev.desc}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {dev.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#f0f4fa] text-[#607085]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Project section */}
      <div className="mt-16 text-center bg-white rounded-[20px] border border-[#e6edf7] p-10 lg:p-14">
        <div className="h-12 w-12 rounded-2xl bg-[#edf3ff] grid place-items-center mx-auto mb-5">
          <Users className="w-6 h-6 text-[#255cd0]" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-[-0.04em] mb-3">共同開発について</h2>
        <p className="text-sm text-[#748399] leading-[2] max-w-[600px] mx-auto">
          ASTRAはひとりの開発者ではなく、複数のチームが協力して進める共同開発プロジェクトです。
          各メンバーがそれぞれの強みを活かし、定期的に意見を交わしながら、
          より良いBot体験をみなさんにお届けしています。
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-7">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f7f9fc] rounded-lg">
            <Star className="w-4 h-4 text-[#255cd0]" fill="currentColor" />
            <span className="text-xs font-bold text-[#4c6079]">オープンな開発体制</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f7f9fc] rounded-lg">
            <Star className="w-4 h-4 text-[#255cd0]" fill="currentColor" />
            <span className="text-xs font-bold text-[#4c6079]">継続的な改善</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f7f9fc] rounded-lg">
            <Star className="w-4 h-4 text-[#255cd0]" fill="currentColor" />
            <span className="text-xs font-bold text-[#4c6079]">コミュニティ重視</span>
          </div>
        </div>
      </div>
    </div>
  );
}
