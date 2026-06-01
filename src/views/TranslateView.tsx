import { Mic, Headphones, Camera, Sparkles, Building2, HardHat, Package, FileText, Anchor, Truck, Stethoscope, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useState } from 'react';

const SCENES = [
  { id: 'meeting', name: '正式会议', icon: Building2 },
  { id: 'bargain', name: '商务砍价', icon: FileText },
  { id: 'employee', name: '管理员工', icon: HardHat },
  { id: 'customs', name: '海关查验', icon: ShieldAlert },
  { id: 'hospital', name: '看病就医', icon: Stethoscope },
  { id: 'logistics', name: '物流清关', icon: Anchor },
];

const INDUSTRIES = [
  { id: 'mining', name: '矿业 / 冶炼' },
  { id: 'factory', name: '工厂 / 制造' },
  { id: 'construction', name: '工程 / 房产' },
  { id: 'ecommerce', name: '电商 / 直播' },
  { id: 'trade', name: '一般贸易' },
  { id: 'catering', name: '本地餐饮' }
];

export function TranslateView() {
  const [activeScene, setActiveScene] = useState<string>('meeting');
  const [activeIndustry, setActiveIndustry] = useState<string>('mining');
  const [useConciseMode, setUseConciseMode] = useState(true);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full bg-slate-50"
    >
      {/* Header */}
      <header className="px-6 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">懂译 Knowly</h1>
        <p className="text-sm text-gray-500 mt-1">你的印尼本地语言私人助理</p>
      </header>

      <div className="p-6 space-y-8 pb-24">
        
        {/* Core Actions */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900 px-1">开始翻译</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="col-span-2 relative overflow-hidden bg-[#2D63FF] active:bg-blue-700 text-white p-7 py-8 rounded-[2rem] shadow-lg transition-shadow active:shadow-sm flex items-center justify-between group">
              <div className="flex flex-col items-start gap-1.5 relative z-10">
                <span className="text-2xl font-bold tracking-wide">开始面对面翻译</span>
                <span className="text-blue-100 text-xs tracking-wider opacity-90">双向智能交互 · 自动降噪</span>
              </div>
              <div className="bg-white/10 p-4 rounded-full group-active:scale-95 transition-transform relative z-10">
                <Mic className="w-8 h-8 text-white stroke-[1.5]" />
              </div>
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
            </button>

            <button className="bg-white border text-left border-gray-200 p-4 rounded-2xl shadow-sm active:bg-gray-50 flex flex-col items-start gap-2">
              <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">同声传译</div>
                <div className="text-xs text-gray-500 mt-0.5">单向接听 · 会议展会</div>
              </div>
            </button>

            <button className="bg-white border text-left border-gray-200 p-4 rounded-2xl shadow-sm active:bg-gray-50 flex flex-col items-start gap-2">
              <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">拍照翻译</div>
                <div className="text-xs text-gray-500 mt-0.5">文件图纸 · 菜单路牌</div>
              </div>
            </button>
          </div>
        </section>

        {/* Translation Configuration */}
        <section className="mt-6 pt-8 border-t border-gray-200/60 space-y-7">
          <div className="mb-2">
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">翻译偏好注入</h2>
          </div>

          {/* AI Settings Toggle */}
          <button 
            onClick={() => setUseConciseMode(!useConciseMode)}
            className="w-full flex flex-row items-center justify-between group active:opacity-70 transition-opacity"
          >
            <div className="text-left">
              <div className="text-[15px] font-medium text-gray-700">商务简练表达模式</div>
              <div className="text-[11px] text-gray-400 mt-0.5">自动去除废话，输出专业地道的印尼语</div>
            </div>
            <div className={cn(
              "w-11 h-6 rounded-full transition-colors relative shrink-0",
              useConciseMode ? "bg-blue-500" : "bg-gray-300"
            )}>
              <div className={cn(
                "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm",
                useConciseMode ? "translate-x-5" : "translate-x-0"
              )}></div>
            </div>
          </button>

          {/* Specific Scenarios */}
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase">对话场景</h3>
            <div className="flex overflow-x-auto pb-2 gap-2 snap-x [&::-webkit-scrollbar]:hidden -mx-6 px-6">
              {SCENES.map((scene) => {
                const Icon = scene.icon;
                const isActive = scene.id === activeScene;
                return (
                  <button
                    key={scene.id}
                    onClick={() => setActiveScene(scene.id)}
                    className={cn(
                      "snap-start shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition-colors",
                      isActive 
                        ? "bg-slate-800 text-white shadow-sm" 
                        : "bg-gray-200/50 text-gray-500 hover:bg-gray-200/80"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[13px] font-medium whitespace-nowrap">{scene.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Industry Context */}
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase">专有术语库</h3>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((ind) => {
                const isActive = activeIndustry === ind.id;
                return (
                  <button
                    key={ind.id}
                    onClick={() => setActiveIndustry(ind.id)}
                    className={cn(
                      "px-3.5 py-2 text-[12px] font-medium rounded-lg transition-colors",
                      isActive 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-gray-200/50 text-gray-500 hover:bg-gray-200/80"
                    )}
                  >
                    {ind.name}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

      </div>
    </motion.div>
  );
}
