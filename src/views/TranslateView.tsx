import {
  Anchor,
  Building2,
  Camera,
  FileText,
  HardHat,
  Headphones,
  MessageCircle,
  Mic,
  Plus,
  ShieldAlert,
  Stethoscope,
} from 'lucide-react';
import { motion } from 'motion/react';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { AppScreen, IndustryContext, ScenePrompt, TranslationSession } from '@/types';

const knowlyLogoUrl = new URL('../../assets/brand/knowly-logo.png', import.meta.url).href;

const ICONS = {
  general: MessageCircle,
  meeting: Building2,
  bargain: FileText,
  employee: HardHat,
  customs: ShieldAlert,
  hospital: Stethoscope,
  logistics: Anchor,
};

function padTime(value: number) {
  return String(value).padStart(2, '0');
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatHistoryTime(isoTime: string) {
  const date = new Date(isoTime);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const dayDiff = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000);
  const time = `${padTime(date.getHours())}:${padTime(date.getMinutes())}`;

  if (dayDiff === 0) return `今天 ${time}`;
  if (dayDiff === 1) return `昨天 ${time}`;
  if (dayDiff === 2) return `前天 ${time}`;

  return `${padTime(date.getMonth() + 1)}-${padTime(date.getDate())} ${time}`;
}

interface TranslateViewProps {
  conciseDefault: boolean;
  profileIndustryId: string;
  industries: IndustryContext[];
  scenes: ScenePrompt[];
  visibleSceneIds: string[];
  history: TranslationSession[];
  showHistory: boolean;
  onOpenScreen: (screen: AppScreen) => void;
}

export function TranslateView({ conciseDefault, profileIndustryId, industries, scenes, visibleSceneIds, history, showHistory, onOpenScreen }: TranslateViewProps) {
  const photoCameraInputRef = useRef<HTMLInputElement>(null);
  const [activeScene, setActiveScene] = useState<string>('general');
  const [activeIndustry, setActiveIndustry] = useState<string>(profileIndustryId);
  const [useConciseMode, setUseConciseMode] = useState(conciseDefault);
  const [useTermsLibrary, setUseTermsLibrary] = useState(true);
  const visibleScenes = scenes.filter((scene) => visibleSceneIds.includes(scene.id));
  const latestSession = history[0];
  const latestSummaryLines = latestSession?.summary.minutes.slice(0, 3) ?? [];
  const latestSessionTime = latestSession ? formatHistoryTime(latestSession.endedAt) : '';
  const effectiveSceneId = visibleSceneIds.includes(activeScene) ? activeScene : visibleScenes[0]?.id ?? 'general';
  const effectiveIndustryId = useTermsLibrary ? activeIndustry : 'trade';

  function openPhotoCamera() {
    const input = photoCameraInputRef.current;
    if (!input) {
      onOpenScreen({ type: 'photo-translate', sceneId: effectiveSceneId, industryId: effectiveIndustryId });
      return;
    }

    input.value = '';
    input.click();
  }

  function handlePhotoCapture(event: ChangeEvent<HTMLInputElement>) {
    const photo = event.target.files?.[0];
    if (!photo) return;

    onOpenScreen({
      type: 'photo-translate',
      sceneId: effectiveSceneId,
      industryId: effectiveIndustryId,
      photoPreviewUrl: URL.createObjectURL(photo),
      photoName: photo.name || '现场照片',
    });
    event.target.value = '';
  }

  useEffect(() => {
    if (visibleScenes.length > 0 && !visibleSceneIds.includes(activeScene)) {
      setActiveScene(visibleScenes[0].id);
    }
  }, [activeScene, visibleSceneIds, visibleScenes]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col min-h-full bg-slate-50">
      <header className="px-6 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between gap-5">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">懂译 Knowly</h1>
            <p className="text-sm text-gray-500 mt-1">你的跨国语言私人助理</p>
          </div>
          <img src={knowlyLogoUrl} alt="Knowly" className="h-14 w-14 shrink-0 object-contain" />
        </div>
      </header>

      <div className="p-6 space-y-8 pb-24">
        <section className="space-y-4">
          <button
            type="button"
            onClick={() => onOpenScreen({ type: 'face-session', sceneId: effectiveSceneId, industryId: effectiveIndustryId, concise: useConciseMode })}
            className="w-full relative overflow-hidden bg-[#2D63FF] active:bg-blue-700 text-white p-7 py-8 rounded-[2rem] shadow-lg transition-shadow active:shadow-sm flex items-center justify-between group"
          >
            <div className="flex flex-col items-start gap-1.5 relative z-10">
              <span className="text-2xl font-bold tracking-wide">开始面对面翻译</span>
              <span className="text-blue-100 text-xs tracking-wider opacity-90">适合双人当面交流</span>
            </div>
            <div className="bg-white/10 p-4 rounded-full group-active:scale-95 transition-transform relative z-10">
              <Mic className="w-8 h-8 text-white stroke-[1.5]" />
            </div>
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
          </button>

          <div className="grid grid-cols-2 gap-3">
            <input
              ref={photoCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="sr-only"
              aria-hidden="true"
              tabIndex={-1}
            />
            <button
              type="button"
              onClick={() => onOpenScreen({ type: 'simultaneous', sceneId: effectiveSceneId, industryId: effectiveIndustryId })}
              className="bg-slate-950 border text-left border-slate-900 p-4 rounded-2xl shadow-sm active:bg-slate-800 flex flex-col items-start gap-2"
            >
              <div className="bg-white/12 text-white p-2 rounded-xl">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-white">同声传译</div>
                <div className="text-xs text-white/70 mt-0.5">实时识别 适合多人场合</div>
              </div>
            </button>

            <button
              type="button"
              onClick={openPhotoCamera}
              aria-label="打开相机进行拍照翻译"
              className="bg-white border text-left border-gray-200 p-4 rounded-2xl shadow-sm active:bg-gray-50 flex flex-col items-start gap-2"
            >
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

        <section className="mt-6 pt-8 border-t border-gray-200/60 space-y-7">
          <button
            type="button"
            onClick={() => setUseConciseMode(!useConciseMode)}
            className="w-full min-h-16 flex items-center justify-between gap-4 text-left active:opacity-75 transition-opacity"
          >
            <div className="min-w-0">
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">翻译偏好注入</h2>
              <div className="text-[15px] font-medium text-gray-700 mt-3">精简润色模式</div>
              <div className="text-[11px] text-gray-400 mt-0.5">自动去除废话并润色</div>
              <div className="text-[11px] text-gray-400 mt-0.5">略微降低翻译速度和增加积分用量</div>
            </div>
            <span className={cn('w-11 h-6 rounded-full transition-colors relative shrink-0', useConciseMode ? 'bg-blue-500' : 'bg-gray-300')}>
              <span className={cn('absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm', useConciseMode ? 'translate-x-5' : 'translate-x-0')} />
            </span>
          </button>

          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase">对话场景</h3>
            <div className="flex flex-wrap gap-2">
              {visibleScenes.map((scene) => {
                const Icon = ICONS[scene.id as keyof typeof ICONS] ?? Building2;
                const isActive = scene.id === activeScene;
                return (
                  <button
                    key={scene.id}
                    onClick={() => setActiveScene(scene.id)}
                    className={cn(
                      'min-h-10 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition-colors',
                      isActive ? 'bg-slate-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[13px] font-medium whitespace-nowrap">{scene.name}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => onOpenScreen({ type: 'profile-detail', detail: 'scenes' })}
                className="min-h-10 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-dashed border-gray-300 bg-white/70 text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="text-[13px] font-medium whitespace-nowrap">自定义场景</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase">专有术语库</h3>
              <button
                type="button"
                onClick={() => setUseTermsLibrary((current) => !current)}
                aria-pressed={useTermsLibrary}
                aria-label="打开或关闭专有术语库"
                className="min-h-11 -my-2 pl-3 flex items-center active:opacity-75 transition-opacity"
              >
                <span className={cn('w-11 h-6 rounded-full transition-colors relative shrink-0', useTermsLibrary ? 'bg-blue-500' : 'bg-gray-300')}>
                  <span className={cn('absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm', useTermsLibrary ? 'translate-x-5' : 'translate-x-0')} />
                </span>
              </button>
            </div>
            {useTermsLibrary && (
              <div className="flex flex-wrap gap-2">
                {industries.map((industry) => {
                  const isActive = activeIndustry === industry.id;
                  return (
                    <button
                      key={industry.id}
                      onClick={() => setActiveIndustry(industry.id)}
                      className={cn(
                        'px-3.5 py-2 text-[12px] font-medium rounded-lg transition-colors',
                        isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-200/50 text-gray-500 hover:bg-gray-200/80',
                      )}
                    >
                      {industry.name}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => onOpenScreen({ type: 'profile-detail', detail: 'terms' })}
                  className="px-3.5 py-2 text-[12px] font-medium rounded-lg border border-dashed border-gray-300 bg-white/70 text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  自定义术语库
                </button>
              </div>
            )}
          </div>

          {showHistory && (
            <div className="space-y-2">
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase">历史记录</h3>
              {latestSession ? (
                <button
                  type="button"
                  onClick={() => onOpenScreen({ type: 'session-summary', sessionId: latestSession.id })}
                  className="w-full text-left bg-gray-200/50 rounded-lg px-3.5 py-3 hover:bg-gray-200/80 active:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">{latestSession.summary.title}</p>
                    {latestSessionTime && <p className="shrink-0 text-[11px] font-medium text-gray-400">{latestSessionTime}</p>}
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {latestSummaryLines.map((line) => (
                      <p key={line} className="text-xs leading-5 text-gray-500 line-clamp-2">{line}</p>
                    ))}
                  </div>
                </button>
              ) : (
                <p className="text-sm text-gray-500 bg-gray-200/50 rounded-lg px-3.5 py-3">完成翻译后，会在这里看到历史记录和纪要。</p>
              )}
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}
