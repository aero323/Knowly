import { motion } from 'motion/react';
import { User, Settings, Shield, HelpCircle, ChevronRight, Briefcase, Building, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProfileView() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full bg-slate-50 relative"
    >
      <header className="px-6 pt-12 pb-6 bg-slate-900 text-white sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 backdrop-blur-sm">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">User1294</h1>
            <p className="text-sm text-slate-300 mt-0.5">普通会员</p>
          </div>
        </div>
      </header>

      <div className="flex-1 pb-24">
        {/* Onboarding / Profile Preferences */}
        <section className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest px-2">业务档案配置</h2>
          <p className="text-xs text-gray-400 px-2 pb-1">完善档案让翻译更懂你的专业</p>
          
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">所属行业</div>
                  <div className="text-xs text-gray-500">矿业 / 冶炼</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">常用名词库</div>
                  <div className="text-xs text-gray-500">已添加 14 个商品名与联系人</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </section>

        {/* Settings Links */}
        <section className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest px-2">系统设置</h2>
          
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {[
              { icon: Settings, label: '通用设置', color: 'text-gray-600', bg: 'bg-gray-100' },
              { icon: Shield, label: '隐私与安全', color: 'text-emerald-600', bg: 'bg-emerald-100' },
              { icon: HelpCircle, label: '帮助与反馈', color: 'text-blue-600', bg: 'bg-blue-100' },
            ].map((item, i, arr) => (
              <div 
                key={item.label}
                className={cn(
                  "p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer",
                  i !== arr.length - 1 && "border-b border-gray-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", item.bg, item.color)}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-900">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
        </section>

        {/* Enterprise Upgrade CTA */}
        <section className="px-4 py-8 flex flex-col items-center justify-center text-center space-y-3 mb-8">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-200">
            <QrCode className="w-20 h-20 text-gray-800" strokeWidth={1} />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-gray-900">开通企业或团队版</h3>
            <p className="text-[11px] text-gray-500 mt-1">扫码联系客户经理，获取专属语料库与私有部署方案</p>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
