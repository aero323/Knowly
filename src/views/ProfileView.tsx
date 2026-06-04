import { Briefcase, Building, ChevronRight, Clock3, Crown, HelpCircle, QrCode, Settings, Shield, User } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { AppScreen, BusinessProfile, IndustryContext, TermEntry } from '@/types';

interface ProfileViewProps {
  profile: BusinessProfile;
  industries: IndustryContext[];
  terms: TermEntry[];
  onOpenScreen: (screen: AppScreen) => void;
}

export function ProfileView({ profile, industries, terms, onOpenScreen }: ProfileViewProps) {
  const industry = industries.find((item) => item.id === profile.industryId);
  const freeMinutesTotal = 30;
  const freeMinutesUsed = 12;
  const freeMinutesLeft = freeMinutesTotal - freeMinutesUsed;
  const freeUsagePercent = Math.round((freeMinutesUsed / freeMinutesTotal) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col min-h-full bg-slate-50 relative">
      <header className="px-6 pt-12 pb-6 bg-slate-900 text-white sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 backdrop-blur-sm">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex min-h-16 items-center">
            <h1 className="text-xl font-bold tracking-tight">User1294</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 pb-24">
        <section className="p-4 pb-2">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-950">
                  <Clock3 className="w-4 h-4 text-blue-600" />
                  免费用量
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-950">{freeMinutesLeft} 分钟</p>
                <p className="mt-1 text-xs text-gray-500">免费额度 {freeMinutesTotal} 分钟，已用 {freeMinutesUsed} 分钟</p>
              </div>
              <button
                type="button"
                onClick={() => onOpenScreen({ type: 'subscription' })}
                className="min-h-11 shrink-0 rounded-xl bg-slate-950 px-3.5 text-sm font-semibold text-white active:bg-slate-800"
              >
                升级会员
              </button>
            </div>

            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${freeUsagePercent}%` }} />
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">
                <Crown className="w-4 h-4 shrink-0" />
                <span>升级 Pro / Ultra 解锁翻译、AI通话和 AI 助理</span>
              </div>
            </div>
          </div>
        </section>

        <section className="p-4 space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-1">业务档案配置</h2>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => onOpenScreen({ type: 'profile-detail', detail: 'industry' })}
              className="min-h-16 w-full p-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">所属行业</div>
                  <div className="text-xs text-gray-500">{industry?.name ?? '未设置'}</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              type="button"
              onClick={() => onOpenScreen({ type: 'profile-detail', detail: 'terms' })}
              className="min-h-16 w-full p-4 flex items-center justify-between hover:bg-gray-50 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">我的名词库</div>
                  <div className="text-xs text-gray-500">添加常用人名、商品名等，将在任何场景中应用</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </section>

        <section className="p-4 space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-1">系统设置</h2>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {[
              { icon: Settings, label: '通用设置', detail: 'general' as const, color: 'text-gray-600', bg: 'bg-gray-100' },
              { icon: Shield, label: '隐私与安全', detail: 'privacy' as const, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { icon: HelpCircle, label: '帮助与反馈', detail: 'help' as const, color: 'text-blue-600', bg: 'bg-blue-50' },
            ].map((item, i, arr) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onOpenScreen({ type: 'profile-detail', detail: item.detail })}
                className={cn('min-h-14 w-full p-4 flex items-center justify-between hover:bg-gray-50 text-left', i !== arr.length - 1 && 'border-b border-gray-100')}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', item.bg, item.color)}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-900">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        </section>

        <section className="px-4 py-6 flex flex-col items-center justify-center text-center space-y-3 mb-8">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-200">
            <QrCode className="w-20 h-20 text-gray-800" strokeWidth={1} />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-gray-900">企业和团队版请扫码洽谈</h3>
            <p className="text-xs text-gray-500 mt-1">获取专属定制方案</p>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
